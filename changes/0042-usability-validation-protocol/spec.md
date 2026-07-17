# Specification — Usability validation protocol

## Goal

A ready-to-run protocol that produces objective evidence about whether a fresh developer can complete a correct change using only AIEF's main flow — executable by an independent moderator, yielding classified problems and confirmed/refuted hypotheses, and proposing nothing.

## Requirements

- **R1** — Define the participant profile and the exact boundary of allowed prior knowledge.
- **R2** — Provide three representative scenarios (bug, feature, migration), each described in business terms with zero AIEF vocabulary.
- **R3** — Specify what the participant receives, may consult, must discover, and must decide.
- **R4** — Specify how "leaving the main flow" is detected and recorded.
- **R5** — Track which concepts the participant needs and which they never use.
- **R6** — Define objective metrics: time to first Change, time to verify, time to correct close, documents opened, decisions taken, errors, main-flow abandonments, commands discovered spontaneously, commands never found, concepts needing external explanation.
- **R7** — Provide a per-session observation template.
- **R8** — Provide a cross-session consolidation format.
- **R9** — Classify every problem as: discoverability, naming, excess documentation, excess decisions, missing automation, onboarding, or other.
- **R10** — List the falsifiable hypotheses, each with a pre-stated confirm/refute condition.
- **R11** — Propose no solutions.
- **R12** — Designate an independent moderator with an explicit charter (independence + strict passive function).
- **R13** — At least five scored participants across experience levels.
- **R14** — Measure total idle time (M-IDLE).
- **R15** — Test the discoverability hypothesis H-DISC (doc-sourced discovery = defect).
- **R16** — A mandatory closing question for every participant.

## Acceptance Criteria

- [x] Participant profile + allowed-knowledge boundary defined, with a disqualification check (protocol §2–3, 7).
- [x] Three scenarios with verbatim business-language TASK.md and no AIEF jargon (scenarios A/B/C).
- [x] Each scenario states the correct main-flow path, expected artifact count, abandonment watch points, and concept exposure.
- [x] Received / may-consult / must-discover / must-decide all specified (protocol §4–6).
- [x] Main-flow abandonment is defined and has a metric (M-ABANDON) and a hint ladder (protocol §6).
- [x] Concepts-needed vs concepts-never-used are metrics (M-CON-USED / M-CON-UNUSED) with an inventory.
- [x] All eleven required metrics defined with method and, where applicable, target (metrics.md).
- [x] Per-session observation sheet exists and is copy-per-participant (observation-sheet.md).
- [x] Cross-session consolidation format exists (consolidation.md).
- [x] The seven-class problem taxonomy is applied, with a one-primary-class rule (metrics.md, observation-sheet.md).
- [x] Hypotheses listed with confirm/refute conditions decided in advance (hypotheses.md).
- [x] No deliverable proposes a solution; the word "therefore we should" is absent from the consolidation.
- [x] Independent moderator charter exists, with the four independence criteria and the four-verb function (moderator.md).
- [x] ≥ 5 scored participants across experience levels; experience is a measured variable (protocol §2, scenarios §5, consolidation §1b).
- [x] M-IDLE defined (metrics.md) and captured on the observation sheet (idle log) and consolidated.
- [x] H-DISC stated with confirm/refute (hypotheses.md) and a consolidation row.
- [x] Mandatory Q7 "what would you do differently tomorrow?" on the observation sheet and consolidation.
- [x] No product surface (Type, Track, onboarding, commands, docs, templates) modified.
- [ ] (human) Approve the protocol before recruiting participants.
- [ ] (review) A moderator independent of this protocol's author confirms it is runnable as written.
