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
 *   5. The freshness audit stays upstream-only and issue-only (never a PR),
 *      runs serialized (file-level concurrency), and only ever closes an
 *      issue whose title matches the exact shape this workflow files.
 *   6. setup.yml proves the fork-initialized tree builds BEFORE opening its
 *      destructive PR (GITHUB_TOKEN PRs don't trigger CI), and its python
 *      [vars] rewrite is line-anchored + key-aligned with the JS channel in
 *      scripts/lib/apply-rewrites.ts (the demo FORKER comment mentions
 *      "[vars]" mid-line — an unanchored match ships invalid two-table TOML
 *      with the build green).
 *   7. release-ops.yml cannot publish unreviewed code from EITHER trigger
 *      path: the publish job requires the "npm" Environment (owner approval)
 *      and the workflow itself proves the published commit sits on main —
 *      unconditionally, so a workflow_dispatch cannot skip the ancestry
 *      guard the way it skips the tag-only version guard (branch protection
 *      does not cover tags).
 *   8. The postbuild range-media lowering downgrades EVERY parenthesized
 *      group of an @media prelude — pinned against the real shipping
 *      script (imported, not copied) so it cannot drift.
 *   9. IndexNow stays opt-in and production-safe: only a successful main
 *      push CI can submit, both repo variables must exist, and submission
 *      waits for the matching deployed key before calling IndexNow.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { expect, test, describe } from 'vitest';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readWorkflow = (rel: string): unknown =>
  parse(readFileSync(join(root, rel), 'utf8')) as unknown;

// Imported (not re-implemented) so the lowering contract below is pinned
// against the exact code that postbuild ships. The script's main-module
// guard keeps this import side-effect-free — this line existing is itself
// the pin for that guard.
const { lowerRangeMedia } = (await import(
  pathToFileURL(join(root, 'scripts/transpile-pagefind.mjs')).href
)) as { lowerRangeMedia: (s: string) => string };

const GATES = '.github/actions/gates/action.yml';
const CI = '.github/workflows/ci.yml';
const AUTO = '.github/workflows/auto-content.yml';
const AUDIT = '.github/workflows/content-pipeline.yml';
const RELEASE_OPS = '.github/workflows/release-ops.yml';
const SETUP = '.github/workflows/setup.yml';
const INDEXNOW = '.github/workflows/indexnow.yml';
const ALL_WORKFLOWS = [CI, AUTO, AUDIT, RELEASE_OPS, SETUP, INDEXNOW];

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
  concurrency?: { group?: string; 'cancel-in-progress'?: boolean };
  jobs?: Record<
    string,
    {
      steps?: Step[];
      timeout?: number;
      if?: string;
      environment?: string;
      'continue-on-error'?: boolean;
    }
  >;
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

describe('IndexNow production automation contract', () => {
  const wf = readWorkflow(INDEXNOW) as Workflow;
  const job = wf.jobs?.submit;
  const steps = job?.steps ?? [];

  test('runs only after the CI workflow completes', () => {
    const trigger = (wf.on?.workflow_run ?? {}) as {
      workflows?: string[];
      types?: string[];
    };
    expect(Object.keys(wf.on ?? {})).toEqual(['workflow_run']);
    expect(trigger.workflows).toEqual(['CI']);
    expect(trigger.types).toEqual(['completed']);
  });

  test('requires successful main push CI but not repository variables', () => {
    expect(job?.if).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(job?.if).toContain("github.event.workflow_run.event == 'push'");
    expect(job?.if).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(job?.if).not.toContain('vars.SITE_URL');
    expect(job?.if).not.toContain('vars.INDEXNOW_KEY');
  });

  test('prefers the repository key and keeps legacy variables as fallback only', () => {
    const detect = steps.find((step) => step.name === 'Detect IndexNow configuration');
    expect(detect?.run).toContain('-s .indexnow-key');
    expect(detect?.run).toContain('LEGACY_INDEXNOW_KEY');
    expect(detect?.env?.LEGACY_INDEXNOW_KEY).toBe('${{ vars.INDEXNOW_KEY }}');

    for (const name of ['Setup pnpm', 'Setup Node', 'Install dependencies']) {
      expect(steps.find((step) => step.name === name)?.if).toBe(
        "steps.config.outputs.enabled == 'true'",
      );
    }
  });

  test('is non-blocking and resolves production config from the checked-out repo', () => {
    expect(job?.['continue-on-error']).toBeFalsy();
    const submit = steps.find((step) => /submit-indexnow/.test(step.run ?? ''));
    expect(submit?.if).toBe("steps.config.outputs.enabled == 'true'");
    expect(submit?.run).toContain('--site-from-config');
    expect(submit?.run).toContain('--wait-for-deploy "$DEPLOY_SHA"');
    expect(submit?.run).toContain('--wait-for-key');
    expect(submit?.run).toContain('--wait-seconds 150');
    expect(submit?.env).toEqual({
      SITE_URL: "${{ steps.config.outputs.source == 'legacy' && vars.SITE_URL || '' }}",
      INDEXNOW_KEY:
        "${{ steps.config.outputs.source == 'legacy' && vars.INDEXNOW_KEY || '' }}",
      DEPLOY_SHA: '${{ github.event.workflow_run.head_sha }}',
    });
  });

  test('Initialize AnvilWiki creates the stable repository key before build', () => {
    const setup = readWorkflow(SETUP) as Workflow;
    const setupSteps = setup.jobs?.setup?.steps ?? [];
    const ensure = setupSteps.find((step) => step.name === 'Ensure stable IndexNow key');
    const build = setupSteps.findIndex((step) => step.name === 'Build (verify the initialized tree is not broken)');

    expect(ensure?.run).toContain('scripts/init-indexnow-key.ts');
    expect(ensure?.env?.INDEXNOW_KEY).toBe('${{ vars.INDEXNOW_KEY }}');
    expect(setupSteps.findIndex((step) => step === ensure)).toBeLessThan(build);
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

  test('require-output reaches every early exit path in the generator scripts', () => {
    // Without the clauses, zero-output shapes exit 0 mid-script — the run
    // goes green and create-pull-request silently makes no PR, the exact
    // no-op --require-output exists to prevent. bulk-new-posts.ts had its
    // clause from day one; sync-codes ported the flag but not the clauses.
    for (const script of ['scripts/bulk-new-posts.ts', 'scripts/sync-codes.ts']) {
      const src = readFileSync(join(root, script), 'utf8');
      expect(src, script).toContain('process.exit(NO_INPUT_IS_ERROR || REQUIRE_OUTPUT ? 1 : 0)');
    }
    // sync-codes has one early exit bulk-new-posts lacks: a header-only or
    // fully --locales-filtered CSV (0 data rows) must fail under
    // --require-output too, not exit 0 at "Nothing to do".
    const syncSrc = readFileSync(join(root, 'scripts/sync-codes.ts'), 'utf8');
    expect(syncSrc).toContain('process.exit(REQUIRE_OUTPUT ? 1 : 0)');
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

describe('setup.yml [vars] rewrite is line-anchored and key-aligned with the CLI', () => {
  // The workflow carries its [vars] rewrite as an inline python heredoc — the
  // JS twin (rewriteWranglerVars) lives in scripts/lib/apply-rewrites.ts. The
  // two channels have drifted before: v2.25.0 fixed line-anchoring in JS only,
  // and the unanchored python regex rewrote the FORKER comment's mid-line
  // "[vars]" mention while LEAVING the real demo table in place — the fork
  // shipped two [vars] tables (invalid TOML, Pages deploy fails) with this
  // workflow's own build green.
  const setupRaw = readFileSync(join(root, SETUP), 'utf8');

  test('the python [vars] regex anchors at line start (old unanchored form gone)', () => {
    // Same shape as the JS channel — and deliberately NO re.M: with it `$`
    // means line-end and the match truncates at the first newline.
    expect(setupRaw).toContain(String.raw`(^|\n)\[vars\]\r?\n[\s\S]*?(?=\r?\n\[|$)`);
    expect(setupRaw).not.toContain(String.raw`\[vars\][\s\S]*?(?=\n*\[|\s*$)`);
    // The `(^|\n)` group is consumed by the match — the splice must put it
    // back or the section above [vars] loses its separating newline.
    expect(setupRaw).toContain(String.raw`(m.group(1) or '')`);
  });

  test('new_vars keys match the apply-rewrites template exactly (no channel drift)', async () => {
    const pyTemplate = setupRaw.match(/new_vars = '''([\s\S]*?)'''/)?.[1];
    expect(pyTemplate, 'setup.yml new_vars triple-quoted template not found').toBeTruthy();
    // Pin the JS channel's key set by BEHAVIOR, not source shape: the JS
    // template has already been refactored (template literal → structured
    // spec array), and a text pin would have broken with it. Rendering
    // rewriteWranglerVars against a minimal demo [vars] emits every key of
    // the JS template blank/commented — the output block IS its key set.
    const { rewriteWranglerVars } = (await import('../scripts/lib/apply-rewrites')) as {
      rewriteWranglerVars: (input: { domain: string }, src: string) => string | null;
    };
    const out = rewriteWranglerVars(
      { domain: 'example.com' },
      'name = "demo"\n[vars]\nSITE_URL = "https://old.dev"\n',
    );
    expect(out, 'rewriteWranglerVars returned null on a minimal [vars] block').toBeTruthy();
    // `#?` covers commented-out slot lines; `[ \t]*` — the python template
    // lives indented inside the YAML block scalar. `m` so ^ is line-start.
    // Comment prose lines never match (they start `# ` — a space, not a key).
    const keys = (s: string) =>
      [...new Set([...s.matchAll(/^[ \t]*#?([A-Z][A-Z0-9_]*) = /gm)].map((m) => m[1]))].sort();
    expect(keys(pyTemplate!)).toEqual(keys(out!));
    expect(
      keys(pyTemplate!).length,
      'the shared template should pin a non-empty key set',
    ).toBeGreaterThan(0);
    // SITE_URL is not a PUBLIC_ key but is the whole point of the rewrite.
    expect(keys(pyTemplate!)).toContain('SITE_URL');
  });

  test('the FORKER warning block is removed after the rewrite (JS-channel parity)', () => {
    // After a successful rewrite the warning would claim the file still holds
    // the DEMO config — stale and misleading, so the python channel must strip
    // it with the same ASCII-anchored regex the JS channel uses. subn + a
    // no-match warning keeps a drifted anchor from silently no-oping (audit
    // round 21) while still not killing a fork whose user deleted the block
    // by hand — pinned behaviorally against the real header below.
    expect(setupRaw).toContain(String.raw`re.subn(r'# .*FORKERS READ THIS FIRST`);
    expect(setupRaw).toContain(String.raw`# .*END FORKER WARNING.*\n?`);
    expect(setupRaw).toContain('FORKER warning block not found');
  });

  test('the rewritten file ends with exactly one newline', () => {
    // python's `$` (without re.M) also matches just BEFORE a trailing
    // newline, so a [vars] section at EOF keeps its old `\n` outside the
    // match and a naive splice doubles it.
    expect(setupRaw).toContain(String.raw`out.rstrip('\n') + '\n'`);
  });
});

describe('setup.yml python [vars] rewrite is value-aware (executes the real heredoc)', () => {
  // v2.29.0 made the JS channel (rewriteWranglerVars) value-aware, but the
  // workflow's python twin kept resetting every template key to blank. A
  // re-run of Initialize AnvilWiki is a documented flow, and the reset was
  // invisible: GITHUB_TOKEN PRs trigger no CI and the in-workflow build
  // stays green because every consumer component is env-gated — the wipe
  // only surfaced as a dead site after merge. These tests EXECUTE the
  // heredoc the runner executes (extracted from the parsed YAML, so the
  // de-indentation matches what the shell receives), not its source shape.
  // Executing requires python3, which a dev box can lack (bare Windows) —
  // there the behavioral tests below SKIP with this probe instead of failing
  // on spawnSync ENOENT (status null → "python rewrite failed:\nnull").
  // CI's ubuntu runner always has python3, so the contract still runs in the
  // gate; only the local convenience degrades, loudly and visibly.
  const hasPython3 = spawnSync('python3', ['--version'], { encoding: 'utf8' }).status === 0;
  const extractVarsPython = (): string => {
    const wf = readWorkflow(SETUP) as Workflow;
    const step = wf.jobs?.setup?.steps?.find(
      (s) => (s.run ?? '').includes("python3 - <<'EOF'") && (s.run ?? '').includes('wrangler.toml'),
    );
    expect(step, 'the [vars] python step not found — setup.yml rewritten?').toBeDefined();
    const heredoc = step!.run!.match(/python3 - <<'EOF'\n([\s\S]*?)\nEOF/);
    expect(heredoc, 'the [vars] python heredoc not found — step rewritten?').toBeTruthy();
    return heredoc![1];
  };

  const runVarsRewrite = (
    wrangler: string,
    siteUrl = 'https://example.com',
  ): { out: string; stderr: string } => {
    const dir = mkdtempSync(join(tmpdir(), 'setup-vars-'));
    try {
      writeFileSync(join(dir, 'wrangler.toml'), wrangler);
      writeFileSync(join(dir, 'rewrite.py'), extractVarsPython());
      const res = spawnSync('python3', [join(dir, 'rewrite.py')], {
        cwd: dir,
        env: { ...process.env, RAW_SITE_URL: siteUrl },
        encoding: 'utf8',
      });
      expect(res.status, `python rewrite failed:\n${res.stderr}`).toBe(0);
      return { out: readFileSync(join(dir, 'wrangler.toml'), 'utf8'), stderr: res.stderr };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  // A fresh fork's [vars]: demo values everywhere, one empty commented slot.
  const demoVars = [
    '[vars]',
    'SITE_URL = "https://anvil.wiki"',
    '#INDEXNOW_KEY = "736d8608fdec899849d382dffdaf4dda78605ffe0f40e2f1dbb57c7390341bed"',
    'PUBLIC_GISCUS_REPO = "PNGTRID/AnvilWiki"',
    'PUBLIC_GISCUS_REPO_ID = "R_kgDOT1aRPQ"',
    'PUBLIC_GISCUS_CATEGORY = "Announcements"',
    'PUBLIC_GISCUS_CATEGORY_ID = "DIC_kwDOT1aRPc4DDODo"',
    'PUBLIC_GISCUS_MAPPING = "pathname"',
    'PUBLIC_CF_BEACON_TOKEN = ""',
    '#PUBLIC_GA_ID = "G-X10CG7N6P6"',
    'MY_CUSTOM_KEY = "keepme" # trailing comment',
    '',
  ].join('\n');

  test.skipIf(!hasPython3)('user values survive, demo values reset, unknown keys survive, SITE_URL follows input', () => {
    // The four behaviors the JS channel has had since v2.29.0 — each one of
    // them used to be a wipe or a reset in the python twin.
    const { out } = runVarsRewrite(demoVars, 'https://mygame.wiki');
    // Demo identity → reset (a FIRST run must clear it).
    expect(out).toContain('SITE_URL = "https://mygame.wiki"');
    expect(out).toContain('PUBLIC_GISCUS_REPO = ""');
    expect(out).toContain('#INDEXNOW_KEY = ""');
    expect(out).toContain('#PUBLIC_GA_ID = ""');
    // User data → survives.
    expect(out).toContain('MY_CUSTOM_KEY = "keepme" # trailing comment');
  });

  test.skipIf(!hasPython3)('the paired-Announcements rule carries over (own name + own ID survives)', () => {
    // "Announcements" is GitHub's suggested giscus category name — demo only
    // when the demo category ID sits right next to it. Wiping the name while
    // a fork's own ID survived would strand a half-reset giscus config.
    const withOwnId = demoVars.replace(
      'PUBLIC_GISCUS_CATEGORY_ID = "DIC_kwDOT1aRPc4DDODo"',
      'PUBLIC_GISCUS_CATEGORY_ID = "R_myOwnId"',
    );
    const { out } = runVarsRewrite(withOwnId);
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY = "Announcements"');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY_ID = "R_myOwnId"');
  });

  test.skipIf(!hasPython3)('recognition covers single quotes, bare scalars and inline comments (JS-channel parity)', () => {
    const handEdited =
      '[vars]\nSITE_URL = "https://x.wiki"\nPUBLIC_GA_ID = G-123 # prod\nPUBLIC_CF_BEACON_TOKEN = \'literal\'\n';
    const { out } = runVarsRewrite(handEdited);
    // Preserved values are re-emitted double-quoted (Pages env vars are
    // strings anyway), and a commented slot flips uncommented once a value
    // exists — matching rewriteWranglerVars on these forms. (An unknown key
    // with a single-quoted value is the round-21 verbatim-preservation path
    // instead, pinned by 'custom [vars] keys are preserved verbatim'.)
    expect(out).toContain('PUBLIC_GA_ID = "G-123"');
    expect(out).toContain('PUBLIC_CF_BEACON_TOKEN = "literal"');
  });

  test.skipIf(!hasPython3)("a second run on the first run's output is byte-identical (idempotent)", () => {
    const first = runVarsRewrite(demoVars, 'https://mygame.wiki').out;
    expect(runVarsRewrite(first, 'https://mygame.wiki').out).toBe(first);
  });

  test('the hardcoded DEMO_VALUES set mirrors the JS registry (DEMO_VAR_VALUES)', async () => {
    // The python block cannot import the TS registry, so it carries a
    // hardcoded copy — this guard is what keeps the copy honest.
    const { DEMO_VAR_VALUES } = (await import('../scripts/lib/apply-rewrites')) as {
      DEMO_VAR_VALUES: readonly string[];
    };
    const body = extractVarsPython().match(/DEMO_VALUES = \{([\s\S]*?)\}/)?.[1];
    expect(body, 'DEMO_VALUES set not found in the python block').toBeTruthy();
    const pyValues = [...body!.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(pyValues).toEqual([...DEMO_VAR_VALUES].sort());
  });

  test.skipIf(!hasPython3)('the FORKER warning block is actually removed (real-header fixture), and absence warns instead of failing', () => {
    // Pinned against the REAL shipping header (authors.ts precedent): if the
    // wrangler.toml anchors drift, this goes red instead of the workflow
    // silently leaving a block that lies about the file still being demo.
    const real = readFileSync(join(root, 'wrangler.toml'), 'utf8');
    const header = real.slice(0, real.indexOf('END FORKER WARNING') + 'END FORKER WARNING'.length);
    expect(header).toContain('FORKERS READ THIS FIRST');
    const { out } = runVarsRewrite(`${header}\n\n${demoVars}`);
    expect(out).not.toContain('FORKERS');
    // Absence is warn-not-exit: a fork that deleted the block by hand must
    // not have its re-run killed over a missing comment (the JS channel
    // keeps going in the same situation).
    const bare = runVarsRewrite(demoVars);
    expect(bare.out).not.toContain('FORKERS');
    expect(bare.stderr).toContain('FORKER warning block not found');
  });
});

describe('setup.yml failure surfaces are loud (audit round 21)', () => {
  const setupRaw = readFileSync(join(root, SETUP), 'utf8');

  test('PR creation asks before creating — no blanket failure swallowing', () => {
    // `gh pr create … || echo "PR already exists"` turned rate limits, auth
    // errors and network failures into a green run with no PR and a
    // misleading success line. "Already exists" is now detected by ASKING
    // first (gh pr view); a real create failure fails the step.
    expect(setupRaw).toContain('gh pr view chore/init-from-template');
    expect(setupRaw).not.toContain('|| echo "PR already exists');
    expect(setupRaw.indexOf('gh pr view')).toBeLessThan(setupRaw.indexOf('gh pr create'));
  });

  test('the landingLinkEnabled flip fails loudly on pattern drift', () => {
    // A silent no-op sed would leave fork nav pointing at the deleted
    // /landing/ routes with no build error — same loud-fail policy as the
    // [vars] match-nothing guard above it.
    expect(setupRaw).toContain("grep -q 'landingLinkEnabled = false' src/config/project.ts");
  });

  test('custom [vars] keys are preserved verbatim, not dropped (single-source rule with the CLI)', () => {
    // rewriteWranglerVars (the JS channel) preserves and warns for keys
    // outside the template; the python channel must behave the same. Pinned
    // by the shared sentinel comment both channels emit.
    expect(setupRaw).toContain('# Custom [vars] keys the template does not know are preserved verbatim.');
    expect(setupRaw).toContain('TEMPLATE_KEYS');
    expect(setupRaw).toContain("file=sys.stderr");
  });
});

describe('freshness audit stays read-only', () => {
  test('upstream-only guard and issues-only permissions unchanged', () => {
    const wf = readWorkflow(AUDIT) as Workflow;
    expect(wf.jobs?.audit?.if).toContain('github.repository');
    expect(wf.permissions).toEqual({ contents: 'read', issues: 'write' });
  });

  test('runs are serialized at the file level (cancel-in-progress: false)', () => {
    // Two overlapping audits would each close "the previous" evergreen issue
    // mid-flight — a queue, not a cancel: the in-flight run finishes and the
    // next one supersedes it with fresher data.
    const wf = readWorkflow(AUDIT) as Workflow;
    expect(wf.concurrency?.group).toBe('content-pipeline');
    expect(wf.concurrency?.['cancel-in-progress']).toBe(false);
  });

  test('issue close filters on the exact audit title BEFORE picking the first hit', () => {
    // `--search` matches title substrings: taking .[0] unfiltered could close
    // an unrelated human issue that merely contains the phrase. The jq filter
    // must pin the exact "Content freshness audit — YYYY-MM-DD" shape, and a
    // no-match run must warn instead of closing anything.
    const raw = readFileSync(join(root, AUDIT), 'utf8');
    expect(raw).toContain('select(.title | test(');
    expect(raw).toContain('Content freshness audit — [0-9]{4}-[0-9]{2}-[0-9]{2}');
    const closeIdx = raw.indexOf('gh issue close');
    const filterIdx = raw.indexOf('select(.title | test(');
    expect(filterIdx).toBeGreaterThan(-1);
    expect(closeIdx).toBeGreaterThan(filterIdx);
    expect(raw).toContain('nothing closed');
  });

  test('a failed issue create fails the step (the issue is the only output)', () => {
    // The old `|| echo "issue create failed (maybe no changes worth
    // filing)"` described a case the empty-body guard above already exits
    // on — all it swallowed was real breakage (API / rate limit / auth),
    // and with the previous issue already closed the evergreen chain lost a
    // week silently. Same loud ::warning:: channel as the no-previous-issue
    // case above, and the step goes red.
    const raw = readFileSync(join(root, AUDIT), 'utf8');
    expect(raw).not.toContain('|| echo "issue create failed');
    const createIdx = raw.indexOf('gh issue create');
    const guardIdx = raw.indexOf('::warning::issue create failed');
    expect(guardIdx, 'the create-failure ::warning:: guard is gone').toBeGreaterThan(createIdx);
    expect(raw.slice(guardIdx, guardIdx + 200)).toContain('exit 1');
  });
});

describe('release-ops publish cannot run from an unreviewed tag', () => {
  const wf = readWorkflow(RELEASE_OPS) as Workflow;
  const steps = wf.jobs?.publish?.steps ?? [];

  test('publish job requires the npm environment (owner approval)', () => {
    // Branch protection does not cover tags: without an environment gate,
    // anyone with write access could tag an arbitrary commit and publish it
    // with valid OIDC provenance. The environment (required reviewer) is the
    // front door; the workflow-side guards below are the back stop.
    expect(wf.jobs?.publish?.environment).toBe('npm');
  });

  test('ancestry guard runs UNCONDITIONALLY (both tag push and workflow_dispatch)', () => {
    // fetch-depth: 0 — the ancestry check needs origin/main locally, which
    // the default shallow clone does not contain.
    const checkout = steps.find((s) => s.uses?.startsWith('actions/checkout'));
    expect(checkout?.with?.['fetch-depth']).toBe(0);
    const guard = steps.find((s) => /merge-base --is-ancestor/.test(s.run ?? ''));
    // Both guards used to be `if: github.ref_type == 'tag'` — on the
    // workflow_dispatch path BOTH were skipped and the environment approval
    // was the only gate left. The version guard is tag-only by nature (a
    // dispatch has no tag to compare), so the ancestry guard must carry the
    // dispatch path: it runs with no `if`, and on dispatch GITHUB_SHA is the
    // checked-out branch head, which the same merge-base check covers.
    expect(guard?.if).toBeUndefined();
    expect(guard?.run).toContain('exit 1');
    // The guard must sit between checkout and npm publish — a check that
    // runs after the publish protects nothing.
    const guardIdx = steps.findIndex((s) => s === guard);
    const publishIdx = steps.findIndex((s) => (s.run ?? '') === 'npm publish');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(publishIdx).toBeGreaterThan(guardIdx);
  });

  test('tag↔version guard stays tag-only (a dispatch has no tag to check)', () => {
    const versionGuard = steps.find((s) => /TAG_VERSION/.test(s.run ?? ''));
    expect(versionGuard?.if).toContain("github.ref_type == 'tag'");
  });
});

describe('transpile-pagefind range-media lowering covers whole preludes', () => {
  // Pre-2023 kernels (old X5, Safari <16.4) drop a media rule at parse time
  // if ANY condition uses range syntax — so a first-group-only matcher that
  // rewrote `(width >= 640px)` but leaked `(hover: hover) and (width >= …)`
  // guarded nothing exactly where it matters. Pin the whole-prelude shape.
  test('compound preludes: EVERY parenthesized group gets lowered', () => {
    expect(lowerRangeMedia('@media (hover: hover) and (width >= 768px) { .x { color: red } }')).toBe(
      '@media(hover: hover) and (min-width:768px) { .x { color: red } }',
    );
  });

  test('simple preludes keep the historic byte-exact output', () => {
    // The paren-leading output shape (space collapsed, operator + trailing
    // spaces swallowed by the colon) predates the compound fix — today's
    // dist inputs must not shift by one byte.
    expect(lowerRangeMedia('@media (width>=640px){.x{}}')).toBe('@media(min-width:640px){.x{}}');
    expect(lowerRangeMedia('@media (height <= 100vh) { .x {} }')).toBe(
      '@media(max-height:100vh) { .x {} }',
    );
    // No range syntax → untouched; the guard's value is zero drift.
    expect(lowerRangeMedia('@media (max-width: 768px) { .x {} }')).toBe(
      '@media (max-width: 768px) { .x {} }',
    );
  });
});
