/**
 * Workflow contract tests — keep the PR-gated content pipeline honest.
 *
 * The safety contract of the v2.0 pipeline lives in YAML, which no compiler
 * checks. These tests pin the load-bearing parts:
 *   1. The shared gates composite action runs EXACTLY the eight gate
 *      commands as separate ordered steps — no more, no fewer.
 *   2. ci.yml and auto-content.yml share ONE gates definition (composite
 *      action); ci.yml also runs the ops-toolkit gates (tools/ is excluded
 *      from root checks, so without that job ops PRs land untested).
 *   3. auto-content.yml never triggers on push/PR/comment (workflow_dispatch
 *      only — collaborator gate), opens DRAFT PRs only, content-only PRs
 *      (add-paths), fails loudly on zero scaffolds, and has no
 *      write-permission surface beyond contents + pull-requests.
 *   4. Every non-local `uses:` across ALL workflows is 40-hex SHA-pinned,
 *      and each action resolves to exactly one SHA repo-wide.
 *   5. The freshness audit stays upstream-only and issue-only (never a PR).
 *   6. setup.yml proves the fork-initialized tree builds BEFORE opening its
 *      destructive PR (GITHUB_TOKEN PRs don't trigger CI).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, describe } from 'vitest';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readWorkflow = (rel: string): unknown =>
  parse(readFileSync(join(root, rel), 'utf8')) as unknown;

const GATES = '.github/actions/gates/action.yml';
const CI = '.github/workflows/ci.yml';
const AUTO = '.github/workflows/auto-content.yml';
const AUDIT = '.github/workflows/content-pipeline.yml';
const RELEASE_OPS = '.github/workflows/release-ops.yml';
const SETUP = '.github/workflows/setup.yml';
const ALL_WORKFLOWS = [CI, AUTO, AUDIT, RELEASE_OPS, SETUP];

const EIGHT_GATES = [
  'pnpm lint',
  'pnpm typecheck',
  'pnpm test',
  'pnpm check-config',
  'pnpm build',
  'pnpm check-content',
  'pnpm check-links',
  'pnpm check-i18n --strict-ui',
];

interface Step {
  name?: string;
  if?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
}
type Workflow = {
  on?: Record<string, unknown>;
  permissions?: Record<string, string>;
  jobs?: Record<string, { steps?: Step[]; timeout?: number; if?: string }>;
};

describe('shared gates composite action', () => {
  test('runs EXACTLY the eight gate commands, each as its own step, in order', () => {
    // Parsing the YAML (not raw-text contains) means a gate hidden in a
    // comment, a description, or several commands collapsed into one run
    // step no longer satisfies the contract.
    const action = readWorkflow(GATES) as { runs?: { steps?: Step[] } };
    const runs = (action.runs?.steps ?? [])
      .map((s) => (s.run ?? '').trim())
      .filter((r) => r.length > 0);
    expect(runs).toEqual(EIGHT_GATES);
  });

  test('the i18n gate can actually fail (strict-ui, not report-only)', () => {
    // The eighth gate was report-only at v2.0.0 — "eight gates" must mean
    // eight gates that can go red.
    expect(EIGHT_GATES[7]).toBe('pnpm check-i18n --strict-ui');
  });

  test('build step forwards the site-url input', () => {
    const action = readWorkflow(GATES) as { runs?: { steps?: Step[] } };
    const build = action.runs?.steps?.find((s) => s.env?.SITE_URL !== undefined);
    expect(build?.env?.SITE_URL).toBe('${{ inputs.site-url }}');
  });
});

describe('ci.yml uses the shared gates + runs the ops toolkit', () => {
  test('root gates job runs ./.github/actions/gates', () => {
    const ci = readWorkflow(CI) as { jobs?: Record<string, { steps?: Step[] }> };
    const uses = ci.jobs?.check?.steps?.map((s) => s.uses) ?? [];
    expect(uses).toContain('./.github/actions/gates');
  });

  test('ops-toolkit job runs typecheck + tests + build in tools/anvil-ops', () => {
    // tools/ is excluded from root tsconfig/eslint/workspace — without this
    // job, PRs touching the ops CLI/MCP land on main with zero test signal.
    const ci = readWorkflow(CI) as { jobs?: Record<string, { steps?: Step[] }> };
    const job = ci.jobs?.['ops-toolkit'];
    expect(job).toBeDefined();
    const gatesStep = job?.steps?.find((s) => /typecheck/.test(s.run ?? ''));
    expect(gatesStep?.run).toContain('pnpm typecheck && pnpm test && pnpm build');
  });

  test('e2e-template job drives apply-template in real mode', () => {
    // apply-template has zero vitest coverage and its bugs only fire in real
    // (non-dry-run) mode — PR #10 (ENOENT) and the home-template schema drift
    // both shipped through all eight gates. Deleting this job must fail here,
    // not re-open the fork's first-build crash window.
    const ci = readWorkflow(CI) as { jobs?: Record<string, { steps?: Step[] }> };
    const job = ci.jobs?.['e2e-template'];
    expect(job).toBeDefined();
    const e2e = job?.steps?.find((s) => /test:e2e/.test(s.run ?? ''));
    expect(e2e?.run).toContain('pnpm test:e2e');
  });
});

describe('auto-content pipeline safety contract', () => {
  const wf = readWorkflow(AUTO) as Workflow;
  const steps = wf.jobs?.['generate-and-pr']?.steps ?? [];

  test('triggers on workflow_dispatch only (collaborator gate)', () => {
    expect(Object.keys(wf.on ?? {})).toEqual(['workflow_dispatch']);
  });

  test('permissions are exactly contents + pull-requests write', () => {
    expect(wf.permissions).toEqual({ contents: 'write', 'pull-requests': 'write' });
  });

  test('runs the shared gates before creating any PR', () => {
    const gateIdx = steps.findIndex((s) => s.uses === './.github/actions/gates');
    const prIdx = steps.findIndex((s) => (s.uses ?? '').includes('create-pull-request'));
    expect(gateIdx).toBeGreaterThan(-1);
    expect(prIdx).toBeGreaterThan(gateIdx);
  });

  test('generator fails loudly when it scaffolds zero articles', () => {
    const gen = steps.find((s) => /bulk-new-posts/.test(s.run ?? ''));
    expect(gen?.run).toContain('bulk-new-posts --require-output');
  });

  test('sync-codes task: gated generator with the same require-output contract', () => {
    // The codes generator follows the identical pipeline contract as
    // import-csv: task-gated step, --require-output so an all-applied run
    // fails loudly instead of opening an empty PR.
    const gen = steps.find((s) => /pnpm sync-codes/.test(s.run ?? ''));
    expect(gen?.run).toContain('pnpm sync-codes --require-output');
    expect(gen?.if).toContain("inputs.task == 'sync-codes'");
  });

  test('PRs are drafts on a fixed branch and contain ONLY content changes', () => {
    const pr = steps.find((s) => (s.uses ?? '').includes('create-pull-request'));
    expect(pr?.with?.draft).toBe(true);
    // One fixed branch per task (idempotent re-dispatch, tasks never mix):
    // the branch is a task-conditional expression covering both names.
    const branch = String(pr?.with?.branch ?? '');
    expect(branch).toContain('chore/auto-content');
    expect(branch).toContain('chore/sync-codes');
    // add-paths keeps the pasted csv_text (new-posts.csv / codes-sync.csv)
    // OUT of the PR — without it the list gets committed to main on merge.
    expect(String(pr?.with?.['add-paths'] ?? '')).toContain('src/content/**');
  });

  test('never references LLM/AI secrets', () => {
    const raw = readFileSync(join(root, AUTO), 'utf8');
    expect(raw).not.toMatch(/OPENAI|ANTHROPIC|API_KEY/);
    // The pipeline uses no secrets at all — GITHUB_TOKEN is implicit.
    expect(raw.match(/secrets\.[A-Z_]+/g) ?? []).toEqual([]);
  });
});

describe('action pinning consistency', () => {
  test('every non-local uses: is 40-hex SHA-pinned in ALL workflows', () => {
    // Includes setup.yml and every third-party action (e.g. peter-evans/
    // create-pull-request) — a tag ref or a typo'd SHA must fail here, not
    // at run time.
    for (const rel of ALL_WORKFLOWS) {
      const raw = readFileSync(join(root, rel), 'utf8');
      for (const m of raw.matchAll(/uses: (\S+)@(\S+)/g)) {
        if (m[1].startsWith('./')) continue; // local composite action
        expect(m[2], `${rel}: ${m[1]} must be pinned to a 40-char SHA`).toMatch(/^[0-9a-f]{40}$/);
      }
    }
  });

  test('each action resolves to exactly ONE SHA repo-wide', () => {
    // A one-character transcription typo in a pinned SHA fails at run time
    // with a confusing "unable to find version" — so pin the invariant here.
    const byAction = new Map<string, Set<string>>();
    for (const rel of ALL_WORKFLOWS) {
      const raw = readFileSync(join(root, rel), 'utf8');
      for (const m of raw.matchAll(/uses: ((?:actions|pnpm|peter-evans)\/[a-z-]+)@([0-9a-f]{40})/g)) {
        const pins = byAction.get(m[1]) ?? new Set<string>();
        pins.add(m[2]);
        byAction.set(m[1], pins);
      }
    }
    expect(byAction.size).toBeGreaterThan(0);
    for (const [name, pins] of byAction) {
      expect([...pins], `${name} should be pinned to exactly one SHA everywhere`).toHaveLength(1);
    }
  });
});

describe('setup.yml verifies the fork tree before its destructive PR', () => {
  test('a build step exists and precedes the PR step', () => {
    // GITHUB_TOKEN-opened PRs do not trigger CI, so the workflow itself must
    // prove the initialized tree builds — otherwise file-list drift breaks
    // the fork's first Cloudflare Pages build with zero CI signal.
    const wf = readWorkflow(SETUP) as Workflow;
    const steps = wf.jobs?.setup?.steps ?? [];
    const buildIdx = steps.findIndex((s) => /pnpm build/.test(s.run ?? ''));
    const prIdx = steps.findIndex((s) => /gh pr create/.test(s.run ?? ''));
    expect(buildIdx, 'setup.yml must run pnpm build before opening the init PR').toBeGreaterThan(-1);
    expect(prIdx).toBeGreaterThan(buildIdx);
  });
});

describe('freshness audit stays read-only', () => {
  test('upstream-only guard and issues-only permissions unchanged', () => {
    const wf = readWorkflow(AUDIT) as Workflow;
    expect(wf.jobs?.audit?.if).toContain('github.repository');
    expect(wf.permissions).toEqual({ contents: 'read', issues: 'write' });
  });
});
