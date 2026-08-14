# Change

## ID

`0094-add-data-definition-skill-pilot-and-validate-coexistence`

## Type

General

## Objective

Add one instructions-only `data-definition` Skill, using the exact architectural pattern
`architecture-definition` (Change 0091, hardened by Changes 0092/0093) already proved, and validate
that two expert Definition Skills can coexist on the same Definition Change — domain-specific,
non-duplicative, governance-safe — without any new orchestration layer, shared context, or graph.
This is the final Change in the current Expert Definition validation round: it produces a verdict
on whether the expert-skill pattern generalizes across multiple domains, and then stops.

## Scope

### In scope

- One new Skill, `cli/src/skills/data-definition.js`, registered in `cli/src/skills/index.js`,
  reusing `architecture-definition.js`'s exact shape: instructions-only, deterministic keyword
  applicability, `definitionEnrichment` consumption, the Change 0092/0093 "check
  `knowledge/decisions.md` first" durable-knowledge instruction pattern, and the same governance
  prohibitions (never fill `Decision (human)`, never check a `(human)` task, never write
  application/infrastructure code).
- An explicit domain boundary: Data Definition owns data-governance/lifecycle concerns
  (classification, retention, residency, ownership, PII/deletion/archival); Architecture Definition
  owns system-level implementation shape (topology, tenancy, persistence technology, deployment).
  Overlap is resolved through explicit scope language in each Skill's own instructions and
  deterministic applicability — never a routing/arbitration mechanism.
- Ten coexistence scenarios (A–J) plus an applicability adversarial review, run against real
  fixtures and a real disposable scratch project driving both Skills through the actual `aief`
  CLI — proving no duplicate governed decisions, no conflicting recommendations, and correct
  independent applicability.
- A defect classification for every finding; only a `REAL DEFECT` gets a fix, at the smallest
  coherent scope.
- A final pattern verdict (A/B/C/D) on whether the expert-skill model is proven across two domains.

### Out of scope

- Security/Integration/NFR Definition Skills — this Change is the last one before a separate
  product decision.
- Any shared `durableKnowledge` Skill Context field (Change 0093's own verdict: KEEP AS-IS).
- Any Skill orchestration engine, conflict resolver, domain router, or Skill Graph — the existing
  Skills Runtime (independent `appliesTo()`/`buildInstructions()` per Skill, composed additively by
  `aief prompt`) is the thing being validated, not replaced.
- Any new graph, decision store, approval engine, or Definition redesign.

## Success Criteria

- `data-definition` is instructions-only, deterministic, assistant-agnostic, zero-write by
  construction — identical capability lock to `architecture-definition`.
- Architecture and Data Definition can both apply to one realistic Definition Change without
  duplicating a governed concern (Missing/Ambiguous/Decision Required/Human/Deferred) or issuing a
  contradictory recommendation.
- Existing `architecture-definition` tests/behavior are unchanged, except where a real coexistence
  defect justifies a narrow, evidenced instruction clarification.
- `npm test` ≥ 940 pass, 0 fail; `aief verify` PASS; `git diff --check` clean.
- A final pattern verdict (A/B/C/D) is recorded, with explicit future-domain constraints if not D.

## Status

Closed (2026-08-14)
