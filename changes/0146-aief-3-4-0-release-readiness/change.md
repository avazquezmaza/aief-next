# Change

## ID

`0146-aief-3-4-0-release-readiness`

## Type

General

## Objective

Prepare AIEF 3.4.0 for release, following the 3.3.0 precedent (Change 0102 → 0103 → 0104): verify
Changes 0105–0145 are integrated on `main`, audit documentation for drift since 3.3.0, fix what the
audit verifies is broken, and record release-readiness evidence. The version bump, tag and
release notes are separate, later steps.

## Inventory of what already exists

AIEF 3.4.0 is 42 Changes since `v3.3.0` (0105–0145; two Changes share `0122`), 67 commits, each
Change closed with its own evidence. Main themes:

- **Governance enforcement:** Workflow Gate authority defined and enforced by `aief close` for
  tracked Changes (0124/0125, ADR-037); one branch per Change enforced by the CLI (0114/0117);
  scope-creep guidance (0127); operational guardrails as policy (0111).
- **Security:** Jira provider path traversal (0105), malformed export handling (0116), threat model
  and trust boundaries (0132), supply-chain CI hardening, secret scanning and a dependency fix
  (0133/0136), generated GitHub workflow removed from bootstrap (0139).
- **Verification and integrity:** `verify --strict` gaps (0109/0115/0120), `verify --json` (0138),
  numeric-ID collision detection in `verify`/`status` (0135/0137), manifest status written on
  close (0131), evidence-report provenance (0129), architecture fitness functions (0128), graph
  cycle reporting (0123).
- **Assistants and detection:** Kiro as a fifth assistant (0112/0113), assistant parity and audit
  hardening (0121), Java/Quarkus/Camel/OpenShift detection (0140), `aiRoadmap` false positive
  (0141), standards derived from the Skill catalog (0106/0108), ai-specs frontmatter (0110).
- **Platform and docs:** Node >= 22 (0126/0142), CI lint (0119), CI apt flakiness (0122), AGENTS
  template in `bootstrap <name>` (0118), external audits (0130/0134), minor fixes (0107).
- **Laya experiment:** analysis, opt-in unvalidated example in `examples/laya-triage/`, evaluation
  with a no-go on fine-tuning (0143/0144/0145). No engine change.

At the start of this Change: `npm test` 1126/1126 PASS; `aief verify` PASS; `main` equals
`origin/main`; only `main` exists locally and on `origin`.

## Scope

### In scope

- Integration check: 0105–0145 reachable from `main` and closed.
- Documentation audit for drift since 3.3.0 (dangling `docs/*.md` references, version strings,
  Node version, Kiro, gates, branch-per-Change, `verify --json`, Skills count), and fixes for the
  gaps it verifies.
- This Change's `spec.md`, `tasks.md`, `evidence.md`.

### Out of scope

- Version bump in `package.json`/`cli/package.json`/`package-lock.json`, and the `README.md`
  `## Status` "AIEF 3.3" line: the next Change (bump), per the 0102 → 0103 precedent and the
  `docs/maintainer.md` "Releasing" note.
- Tag, `releases/v3.4.0.md`, GitHub Release: after the bump, only with explicit owner confirmation.
- New features, commands or manifest fields; re-litigating any shipped Change.

## Success Criteria

- 0105–0145 confirmed on `main` and closed.
- Every documentation gap the audit verified is fixed or explicitly deferred to the bump Change.
- `npm test`, `node cli/bin/aief.js verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
