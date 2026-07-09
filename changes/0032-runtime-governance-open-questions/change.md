# Change

## ID

`0032-runtime-governance-open-questions`

## Type

General

## Objective

Capture, as formal open questions in an architecture document, the three tensions that survived the adversarial Architecture Review of AIEF's Runtime Model and Governance Model (two independent reviews held 2026-07-08: one proposing a compliance-platform redesign, one refuting it) — so they are decided later by evidence and ADR, not re-litigated or silently implemented. Documentation only; no code.

## Scope

### In scope

- Create `docs/runtime-governance-open-questions.md` covering exactly three tensions:
  1. **Requirement vs Change** — whether AIEF conflates problem space (requirement/intent/need) and solution space (change/implementation/evidence) by embedding normalized requirements inside Enrichment Changes.
  2. **Tasks vs Gates** — whether development/verification tasks and human approval gates should be distinct concepts, given they share one checkbox mechanism today.
  3. **Execution Identity** — whether AIEF needs to record what composed the work (assistant, model, profile, standards, skills, timestamp, prompt hash/snapshot), distinguishing procedural evidence (today) from a composition record (open question) from strong attestation (explicitly out of scope).
- For each tension: what the current model gets right, what would falsify it, which hypotheses require validation (H1–H6), and what is deliberately not proposed.
- Closing summary table: open question / risk if ignored / evidence required / decision recommended now / decision deferred to AIEF 1.x.
- This Change's own artifacts.

### Out of scope

- Any code, CLI, or test change.
- Introducing `requirement`, `gate`, or `execution identity` as implementation concepts — they exist only as documented questions.
- Modifying `tasks.md` format, `aief enrich` behavior, or any existing document.
- Moving or reorganizing files.
- Deciding any of the three questions — per ADR-008, decisions arrive later as ADRs backed by the evidence each question's table row demands.

## Success Criteria

- `docs/runtime-governance-open-questions.md` exists, covers only the three tensions, is explicit about which hypotheses require validation, and ends with the required five-column table.
- The document maintains the ADR-008 posture throughout: no implementation authorized; the cheapest experiment is named before any structure (manual convention before tooling).
- No executable file changed; `aief verify` PASS; no other document modified.
