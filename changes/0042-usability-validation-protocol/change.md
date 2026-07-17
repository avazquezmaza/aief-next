# Change

## ID

`0042-usability-validation-protocol`

## Type

Analysis

## Objective

Design a **usability validation protocol** that proves — or disproves — that a developer who never participated in Flux Portal can complete a correct change using only the main flow (`INTAKE → CONTEXT → PLAN → IMPLEMENT → VERIFY → CLOSE`) with no prior AIEF training.

**Build evidence first. Propose no solutions. Change no product surface.**

## Guiding principle (recorded)

> AIEF 2.0's success is no longer measured by feature count. It is measured by how easily a new user can complete a correct change using only the main flow. If a user must learn the framework's internal architecture to start, AIEF 2.0 has not met its objective.

## Scope

### In scope

- Participant profile and allowed prior knowledge.
- Three representative scenarios: fix a bug, add a feature, start a migration.
- What the participant receives, may consult, must discover, must decide.
- Where they leave the main flow; which concepts they need; which they never use.
- Objective metrics with exact definitions and measurement methods.
- A per-session observation template and a cross-session consolidation format.
- The falsifiable hypotheses under test.
- The problem taxonomy: discoverability · naming · excess documentation · excess decisions · missing automation · onboarding · other.

### Out of scope

- **Running the study.** This Change delivers the protocol, not results.
- **Any solution.** No problem found is fixed here.
- Modifying Type, Track, onboarding, commands, documentation or templates.
- Implementing Tracks; modifying OpenSpec or SpecBoot.
- Executing any DELETE (ADR-014).

## Deliverables

| # | Deliverable | File |
|---|---|---|
| 1 | Usability validation plan | [protocol.md](protocol.md) |
| 2 | Test scenarios | [scenarios.md](scenarios.md) |
| 3 | Metrics | [metrics.md](metrics.md) |
| 4 | Observation template | [observation-sheet.md](observation-sheet.md) |
| 5 | Results consolidation format | [consolidation.md](consolidation.md) |
| 6 | Hypotheses under test | [hypotheses.md](hypotheses.md) |
| 7 | Independent moderator designation | [moderator.md](moderator.md) |

## Extensions approved 2026-07-17

Added after approval, by project-owner direction:

- **≥ 5 scored participants** across experience levels (≥1 junior, ≥2 mid, ≥1 senior) — experience is a measured variable.
- **Independent moderator charter** ([moderator.md](moderator.md)): independent of AIEF design, Flux Portal, Changes 0036–0042 and the map; may only deliver / measure / apply the hint ladder / record; never suggest, teach, interpret or correct.
- **New metric M-IDLE** — total idle time (cumulative time the participant does nothing because they don't know the next step).
- **New hypothesis H-DISC** (requested as "H7"): a command/concept discovered only via documentation is a discoverability defect.
- **Mandatory closing question** for every participant: *"If you had to do this same task again tomorrow, what would you do differently?"*

## Freeze in force

Per [ADR-015](../../knowledge/decisions.md), the study has priority over the simplification. Frozen until this study's consolidation exists: Candidate DELETEs, Type↔Track, onboarding, new commands, documentation simplification. No AIEF change may be made from an individual observation; redesign begins only after all evidence is consolidated.

## Success Criteria

- The protocol can be executed by a moderator who did not design AIEF, without further instruction.
- Every metric has an unambiguous definition and a ground-truth source.
- Every hypothesis has a pre-stated confirm/refute condition.
- The problem taxonomy is the one the approved direction specified.
- No solution is proposed anywhere in the deliverables.

## Status

Open

Approved 2026-07-17. Extended the same day with the moderator charter, ≥5 experience-spread participants, M-IDLE, H-DISC and the mandatory closing question. Stays **Open** pending its `(review)` gate (an independent moderator confirms it is runnable) and the study run itself.
