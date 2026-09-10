# Evidence

## Summary

Closes the part of `docs/security-model.md`'s (Change 0132) supply-chain Known Gap that's pure
CI configuration: CodeQL static analysis, dependency-vulnerability review on every PR, and
CycloneDX SBOM generation on every push to `main` — all via GitHub-hosted actions or npm's own
built-in `sbom` command, no new dependency added to `cli/package.json`.

## Activities Performed

- Confirmed the repository is public (`gh repo view --json visibility`) — CodeQL and Dependency
  Review are free for public repos, no billing/plan concern.
- Added `.github/workflows/codeql.yml`: `github/codeql-action` `init`+`analyze` for
  `javascript-typescript`, on push to `main`, every PR, and a weekly cron (catches a newly
  disclosed CVE in already-merged code, not only new changes) — scoped `permissions` to exactly
  `security-events: write`/`contents: read`.
- Added `.github/workflows/dependency-review.yml`: `actions/dependency-review-action` on every
  PR.
- Added an `sbom` job to `.github/workflows/ci.yml`, gated to `push` only (not PRs — an SBOM
  describes what's released): `npm ci` then `npm sbom --sbom-format cyclonedx`, uploaded as a
  build artifact (90-day retention).
- Updated `docs/security-model.md`'s Known Gaps section: removed the "no CodeQL/dependency-
  review/SBOM" line (now covered); added a line naming secret scanning specifically as the
  remaining gap — a repository *setting* (Settings → Code security), not CI config, left for
  the project owner to enable directly rather than toggled by this Change (an outward-facing
  repository-configuration change).

## Verification

- Verified `npm sbom --sbom-format cyclonedx` runs successfully against `cli/`'s real
  `package.json`/`package-lock.json` locally (npm 10.9.8) before writing the CI step — produces
  valid CycloneDX 1.5 JSON.
- Validated all three workflow files as syntactically valid YAML
  (`python3 -c "import yaml; yaml.safe_load(open(f))"` for each).
- `npm test` (cli/): 1095/1095 passed — unaffected, as expected (no application code touched).
- `npm run lint`: clean — unaffected.
- `node cli/bin/aief.js verify --change 0133-supply-chain-hardening --strict`: PASS.
- `git diff --check`: clean.
- `cli/package.json`'s `dependencies`/`devDependencies` are byte-identical to before this
  Change — confirmed by diff.
- The three new/modified workflow files themselves only actually execute in GitHub Actions —
  their first real execution was this Change's own PR (#79). **All watched to green before
  merging**, not assumed:
  - `Analyze (javascript-typescript)` (CodeQL): passed on first run.
  - `lint`/`test (22)`/`test (24)`: passed on first run, unaffected as expected.
  - `Generate SBOM`: correctly skipped (PR event, not `push` — exactly the intended gating).
  - `dependency-review`: **failed on first run** — `"Dependency review is not supported on this
    repository. Please ensure that Dependency graph is enabled"`. Root cause: the action
    requires GitHub's vulnerability-alerts feature enabled at the repository level; it was off
    (`gh api repos/.../vulnerability-alerts` returned 404). Fixed by enabling it directly
    (`gh api --method PUT repos/.../vulnerability-alerts`, confirmed with the user first as an
    outward-facing repository-configuration change) — a one-time, additive, reversible setting,
    not a workflow-file bug. Re-ran the job; passed. Documented here since it's a real
    repository-configuration prerequisite this Change's workflow depends on, not obvious from
    the YAML alone.

## Findings

- None beyond what change.md already named.

## Risks

- CodeQL or Dependency Review could surface a real finding once they start running against this
  repository for the first time — that is the intended outcome of adding them, not a risk of
  this Change; triaging any such finding is explicitly out of this Change's own scope (see
  change.md).

## Recommendations

- If CodeQL or Dependency Review's first real run surfaces a finding, triage it as its own,
  separate Change — do not silently suppress or ignore it.
- Enabling GitHub's secret scanning / push protection (a repository setting) remains a
  recommended next step for the project owner, outside what this Change touches.

## Artifacts Produced

- `.github/workflows/codeql.yml`, `.github/workflows/dependency-review.yml` (new).
- `.github/workflows/ci.yml` (extended with the `sbom` job).
- `docs/security-model.md` (Known Gaps section updated).

## Lessons Learned

- npm's own built-in `sbom` command (available since npm 9.5, and this project's Node ≥22 floor
  already guarantees a compatible npm) meant SBOM generation needed zero new dependencies —
  worth checking a tool's own built-in capabilities before reaching for a dedicated package,
  the same lesson Change 0128 drew from ESLint's core rules covering what looked like it might
  need a plugin.

## Next Change

- None required now. See Recommendations for the secret-scanning setting and any real
  CodeQL/Dependency-Review finding that surfaces once these workflows run for the first time.
