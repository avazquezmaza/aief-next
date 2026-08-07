# Specification

## Goal

An Analysis Change's findings are traceable to resolution over time: anyone reading that Change's
`evidence.md` later can see, without grepping every subsequent Change, which findings are fixed,
by which Change, and which are still open — without AIEF gaining a new CLI entity, command, or
enforced structure.

## Requirements

- `docs/history/governance-conventions.md` gains a numbered "9. Findings Status" section, in the
  same style as the existing 8, covering:
  - **Shape**: a Markdown table at the end of an Analysis Change's `evidence.md`, appended after
    the standard `## Findings` section (not replacing it), titled `## Findings Status`. Columns:
    `Finding | Status | Resolved By | Notes`.
  - **Status vocabulary**: `Open`, `In Progress`, `Resolved`, `Not Applicable`, `Deferred` — chosen
    to reuse the existing §2 deferred-work vocabulary (`Deferred`) rather than invent a parallel
    one.
  - **Who writes it**: the Analysis Change author adds the table (rows in `Open` status, one row
    per finding) before that Change is closed — it derives directly from the `## Findings` section
    already required.
  - **Who updates it**: whichever *later* Change resolves a specific finding updates that finding's
    row (status, `Resolved By` = the resolving Change's id, a one-line note) as part of *that later
    Change's own* Documentation step (AGENTS.md → Document) — never by reopening or re-closing the
    Analysis Change itself.
  - **Parser compatibility**: free-form Markdown table, ignored by `aief verify`/`aief close`
    exactly like §7's Architecture Checkpoint — confirmed against
    `cli/src/core/services/change-verifier.js`, which classifies evidence only by "Pending." ratio.
- `AGENTS.md` → Evidence Guidance gains one short paragraph pointing to the convention, mirroring
  how "Tasks and gates" already links to the same document — no duplication of the table shape or
  rules themselves. The identical paragraph lands in `cli/templates/agents/AGENTS.md` (the
  canonical source, Change 0040) so `cli/tests/agents-canonical.test.js`'s byte-identity check
  keeps passing.
- `changes/0013-analyze-current-architecture/evidence.md` gains a `## Findings Status` table
  covering its five real findings, statuses derived only from what later Changes' own `evidence.md`
  already state (0014, 0015, and a check against the current `adapters/openspec/README.md`) — no
  invented resolution.

## Acceptance Criteria

- [ ] `docs/history/governance-conventions.md` § "9. Findings Status" exists with table shape,
      status vocabulary, write/update ownership, and a parser-compatibility note.
- [ ] `docs/history/governance-conventions.md` § "Parser compatibility" (the closing section) lists
      the new `## Findings Status` table alongside the other free-form, ignored sections.
- [ ] `AGENTS.md` and `cli/templates/agents/AGENTS.md` → Evidence Guidance both link to the
      convention in 1-2 lines, byte-identical to each other.
- [ ] `changes/0013-analyze-current-architecture/evidence.md` has a `## Findings Status` table with
      one row per finding from its existing `## Findings` section, each status backed by a citation
      to the resolving Change's own evidence (traceable, not asserted).
- [ ] No CLI/runtime file under `cli/src/` is modified.
- [ ] Root `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.

## Constraints

- No new CLI command, Change Type, Track, or verification rule. No parser change.
- Does not touch Type/Track derivation (frozen per ADR-015 pending the usability study).
- Does not modify `docs/dogfooding-findings.md` (a separate, framework-level ledger).
- Backward compatible: an Analysis Change without a `## Findings Status` table is unaffected by
  `verify`/`close`, exactly as today.

## Assumptions

- "Análisis/Auditoría" in the original request maps to AIEF's existing single vocabulary term,
  **Analysis Change** (`docs/concepts.md`) — no separate "Audit" Change Type is introduced.
- `0013-analyze-current-architecture` is the only existing Analysis Change in this repository, so
  it is the only one retrofitted with a worked example.
