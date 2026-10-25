/**
 * [WHY]:    版本号五处 + anvil-ops 版本行 + anvil-* 技能枚举此前只有部分被
 *           changelog.test 覆盖;roadmap 版本头、AGENTS Status、ops「semver X.Y.Z」
 *           行与技能枚举四处是无门禁纯纪律项,文档漂移审计多轮在这些面上反复抓漏。
 *           本模块把「逐项比对」抽成纯函数,tests/versions.test.ts 直测后随 pnpm test
 *           进 CI——纪律变门禁(changelog.test 先例),CLI 壳 scripts/check-versions.ts
 *           供每日体检一键输出红绿。
 * [INPUT]:  各同步面的文件内容字符串(package.json / landing-shared.ts / CHANGELOG /
 *           roadmap / AGENTS / tools/anvil-ops/package.json / README / docs README /
 *           PRD),由调用方读取后注入——保持纯函数可测。
 * [OUTPUT]: checkVersionConsistency() 返回逐项检查结果数组,被 CLI 与测试双方消费。
 * [BOUND]:  只比对字面一致性与存在性,不解析语义;AGENTS Status 的 as-of 日期只做
 *           报告级老化提示(>35 天),不当失败;CI workflow(ci.yml)零改动——
 *           门禁经 pnpm test 自动生效。
 * [PROTOCOL]: 新增版本同步面时,在此加检查项+补 fixture 测试+更新 AGENTS 命令表。
 */

export interface VersionCheck {
  /** 稳定检查项 ID,测试与 CLI 输出引用 */
  id: string;
  ok: boolean;
  /** 通过时为通过描述;失败时为期望 vs 实际 */
  detail: string;
  /** 报告级提示(不判失败),如 as-of 老化 */
  note?: string;
}

/** 六个 anvil-* 技能名——技能增删时同步 .agent/skills/ 与本清单 */
export const ANVIL_SKILLS = [
  'anvil-find-keywords',
  'anvil-new-article',
  'anvil-batch-articles',
  'anvil-update-codes',
  'anvil-refresh',
  'anvil-adsense-audit',
] as const;

/** 技能枚举必须各自出现一次的四个同步面文件 */
export const SKILL_ENUM_SURFACES = ['README.md', 'docs/README.md', 'docs/PRD.md', 'AGENTS.md'] as const;

const extractPackageVersion = (packageJson: string): string =>
  JSON.parse(packageJson).version;

const extractProjectVersion = (landingShared: string): string | null =>
  landingShared.match(/PROJECT_VERSION = '([^']+)'/)?.[1] ?? null;

/** CHANGELOG 中最新已发布版本段号(跳过 [Unreleased]) */
const extractLatestChangelogVersion = (changelog: string): string | null =>
  changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1] ?? null;

const extractRoadmapVersion = (roadmap: string): string | null =>
  roadmap.match(/当前版本:v(\d+\.\d+\.\d+)/)?.[1] ?? null;

const extractAgentsStatusVersion = (agents: string): string | null =>
  agents.match(/当前最新 \*\*v(\d+\.\d+\.\d+)\*\*/)?.[1] ?? null;

const extractAgentsStatusDate = (agents: string): string | null =>
  agents.match(/Status \(as of (\d{4}-\d{2}-\d{2})\)/)?.[1] ?? null;

const extractOpsVersion = (opsPackageJson: string): string | null =>
  JSON.parse(opsPackageJson).version;

export interface VersionCheckInputs {
  packageJson: string;
  landingShared: string;
  changelog: string;
  roadmap: string;
  agents: string;
  opsPackageJson: string;
  /** 技能枚举四个同步面的内容,键为文件路径 */
  skillSurfaces: Record<string, string>;
  /** 仅用于 as-of 老化提示的「今天」,ISO 日期;测试可注入固定值 */
  todayIso: string;
}

export function checkVersionConsistency(input: VersionCheckInputs): VersionCheck[] {
  const checks: VersionCheck[] = [];
  const pkgVersion = extractPackageVersion(input.packageJson);
  const projectVersion = extractProjectVersion(input.landingShared);
  const changelogVersion = extractLatestChangelogVersion(input.changelog);
  const roadmapVersion = extractRoadmapVersion(input.roadmap);
  const agentsVersion = extractAgentsStatusVersion(input.agents);
  const opsVersion = extractOpsVersion(input.opsPackageJson);

  checks.push({
    id: 'project-version',
    ok: projectVersion === pkgVersion,
    detail: `package.json ${pkgVersion} ↔ PROJECT_VERSION ${projectVersion ?? '(not found)'}`,
  });
  checks.push({
    id: 'changelog-latest',
    ok: changelogVersion === pkgVersion,
    detail: `package.json ${pkgVersion} ↔ CHANGELOG latest section ${changelogVersion ?? '(not found)'}`,
  });
  checks.push({
    id: 'roadmap-header',
    ok: roadmapVersion === pkgVersion,
    detail: `package.json ${pkgVersion} ↔ roadmap 当前版本 ${roadmapVersion ?? '(not found)'}`,
  });
  checks.push({
    id: 'agents-status',
    ok: agentsVersion === pkgVersion,
    detail: `package.json ${pkgVersion} ↔ AGENTS Status 当前最新 ${agentsVersion ?? '(not found)'}`,
  });

  // AGENTS Status as-of 日期老化:报告级,不拦(发版日才必更,纯内容周可能数周不动)
  const statusDate = extractAgentsStatusDate(input.agents);
  let asOfNote: string | undefined;
  if (statusDate) {
    const days = Math.round(
      (Date.parse(`${input.todayIso}T00:00:00`) - Date.parse(`${statusDate}T00:00:00`)) / 86_400_000,
    );
    if (days > 35) asOfNote = `AGENTS Status as-of ${statusDate} is ${days} days old — refresh on next release`;
  }

  // ops 版本行:AGENTS 的「semver X.Y.Z」必须与 tools/anvil-ops/package.json 一致
  const opsSemver = input.agents.match(/anvilwiki-ops`, semver (\d+\.\d+\.\d+)/)?.[1] ?? null;
  checks.push({
    id: 'ops-version-line',
    ok: opsSemver === opsVersion,
    detail: `tools/anvil-ops ${opsVersion} ↔ AGENTS "semver ${opsSemver ?? '(not found)'}"`,
  });

  // 技能枚举:每个技能名在四个同步面各至少出现一次
  for (const surface of SKILL_ENUM_SURFACES) {
    const content = input.skillSurfaces[surface] ?? '';
    const missing = ANVIL_SKILLS.filter((skill) => !content.includes(skill));
    checks.push({
      id: `skills-${surface}`,
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? `${surface}: all ${ANVIL_SKILLS.length} anvil-* skills present`
          : `${surface}: missing ${missing.join(', ')}`,
    });
  }

  if (asOfNote) {
    const status = checks.find((c) => c.id === 'agents-status');
    if (status) status.note = asOfNote;
  }
  return checks;
}
