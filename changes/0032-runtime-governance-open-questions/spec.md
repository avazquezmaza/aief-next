# Specification

## Goal

The three unresolved tensions from the Runtime/Governance Architecture Review are captured in one authoritative architecture document, framed as evidence-gated open questions (ADR-008 posture), so that future decisions about them arrive as ADRs backed by named evidence — and so that none of them slips into implementation informally.

## Requirements

- **Document**: `docs/runtime-governance-open-questions.md`, new file; no existing document modified.
- **Coverage — exactly three tensions, no more**:
  1. *Requirement vs Change*: analyze the problem-space/solution-space conflation (normalized requirement embedded in Enrichment Changes); name the failure modes that would falsify the current model (ledger pollution by rejected requirements; non-1:1 requirement↔Change mapping); state hypotheses H1/H2 as requiring validation; explicitly do not propose a Requirement concept, lifecycle, or directory.
  2. *Tasks vs Gates*: analyze the single-checkbox mechanism serving both developer tasks and human approval gates; name the convention that holds the distinction today (prompt guardrail + human diff review) and its limits (only valid under supervised use); state hypotheses H3/H4; explicitly do not change `tasks.md` or verify rules; point any future formalization into the closability-contract roadmap workstream.
  3. *Execution Identity*: analyze the absence of a composition record (assistant, model, profile, standards, skills, timestamp, prompt hash/snapshot); distinguish three rungs — procedural evidence (today), composition record (open question), strong attestation (out of scope, no validated demand); state ADR-derived constraints any future record must respect (visible/versionable per ADR-009; references not copies; owned by Verification & Governance not Prompt Composition per ADR-012; never named "Context"; traceability never sold as enforcement); state hypotheses H5/H6 with the manual-convention experiment named as the mandatory cheapest first step.
- **Closing table** with exactly these five columns: Pregunta abierta / Riesgo si se ignora / Evidencia requerida / Decisión recomendada ahora / Decisión diferida para AIEF 1.x — one row per tension.
- **Posture**: every recommendation in the "now" column must be a non-implementation action (observe, document, dogfood a manual convention); every deferred decision must name its evidence precondition.
- **Constraints**: no code, no CLI change, no test change, no file moves, no new implementation concepts.

## Acceptance Criteria

- [x] `docs/runtime-governance-open-questions.md` created with the three tensions and only those three.
- [x] Each tension includes: current-model strengths, falsification conditions, explicit hypotheses (H1–H6), and a "deliberately not proposed here" statement.
- [x] The five-column summary table is present with one row per tension.
- [x] ADR-008 posture explicit at document top and in every "decision recommended now" cell.
- [x] No file outside this Change and the new document was created or modified.
- [x] `aief verify` PASS.
- [x] Tests not run/not required: no executable file changed (documentation only).
