# Change

## ID

`0090-expose-definition-enrichment-in-skill-context`

## Type

General

## Objective

`buildSkillContext()` (`cli/src/core/services/skill-context.js`) is the only place a Skill Context
is assembled, but it does not expose a Definition Change's own content — a Skill can see
`workflow`/`sdd`/`action` state but has no way to know what a Definition Change's sections already
say (Known/Missing sections, `(deferred)`/`(ambiguous)`/`(decision required)`/`(human)`-marked
items). This Change adds one additive field, `definitionEnrichment`, reusing the already-existing,
already-tested `analyzeDefinitionSections()` (`cli/src/core/domain/definition-enrichment.js`,
Change 0081) — no new parser, no new marker vocabulary, no new domain module.

This is the foundation gap identified by the prior read-only feasibility review
("AIEF 3.2.0 Product + Next-Program Feasibility Review"): `B. FEASIBLE WITH SMALL FOUNDATION GAP`.
Closing it is a prerequisite for a future Definition-aware Skill (e.g. an Architecture Definition
Skill pilot) to avoid re-deriving or duplicating what a Definition Change already records.

## Scope

### In scope

- Add a `definitionEnrichment` field to `buildSkillContext()`'s return value.
- Populate it by calling `analyzeDefinitionSections()` on the Change's own `change.md` content,
  only when `change.type === "definition"`.
- `null` for every other Change type (General, Analysis, Enrichment, or an unrecognized/absent
  type) — the same "absent-when-inapplicable" convention `workflow`/`sdd` already use.
- Zero new I/O: reuse `change.files["change.md"]`, already read by `loadChangeUnified()` for a
  legacy (no-manifest) Change — the only shape a Definition Change takes today (`## Type` is only
  ever read from `change.md`, and a manifest-carrying Change's `.type` is always `""`, never
  `"definition"`, per `change-loader.js`).
- Focused + full test coverage; update the existing "adds exactly `project`" contract test to the
  new field set.

### Out of scope

- No new graph, state store, approval engine, architecture lifecycle, or runtime dependency.
- No new Skill in this Change — the consuming Architecture Definition Skill is Change 0091.
- No change to `analyzeDefinitionSections()`'s own logic, marker vocabulary, or section list.
- No change to `workflow`/`sdd`/`action`/`project`'s existing shape or behavior.

## Success Criteria

- `buildSkillContext()` returns `definitionEnrichment` for a Definition Change, computed via the
  existing `analyzeDefinitionSections()` — never a second, parallel implementation.
- `definitionEnrichment` is `null` for every non-Definition Change type.
- Zero writes, deterministic output, frozen context — the same guarantees `buildSkillContext()`
  already carries for `project`/`change`/`workflow`/`sdd`/`action`.
- `npm test` (907 existing + new tests) passes; `aief verify` PASS; `git diff --check` clean.

## Status

Closed (2026-08-14)
