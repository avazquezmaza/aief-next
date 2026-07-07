# Change

## ID

`0025-bootstrap-experience`

## Type

General

## Objective

Give a new user a working bootstrap path: clone the repo, run `npm install` and `npm link` from the root, and use `aief --help`, `aief doctor` and `aief init` without basic errors.

## Problem

A new user could install OpenSpec globally without friction, but AIEF failed at the first step: the repository root had no `package.json`, so `npm install` / `npm link` from the root died with `ENOENT: Could not read package.json`. The CLI existed (in `cli/`) but the bootstrap experience did not.

## Scope

### In scope

- Root `package.json` exposing the existing `cli/bin/aief.js` as the `aief` binary (npm-link compatible from the root).
- `aief --help` / `-h` / `--version` / `-v` flags.
- `aief doctor`: environment report grouped by level — Core (required: node, npm, git), SDD (recommended: openspec, specboot), Build tools (optional: java, maven, gradle, docker), Assistants (optional: claude, gemini, cursor, codex) — with versions where cheap, a summary line, and no failure when optional tools are absent.
- `aief init` without arguments: initialize the current directory by reusing the adopt logic; detect AGENTS.md, changes/, OpenSpec CLI, `openspec/`/`.openspec/`, SpecBoot markers; inform (not install) how to add OpenSpec/SpecBoot; end with explicit next steps. `aief init <name>` keeps its existing new-skeleton behavior.
- Documentation: `docs/bootstrap.md`, README "Get the CLI", `docs/cli.md`, `cli/README.md`, CHANGELOG.
- Tests for the new behavior in the existing `node --test` suite.

### Out of scope

- A `.aief/` directory (`.aief/changes/`, `.aief/evidence/`, `.aief/context/`, `.aief/config.json`) — **rejected, see Architecture decision below**.
- Installing OpenSpec or SpecBoot automatically.
- Publishing to npm.
- Assistant-specific commands or adapters (claude-mode etc.).
- Business logic of any kind.

## Architecture decision: `.aief/` rejected

The original 0025 proposal specified that `aief init` should create a hidden `.aief/` tree with `config.json`. This conflicts with **ADR-009** (`knowledge/decisions.md`): AIEF stores no state outside the Change files, and a previously proposed `.aief/state.json` was already evaluated and rejected. ADR-009, as an accepted architectural decision, takes precedence over the incoming spec (owner confirmed during implementation). Therefore:

- `aief init` creates only the visible, existing structure (`AGENTS.md`, `changes/`, `knowledge/`, `profiles/`) by reusing the adopt logic.
- No `.aief/` directory, no hidden mutable state, no parallel Change location.
- ADR-009 itself is not modified by this Change.
- Validation is `ls changes knowledge`, not `ls .aief`.

## Success Criteria

- `npm install` and `npm link` work from the repository root.
- `aief --help` shows available commands; `aief --version` prints the version.
- `aief doctor` shows the grouped diagnosis and does not fail because of absent optional tools.
- `aief init` (no argument) creates the visible AIEF structure in the current directory, modifies no functional code, overwrites nothing, and prints next steps including OpenSpec/SpecBoot guidance.
- README and `docs/bootstrap.md` explain local installation and validation.
- No coupling to any specific assistant; OpenSpec and SpecBoot remain external responsibilities.

## Status

Closed (2026-07-07)
