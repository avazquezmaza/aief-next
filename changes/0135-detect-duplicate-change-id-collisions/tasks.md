# Tasks

## Implementation

- [x] Add `detectDuplicateChangeIds()` to `change-id-collisions.js` (R1).
- [x] Wire it into whole-project `aief verify`, mirroring the drift-note rendering (R2, R3).
- [x] Update Change 0130's Findings Status table: C0130-F2 marked Resolved (R4).

## Documentation

- [x] Header comment explains why detection (not allocation-side prevention) was chosen, citing
      the "no hidden state" / no-cross-branch-coordination reasoning.

## Verification

- [x] Unit tests for `detectDuplicateChangeIds()` — no collision, one collision, three-way
      collision, multiple independent collisions, non-numeric basenames ignored, determinism,
      empty input.
- [x] Integration test: a real collision is reported non-blockingly (`Result: PASS`); no false
      positive when every id is unique.
- [x] Confirmed manually that `aief verify` against this repository's own current state reports
      the real, pre-existing `0122-*` collision.
- [x] Run `npm test` (1104/1104), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0135-detect-duplicate-change-id-collisions --strict`.

## Evidence

- [x] Update evidence.md
