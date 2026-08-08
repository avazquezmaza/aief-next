# Tasks

## Implementation

- [x] Create `cli/src/process-utils.js` with the shared `run()`/`commandExists()`.
- [x] `cli.js`: import from it, remove the private copies.
- [x] `sdd-providers/openspec.js`: import from it, remove the private copies, update the header
      comment to record the consolidation as done.

## Tests

- [x] Confirm existing `propose`/`doctor`/`bootstrap`/OpenSpec-provider tests still pass unmodified
      (this Change should need zero test-file changes if truly behavior-preserving).
- [x] Add a small regression test (or reuse an existing one) asserting `grep`-verifiable absence of
      a second `run()`/`commandExists()` definition — or note in evidence.md why this was checked
      manually instead.

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0070-shared-process-utils-openspec-consolidation` passes.
- [x] `git diff --check` passes.
- [x] Manual check: `grep -rn "^function run(\|^function commandExists(" cli/src/` shows exactly
      one of each.

## Evidence

- [x] Update evidence.md
