# Change

## ID

`0054-lidr-skill-recommendations`

## Type

General

## Objective

Wire Change 0053's `discoverAiSpecs()`/`resolveResources()` into a real command, so a project's
`ai-specs/skills/*.md` are consumed alongside AIEF's built-in Skill Catalog recommendations, with
explicit precedence (`project > built-in`), visibly and opt-in — without changing behavior for any
project that has no `ai-specs/skills/` directory.

## Scope

### In scope

- `cli/src/core/domain/ai-specs.js`: `deriveSkillDescription(content)` and
  `resolveSkillRecommendations(builtins, cwd)` — pure resolution, reusing `discoverAiSpecs()`/
  `resolveResources()` without duplicating their logic.
- `aief doctor`: the sole integration point. `printSkills()` now shows project-sourced Skills
  (tagged `[project]`/`[project override]`) alongside built-ins, in deterministic order. A new
  `--verbose` flag reveals `source`, `path`, and `overrides` detail, plus any ai-specs resolution
  warnings; the default output stays a single extra line (a count) when warnings exist.
- Tests: unit tests for the new domain function, CLI tests for `aief doctor`/`aief doctor
  --verbose`.
- `docs/cli.md`: document `--verbose` on `doctor`.
- `knowledge/decisions.md`: ADR-024 (activates the wiring ADR-023 left dormant).

### Out of scope

- `aief bootstrap`, `aief analyze`, `aief prompt` — all three still call `recommendSkills()`
  directly and are untouched (zero diff).
- `knowledge/standards/` / `ai-specs/standards/` wiring — a future Change.
- Any new command, Harness, Loop, Graph, worktrees, `--json` output.
- `cli/src/detect.js` — untouched; `recommendSkills()`'s signature and behavior are unchanged.

## Status

Closed (2026-07-30)
