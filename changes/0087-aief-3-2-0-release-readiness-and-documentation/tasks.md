# Tasks

## Integration Verification

- [x] Validate repo state: `git status`, `git branch --show-current`, `git fetch --all --prune
      --tags`, `git rev-list --left-right --count origin/main...main` (0 0 — up to date).
- [x] Confirm Changes 0073–0086 present under `changes/`, closed, and reachable from `main`
      (`git log --oneline main -- changes/<id>`).
- [x] Run baseline `npm test` (907/907 PASS), `node cli/bin/aief.js verify` (PASS), `git diff
      --check` (clean).

## Branch Cleanup

- [x] `git branch --merged main` / `git branch --no-merged main` — all 7 target branches merged,
      none unmerged.
- [x] `git merge-base --is-ancestor <branch> main` for each of the 7 local branches — all pass.
- [x] `git merge-base --is-ancestor origin/<branch> origin/main` for the 6 remote counterparts
      (`remediation/audit-fixes-2026-08` has no remote counterpart) — all pass.
- [x] User confirmed deletion (destructive Git operation — explicit confirmation obtained per
      standing rule).
- [x] `git branch -d` all 7 local branches; `git push origin --delete` the 6 remote counterparts;
      `git fetch origin --prune`.
- [x] Report the 6 additional merged-but-unreviewed remote branches found (`docs/0066-*`,
      `feat/0067-*`, `feat/0068-*`, `feat/0069-*`, `feat/0072-*`, `refactor/0070-*`) — left alone,
      not part of this Change's reviewed set.

## Release Convention Study

- [x] Read Changes 0060 (release readiness), 0061 (unrelated feature squeezed into the same window),
      0062 (version-bump-only Change) to establish precedent.
- [x] `git tag --list --sort=version:refname` — only `aief-2.0-baseline` and `v3.0.0` exist; no
      `v3.1.0` tag was ever created.
- [x] `ls releases/` — only `v0.1.0.md`, `v0.2.0-readme-cli-v2.md`, `v1.0.0.md`; neither 3.0.0 nor
      3.1.0 has a `releases/` file, even though `aief release <version>` exists.
- [x] `CHANGELOG.md` confirmed explicitly unmaintained past Change 0031 ("for everything since, see
      changes/").
- [x] `gh` confirmed not installed; no evidence any GitHub Release was ever created.
- [x] Presented the convention gap to the user; decision: match 3.1 exactly (no tag, no `releases/`
      file, no GitHub Release for 3.2.0 either).

## Documentation

- [x] Audit README.md, docs/, AGENTS.md for Definition/Analysis/maturity/verify/decision coverage.
- [x] README.md: product positioning, "Definition and Analysis" section, "Start a software
      initiative before code exists" section, "What AIEF adds" bullet, Documentation table rows.
- [x] docs/cheat-sheet.md: Project Maturity / Definition Change glossary rows, canonical-flow step 2.
- [x] docs/concepts.md: maturity-aware standards paragraph under Project Maturity.
- [x] Confirmed docs/getting-started.md ("Starting from a PRD"), docs/cli.md (`analyze`/
      `new-change --type definition`/`verify --strict` rows) already accurate — no edit needed.
- [x] Confirmed no documentation claims `aief bootstrap` pre-creates `knowledge/decisions.md`.
- [x] Confirmed no documentation claims Architecture/Security/Data Definition Skills or Definition
      Expert Enrichment exist.
- [x] Consistency search: `aief analyze`, `aief verify`, `Definition`, `existing.*implementation`,
      `existing.*code` across README/docs/AGENTS.md — no stale contradiction found.

## CLI Validation

- [x] `aief help analyze`, `grep -- "--maturity" cli/src/cli.js` — flag exists, matches docs.
- [x] `aief help new-change` — `--type definition` documented and implemented.
- [x] `node cli/bin/aief.js verify` output cross-checked against `docs/cli.md`'s `verify --strict`
      row.

## Verification

- [x] `npm test` — 907/907 PASS.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.

## Evidence

- [x] Update evidence.md
