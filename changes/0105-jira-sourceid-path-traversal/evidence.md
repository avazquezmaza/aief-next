# Evidence

## Summary

Fixed a path traversal / arbitrary file read in the Jira Requirement Source provider. Change 0074
added real-path containment (`isReallyWithin()`) for `aief enrich jira <id> --file <path>`, but
only for the explicit `--file` case — the default path,
`path.resolve(projectRoot, "requirements", "jira", \`${sourceId}.json\`)`, was assumed safe
because it is "built from a fixed segment". That assumption ignored that `sourceId` itself is
unsanitized CLI input (`cli/src/commands/enrich.js` passes `argv` straight through), so a
`sourceId` containing `../` segments escapes the project root the same way a malicious `--file`
value would. This Change applies the same containment check to both paths.

## Activities Performed

- Confirmed the gap by reproduction: `aief enrich jira "../../../../../../tmp/<outside>/pwn"` (no
  `--file`) read an arbitrary file outside the project root and embedded its `summary`/
  `description` fields into the newly created Change's `spec.md` and `evidence.md`.
- Moved the `isReallyWithin(projectRoot, filePath)` check in
  `cli/src/requirement-providers/jira.js` outside the `usingExplicitFile &&` condition so it
  applies to both the `--file` path and the default `requirements/jira/<sourceId>.json` path.
- Updated the rejection message to name whichever input (`--file` value or source id) caused the
  rejection, reusing the exact wording `--file` already used.
- Updated the stale inline comment that asserted the default path "can never resolve outside the
  project root".
- Added two regression tests to `cli/tests/requirement-providers.test.js`.

## Verification

- Re-ran the manual reproduction after the fix: the same command is now rejected before any read,
  with `source id "../../../../../../tmp/.../pwn" resolves outside the project root — rejected
  before reading.` printed to the console, and the created Change's `spec.md` shows
  `(unknown — see Open Questions)` instead of the leaked content.
- `npm test` (repo root): 1011/1011 passing (was 1009 before the two new tests).
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Confirmed the existing `--file` containment tests (Change 0074) still pass unchanged — same
  behavior, no regression.

## Findings

- The vulnerable code path was reachable directly from the CLI with no prior sanitization: `aief
  enrich jira <sourceId>` → `enrich.js`'s `sourceId = parsed._[1] || ""` → `retrieveRequirement()`
  → `jira.js`'s `retrieve()` → `fs.readFileSync`, with zero containment checks on the default-path
  branch before this fix.
- The `manual` requirement provider was checked and does no filesystem I/O — not affected.

## Risks

- None introduced. The fix only narrows behavior (rejects previously-mis-served out-of-bounds
  reads); every existing, in-bounds `sourceId`/`--file` case is unchanged and covered by the
  existing Change 0074 tests, which still pass.

## Recommendations

- None outstanding for this Change. A broader audit of other CLI inputs that get interpolated into
  filesystem paths without sanitization would be worthwhile as a separate Change, but no other
  instance was found during this fix (SDD providers and evidence resolution already apply the same
  check; `manual.js` has no filesystem access).

## Artifacts Produced

- `cli/src/requirement-providers/jira.js` (fix)
- `cli/tests/requirement-providers.test.js` (2 new regression tests)
- `changes/0105-jira-sourceid-path-traversal/` (this Change)

## Lessons Learned

- A containment check scoped to "only the input a human explicitly typed a flag for" is incomplete
  when another input (here, `sourceId`) is interpolated into the same filesystem path template —
  every value that reaches a path template needs the same check, not just the one that looked most
  obviously untrusted.

## Next Change

None required — this was a standalone fix found during an independent security review of the
repository (unprompted by a specific ticket).
