# Evidence

## Summary

`checkStrictCompleteness()`'s scan for unresolved `(human)` tasks in `tasks.md` now recognizes all
three CommonMark unordered-list markers (`-`, `*`, `+`), matching the tolerance `countOpenTasks()`
(Change 0075) and this same file's own Acceptance Criteria placeholder check (Change 0109) already
apply. Found by an independent audit review: a pending `(human)` decision written with `*` or `+`
was silently invisible to `aief verify --strict`.

## Activities Performed

- Changed the line-match regex in `checkStrictCompleteness()`
  (`cli/src/core/services/change-verifier.js`) from `/^\s*-\s*\[\s\]\s*\(human\)\s*(.+)$/i` to
  `/^\s*[-*+]\s*\[\s\]\s*\(human\)\s*(.+)$/i`.
- Added two tests to `cli/tests/verify-strict.test.js`: unresolved `(human)` tasks written with `*`
  and `+` are flagged; checked (`[x]`) ones written with `*`/`+` are not.

## Verification

- `npm test`: 1035/1035 pass (1033 before this Change; +2 new tests, zero regressions).
- `node cli/bin/aief.js verify --strict --change 0115`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

None beyond the pre-existing gap this Change fixes.

## Risks

None — strictly widens detection (more `(human)` tasks are caught, never fewer); no change to
checked-box semantics.

## Recommendations

None.

## Artifacts Produced

- Diff to `cli/src/core/services/change-verifier.js`.
- Diff to `cli/tests/verify-strict.test.js`.

## Lessons Learned

A tolerance fix applied to one regex in a file doesn't propagate to sibling regexes in the same
file doing the same kind of line-matching — each one needs its own fix and its own test, even when
the pattern (and the fix) is identical.

## Next Change

`0116-jira-provider-malformed-json` (uncaught `SyntaxError` on a corrupt Jira export).
