# Tasks

## Reproduction

- [x] Reproduce Case 2 against unmodified `checkChangeReadiness()`/`close` — confirmed
      `close --yes` succeeded incorrectly.
- [x] Confirm Cases 1, 3, 4 already behave correctly (not broken).

## Implementation

- [x] Extract `definitionDecisionOutcomeProblem(change)` from `checkStrictCompleteness()`.
- [x] Call it from `checkChangeReadiness()`, unconditionally for Definition Changes.

## Tests

- [x] Domain-level: full 4-case matrix against `checkChangeReadiness()` directly
      (`cli/tests/definition-close-governance.test.js`).
- [x] Domain-level: no-op for non-Definition types; no-op when Decisions Required itself is empty;
      non-Definition regression guard.
- [x] CLI-level: `aief close` blocked in Case 2, then succeeds once genuinely recorded.
- [x] CLI-level: `aief close` blocked in Case 3 (approved decision, unchecked task).
- [x] Re-ran Change 0083's existing `checkStrictCompleteness()` tests — unmodified, still pass
      (proves the extraction changed nothing about `--strict`'s behavior).

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
