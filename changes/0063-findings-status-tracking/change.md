# Change

## ID

`0063-findings-status-tracking`

## Type

General

## Objective

Standardize how an Analysis Change's findings are tracked to resolution across later Changes.
Today an Analysis Change (`## Type: Analysis`, e.g. `0013-analyze-current-architecture`) records a
`## Findings` list in its `evidence.md` and is then closed — but as Changes 0014, 0015, etc.
resolve individual findings, nothing links back to say which finding is fixed, by which Change, or
what's still open. This Change adds a documented convention — a living **Findings Status** table
at the end of an Analysis Change's `evidence.md`, updated by whichever later Change resolves an
entry — so that traceability survives instead of being reconstructed by memory or grep.

This is convention #9 in the same family as `changes/0035-governance-conventions`: a writing
convention plus a short documentation update, not a new CLI entity, command, or Change Type.

## Scope

### In scope

- A new "9. Findings Status" section in `docs/history/governance-conventions.md` defining: the
  table shape, who writes the initial rows (the Analysis Change itself, before closing), who
  updates a row (the later Change that resolves that finding, as part of *its own* Documentation
  step), and the allowed status values.
- A short pointer in `AGENTS.md` → Evidence Guidance, linking to the full convention (mirrors how
  "Tasks and gates" already links out). Applied identically to `cli/templates/agents/AGENTS.md`,
  the canonical source `AGENTS.md` must stay byte-identical to (Change 0040,
  `cli/tests/agents-canonical.test.js`).
- A worked example added to `changes/0013-analyze-current-architecture/evidence.md`'s existing
  `## Findings` section, retrofitting the convention onto the one Analysis Change this repository
  already has, without inventing history it can't verify.
- This Change's own artifacts (`change.md`, `spec.md`, `tasks.md`, `evidence.md`).

### Out of scope

- Any CLI/runtime change, new command, or verification rule enforcing the table's presence or
  shape. `aief verify`'s evidence classification (placeholder/partial/complete) is unaffected —
  confirmed by reading `cli/src/core/services/change-verifier.js`, which counts only "Pending."
  ratio, not specific headings.
- A new Change Type or Track (e.g. "Audit"). AIEF's vocabulary has exactly one relevant type today
  — Analysis Change (`docs/concepts.md`) — and Type/Track derivation work is frozen per ADR-015
  pending the usability study; this Change does not touch that boundary.
- Retrofitting the convention onto every historical Change — only `0013` gets a worked example,
  as the sole existing Analysis Change.
- Any change to `docs/dogfooding-findings.md` (a different ledger, for framework-level dogfooding
  findings, not per-Change analysis findings).

## Success Criteria

- `docs/history/governance-conventions.md` documents the Findings Status convention with a clear
  table shape, parser-compatibility note (free-form Markdown, ignored by `verify`/`close`, same as
  §7's Architecture Checkpoint), and ownership rule (who updates the row and when).
- `AGENTS.md` → Evidence Guidance links to the new convention in one or two lines, no duplication.
- `changes/0013-analyze-current-architecture/evidence.md` gains a `## Findings Status` table
  reflecting the real, current state of its findings (cross-checked against later Changes'
  evidence, not invented).
- No CLI behavior changes; `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all
  pass.

## Status

Open
