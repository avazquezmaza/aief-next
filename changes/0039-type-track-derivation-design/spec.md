# Specification

## Goal

AIEF has an approved, evidence-checked design for introducing Track without disturbing Type's governance semantics — implementable later, by someone else, without re-deriving any of it.

## Requirements

- **R1** — Track and Type coexist as distinct dimensions. Track is the user-facing entry; Type stays internal.
- **R2** — Default derivation: `Basic → General`, `Standard → General`, `Migration → Analysis`.
- **R3** — Enrichment is never derived automatically; it must be declared explicitly.
- **R4** — Any Enrichment Change keeps every current human gate, on every Track.
- **R5** — Track cannot remove, weaken or hide an existing gate.
- **R6** — An explicit override exists (`Track: Standard` + `Type: Enrichment`).
- **R7** — If Type is absent, the CLI may derive it from Track.
- **R8** — If both are present and incoherent, fail loudly.
- **R9** — The new user is asked exactly one mandatory question.
- **R10** — Design covers: compatibility, metadata migration, `changeType()`, prompt composition, Enrichment gates, valid combinations, invalid cases, tests, reversibility.

## Acceptance Criteria

- [x] Derivation table matches R2 exactly (design §2).
- [x] Enrichment is unreachable by derivation from any Track (§2, test 4).
- [x] A declared Type always wins over derivation (§3) — the mechanism that makes R5 structural rather than aspirational.
- [x] Valid-combination table covers all Track × Type pairs plus both legacy populations (§3).
- [x] Invalid cases are enumerated with behavior per case (§4).
- [x] "Incompatible" is defined as **incoherence**, not semantics, and every rule protects a gate or a parser (§4).
- [x] One question: the human declares Track; the CLI writes Type (§2).
- [x] Compatibility: all 40 Changes here and 13 in the case study resolve unchanged (§8).
- [x] Metadata migration: none required, with the reason (§9).
- [x] `changeType()` impact names every caller to migrate (§5).
- [x] Prompt composition impact stated, including what is deliberately not injected (§6).
- [x] Enrichment gates enumerated one by one, not asserted (§7).
- [x] Tests listed, including the zero-drift regression across 53 real Changes (§11).
- [x] Reversibility: code revert only, no data to undo (§10).
- [x] Rules validated against the real corpus — two were corrected as a result (§1.1, §4).
- [x] Nothing implemented.
- [ ] (human) Approve the design, or amend it.
- [ ] (human) Confirm I4 stays non-fatal, given it would otherwise break Change 0036.
- [ ] (review) Independent review before any implementation.
