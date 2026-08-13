# Evidence

## Summary

Fixed Finding F1: `countOpenTasks()` only recognized hyphen-bulleted `- [ ]` unchecked tasks. A
genuinely incomplete task written with a standard CommonMark `*` or `+` bullet was invisible to
the close/verify readiness gate. Broadened the regex's bullet-character match from a literal
hyphen to a character class covering `-`, `*`, `+`. Fenced-code-block awareness was deliberately
left unaddressed, per this Change's own explicit non-goal.

## Activities Performed

- Wrote 5 new regression tests in `cli/tests/change-verifier.test.js` first, confirmed 3 correctly
  failed against the unmodified code (`*`-bullet and `+`-bullet unchecked tasks were silently
  ignored; the mixed-bullet count came out as 1 instead of 3), while the "checked `*`/`+`" and
  "fenced-code-block unchanged" cases already passed.
- Broadened `countOpenTasks()`'s regex from `/^\s*- \[ \]/gm` to `/^\s*[-*+] \[ \]/gm`.
- Checked this repository's own 72+ real Changes for any existing `*`/`+` unchecked task lines
  that could be newly (and correctly) blocked by the broadened regex — found none, confirming zero
  surprise behavior change for any Change already in this repository.
- Re-ran the focused test file: all 13 tests pass (8 pre-existing + 5 new).
- Ran the full suite: 826/826 tests pass.
- Ran `aief verify` (whole project) — PASS, confirming no unexpected new blocking anywhere in this
  repository's real Change history.

## Verification

- `node --test tests/change-verifier.test.js`: **13/13 pass** (0 failures).
- `npm test` (full suite): **826/826 pass** (0 failures) — 821 from Change 0074's baseline + 5
  new tests this Change adds.
- `grep -rn "^\s*\* \[ \]\|^\s*+ \[ \]" changes/*/tasks.md`: zero matches across this repository's
  entire Change history — confirms the fix cannot newly block any existing Change.
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean.
- `git diff --stat`: exactly the two intended files changed
  (`cli/src/core/domain/change.js`, `cli/tests/change-verifier.test.js`).

### Behavior before / after

| Input | Before | After |
|---|---|---|
| `- [ ] task` | Counted as open | Unchanged |
| `- [x] task` / `- [X] task` | Not counted | Unchanged |
| `* [ ] task` | **Not counted (the bug)** | Counted as open |
| `* [x] task` | Not counted | Unchanged |
| `+ [ ] task` | **Not counted (the bug)** | Counted as open |
| `+ [x] task` | Not counted | Unchanged |
| `- [ ] task` inside a fenced code block | Counted as open (over-counting) | Unchanged — explicitly out of scope |

## Findings

None beyond the fixed finding. Fenced-code-block over-counting remains, exactly as before,
explicitly out of scope per this Change's own `change.md` — recorded here as a reminder for
future reference if that direction is ever taken up separately.

## Risks

None identified — this is a behavior *tightening* affecting only unchecked `*`/`+` bulleted tasks,
confirmed to affect zero existing Changes in this repository.

## Recommendations

None beyond this Change's own scope.

## Artifacts Produced

- `cli/src/core/domain/change.js` (`countOpenTasks()` broadened).
- `cli/tests/change-verifier.test.js` (5 new regression tests).

## Lessons Learned

Checking this repository's own real Change history for the specific pattern being newly matched
(`grep` for `* [ ]`/`+ [ ]` across `changes/*/tasks.md`) was a fast, concrete way to confirm a
behavior-tightening fix has zero real-world blast radius today, beyond relying on test coverage
alone.

## Next Change

Proceed to the next approved remediation batch (documentation clarifications, Findings F3/F5/F9,
and project-root reinforcement).
