# Specification

## Goal

A new user can clone the repository and run `npm install`, `npm link`, `aief --help`, `aief doctor` and `aief init` without basic bootstrap errors, on Linux, with no dependencies.

## Requirements

- Root `package.json` (name `aief-next`, private, Node >= 18) exposing `bin.aief -> cli/bin/aief.js`. The CLI package in `cli/` remains untouched as the implementation home.
- `aief --help`/`-h` print usage (exit 0); `aief --version`/`-v` print the CLI version read from `cli/package.json`.
- `aief doctor` prints, before the existing project-readiness report, an environment section grouped by level:
  - Core (required): node, npm, git — `✗ ... not found (required)` when absent; summary lists missing required tools and doctor exits non-zero.
  - SDD (recommended): openspec (or `opsx`), specboot (CLI or `specboot`/`.specboot` markers) — `⚠` warning with install/integration hint when absent.
  - Build tools (optional): java, maven, gradle, docker — `○` informative line when absent.
  - Assistants (optional): claude, gemini, cursor, codex — `○` informative line when absent; no assistant is required or special.
  - Versions shown where cheap (numeric extract of `--version` / `java -version`).
  - Summary: "Environment is ready." / "Environment is usable with warnings." / missing-required message.
- `aief init` (no argument) initializes the current directory:
  - Prints a detection report (AGENTS.md, changes/, OpenSpec CLI, OpenSpec project structure, SpecBoot).
  - Reuses the adopt logic: creates only visible structure (AGENTS.md if missing, changes/, knowledge/ with starter standards, profiles/), never overwrites, never touches application code.
  - Never creates `.aief/` (ADR-009 — see change.md).
  - Ends with numbered next steps: doctor, install OpenSpec if missing, `openspec init` if needed, SpecBoot integration pointer, first Change.
- `aief init <name>` keeps the existing new-project-skeleton behavior.
- Documentation: `docs/bootstrap.md` (install, no-install usage, doctor levels, init modes, validation); README "Get the CLI" uses the root path; `docs/cli.md` and `cli/README.md` updated.
- Tests added to the existing `node --test` suite; `npm test` also works from the root.

## Acceptance Criteria

- [x] `npm install` works from the repo root.
- [x] `npm link` works from the repo root and installs a global `aief`.
- [x] `aief --help` shows available commands.
- [x] `aief doctor` shows the grouped diagnosis without failing on absent optional tools.
- [x] `aief init` creates the minimal visible structure (`changes/`, `knowledge/`, `AGENTS.md`) in the current directory.
- [x] `aief init` does not modify functional code and creates no `.aief/`.
- [x] README explains local install and validation; `docs/bootstrap.md` explains the Bootstrap Experience.
- [x] No coupling to Claude Code, Gemini, Cursor, Copilot or Codex.
- [x] OpenSpec and SpecBoot remain external responsibilities (informed, not installed).
- [x] Full test suite passes (50 tests, 7 new).
