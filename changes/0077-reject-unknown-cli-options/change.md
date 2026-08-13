# Change

## ID

`0077-reject-unknown-cli-options`

## Type

General

## Objective

Fix Finding F7/H4 from the completed technical audit: AIEF's hand-rolled `parseArgs()` silently
accepts unknown/misspelled flags (`--verboes`, `--verbos`, `--nex`, `--typ`, `--yess`), which
either silently no-op or degrade a command's behavior without any error. Migrate to
`node:util.parseArgs()` with per-command explicit option schemas and `strict: true`, so an
unrecognized option fails loudly (exit 1) instead of being silently ignored.

## Scope

### In scope

- Replace the shared hand-rolled `parseArgs(args)` with a schema-based wrapper around
  `node:util.parseArgs()`, used by every command that currently parses flags: `new-change`,
  `enrich`, `analyze`, `prompt`, `close`, `verify`, `status`, `doctor`, `bootstrap`, `propose`.
- Each command declares its own exact, already-known option set (enumerated from the current
  codebase's `parsed.<flag>` reads) — no new flags introduced, no flag removed.
- Regression tests in `cli/tests/cli.test.js` for: every currently-valid flag/positional
  combination (must keep working), and all 5 confirmed typo cases from the audit (must now fail
  with exit 1 and a clear message).

### Out of scope

- No new short flags (`-h`/`-v` remain handled specially in `main()`'s own switch, untouched).
- No change to `--help`/`help`/`--version` output.
- No redesign of command syntax or positional semantics beyond what's needed to preserve current
  behavior under the new parser.
- No other audit finding.

## Success Criteria

- Every currently-valid CLI invocation (every flag/positional combination exercised by the
  existing test suite) continues to work identically.
- `aief verify --verboes`, `aief doctor --verbos`, `aief status --nex`,
  `aief new-change --typ enrichment ...`, `aief close --yess ...` all now exit 1 with a clear
  "unknown option" message and make zero filesystem changes.
- `--help`, `help`, `--version` output is byte-identical to before.
- No new dependency (Node's own `node:util.parseArgs()`, already available at the project's
  `engines.node: >=18` floor).

## Status

Closed (2026-08-13)
