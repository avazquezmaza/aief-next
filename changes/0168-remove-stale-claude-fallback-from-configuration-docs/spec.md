# Specification

## Goal

`docs/configuration.md` describes what `aief prompt` does when the requested assistant's file is
missing.

## Requirements

- R1: The sentence says `aief prompt` warns and uses the generic, `AGENTS.md`-only prompt, never
  another assistant's file, citing Change 0112.
- R2: No other file in `docs/`, `README.md`, `AGENTS.md` or `cli/templates/` still describes the
  `CLAUDE.md` fallback.

## Acceptance Criteria

- [x] R1–R2 done.
- [ ] `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
- [ ] (human) Owner reviews the diff before merge.
