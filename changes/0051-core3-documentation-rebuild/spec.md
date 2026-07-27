# Specification — AIEF Core 3.0 documentation rebuild and repository-wide Markdown cleanup

## Goal

A newcomer arriving at the repository for the public Core 3.0 release finds a small, professional,
accurate documentation set describing the product as it exists today — not the repository's
development history, not a discarded prior architecture — and every remaining Markdown file in the
repository has an obvious reason to exist.

## Requirements

### README and product framing

- **R1 — README.md is the public product landing page.** It states what AIEF is, the problem it
  solves, how it works, install, use, extend, documentation index, ecosystem relationship,
  contributing, status, license — and contains no Change numbers, no ADR narrative, and no
  repository-development history in its body.
- **R2 — README.md contains the mandatory high-level Mermaid diagram** of the product workflow
  (`aief doctor` → `init`/`adopt` → `new-change`/`enrich` → `prompt` → `verify` → `close` →
  `status --next`).

### Canonical documentation set

- **R3 — Canonical product documentation is limited to the approved current set**: `README.md`,
  `docs/getting-started.md`, `docs/concepts.md`, `docs/workflow.md`, `docs/architecture.md`,
  `docs/cli.md`, `docs/configuration.md`, `docs/examples.md`, `docs/maintainer.md`. No document
  outside this set is presented as part of the primary onboarding path.
- **R4 — Documentation is product-first and written in English.** No canonical document requires
  knowledge of a prior documentation architecture, a discarded plan, or repository archaeology to
  be understood.
- **R5 — `docs/architecture.md` describes the current implemented architecture** (CLI dispatcher /
  domain models / services / registries: Workflow Engine, SDD Provider, Skills Runtime, Hooks
  Runtime, Verification Engine) without an Entrega-by-Entrega or Change-by-Change narrative.
- **R6 — `docs/workflow.md` explains the complete Core 3.0 lifecycle**: the three levels, tracks and
  gates, Requirement Sources, Skills Runtime, Hooks Runtime, and Verification (structural and
  requirement-based).
- **R7 — `docs/cli.md` reflects every implemented command and flag**, cross-checked against
  `cli.js`'s actual `parseArgs()`/`main()` dispatch — no documented flag that does not exist in code,
  no implemented flag left undocumented.

### Historical separation

- **R8 — Historical and superseded material is clearly separated from the main learning path**,
  consolidated under one location (`docs/history/`), each relocated file's internal links corrected
  for its new depth, and indexed by `docs/history/README.md`.

### Cleanup

- **R9 — Obsolete and duplicate Markdown was removed where safe** — a file was deleted only when it
  was not canonical product documentation, not required by a tool or workflow, not a standard
  open-source file, not an important historical/engineering record, its content was absorbed
  elsewhere or no longer valid, and no live reference depended on it. Every deletion is recorded
  with its classification and reference checks in `evidence.md`.
- **R10 — A file named as a dependency by an accepted ADR is not deleted** without first amending or
  superseding that ADR.

### Links and verification

- **R11 — Active product documentation (everything outside `changes/*`) has no broken internal
  Markdown links.** Links broken only inside `changes/*` (immutable historical Change records
  referencing since-relocated or since-deleted files) are pre-existing and out of this Change's
  scope.
- **R12 — The CLI test suite and the example test suite both pass**, and `aief doctor`/`aief status`
  run without error, after every documentation change and deletion in this Change.

## Acceptance Criteria

- [x] R1–R2 — README rewritten; Mermaid workflow diagram present (`README.md:43`).
- [x] R3 — exactly the nine approved documents exist under the canonical set; no tenth document
      added.
- [x] R4 — every canonical document reviewed; English; no discarded-architecture references.
- [x] R5 — `docs/architecture.md` describes current layers only.
- [x] R6 — `docs/workflow.md` covers tracks/gates/Requirement Sources/Skills/Hooks/Verification.
- [x] R7 — `docs/cli.md` cross-checked against `cli.js`.
- [x] R8 — `docs/history/` holds all relocated material with corrected links and an index.
- [x] R9 — every deletion classified and reference-checked in `evidence.md`.
- [x] R10 — `templates/specboot/` retained after an ADR-reference check found it protected.
- [x] R11 — repository-wide link scan run; zero broken links outside `changes/*`.
- [x] R12 — `cli/` test suite 534/534; `examples/todo-app` test suite 3/3; `aief doctor`/
      `aief status` run clean.
