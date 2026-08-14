# Change

## ID

`0081-definition-enrichment-workflow`

## Type

General

## Objective

Give a Definition Change (Change 0079) a deterministic way to classify its own content into
Known / Missing / Ambiguous / Decision required / Human approval required / Deferred until
implementation, so a human or assistant working it can see exactly what is resolved and what
still needs attention — without inventing requirements, without auto-approving decisions, and
without duplicating the existing (Jira/manual) requirement-source Enrichment.

## Inventory of what already exists (ADR-013 accounting)

- `aief enrich manual|jira` (Change 0021/0074 area) already owns "Enrichment" as a concept — a
  read-only normalization of an *external* requirement source into a Change. This Change reads
  nothing external; it only classifies a Definition Change's own `change.md`, already written by a
  human/assistant. To avoid ambiguity with that existing meaning, this capability is not exposed
  as `aief enrich definition` — it extends `aief status --change <id>` (an existing, already
  read-only inspection command) with a Definition-specific block, the same additive pattern
  `printHarnessStatus()` already established for Harness-configured Changes (Change 0056).
- The `(human)` task-marker convention (Change 0079's inventory) is reused as a line-level marker
  inside `change.md` itself, not reinvented.
- `changeType()`/`changeTypeFromContent()` (unchanged) already identify a Definition Change; this
  Change adds no second type-detection mechanism.
- ADR-013: this Change adds one new read-only domain module
  (`core/domain/definition-enrichment.js`) and one additive block on an existing command
  (`aief status --change`, present only for `## Type: Definition`) — it replaces the previous
  state where a Definition Change's completeness was invisible to any command (a human had to
  read change.md manually to know what was still a "-" placeholder) with an explicit, queryable
  view — no new command, no new persistence, no new approval mechanism.

## Scope

### In scope

- `analyzeDefinitionSections(changeMd)` (`cli/src/core/domain/definition-enrichment.js`):
  section-level Known/Missing (placeholder detection) plus item-level Deferred/Ambiguous/Decision
  required/Human approval required, from explicit author-written line markers
  (`(deferred)`, `(ambiguous)`, `(decision required)`, `(human)`) — never inferred from prose.
- `aief status --change <id>` on a Definition Change prints a "Definition readiness" block:
  known/missing section counts (a transparent literal ratio, not a fabricated completeness score)
  and every marked item, grouped by category.
- `aief prompt` on a Definition Change (Change 0079's instruction block) documents the marker
  convention, so an assistant filling in change.md knows how to flag ambiguity/decisions/deferrals
  instead of leaving them unmarked prose.

### Out of scope

- Any change to `aief enrich` (Jira/manual requirement sources) — verified unchanged.
- Maturity-aware standards — Change 0082.
- `aief verify --strict` — Change 0083.
- Auto-approving any `(human)`-marked item, or auto-writing to `knowledge/decisions.md`.
- A percentage-complete or quality score — only literal counts and explicit-marker lists.

## Success Criteria

- A fresh, untouched Definition Change reports every section as Missing.
- A Definition Change with real content in a section reports that section as Known.
- `(deferred)`/`(ambiguous)`/`(decision required)`/`(human)` line markers are classified correctly
  and only when explicitly present — an unmarked line is never guessed into a category.
- `aief status --change` on a non-Definition Change is byte-identical to before this Change (no
  Definition readiness block).
- `aief enrich` (Jira/manual) is untouched and its own tests still pass unmodified.

## Status

Closed (2026-08-14)
