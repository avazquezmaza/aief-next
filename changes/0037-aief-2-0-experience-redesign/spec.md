# Specification

## Goal

AIEF has a documented, evidence-grounded design for its **experience of use**, built from the Flux Portal migration, that a human can accept, reject or amend — and which authorizes nothing by itself.

## Requirements

- **R1** — Audit the AIEF repository and identify: what works, what nobody used during Flux Portal, what was discovered too late, what duplicates, what OpenSpec already solves, what SpecBoot already solves, what genuinely belongs to AIEF.
- **R2** — Produce a responsibility map: responsibility, consumer, moment of use, dependency, complexity, frequency of use per component.
- **R3** — Classify every component as CORE / OPTIONAL / ADVANCED / EXPERIMENTAL / LEGACY. Propose no deletions.
- **R4** — Design the experience from the newcomer's position, assuming no knowledge of ADR, OpenSpec, SpecBoot, governance, dogfooding or Flux Portal.
- **R5** — Express the main flow as INTAKE → CONTEXT → PLAN → IMPLEMENT → VERIFY → CLOSE, with everything else appearing progressively.
- **R6** — Design three usage profiles (Basic / Standard / Migration), each stating minimum artifacts and when ADR, OpenSpec, rollback, cutover and parity appear.
- **R7** — Design a modular harness of eleven pieces, each answering exactly one question, with no repetition between pieces.
- **R8** — Document when OpenSpec must be used, without modifying it and without ever duplicating a contract in AIEF.
- **R9** — Document how AIEF leans on SpecBoot, without modifying it. SpecBoot creates, AIEF guides, OpenSpec validates.
- **R10** — Provide the smallest possible example and a complete example using Flux Portal.
- **R11** — Define usability measures: time to start, mandatory documents, decisions required of a new user, flow clarity, points where documentation must be consulted.
- **R12** — Provide an incremental roadmap.
- **R13** — Implement nothing (no commands, verifiers, automations, parsers; no changes to OpenSpec or SpecBoot; no Initiative, Parent/Child, contract hashes or traceability parser).

## Acceptance Criteria

- [x] Every quantitative claim about the current framework carries a reproducible command (R1).
- [x] The audit is grounded in the case-study repository on disk, not only in prior AIEF documents (R1).
- [x] Responsibility map covers all six required columns (R2).
- [x] Every component carries exactly one classification; no deletion is proposed (R3).
- [x] The design states the newcomer's assumed knowledge and never requires more (R4).
- [x] The six-step flow is mapped onto today's commands and onto ADR-011's levels (R5).
- [x] All three profiles state minimum artifacts and the appearance of ADR / OpenSpec / rollback / cutover / parity (R6).
- [x] Eleven harness pieces, one question each, non-overlapping (R7).
- [x] The OpenSpec rule prohibits duplication and defines `none` as an explicit answer (R8).
- [x] The SpecBoot rule assigns creation to SpecBoot and prohibits re-implementation (R9).
- [x] Both examples exist and use the same entry point and flow (R10).
- [x] Usability metrics are defined with a stated method, and unmeasured numbers are labelled as derived (R11).
- [x] Every roadmap stage names its evidence gate (R12).
- [x] No code, command, verifier or automation was added; OpenSpec and SpecBoot untouched (R13).
- [x] Every conflict with an accepted ADR is flagged for human decision rather than resolved.
- [ ] (human) A human accepts, rejects or amends the study and decides the six open questions in `11-roadmap.md`.
