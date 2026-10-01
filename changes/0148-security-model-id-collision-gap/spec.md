# Specification

## Goal

`docs/security-model.md` describes the Change-ID collision gap as it is today.

## Requirements

- The Known Gaps bullet states: detection exists in `verify` and `status` (non-blocking); a bare
  `--change <number>` matching several Changes fails; allocation is still per checkout and
  prevention was deliberately not pursued (per C0130-F2's recorded resolution).
- No other file changes besides this Change's own files.

## Acceptance Criteria

- [x] Bullet rewritten and checked against `aief verify`, `aief status` and `aief status --change 0122`.
- [x] `npm test`, `node cli/bin/aief.js verify` and `git diff --check` pass.
