# Specification

## Goal

Answer, with evidence from real scenario runs, not prose speculation: does the
`architecture-definition` Skill remain useful, conservative, non-duplicative, and
governance-safe under realistic Definition-stage messiness?

## Requirements

- R1. Ten scenarios (A–J below) are each run against a real fixture (`buildSkillContext()` +
  `appliesTo()`/`buildInstructions()` directly) or a real disposable scratch project driven through
  the actual `aief` CLI — never simulated in prose only.
- R2. Scenario A (incomplete PRD): the Skill's instructions must not assert a scale/availability
  number, must not silently choose a cloud provider, must not touch `Decision (human)`.
- R3. Scenario B (contradictory requirements): the Skill's instructions must not silently reconcile
  the contradiction or treat one side as authoritative; must direct the assistant to surface it.
- R4. Scenario C (existing approved decision in `knowledge/decisions.md`): the Skill's instructions
  must not lead the assistant to treat the concern as undecided, and the approved decision must
  outrank a new recommendation — verified by the Skill's own instruction text (R2 constraint), and
  by whether `aief prompt`'s composed output makes `knowledge/decisions.md` visible at all.
- R5. Scenario D (existing unresolved `(decision required)` item): `context.definitionEnrichment`
  must surface it, and the Skill's instructions must tell the assistant not to duplicate it.
- R6. Scenario E (approved decision + new related concern): the Skill's instructions must
  distinguish "already decided" from "new consequence of that decision" — same mechanism as C/D,
  not a new one.
- R7. Scenario F (weak/absent architecture signal): `appliesTo()` must return `not_applicable` for
  Definition content carrying no real architecture-relevant keyword outside scaffold headings.
- R8. Scenario G (context mixed across README/PRD/knowledge/decisions.md/Definition Change):
  determine, from the real composed `aief prompt` output, whether the assistant actually receives
  this context anywhere in the full prompt (even if not inside the Skill's own instructions block)
  — a Skill Context gap is only real if the *whole* composed prompt omits it, per this Change's own
  non-goal against widening Skill Context without a demonstrated need.
- R9. Scenario H (irrelevant historical `knowledge/decisions.md` entries): assess only whether the
  Skill's own instructions text risks overfitting to unrelated ADRs; do not build any scoping
  mechanism.
- R10. Scenario I (`(deferred)` item): the Skill's instructions must not direct the assistant to
  turn a deferred item back into a blocking decision.
- R11. Scenario J (marker says `(ambiguous)`, but `knowledge/decisions.md` records a resolution):
  report this as a real repository-state question (documentation/convention gap vs. Skill
  limitation vs. out-of-scope lifecycle issue) — do not build automatic reconciliation.
- R12. Applicability adversarial review: false positives/negatives, case sensitivity, headings,
  code blocks, negative statements ("we will not use multi-tenancy"), and generic words ("system",
  "data") are each explicitly checked and reported, not just asserted safe.
- R13. Every scenario's final tree is inspected: no `src/`, `app/`, `infra/`, `terraform/`,
  `migrations/`, `Dockerfile`, or other application/infrastructure file is created unless it
  existed as input.
- R14. Any code fix is scoped to a demonstrated `REAL DEFECT` only, touches only
  `architecture-definition.js` (and, only if the defect is proven to live there,
  `skill-context.js`) plus its own tests/docs, and ships with a regression test plus a rerun of the
  affected scenario.

## Acceptance Criteria

- [x] All ten scenarios run, each with recorded input, Skill Context/applicability result, key
      instruction output, governance outcome, and final tree — in `evidence.md`.
- [x] A scenario matrix (Applicable/Useful/Duplicates/Invents/Governance Safe/Fix Needed) is
      recorded for all ten scenarios.
- [x] Every finding is classified (`REAL DEFECT`/`DESIGN LIMITATION`/`EXPECTED
      BEHAVIOR`/`DOCUMENTATION GAP`/`TEST GAP`/`OVERENGINEERING TO FIX`).
- [x] Any `REAL DEFECT` has a reproduction, a regression test, a smallest-coherent fix, and a
      scenario rerun proving the fix.
- [x] Human governance (`Decision (human)` untouched, `(human)` tasks untouched, `verify --strict`
      and `close` gating unchanged) holds across every scenario.
- [x] No scenario's final tree contains unexpected application/infrastructure files.
- [x] Assistant-independence holds (no Claude/Gemini-specific string introduced by any fix).
- [x] A generalization verdict (A/B/C/D) is recorded with justification.
- [x] `npm test` ≥ 932 pass, 0 fail; `aief verify` PASS; `git diff --check` clean.
