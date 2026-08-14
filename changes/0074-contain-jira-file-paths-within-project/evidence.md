# Evidence

## Summary

Fixed Finding F2: `aief enrich jira <id> --file <path>` had no path-containment check and could
read a file outside the project root, embedding its content into a new Change's documents. Added
`isPathWithin()`/`isReallyWithin()` (real-path, symlink-aware containment) to `jira.js`, mirroring
the existing, already-reviewed pattern in `sdd-providers/openspec.js` and
`core/services/verification-evidence.js`. `--evidence-from` (Finding F5) was deliberately NOT
given the same treatment — see "Non-goals" below.

## Activities Performed

- Wrote 5 new regression tests in `cli/tests/requirement-providers.test.js` first, confirmed 3 of
  them correctly failed against the unmodified code (traversal, absolute-path, and symlink
  escapes all succeeded in reading outside content before the fix), while the other 2 (boundary-
  adjacent legitimate path, existing "not found" behavior) already passed — proving the new tests
  target the real, confirmed bug rather than an imagined one.
- Implemented `isPathWithin()` (textual containment, copied from `openspec.js`) and
  `isReallyWithin()` (real-path/symlink-aware containment, copied from
  `verification-evidence.js`'s `realPathIfWithin()` reasoning) in `jira.js`.
- Applied the check only to an explicitly-supplied `--file` value — the default
  `requirements/jira/<sourceId>.json` path is unaffected (it can never itself resolve outside the
  project root).
- Re-ran the focused test file: all 11 tests pass (6 pre-existing + 5 new).
- Ran the full suite: 821/821 tests pass.

## Verification

- `node --test tests/requirement-providers.test.js`: **11/11 pass** (0 failures).
- `npm test` (full suite): **821/821 pass** (0 failures) — 816 from Change 0073's baseline + 5
  new tests this Change adds.
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean.
- Adversarial re-check: `sdd-provider-openspec.test.js` (14 tests) still passes unmodified,
  confirming no coupling was introduced between the two providers' independent containment checks.
- Adversarial re-check: `git diff --stat` shows exactly the two intended files changed
  (`cli/src/requirement-providers/jira.js`, `cli/tests/requirement-providers.test.js`) — no
  unrelated file touched.

### Behavior before / after

| Scenario | Before | After |
|---|---|---|
| `--file requirements/jira/X.json` (project-local, exists) | Retrieved, content normalized | Unchanged |
| `--file ../../outside.json` | Retrieved — outside content read and embedded | Rejected before any read, `retrieved: false`, distinct "outside the project root" reason |
| `--file /tmp/outside.json` (absolute) | Retrieved — outside content read | Rejected, same as above |
| `--file` = symlink inside project pointing outside | Retrieved — outside content read (symlinks followed transparently) | Rejected, same as above |
| `--file requirements/jira/../jira/X.json` (resolves back inside) | Retrieved | Unchanged — not falsely rejected |
| `--file requirements/jira/missing.json` (inside, doesn't exist) | "No local Jira export found" placeholder | Unchanged — distinct wording from the new containment rejection |

This is an intentional, documented behavior change for the escape cases (per the Change's own
`change.md`): `docs/workflow.md`'s only documented `--file` example is project-local
(`requirements/jira/ISSUE-123.json`), so no known legitimate use case is affected.

## Findings

None beyond the fixed finding. One related, explicitly out-of-scope observation recorded here per
the remediation workflow's "notice it, don't fix it" rule: the *default* (no `--file`) path is
built as `path.resolve(cwd, "requirements", "jira", \`${sourceId}.json\`)`, and `sourceId` itself
(the CLI positional argument) is not sanitized before that join — in principle a `sourceId`
containing `../` segments could also escape `requirements/jira/`. This was not in this Change's
approved scope (F2 was specifically about `--file`) and was not fixed here. Recorded for a future,
separately-scoped Change if judged worth addressing.

## Risks

None identified for the approved scope. The unaddressed `sourceId`-based default-path observation
above carries whatever residual risk existed before this Change, unchanged.

## Recommendations

Consider a future, separately-approved Change to apply the same `sourceId` containment reasoning
to the default (no `--file`) path, if judged worthwhile.

## Artifacts Produced

- `cli/src/requirement-providers/jira.js` (containment check added).
- `cli/tests/requirement-providers.test.js` (5 new regression tests).

## Lessons Learned

Writing the regression tests before the fix and confirming they failed for the right reason (not
just "some assertion failed") was valuable: it directly proved the vulnerability was real and
reproducible before any code changed, and proved the fix actually closes it rather than just
making the tests pass by coincidence.

## Next Change

Proceed to the next approved remediation batch (task readiness parsing, Finding F1).
