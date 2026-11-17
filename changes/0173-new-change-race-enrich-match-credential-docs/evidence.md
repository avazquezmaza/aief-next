# Evidence

## Summary

Fixes from an external audit of the CLI (`Hallazgo 1.txt`, 2026-11-17). `new-change` now claims
`changes/<id>-<slug>` with an atomic, non-recursive `mkdir` and never prints "Created Change" for a
directory it did not create (B1). `enrich` matches an existing Change by its exact slug, not by
suffix (B3). The credential deny rules are described as what they are: Claude Code file-tool rules
for listed paths, not a guarantee (S3). The audit's top security item — the approval guard
possibly never running in Claude Code — was tested live and does not hold. D1: the guard keeps
blocking a reworded approval, now pinned by a test.

## Activities Performed

- `cli/src/commands/shared.js`: `claimChangeDir(dir)` (new, exported) creates the directory
  non-recursively and returns `false` on `EEXIST`; `createChange()` stops with exit 1 and a message
  when the claim fails, and reports any scaffold file `writeFile()` did not write instead of
  printing "Created" (R1, R2).
- `cli/src/commands/enrich.js`: `findChangeBySlugSuffix()` compares the basename without its
  numeric prefix to the slug, exactly (R3).
- `docs/configuration.md`, `docs/cli.md` and `aief help guardrails` (`cli/src/commands/misc.js`):
  the deny rules stop Claude Code's file tools reading the listed paths; other credential files
  and shell commands such as `cat .env` are not covered (R4).
- `cli/tests/new-change-claim.test.js` (new, 4 tests); one guard test for D1 in
  `cli/tests/guardrails.test.js`.

## Verification

- B1 reproduced before the fix, in a scratch directory, 4 concurrent
  `aief new-change "race test" --no-branch` per try: try1 `Created=4 dirs=3`, try2 `Created=4
  dirs=3`, try3 `Created=4 dirs=2`. After the fix, four tries: `Created=3 dirs=3 errors=1`,
  `3/3/1`, `2/2/2`, `3/3/1`; every created directory holds all four files; the losers print
  `changes/0001-race-test already exists — another aief new-change may be running at the same
  time. Nothing was written; run it again.` and exit 1.
- B3 before the fix (audit): `enrich manual TEST-001` next to `0001-notes-on-manual-test-001` →
  "already exists", exit 0, nothing created. After: creates `0002-manual-test-001`; a second run
  still reports "A Change for manual:TEST-001 already exists: changes/0002-manual-test-001".
- R5 — approval guard live in Claude Code (2.1.326), scratch project, guard installed with
  `aief guardrails install --approval-hook` (registered as `command: "node"`, script path in
  `args`), driven by `claude -p … --model haiku --allowedTools Edit Read --permission-mode
  acceptEdits`:
  - Edit checking `- [ ] (human) Owner approves` → blocked; the session received
    "checked: (human) Owner approves"; file unchanged.
  - Edit adding `- [x] (human) Owner approves the release` → blocked; "added already resolved:
    (human) Owner approves the release"; file unchanged.
  Claude Code passes `args`: the audit's "fail-open" scenario does not occur on this version. This
  closes what Change 0162's evidence left as "Not verified: the hook inside a live Claude Code
  session".
- `node --test cli/tests/new-change-claim.test.js` → 4 pass, three consecutive runs.
- `npm test` → `tests 818, pass 818, fail 0`. `npm run lint` → clean. `git diff --check` → clean.
  `aief verify` → PASS.
- PR: https://github.com/avazquezmaza/aief-next/pull/126, squash-merged as `3d5ca40`. On `main`
  before close: `verify --strict --change 0173` → PASS with three non-blocking approval notices
  (the squash-merge window from Change 0172).

## Findings

- The audit was right on B1 and B3 and on the credential wording; it was wrong on the guard. Its
  author flagged that item "not verified", and it took one live session to settle.
- Two concurrent runs with *different* names can still take the same id; `aief verify` already
  reports that as a duplicate id. Left out of scope.

## Risks

- `claimChangeDir()` throws on errors other than `EEXIST` (e.g. permissions), as `writeFile()`
  already did; behaviour there is unchanged.

## Recommendations

- Audit items left out of scope (help drift, deny-list contents, `shell: true` on win32, installer
  error handling, `approval-history.js` subprocess count) can each become a Change if wanted.

## Artifacts Produced

- `cli/src/commands/shared.js`, `cli/src/commands/enrich.js`, `cli/src/commands/misc.js`
- `cli/tests/new-change-claim.test.js`, `cli/tests/guardrails.test.js`
- `docs/configuration.md`, `docs/cli.md`

## Lessons Learned

A success message is a claim; it should be printed only after the step that makes it true. And
an unverified security finding is a question, not a defect, until something runs it.

## Next Change

None required.
