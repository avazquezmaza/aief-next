# Change

## ID

`0168-remove-stale-claude-fallback-from-configuration-docs`

## Type

Documentation

## Objective

`docs/configuration.md` § Assistant instruction files says that when an explicitly requested
assistant's file is missing, `aief prompt` "falls back to `CLAUDE.md` if present". Change 0112
removed that fallback: the prompt becomes the generic, `AGENTS.md`-only one. Found in Change 0166.

## Scope

### In scope

- Correct that sentence in `docs/configuration.md`.

### Out of scope

- Any code change; any other doc (searched: no other occurrence).

## Success Criteria

- The sentence matches `aief prompt`'s behavior and `docs/cli.md`.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.

## Status

Closed (2026-10-22)
