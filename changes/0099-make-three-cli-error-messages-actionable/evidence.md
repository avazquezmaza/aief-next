# Evidence

## Summary

Audited every `console.error()` call in `cli/src/commands/*.js` and `cli/src/cli.js` (32 sites).
29 already state a next step (Example:/Fix this with:/Known X:); 3 did not. Brought those 3 in
line with the rest of the codebase's own convention — text only, no control-flow change.

## Activities Performed

- `grep -n "console.error" cli/src/commands/*.js cli/src/cli.js` — reviewed all 32 sites.
- `resolveImplicitChange()` in `cli/src/commands/shared.js`: "No open Change found." now points to
  `aief new-change "<name>"` and `aief status`.
- `createChange()` in `cli/src/commands/shared.js`: "Change name is required." now includes
  `Example: aief new-change "Add login"`.
- `initProject()` in `cli/src/commands/bootstrap.js`: "Project already exists: <path>" now
  suggests a different name or `cd`-ing in and running `aief bootstrap` there.
- Updated the existing "1. zero open Changes" test in `change-selection.test.js` to also assert
  the new next-step text, and added 2 new tests: one for `new-change` with no name, one for
  `bootstrap <name>` on an existing directory.

## Verification

- `node --test cli/tests/change-selection.test.js cli/tests/cli-bootstrap-and-standards.test.js`
  — 56/56 passing.
- `npm test` (full suite) — 1005/1005 passing (1003 pre-existing + 2 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.
- `git status --short` confirms only `shared.js`, `bootstrap.js`, and the two test files changed
  outside this Change's own directory — matches spec.md's scope exactly.

## Findings

None. All three messages were genuine gaps (no wrapper caller was already appending guidance);
confirmed by grepping each function's call sites before editing.

## Risks

None identified — pure string changes to error paths already covered by tests using substring
regex match, not full-string equality, so the extended text could not silently break an existing
assertion (verified: all pre-existing assertions on these three messages still pass unmodified).

## Recommendations

None — this closes the audited gap. If a future `console.error()` call site is added without a
next step, the same audit grep (`console.error` across `cli/src/commands/*.js`) is a fast way to
re-check consistency.

## Artifacts Produced

- `cli/src/commands/shared.js` — 2 messages updated.
- `cli/src/commands/bootstrap.js` — 1 message updated.
- `cli/tests/change-selection.test.js` — 1 test updated, 1 test added.
- `cli/tests/cli-bootstrap-and-standards.test.js` — 1 test added.

## Lessons Learned

The codebase's existing error-message convention (state the problem, then the fix) made the gap
easy to spot with a single grep and easy to close consistently — no new pattern was invented.

## Next Change

None proposed — this was the last item on the current improvement plan (skills-catalog expansion,
manifest-drift diagnostic [already covered by Change 0095], actionable error messages).
