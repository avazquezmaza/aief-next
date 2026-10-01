# Tasks

## Implementation

- [x] Rewrite the Change-ID collision bullet in `docs/security-model.md`.

## Verification

- [x] Observe behavior: `aief verify` lists "Changes sharing a numeric ID (non-blocking)"; `aief status --change 0122` exits 1 with "Ambiguous --change".
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md
