# Specification

## Goal

Every AIEF command rejects an option it does not declare, with exit 1 and a clear message, while
every previously-valid invocation keeps working identically.

## Requirements

- R1 — A shared `parseCommandArgs(command, args, schema)` helper wraps
  `node:util.parseArgs({ args, options: schema, allowPositionals: true, strict: true })`, catches
  its thrown error on an unknown/malformed option, prints a clear `aief <command>: <message>` to
  stderr, sets `process.exitCode = 1`, and returns `null` so the caller can return early before
  touching the filesystem.
- R2 — Every command's exact current flag set (name + type) is preserved, enumerated once per
  command, not guessed.
- R3 — Positionals (`parsed._`) behave identically to today for every command that uses them
  (`new-change`, `enrich`, `analyze`, `prompt`, `bootstrap`, `propose`).
- R4 — No new runtime dependency (`node:util` is Node's own standard library).
- R5 — `--help`/`help`/`--version`, handled in `main()`'s own switch before any `parseArgs` call,
  are untouched.

## Acceptance Criteria

- [ ] Every currently-passing `cli.test.js` test still passes unmodified (proves no valid-flag
      regression).
- [ ] `aief verify --verboes` → exit 1, clear unknown-option message, zero filesystem changes.
- [ ] `aief doctor --verbos` → exit 1, same.
- [ ] `aief status --nex` → exit 1, same.
- [ ] `aief new-change --typ enrichment "x"` → exit 1, same (no Change directory created).
- [ ] `aief close --yess --change <id>` → exit 1, same (Change state unchanged).
- [ ] `aief --help` / `aief help` / `aief --version` output unchanged.
- [ ] `node cli/bin/aief.js verify` and `git diff --check` both pass.
