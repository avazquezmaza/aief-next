# Change

## ID

`0091-add-architecture-definition-skill-pilot`

## Type

General

## Objective

Add one instructions-only Skill, `architecture-definition`, proving that expert Definition
enrichment (the "Definition Expert Enrichment" direction the prior feasibility review evaluated)
can be built entirely on AIEF's existing primitives: the Definition Change type, the Skills
Runtime's seven-status/instructions-only contract, `context.definitionEnrichment` (Change 0090),
the existing `(decision required)`/`(ambiguous)`/`(human)`/`(deferred)` markers, and
`knowledge/decisions.md` as the one durable-decision ledger — with no new graph, state store,
approval engine, architecture lifecycle, or dependency.

This is a **pilot**, not a platform: it proves the pattern for one expert domain (architecture). It
does not generalize to Security/Data/Integration/NFR Definition Skills, and does not itself decide
anything — every output is non-authoritative instructions for the assistant, which edits a Definition
Change's own existing sections; the human remains the only authority over `Decision (human)`.

## Scope

### In scope

- One new Skill module, `cli/src/skills/architecture-definition.js`, registered in
  `cli/src/skills/index.js` (one file + one registry entry, per the existing extension model —
  `docs/architecture.md#extension-model`).
- `appliesTo(context)`: applicable only for a Definition Change (`context.change.type ===
  "definition"`) whose own content contains at least one deterministic, architecture-relevant
  keyword signal (authentication, tenancy, integration, persistence, availability, scalability,
  ...) — a simple, fixed OR-of-keywords test, never a policy engine, never AI classification.
- `buildInstructions(context)`: reads `context.definitionEnrichment` (Change 0090) to avoid
  duplicating already-known/already-marked content, then instructs the assistant to draft
  Architecture Concerns, Options Considered, Trade-offs, and a Recommendation inside the Definition
  Change's *existing* sections, using the existing markers — with explicit, repeated prohibitions
  against writing `Decision (human)`, checking a `(human)` task, choosing a technology/architecture
  silently, or implementing application code.
- Full test coverage: applicability (positive/negative), context consumption, governance-language
  presence, assistant-independence, capability lock, determinism.
- An end-to-end pilot run against a disposable, throwaway Definition-stage project (the mission's
  own B2B SaaS scenario), verifying no application code, no hidden state, no second decision
  ledger, and correct `verify --strict` gating before/after a human decision is recorded.

### Out of scope

- Security/Data/Integration/NFR Definition Skills — explicitly deferred pending review of this
  pilot.
- Any new graph, decision store, approval mechanism, or architecture-specific lifecycle/state
  machine.
- Automatic generation of a follow-up implementation Change — `Follow-up Changes` stays a
  human/assistant-authored section, exactly as it already is for every Definition Change.
- Any change to `analyzeDefinitionSections()`, the marker vocabulary, or the Definition scaffold's
  section list.

## Success Criteria

- The Skill is instructions-only, deterministic, assistant-agnostic, and zero-write by
  construction — the Skills Runtime's existing `writeFiles`/`executeCommands`/`network` capability
  lock enforces this the same way it does for every other Skill.
- The Skill's own instructions explicitly separate Recommendation from Decision and forbid every
  action listed in this Change's adversarial review.
- The pilot scenario produces Known/Missing/Ambiguous/Decision-required architecture content inside
  existing Definition sections, an unresolved `Decision (human): TBD`, and Implementation
  Prerequisites — without generating `src/`, application code, or a second decision artifact.
- `npm test` passes; `aief verify` PASS; `git diff --check` clean.

## Status

Closed (2026-08-14)
