# Tasks

## Implementation

- [x] Add `parseCommandArgs(command, args, schema)` wrapper around `node:util.parseArgs()`.
- [x] Migrate `newChange`, `enrich`, `analyze`, `prompt`, `close`, `verify`, `status`, `doctor`,
      `bootstrap`, `propose` to call it with their exact existing schema, with an early
      `if (!parsed) return;` guard after each call.
- [x] Remove the old hand-rolled `parseArgs()` once nothing calls it.

## Documentation

- [x] None expected — no doc claims permissive unknown-flag handling to update.

## Verification

- [x] Add regression tests to `cli/tests/cli.test.js` for the 5 confirmed typo cases.
- [x] `cd cli && node --test tests/cli.test.js` — new + existing cases pass (this is the slow
      file, budget several minutes).
- [x] `cd cli && npm test` — full suite still 100% passing.
- [x] `node cli/bin/aief.js verify` from repo root.
- [x] `git diff --check`.
- [x] Manually confirm `--help`/`help`/`--version` output unchanged.

## Evidence

- [x] Update evidence.md
