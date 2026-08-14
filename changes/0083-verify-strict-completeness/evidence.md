# Evidence

## Summary

Added `aief verify --strict` — an opt-in, deterministic objective-completeness check
(TODO/TBD, untouched scaffold placeholders, empty Requirements/Acceptance Criteria, a Definition
decision with no recorded outcome, an unresolved required human decision) layered on top of
default `aief verify`, which is provably unaffected. Validated against AIEF's own 83-Change
repository, including a real false positive found and fixed during that validation.

## Activities Performed

- Added `checkStrictCompleteness(change)`, `extractSection()`, `isPlaceholderContent()` in
  `change-verifier.js`; threaded an optional `strict` parameter (default `false`) through
  `verifyProject()`, `verifyChange()`, `addChangeLines()`.
- Added `--strict` to `KNOWN_FLAGS.verify` and wired it in `cli.js`'s `verify()` for both the
  whole-project and `--change` paths; documented it in `aief help verify`.
- Added `cli/tests/verify-strict.test.js`: 8 unit tests against `checkStrictCompleteness()`
  directly.
- Added 7 CLI-level tests in `cli.test.js`: default-verify-unaffected (backward compatibility),
  strict-flags-untouched-scaffold, `--strict --change` scoping, strict-passes-once-filled-in,
  Definition-decision-no-outcome, unresolved-human-decision, and the Change 0077 unknown-option
  regression (`--strikt`).
- Ran `node cli/bin/aief.js verify --strict` against AIEF's own repository (required by the
  commissioning brief §16/§19) and found a real false positive: `changes/0036.../tasks.md`
  documents the recognized status-token vocabulary inside a backtick span
  (`` `OPEN/PROPOSED/.../ACTIVE/TODO` ``) — not an unresolved marker. Fixed by stripping inline
  code spans (including ones a Markdown line-wrap carries across a newline) before TODO/TBD
  scanning, added `stripInlineCode()`, and added a regression test for exactly this case.
- After the fix, `--strict` against AIEF's own repository reports only genuinely unresolved
  `(human)` tasks in Changes 0036/0037/0038/0039/0042 — every one of them a real, already-known
  decision still pending the project owner, per ADR-015's freeze (confirmed against
  `knowledge/decisions.md` — these are exactly the items ADR-015 froze pending Change 0042's
  usability study, and ADR-022's later thaw explicitly did not unfreeze them).

## Verification

- `node --test cli/tests/verify-strict.test.js` — 8/8 pass.
- `node --test --test-name-pattern="verify --strict|aief verify is unaffected|strict"
  cli/tests/cli.test.js` — 7/7 pass.
- `npm test` (full suite) — 891/891 pass, 0 fail (876 before this Change + 15 new).
- `node cli/bin/aief.js verify` (default, real repo) — Result: PASS, unaffected.
- `node cli/bin/aief.js verify --strict` (real repo) — Result: FAIL, with exactly 10 `[strict]`
  lines, all genuine unresolved `(human)` decisions in already-frozen Changes; zero false
  positives after the inline-code-span fix.
- `git diff --check` — clean.

## Findings

- Real-repository validation (§16/§19 of the commissioning brief) caught a genuine false positive
  a synthetic-fixture-only test suite would not have surfaced — the backtick-spanning-a-line-wrap
  case is specific to how this repository's own tasks.md documents a code vocabulary. This
  justifies running `--strict` against AIEF itself as part of this Change's own verification, not
  only as a demo for the end-to-end Change (0084).

## Risks

- The TODO/TBD check is a literal substring match outside code spans — a project that writes
  "TODO" as prose unrelated to unfinished work (rare, but possible) could still see a false
  positive. Documented, not solved: `--strict` is deliberately opt-in and additive so this never
  affects default `aief verify`.

## Recommendations

- None — Change 0084 (end-to-end validation) can now exercise `--strict` as part of the full
  pre-implementation Definition flow.

## Artifacts Produced

- `cli/src/core/services/change-verifier.js`: `checkStrictCompleteness()` and helpers.
- `cli/src/cli.js`: `--strict` flag, `verify()` wiring, help text.
- `cli/tests/verify-strict.test.js` (new, 8 tests), `cli/tests/cli.test.js` (+7 tests).
- `changes/0083-verify-strict-completeness/`.

## Lessons Learned

- Running a new deterministic check against the real, large, imperfect repository it will
  eventually govern — not just synthetic fixtures — is the fastest way to find a false positive a
  hand-written test suite would not think to construct. Worth doing before close, not only at
  Change 0084's end-to-end stage.

## Next Change

Change 0084 — end-to-end pre-implementation initialization (fresh PRD-only project through
bootstrap → analyze → Definition → enrichment → human gate → durable decisions → strict
verification → implementation handoff), plus user docs and CLI help updates.
