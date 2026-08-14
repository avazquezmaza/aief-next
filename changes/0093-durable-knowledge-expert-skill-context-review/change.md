# Change

## ID

`0093-durable-knowledge-expert-skill-context-review`

## Type

General

## Objective

A focused, adversarial design review: should Definition-aware expert Skills receive durable
project knowledge (`knowledge/decisions.md`) through shared Skill Context / prompt composition, or
should each Skill continue to explicitly instruct the assistant to inspect durable knowledge when
relevant — the pattern Change 0092 added to `architecture-definition` as a real-defect fix?

This is a design-validation/product-architecture review, not a feature-expansion Change. No Data
Definition, Security Definition, Integration Definition, or NFR Definition Skill is implemented
here. No retrieval system, RAG layer, embeddings, vector database, decision graph, knowledge graph,
or new state store is considered in scope, regardless of the verdict.

## Scope

### In scope

- Inspection of the actual durable-knowledge model (`knowledge/decisions.md`'s real structure,
  writers, readers, and this repository's own real 31-ADR/1437-line ledger as concrete evidence),
  the actual composed-prompt path (`cli.js`'s `prompt()`), the actual `buildSkillContext()` fields,
  and the two other shipped Skills (`change-context`, `requirements-analysis-instructions`) for
  precedent.
- Six scenarios (A–F: one relevant decision, many irrelevant decisions, a superseded decision, a
  conflicting current Definition state, no decisions file, a large real ledger) evaluated against
  three architectural options (A. keep as-is / B. small shared context fix / C. too broad).
- An explicit architectural verdict, reached against the mission's own six-criterion Foundation
  Change Threshold — not a preference call.
- Implementation of the smallest coherent fix, but **only** if the verdict is B; otherwise no code
  change at all.

### Out of scope

- Data/Security/Integration/NFR Definition Skills.
- Any retrieval, embeddings, vector database, semantic search, ADR indexing/caching, knowledge
  graph, decision graph, or requirement graph.
- Any new persistence format, approval mechanism, or durable-decision store — `knowledge/decisions.md`
  remains the one durable authority regardless of the verdict.
- General cross-file prompt-composition gaps (e.g. `docs/prd.md` visibility) beyond durable
  knowledge specifically — Change 0092 already flagged this as a separate, pre-existing, general
  limitation; not re-litigated here except where it bears directly on the durable-knowledge
  question.

## Success Criteria

- A single, explicit, evidence-backed verdict (A/B/C) is recorded, tested against the mission's own
  Foundation Change Threshold criteria, not asserted by preference.
- If B, the smallest coherent implementation is built, tested, and evidenced in this same Change —
  no second Change.
- If A or C, no runtime code changes; the Change still closes as a design-review Change, per this
  repository's own existing convention for review/design Changes (`## Type: General`, evidence-only
  closure).
- `npm test` ≥ 940 pass, 0 fail; `aief verify` PASS; `git diff --check` clean, regardless of verdict.
- An explicit answer on whether Data Definition may proceed, and under what condition.

## Status

Closed (2026-08-14)
