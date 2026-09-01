# Change

## ID

`0107-minor-consistency-fixes`

## Type

General

## Objective

Fix three small, low-risk consistency bugs found during an independent code review of the
repository, grouped into one Change because each is a one-file, low-blast-radius fix with no
shared code path between them:

1. `ai-specs.js` reports a fabricated `.md` path in `because` for folder-shaped Skills/Standards
   (`<id>/SKILL.md`), contradicting the correct `path` shown alongside it.
2. `definition-enrichment.js`'s item-marker scan only recognizes `-` bullets, silently ignoring
   `*`/`+` bullets that Change 0075 already standardized elsewhere in the codebase
   (`change.js`'s `countOpenTasks()`).
3. `README.md`'s `## Status` section still says "AIEF 3.2" while `package.json` has been at
   `3.3.0` since Change 0103 — stale, and the kind of dangling reference Change 0101 just fixed
   in docs.

## Scope

### In scope

- `cli/src/core/domain/ai-specs.js`: `because` for a project-sourced resource must name the real
  discovered path, not assume flat `<id>.md`.
- `cli/src/core/domain/definition-enrichment.js`: item-marker scan accepts `-`, `*`, `+` bullets,
  matching `change.js`'s `countOpenTasks()` convention.
- `README.md`: `## Status` updated to say AIEF 3.3.
- Regression tests for (1) and (2).

### Out of scope

- Any other stale-version mention beyond `README.md`'s `## Status` (a full sweep of every doc for
  version mentions is a separate, larger task, not verified as broken here).
- Deriving `standardsForProject()` from the catalog (already handled separately in Change 0106).
- The Jira `sourceId` path traversal fix (Change 0105, separate branch).

## Success Criteria

- `doctor --verbose` (and any other caller of `resolveResourceRecommendations()`) reports a
  `because` line naming the actual discovered file for both flat (`<id>.md`) and folder
  (`<id>/SKILL.md`) project resources.
- A Definition Change's `change.md` using `*` or `+` bullets for `(deferred)`/`(ambiguous)`/
  `(decision required)`/`(human)` markers is classified the same as one using `-`.
- `README.md`'s `## Status` says "AIEF 3.3".

## Status

Closed (2026-09-01)
