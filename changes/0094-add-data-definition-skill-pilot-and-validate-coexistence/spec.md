# Specification

## Goal

`aief prompt --skill data-definition` attaches deterministic, non-authoritative data-governance
instructions to a Definition Change's prompt, reusing every primitive `architecture-definition`
already validated — and the two Skills can coexist on one Definition Change without duplication or
conflict.

## Requirements

- R1. `cli/src/skills/data-definition.js` follows the exact descriptor shape
  `architecture-definition.js` uses (`id`, `version`, `title`, `description`, `capabilities`,
  `appliesTo`, `buildInstructions`, `summarize`).
- R2. `capabilities`: `instructions: true` only; `writeFiles`/`executeCommands`/`network` remain
  `false`; `assistantRequired: false`.
- R3. `appliesTo(context)`: `not_applicable` when no Change resolved; `not_applicable` ("not a
  Definition Change") when `context.change.type !== "definition"`; `not_applicable` (naming the
  absence) when the Definition Change's own content (headings stripped, per the Change 0091 fix)
  carries no data-governance keyword signal (PII, personal data, sensitive data, customer data,
  retention, residency, ownership, classification, deletion, archival, records, regulated,
  data subject); `{ applicable: true }` otherwise.
- R4. The keyword set deliberately excludes bare "data"/"database"/"schema"/"storage" — these are
  exactly the words that would cause false-positive overlap with `architecture-definition`
  (mission §10); a data-governance-specific phrase (e.g. "customer data", "sensitive data",
  "personal data") is required, not the bare word "data" alone.
- R5. `buildInstructions(context)` reads `context.definitionEnrichment` (Change 0090) exactly as
  `architecture-definition` does, to avoid duplicating already-known/already-marked content.
- R6. The built instructions state the domain boundary explicitly: Data Definition owns
  classification/retention/residency/ownership/deletion/archival; it must explicitly defer
  persistence-technology, deployment-topology, tenancy-topology, and cloud-provider questions to
  `architecture-definition`, never claim them itself.
- R7. The built instructions reuse the Change 0092/0093 "check `knowledge/decisions.md` first"
  pattern verbatim in structure (adapted for data-governance decisions) — no new durable-knowledge
  mechanism, no Skill Context field.
- R8. The built instructions carry the same governance prohibitions as `architecture-definition`
  (never fill `Decision (human)`, never check a `(human)` task, never write application/
  infrastructure code/migrations/schemas, never invent a regulatory obligation not supported by
  repository evidence, never silently reconcile a contradiction).
- R9. The built instructions permit "insufficient evidence to recommend yet" / a conditional
  Recommendation — never forcing a conclusion merely because the template has a Recommendation
  section.
- R10. Registration: `cli/src/skills/index.js`'s `MODULES` gains exactly one new entry; existing
  entries/order/behavior unchanged.
- R11. No Claude/Gemini/assistant-specific reference anywhere in the module (verified by a
  source-level test, mirroring `architecture-definition`'s own).
- R12. Ten coexistence scenarios (A–J, per this Change's own `change.md`/mission) are run against
  real fixtures and/or a real disposable scratch project — never simulated in prose only — proving:
  both Skills can apply simultaneously without duplicating a governed concern or issuing a
  contradictory recommendation; each Skill's applicability is independently correct; no ordering
  dependency exists that changes correctness.
- R13. Any code fix is scoped to a demonstrated `REAL DEFECT` only, at the smallest coherent scope
  — `data-definition.js` primarily; `architecture-definition.js` only if a coexistence defect is
  proven to live there; no other runtime file.

## Acceptance Criteria

- [x] All ten coexistence scenarios run with recorded input, applicability results for both
      Skills, key instruction output, duplication/conflict analysis, and governance outcome.
- [x] A scenario matrix is recorded.
- [x] Applicability adversarial review (false positives/negatives, generic "data"/"database"/
      "schema" words, headings, code blocks, negative statements) is explicit.
- [x] Every finding is classified; only `REAL DEFECT` findings receive a fix, each with a
      regression test and a scenario rerun.
- [x] Existing `architecture-definition` tests still pass unmodified (or, if changed, the change is
      justified by a real coexistence defect and documented).
- [x] Human governance (`Decision (human)`, `(human)` tasks, `verify --strict`, `close`) unchanged
      across every scenario.
- [x] No scenario's final tree contains an unexpected application/infrastructure file.
- [x] `npm test` ≥ 940 pass, 0 fail; `aief verify` PASS; `git diff --check` clean.
- [x] A final pattern verdict (A/B/C/D) is recorded with justification and future-domain
      constraints.
