# Evidence

## Summary

Created `docs/runtime-governance-open-questions.md` on 2026-07-08, capturing the three tensions that survived the adversarial Architecture Review of AIEF's Runtime and Governance models (Requirement vs Change; Tasks vs Gates; Execution Identity) as evidence-gated open questions under ADR-008. Documentation only: no code, no CLI change, no test change, no file moves, no existing document modified.

## Activities Performed

- Created the Change with `aief new-change runtime-governance-open-questions` (ID 0032 assigned by the CLI).
- Distilled the two-sided Architecture Review (a compliance-platform redesign proposal and its adversarial refutation, both 2026-07-08) down to the three observations both sides ultimately agreed were real, discarding everything already documented elsewhere (domain-model.md, ROADMAP-TO-1.0.md) or rejected for lack of evidence.
- Wrote `docs/runtime-governance-open-questions.md`:
  - **Tension 1 — Requirement vs Change**: problem-space/solution-space conflation from embedding normalized requirements in Enrichment Changes (a deliberate 0030 scope decision, not an accident); falsification conditions (ledger pollution by rejected requirements; non-1:1 requirement↔Change mapping); hypotheses H1/H2; no Requirement concept proposed.
  - **Tension 2 — Tasks vs Gates**: one checkbox mechanism serving two authority models; the convention holding it today (prompt guardrail + mandatory human diff review) and its limit (supervised use only); hypotheses H3/H4; formalization explicitly routed into the closability-contract roadmap workstream, `tasks.md` untouched.
  - **Tension 3 — Execution Identity**: no record exists of what `aief prompt` composed; three rungs distinguished (procedural evidence today / composition record as the open question / strong attestation explicitly out of scope with zero validated demand); ADR-constraints for any future record (visible per ADR-009, references not copies, owned by Verification & Governance per ADR-012, never named "Context", never sold as enforcement); hypotheses H5/H6 with the manual "Composition" line in evidence.md named as the mandatory cheapest experiment.
  - **Closing table** with the five required columns (Pregunta abierta / Riesgo si se ignora / Evidencia requerida / Decisión recomendada ahora / Decisión diferida para AIEF 1.x), one row per tension.
- Completed this Change's change.md, spec.md and tasks.md (were the generic scaffold).

## Verification

```
aief verify -> PASS (run after this evidence was written; 0032 reported as in progress/complete)
npm test    -> NOT RUN, per the Change instructions: no executable file changed.
               git status confirms nothing under cli/ or adapters/ was touched.
git status  -> Untracked only:
               changes/0032-runtime-governance-open-questions/
               docs/runtime-governance-open-questions.md
Manual checks:
- Document covers exactly the three requested tensions, no more.
- No existing document modified; no folder moved; no implementation concept introduced.
- Every "decision recommended now" is a non-implementation action; every deferred
  decision names its evidence precondition (H1–H6).
```

## Findings

- The two adversarial reviews converged on Execution Identity from opposite directions (compliance demand vs runtime-model analysis) — recorded in the document as a signal worth noting, with the explicit caveat that reviewer convergence is not user evidence.
- Tension 2 (Tasks vs Gates) is the only one with a probable near-term forcing function: the closability-contract workstream (ROADMAP-TO-1.0 workstream 4) likely cannot be specified without distinguishing who may check which boxes (H4). It was routed there rather than treated as a standalone feature.
- Tension 1 has the highest falsifiability: one real team pilot with a healthy requirements funnel will confirm or kill H1/H2 without building anything.

## Risks

- These questions could be re-litigated from scratch in future sessions if this document isn't treated as the single capture point — mitigated by cross-referencing it from the Change and by its closing note that answers must arrive as ADRs.
- The manual H6 experiment (Composition line in evidence.md) depends on voluntary discipline; if nobody actually tries it, H5/H6 remain unvalidated indefinitely — acceptable under ADR-008 (an unfelt need is evidence in itself).

## Recommendations

- Adopt the H6 dogfooding experiment on this repo's own future Changes (a manual "Composition:" line in evidence.md) — zero cost, directly tests tension 3's cheapest hypothesis.
- Watch H1/H2 signals during the next real-team pilot (rejected-requirement volume; any requirement needing multiple Changes).
- When the closability-contract workstream is designed, resolve H4 inside it and, if confirmed, bring the task/gate distinction as part of that ADR — not before.

## Artifacts Produced

- New: `docs/runtime-governance-open-questions.md`.
- `changes/0032-runtime-governance-open-questions/` (this Change: change.md, spec.md, tasks.md, evidence.md).

## Lessons Learned

- An adversarial review pair (thesis + refutation) proved efficient at separating signal from noise: of eight original claims, only three survived both directions of scrutiny — and those three are cheap to hold as questions and expensive to implement prematurely, which is exactly the case ADR-008 was written for.

## Next Change

Whichever arrives first: evidence confirming H1/H2 (Requirement as first-class concept), the closability-contract workstream design (resolving H4), or accumulated H6 dogfooding results (composition record). Independently: the existing roadmap workstreams (ROADMAP-TO-1.0) remain the committed path.
