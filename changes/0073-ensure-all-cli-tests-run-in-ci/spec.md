# Specification

## Goal

`npm test` (and therefore CI, which just invokes `npm test`) executes every `*.test.js` file
under `cli/tests/`, with no silent omission possible in the future.

## Requirements

- R1 — `cli/package.json`'s `test` script must execute every file under `cli/tests/*.test.js`
  that exists on disk at run time, not a hardcoded snapshot of file names.
- R2 — The change must not introduce a new runtime or dev dependency (Node's own `--test`
  runner, already in use, supports directory arguments natively).
- R3 — `assistant-resolver.test.js`'s 17 tests must be included in the executed run and must
  pass.
- R4 — No non-test file must be swept into execution (verified: `cli/tests/` contains only
  `*.test.js` files today).

## Acceptance Criteria

- [ ] `cd cli && npm test` reports exactly the number of files present in `cli/tests/*.test.js`
      (40 at the time of this Change), including `assistant-resolver.test.js`.
- [ ] All tests pass (0 failures).
- [ ] `.github/workflows/ci.yml` requires no modification (it already calls `npm test`).
- [ ] `node cli/bin/aief.js verify` passes.
- [ ] `git diff --check` passes.
