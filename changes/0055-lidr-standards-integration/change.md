# Change

## ID

`0055-lidr-standards-integration`

## Type

General

## Objective

Second activation of Change 0053's `discoverAiSpecs()`/`resolveResources()`: let AIEF discover,
resolve and — critically — actually consume a project's `ai-specs/standards/*.md` alongside its
built-in `knowledge/standards/*.md`, project always winning on id collision, without ever copying
a file.

## Scope

### In scope

- `cli/src/core/domain/ai-specs.js`: shared `resolveResourceRecommendations()` (extracted from
  Change 0054's `resolveSkillRecommendations()`, behavior-preserving) and new
  `resolveStandardRecommendations(builtins, cwd)`.
- `aief prompt`: primary integration point. `standardsBlock` renders through the resolver —
  byte-identical for a project with no `ai-specs/standards/`; a resolving project standard appears
  with its real path, tagged `[project]`/`[project override]`.
- `aief doctor --verbose`: a new, fully conditional "Standards:" report — present only when
  `ai-specs/standards/` contributes at least one entry (valid or not).
- Tests, `docs/cli.md`, ADR-025.

### Out of scope

- `bootstrap`, `analyze`, Skills, Harness, Loop, Graph, worktrees, `status --next` — untouched.
- `createStandards()`/`standardsForProject()` (the built-in standards copy mechanism) and
  `cli/templates/standards/` — untouched.
- Any new command or `--json` output.

## Status

Closed (2026-07-30)
