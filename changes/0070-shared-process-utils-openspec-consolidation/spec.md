# Specification

## Goal

The literal code duplication ADR-017/`openspec.js`'s own comment names is gone: one shared
`run()`/`commandExists()` implementation, imported by both `cli.js` and `sdd-providers/openspec.js`,
with zero observable behavior change anywhere.

## Requirements

- `cli/src/process-utils.js` (new file) exports:
  - `run(command, args = [], options = {})` → `{ status, stdout, stderr }`, `stdout`/`stderr`
    always strings (never `undefined`/`null`) — `spawnSync(command, args, { stdio: options.stdio ||
    "pipe", shell: process.platform === "win32", encoding: "utf8" })`, with `result.stdout || ""`
    and `result.stderr || ""`.
  - `commandExists(command)` → boolean, via `run(process.platform === "win32" ? "where" : "which",
    [command]).status === 0`.
- `cli.js`: remove its private `run()`/`commandExists()`; import both from `./process-utils.js`.
  Every existing call site (`doctorEnvironment()`'s tool checks, `bootstrapHere()`'s
  `openspecCli`/`specboot` detection, `openspecInfo()`, `propose()`'s delegation call) is
  unmodified except for where the two functions now come from.
- `sdd-providers/openspec.js`: remove its private `run()`/`commandExists()`; import both from
  `../process-utils.js`. `detect()`'s logic is otherwise unchanged.
- The duplication note in `openspec.js`'s header comment is updated to state the consolidation is
  done, referencing this Change, instead of describing it as deferred.
- No change to `CAPABILITIES`, `createChange()`, `detect()`'s return shape, `propose()`'s console
  output, or any test's expected output.

## Acceptance Criteria

- [x] `grep -rn "^function run(\|^function commandExists(" cli/src/` finds exactly one definition
      of each, both in `cli/src/process-utils.js`.
- [x] `aief propose "<idea>"` (OpenSpec installed and supporting propose / not installed / installed
      without propose support) produces byte-identical output to before this Change, in all three
      cases.
- [x] `aief doctor` and `aief bootstrap` (OpenSpec CLI present / absent, OpenSpec project structure
      present / absent) produce byte-identical output to before this Change.
- [x] `sdd-providers/openspec.js`'s `detect()` — CLI present / absent, structure present / absent —
      still returns the exact same shape and values as before this Change.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
