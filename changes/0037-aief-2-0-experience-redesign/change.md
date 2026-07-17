# Change

## ID

`0037-aief-2-0-experience-redesign`

## Type

Analysis

## Objective

Redesign AIEF's **experience of use** — not its capabilities — leaning on OpenSpec and SpecBoot without modifying either. Deliver a design study (vision, maps, comparison, conceptual architecture, user flow, Tracks, modular harness, integration rules, roadmap) grounded in the Flux Portal migration as the primary case study.

Guiding principle: **a complex system must feel simple; complexity appears only when needed.**

Design success criterion: a person who never participated in Flux Portal can correctly start a project in **under 15 minutes**.

## Scope

### In scope

- Full audit of the AIEF repository (Phase 1): what works, what nobody used, what duplicates, what belongs to OpenSpec / SpecBoot / AIEF.
- Responsibility map + CORE / OPTIONAL / ADVANCED / EXPERIMENTAL / LEGACY classification.
- Experience redesign (Phase 2): entry point, six-step flow, Tracks, modular harness.
- Documented relationship with OpenSpec and with SpecBoot.
- Two worked examples: the smallest possible change, and Flux Portal.
- Usability metrics and the test that would measure them.
- Incremental roadmap with an evidence gate per stage.
- Deliverables under `docs/aief-2.0/`.

### Out of scope

- **Any implementation.** No new commands, verifiers, automations or parsers.
- Change 0036 — accepted; closed to further work by explicit instruction.
- Initiative, Parent/Child, contract hashes, traceability parser.
- Any modification to OpenSpec or SpecBoot.
- Deleting or altering any existing AIEF component — this Change classifies, it does not remove.
- Resolving the ADR conflicts the study surfaces — they are raised for human decision.

## Success Criteria

- Every claim about the current framework is reproducible from a command recorded in the study.
- Every proposal names the evidence that would unlock it (ADR-008).
- Every conflict with an accepted ADR is flagged, not silently resolved (ADR precedence).
- The study's load-bearing hypothesis names what would refute it.
- Deliverables 1–11 of the brief are addressed and locatable.

## Status

Open.
