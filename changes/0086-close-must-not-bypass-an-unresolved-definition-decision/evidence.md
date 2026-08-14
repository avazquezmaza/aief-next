# Evidence

## Summary

Fixed a real governance bypass: `aief close --yes` could close a Definition Change with every
`(human)` approval task checked while `## Decision (human)` still held the untouched scaffold
placeholder. Found and confirmed by a focused pre-merge adversarial review's "Case 2" of its
mandatory four-state human-decision matrix; reproduced before any code change, fixed by making an
existing `--strict`-only check unconditional at close, and covered by 9 new regression tests
(7 domain-level, 2 CLI-level) plus re-verification that Change 0083's own tests are untouched.

## Activities Performed

- Reproduced Case 2 directly against the unmodified CLI: created a Definition Change, filled
  `Decisions Required` and `Recommendation`, checked off every `(human)` task in `tasks.md`
  without editing `## Decision (human)`, ran `aief close --yes` — it succeeded. Captured the
  before-state as evidence.
- Reproduced Cases 1, 3, 4 to confirm they were already correct (not broken) — Case 1 and 3 block
  on the pre-existing `openTasksCount` gate; Case 4 succeeds correctly.
- Extracted the "Decisions Required has content but Decision (human) records no outcome yet" check
  out of `checkStrictCompleteness()` (Change 0083) into a standalone, exported
  `definitionDecisionOutcomeProblem(change)`; `checkStrictCompleteness()` now calls it — zero
  behavior change there (verified: Change 0083's own tests still pass unmodified).
- Called `definitionDecisionOutcomeProblem()` from `checkChangeReadiness()` — the single function
  `aief close` uses (confirmed exactly one call site via `grep`) — so it always runs for a
  Definition Change, not gated behind `--strict`.
- Re-reproduced Case 2 against the fixed code: `close --yes` now refuses, with the exact message
  `Decisions Required has content but Decision (human) records no outcome yet`; filling in
  `Decision (human)` genuinely and retrying succeeds.
- Added `cli/tests/definition-close-governance.test.js` (7 domain-level tests: the 4-case matrix
  against `checkChangeReadiness()` directly, `definitionDecisionOutcomeProblem` no-op for
  non-Definition types and for an empty `Decisions Required`, and a non-Definition regression
  guard reproducing the same document shape).
- Added 2 CLI-level tests to `cli.test.js`: the full Case-2-then-fixed-then-succeeds flow through
  the real `aief close` command, and Case 3 (approved decision, unchecked task still blocks).

## Verification

- `node --test cli/tests/definition-close-governance.test.js` — 7/7 pass.
- `node --test --test-name-pattern="Case 3|Decision \(human\) still holds|Change 0086"
  cli/tests/cli.test.js` — 2/2 pass.
- `node --test cli/tests/verify-strict.test.js` (Change 0083's own suite, unmodified) — 8/8 pass,
  confirming the extraction preserved `--strict`'s behavior exactly.
- `npm test` (full suite, combined with Change 0085's fix) — 907/907 pass, 0 fail.
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.

## Findings

- The assistant-facing trust boundary (`aief prompt`'s Definition instructions: "never fill in the
  Decision (human) section yourself... never mark a task under Human Approval done yourself") was
  already correct as a *policy* statement — this Change closes the *technical* gap the review
  found (a careless or malicious close bypassing that policy), it does not change or strengthen
  the prompt-level instruction itself. The two layers (policy + this fix) are complementary, not
  duplicative: the prompt instruction is what a compliant assistant follows; this fix is what
  happens when it — or a human — doesn't.

## Risks

- None new. The fix is strictly narrowing (blocks a previously-succeeding case), so no existing
  valid Definition Change close could regress — verified via the full suite and via Change 0084's
  own end-to-end test (which genuinely fills `Decision (human)`) still passing unmodified.

## Recommendations

- None.

## Artifacts Produced

- `cli/src/core/services/change-verifier.js`: `definitionDecisionOutcomeProblem()` (extracted,
  exported), `checkChangeReadiness()` wiring.
- `cli/tests/definition-close-governance.test.js` (new, 7 tests).
- `cli/tests/cli.test.js` (+2 tests).
- `changes/0086-close-must-not-bypass-an-unresolved-definition-decision/`.

## Lessons Learned

- A reusable check written for an opt-in mode (`--strict`) can hide a real gap in the mandatory
  path (`close`) if nothing ever calls it from there — worth asking, for any `--strict`-only check
  introduced in the future, whether part of it should also be a `close` invariant.

## Next Change

None required to close this program — this was the second of two independent fixes from the
focused pre-merge review; both are now closed.
