# Tasks

## Implementation

- [x] Replace `cli/package.json`'s hardcoded 39-file `test` script with `node --test tests/`.

## Documentation

- [x] Check `cli/README.md`/`docs/maintainer.md` for any reference to an explicit test-file
      count or list that would now be inaccurate; update only if found.

## Verification

- [x] Run `cd cli && npm test`; confirm all files in `cli/tests/*.test.js` execute and pass.
- [x] Run `node cli/bin/aief.js verify` from repo root.
- [x] Run `git diff --check`.

## Evidence

- [x] Update evidence.md
