# Tasks

## Implementation

- [x] Add the collision note to `statusOverview()` (R1, R2).

## Documentation

- [x] Header comment cites Change 0135 and the fact that this Change reuses its detector as-is.

## Verification

- [x] Added `status` tests mirroring the existing `verify` collision tests (collision present /
      absent).
- [x] Manually confirmed `aief status` against this repository's own real `0122-*` collision.
- [x] Run `npm test` (1106/1106), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0137-surface-change-id-collisions-in-status-overview --strict`.

## Evidence

- [x] Update evidence.md
