# Evidence

## Summary

`jira.js`'s `retrieve()` no longer crashes with an uncaught `SyntaxError` on a malformed/truncated
local Jira export — it now returns the same clean placeholder-Change shape (`retrieved: false`,
populated `openQuestions`/`riskNotes`/`consoleNotes`) every other error path in this function
already returns. Found by an independent audit review.

## Activities Performed

- Wrapped `JSON.parse(fs.readFileSync(filePath, "utf8"))` in `try`/`catch` in
  `cli/src/requirement-providers/jira.js`'s `retrieve()`.
- On catch, return `emptyRequirement("jira", sourceId)` with `retrieved: false` and messages naming
  the file and the parse error — same shape/tone as the existing path-outside-project-root and
  file-not-found branches.
- Added a test to `cli/tests/requirement-providers.test.js`: a `--file` pointing at malformed JSON
  (`{ invalid`) returns a clean placeholder, not a thrown exception.

## Verification

- `npm test`: 1036/1036 pass (1035 before this Change; +1 new test, zero regressions).
- `node cli/bin/aief.js verify --strict --change 0116`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

None beyond the pre-existing gap this Change fixes.

## Risks

None — strictly adds error handling; the success path (valid JSON) is unchanged and covered by the
existing "jira adapter normalizes a local export file with --file" test.

## Recommendations

None.

## Artifacts Produced

- Diff to `cli/src/requirement-providers/jira.js`.
- Diff to `cli/tests/requirement-providers.test.js`.

## Lessons Learned

Every other error branch in this same function already degraded gracefully to a placeholder
response — the pattern existed right next to the gap; the fix is applying the same shape a parse
failure, not inventing a new one.

## Next Change

`0117-branch-isolation-followup` (enrich auto-branch + --no-branch on analyze/propose).
