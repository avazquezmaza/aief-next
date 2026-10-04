# Tasks

## Implementation

- [x] Skip nested repositories in `walkProject()` (R1).
- [x] Parse approval lines from `spec.md` Acceptance Criteria (R2).
- [x] Enforce them in `checkChangeReadiness()` and list them in `close` (R2).
- [x] Report them in `verify --strict`: errors when open, notices when closed (R3).

## Tests

- [x] Detection tests for a nested repository (directory and file `.git`) and for the root.
- [x] Readiness, close and strict tests, including unlabeled criteria (R4).

## Documentation

- [x] Update the docs that describe approval labels (R5).

## Verification

- [x] `npm test` and `npm run lint` in `cli/`.
- [x] `aief status` in `~/PRS/THINGS/kiro/I5`.
- [x] `aief verify --strict` on this repository.

## Evidence

- [x] Update evidence.md.
- [x] (review) Independent review of the fix.
