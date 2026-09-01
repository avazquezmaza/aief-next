# Tasks

## Implementation

- [x] `resolveImplicitChange()` (`shared.js`) — append next step (`aief new-change`, `aief status`).
- [x] `createChange()` (`shared.js`) — append an example.
- [x] `initProject()` (`bootstrap.js`) — append next step (different name, or `cd` in and bootstrap).

## Documentation

- [x] No separate doc needed — text-only CLI message changes, self-describing.

## Verification

- [x] `npm test` — 1005/1005 passing (1003 pre-existing + 2 new).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] Confirmed diff touches only `shared.js`, `bootstrap.js`, and the two test files.

## Evidence

- [x] Update evidence.md
