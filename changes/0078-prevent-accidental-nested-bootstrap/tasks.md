# Tasks

## Implementation

- [x] Add a small ancestor-detection helper and wire it into `bootstrapHere()`'s pre-flight check.
- [x] Add `--force` to `bootstrap`'s `KNOWN_FLAGS` schema (Batch 5's parser).
- [x] Update `docs/getting-started.md`'s Change-0076 sentence to reflect the new guard.

## Documentation

- [x] (covered by the `docs/getting-started.md` update above)

## Verification

- [x] Add regression tests to `cli/tests/cli.test.js` for all 6 acceptance-criteria cases.
- [x] `cd cli && node --test tests/cli.test.js` — new + existing cases pass.
- [x] `cd cli && npm test` — full suite still 100% passing.
- [x] `node cli/bin/aief.js verify` from repo root.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md
