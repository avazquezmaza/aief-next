# History

Engineering history — proposals, studies, findings and roadmaps produced while building AIEF.
None of this is required reading to use AIEF. It exists for provenance and for anyone curious how a
decision came about.

The current product is documented starting from the [README](../../README.md) and
[docs/](../). The current architecture decisions are logged, unabridged, in
[knowledge/decisions.md](../../knowledge/decisions.md) — that ADR log is not "historical," it is
still authoritative; it is simply not part of the learning path.

## What's here

- **[aief-2.0-experience-redesign/](aief-2.0-experience-redesign/)** — a UX simplification study
  ("Experience Redesign"), proposed but never accepted. Frozen by ADR-015 pending a usability
  validation study. Not related to the AIEF Core 3.0 subsystems described in the current docs —
  the "2.0" in its name is a historical naming collision, not a version relationship.
- **[roadmap-pre-core3.md](roadmap-pre-core3.md)**, **[ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md)**,
  **[AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md)** — forward-looking roadmaps written before
  Core 3.0 existed. Superseded by the actual Change history in [changes/](../../changes/).
- **[VALIDATION-SUMMARY.md](VALIDATION-SUMMARY.md)** — results from AIEF's first two real-project
  validations (one greenfield, one brownfield), predating Core 3.0.
- **[dogfooding-findings.md](dogfooding-findings.md)** — findings ledger from using AIEF on a real
  migration project; several entries fed directly into accepted ADRs and Changes.
- **[governance-conventions.md](governance-conventions.md)** — writing conventions (task labels
  like `(human)`/`(review)`, deferred-work vocabulary) that a real project adopted by hand before
  any of them became CLI behavior. Still a valid convention to use; not CLI-enforced.
- **[runtime-governance-open-questions.md](runtime-governance-open-questions.md)** — open design
  questions raised during dogfooding. Some were later answered by ADR-016 and ADR-021; recorded
  here as raised, not updated in place.
- **[external-harness-patterns.md](external-harness-patterns.md)** — patterns observed from an
  external CI/review harness, considered as input to the Verification Engine design.
- **[proposals/](proposals/)** — early proposals that predate or duplicate what
  [knowledge/decisions.md](../../knowledge/decisions.md) now records as accepted ADRs.

## Browsing further back

Every unit of work AIEF has ever done is a Change under [changes/](../../changes/), each with its
own `proposal.md`/`spec.md`/`tasks.md`/`evidence.md` and (for Core 3.0) `design.md`/`verification.md`.
That directory is the project's complete, unedited history — nothing here duplicates it.
