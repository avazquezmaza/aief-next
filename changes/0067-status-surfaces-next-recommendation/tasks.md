# Tasks

## Implementation

- [x] Update the "Multiple Changes in progress" line in `statusOverview()` to also name
      `aief status --next`.
- [x] Update the `open.length > 1` branch of `statusOverview()`'s `Next:` block to print
      `aief status --next` first.

## Tests

- [x] Add/extend a test in `cli/tests/change-selection.test.js` asserting both new mentions of
      `aief status --next` appear when 2+ Changes are open.
- [x] Confirm existing tests referencing this output (`"status lists all open Changes and flags
      multiplicity"`, test 11) still pass unmodified.
- [x] Confirm 0-open and 1-open `status` output is unchanged (existing tests for those paths).

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0067-status-surfaces-next-recommendation` passes.
- [x] `git diff --check` passes.
- [x] Manual run: `aief status` in this repo (21 open Changes) shows the new lines.

## Evidence

- [x] Update evidence.md
