# Change

## ID

`0118-bootstrap-agents-template-reuse`

## Type

General

## Objective

`aief bootstrap <name>` (`initProject()` in `cli/src/commands/bootstrap.js`) writes a hardcoded
two-line `AGENTS.md` (`"# Project Agent Instructions\n\nAI assists. Humans decide.\n"`) instead of
the canonical `AGENTS_TEMPLATE` that `runAdoption()` (`aief bootstrap` with no name, i.e.
adopting AIEF into an *existing* project) already uses. A brand-new project created by name misses
the ~40 collaboration rules, the `(human)`/`(review)` gates, and the per-assistant pointer
(`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`) every other bootstrap path delivers — the exact
class of gap Change 0040 already fixed once for the adopt-in-place path.

## Scope

### In scope

- `initProject()` writes `AGENTS_TEMPLATE`'s content instead of the inline two-line string.
- New project skeleton (`README.md`, `changes/`, `knowledge/`, `src/`, `tests/`) is otherwise
  unchanged.

### Out of scope

- `initProject()` does not call `runAdoption()`/`createStandards()` — it stays a plain skeleton
  generator, not a full adoption run (project detection, standards, CI gate, adopt-aief Change).
  That would change its behavior well beyond "use the right AGENTS.md" and is a larger, separate
  decision (raised as a Recommendation, not implemented here).
- No change to `bootstrapHere()`/`runAdoption()` (the no-name path) — already correct.

## Success Criteria

- `aief bootstrap <name>` writes an `AGENTS.md` byte-identical to `cli/templates/agents/AGENTS.md`,
  same as `aief bootstrap` (no name) already does.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-03)
