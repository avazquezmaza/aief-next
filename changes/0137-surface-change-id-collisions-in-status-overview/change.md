# Change

## ID

`0137-surface-change-id-collisions-in-status-overview`

## Type

Fix

## Objective

Change 0135 added numeric-ID-collision detection to whole-project `aief verify`, and its own
evidence.md named extending it to `aief status`'s overview as a reasonable, optional follow-up
(mirroring how the manifest-status-drift note already appears in both commands). This Change
does exactly that.

Confirmed live, again, while scaffolding this very Change: `aief new-change` initially assigned
it the id `0136`, colliding with the not-yet-merged
`0136-fix-qs-vulnerability-in-study-fixtures-and-enable-secret-scanning` branch — renamed to
`0137` before proceeding, the same real-world instance of the gap Change 0135 detects.

## Scope

### In scope

- `cli/src/commands/status.js`: `statusOverview()` gains the same non-blocking numeric-ID
  collision note `verify.js` already renders, using the exact same
  `detectDuplicateChangeIds()` function from Change 0135 — no new detection logic.
- Tests mirroring the existing `verify` collision tests, for `status`.

### Out of scope

- Any change to the detection function itself (`change-id-collisions.js`) — reused as-is.
- Any other `status`/`verify` parity gap — only this one note, per Change 0135's own
  recommendation.

## Success Criteria

- `aief status` reports the same numeric-ID collision `aief verify` already does, in the same
  non-blocking way, using the exact same message shape.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0137-surface-change-id-collisions-in-status-overview --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-10)
