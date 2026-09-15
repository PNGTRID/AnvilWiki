import { defaultRun, runValidation, type RunFn } from './content.js';
import { loadSiteConfig } from './site.js';
import { OpsError } from './errors.js';

export interface SubmitResult {
  branch: string;
  prUrl: string;
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export async function submit(opts: { cwd: string; title?: string; base?: string; run?: RunFn }): Promise<SubmitResult> {
  const run = opts.run ?? defaultRun;
  const site = loadSiteConfig(opts.cwd);

  // 1. require a dirty worktree — never submit nothing
  const status = run('git', ['status', '--porcelain'], { cwd: opts.cwd });
  if (!status.stdout.trim()) {
    throw new OpsError(
      'No uncommitted changes to submit.',
      'Write content first (agent flow: .agent/skills/anvil-new-article), or make the config/content change you want to publish, then re-run submit.',
    );
  }

  // 2. full validation gate before any git mutation — fail fast, no PR
  const validation = runValidation({ cwd: site.root, run });
  const failed = validation.filter((v) => !v.ok);
  if (failed.length > 0) {
    throw new OpsError(
      `Validation failed: ${failed.map((f) => f.name).join(', ')}. Nothing was committed or pushed.`,
      failed.map((f) => `${f.name}:\n${f.summary}`).join('\n---\n') + '\nFix the issues above, then re-run submit.',
    );
  }

  // 3. branch + commit + push (never main)
  const title = opts.title ?? 'ops: content update via anvil-ops';
  const branch = `ops/submit-${stamp()}`;
  const git = (args: string[]) => run('git', args, { cwd: opts.cwd });

  // Remember where to unwind to: every abort below must leave the user on
  // their original branch with no ops/submit-* branch left behind, or a
  // same-minute re-run would hit "branch already exists" with no way out.
  const headBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const headSha = git(['rev-parse', 'HEAD']);
  const backTo =
    headBranch.status === 0 && headBranch.stdout.trim() && headBranch.stdout.trim() !== 'HEAD'
      ? headBranch.stdout.trim()
      : headSha.status === 0
        ? headSha.stdout.trim()
        : '';

  /** Undo the branch switch (best effort); returns a report of any leftovers. */
  const unwindBranch = (): string => {
    const notes: string[] = [];
    if (backTo) {
      const back = git(['checkout', backTo]);
      if (back.status !== 0) notes.push(`could not switch back to ${backTo}: ${(back.stderr || back.stdout).trim()}`);
    }
    const del = git(['branch', '-D', branch]);
    if (del.status !== 0) notes.push(`could not delete ${branch}: ${(del.stderr || del.stdout).trim()}`);
    return notes.length ? ` Cleanup attempt: ${notes.join('; ')}.` : ' Temporary branch removed; you are back on your original branch.';
  };

  const checkout = git(['checkout', '-b', branch]);
  if (checkout.status !== 0) {
    throw new OpsError(
      `git checkout -b ${branch} failed.`,
      `${checkout.stdout}\n${checkout.stderr}\nFix: a leftover branch from an earlier failed submit is the usual cause — delete it with \`git branch -D ${branch}\` (or wait a minute for a fresh timestamp), then re-run submit.`,
    );
  }
  git(['add', '-A']);
  // Safety net for non-template repos whose .gitignore may not cover .env:
  // staged secret files abort the submit before anything is committed/pushed.
  const staged = git(['diff', '--cached', '--name-only']);
  const stagedSecrets = staged.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /(^|\/)\.env($|\.)/.test(l));
  if (stagedSecrets.length > 0) {
    const cleanup = unwindBranch();
    throw new OpsError(
      `Refusing to commit env files: ${stagedSecrets.join(', ')}. ${cleanup}`,
      'Add them to .gitignore and unstage (git restore --staged <file>), then re-run submit. Nothing was committed or pushed.',
    );
  }
  const commit = git(['commit', '-m', title]);
  if (commit.status !== 0) {
    const cleanup = unwindBranch();
    throw new OpsError(`git commit failed. ${cleanup}`, `${commit.stdout}\n${commit.stderr}\nFix: check git user config (user.name/user.email) and re-run. Nothing was committed or pushed.`);
  }
  const push = git(['push', '-u', 'origin', branch]);
  if (push.status !== 0) {
    throw new OpsError(`git push origin ${branch} failed.`, `${push.stdout}\n${push.stderr}\nFix: check the origin remote and credentials (gh auth status), then re-run.`);
  }

  // 4. open PR via gh
  const body =
    validation.map((v) => `## ${v.name} ${v.ok ? 'PASS' : 'FAIL'}\n${v.summary}`).join('\n\n') +
    '\n\n---\nSubmitted via `anvil-ops submit`. Merge after review; Cloudflare Pages deploys automatically.';
  const pr = run('gh', ['pr', 'create', '--title', title, '--base', opts.base ?? 'main', '--body', body], { cwd: opts.cwd });
  if (pr.status !== 0) {
    throw new OpsError(
      `gh pr create failed — branch ${branch} is pushed with the commit kept on it; you are still on that branch.`,
      `${pr.stdout}\n${pr.stderr}\nFix: ensure gh is authenticated (gh auth status), then run \`gh pr create --title ${JSON.stringify(title)}\` from the repo, or \`git checkout main\` to go back (the ${branch} branch stays for a retry).`,
    );
  }
  return { branch, prUrl: pr.stdout.trim() };
}
