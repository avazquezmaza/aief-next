# Specification

## Goal

The repository passes the post-0026 Product Architecture Review with no Critical or Major findings: every install/adoption path teaches the canonical Bootstrap Experience, no personal information leaks in docs, and terminology is uniform in current-facing documentation.

## Requirements

- Install guides (linux/macos/windows) use `npm install && npm link` + `aief` commands, link to `docs/bootstrap.md`, keep the no-link fallback (`node cli/bin/aief.js`), and contain no personal paths.
- `docs/migration-guide.md` adopts via `aief doctor` → `aief init`/`adopt` → `analyze` → `verify`/`close`, preserving the "adopt gradually" principle, and links to lifecycle.md and existing-project.md.
- "SpecBoot" spelling normalized in README, `docs/**` and `adapters/**`; lowercase paths (`adapters/specboot/`, `templates/specboot/`, `@lidr/lidr-specboot`) and historical records (ADRs, changes/, releases/, past CHANGELOG entries) untouched.
- `SECURITY.md` scope names the CLI.
- `ai-assistants.md` teaches `aief prompt <assistant>` for all assistants, with the manual-briefing fallback described in terms of the same files the Prompt Engine uses.
- `COMMAND_HELP.explain` exists so `aief help explain` succeeds (isolated help-text data; no behavior change); help-coverage test extended to include `explain`.

## Acceptance Criteria

- [x] `grep -rn "PRS" docs/` returns nothing (no personal paths).
- [x] No `Specboot` spelling remains in README, docs/ or adapters/.
- [x] `aief help explain` exits 0 with the six standard help fields.
- [x] All relative links in changed docs resolve.
- [x] `npm test` green (50 tests; the help-coverage test now iterates 14 commands including `explain`).
- [x] `aief verify` PASS.
