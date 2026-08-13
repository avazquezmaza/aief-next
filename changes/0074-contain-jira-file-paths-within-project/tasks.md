# Tasks

## Implementation

- [x] Add `isPathWithin()`/`realPathIfWithin()` (mirroring `openspec.js`/`verification-evidence.js`)
      to `requirement-providers/jira.js`.
- [x] Apply the containment check only to an explicitly-supplied `options.file`, before the
      existing `fs.existsSync` check.
- [x] Return the existing `{ requirement, retrieved: false, ... }` shape on rejection, with
      wording distinct from the existing "not found" case.

## Documentation

- [x] Confirm `docs/workflow.md`'s existing `--file requirements/jira/ISSUE-123.json` example
      still works byte-identically (no doc change expected/needed).

## Verification

- [x] Add the 6 regression cases (R1-R6 acceptance criteria) to
      `cli/tests/requirement-providers.test.js`.
- [x] `cd cli && node --test tests/requirement-providers.test.js` — new + existing cases pass.
- [x] `cd cli && npm test` — full suite still 100% passing.
- [x] `node cli/bin/aief.js verify` from repo root.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md
