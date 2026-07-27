# Change

## ID

`0050-core3-documentation-architecture`

## Type

Analysis

## Objective

Audit and design a documentation architecture and System Map for AIEF, grounded in the real state of
the repository after Entregas 1–7 of AIEF Core 3.0 (Changes 0043–0049, closed), without losing any
architectural decision, specification, traceability record, evidence, Change history, audit
capability, or technical knowledge currently held in the repository's 382 Markdown files.

**Planning only. Nothing is implemented.** Full SDD planning set: `proposal.md`, `spec.md`,
`design.md`, `tasks.md`, `verification.md`, `evidence.md`. No file is moved, deleted, merged, or
edited outside this Change's own new artifacts. No ADR is proposed — this is a documentation-process
initiative, not a new architectural boundary.

## Scope

### In scope (this Change)

- A complete inventory of every `.md` file in the repository (382 files), classified into exactly
  one of ten primary categories (Entry Point, Conceptual, Operational, Architecture Reference,
  Decision Record, Change Specification, Historical Evidence, Duplicate, Obsolete, Generated/
  Temporary).
- Identification of competing entry points, semantic duplicates, and content stale relative to the
  real, tested state of Entregas 1–7 (confirmed by grep/read inspection, not filename guessing).
- A two-layer target documentation model (Orientation vs. Detail/Evidence).
- A designed (not yet published) `docs/core3-system-map.md` — purpose, workflow diagram, component
  diagram, authority diagram, reading map, glossary, delivery status, one worked Change example.
- A documentation maintenance policy (ownership, status markers, obsolescence review triggers).
- A staged, reversible implementation plan for a *future*, separately-approved Change to actually
  reorganize (move/merge/redirect/archive) documentation — planning only, not executed here.

### Out of scope (this Change)

- Any file move, deletion, merge, edit, or redirect. No code, CLI, output, or exit-code change.
- Review (Entrega 8) implementation.
- Publishing `docs/core3-system-map.md` as a live file — its full designed content is captured inside
  this Change's own `design.md` for human review first.

## Success Criteria

- Every one of the 382 Markdown files is accounted for in the inventory (by count and by category),
  not sampled by filename alone — every classification claim is backed by an actual content read or
  grep-confirmed signal cited in `evidence.md`.
- The audit distinguishes real documentation-volume problems from navigation-hierarchy problems,
  with numbers, not impressions.
- No recommendation proposes deleting a Change's `spec.md`/`design.md`/`tasks.md`/`verification.md`/
  `evidence.md`, or any ADR.
- The System Map design avoids duplicating specs, ADRs, or requirement lists — it summarizes and
  links.
- The three required diagrams (workflow, components, authority) are present as text/Mermaid drafts
  and clearly distinguish Workflow / Verification / Review / Human Approval / Close, and Structural
  vs. Requirement Verification.
- The plan is staged into small, independently reversible steps with an explicit rollback per stage.

## Status

Open.
