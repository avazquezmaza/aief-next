# Specification

## Goal

A user mid-flow (e.g. reading a CLI message that says "Gate" or "SDD Provider") can look the term
up in one scannable page and get a correct one-line answer plus a link to the full definition —
without re-reading `docs/concepts.md` from the top.

## Requirements

- `docs/cheat-sheet.md` exists and contains:
  - A glossary table with exactly one row per term `docs/concepts.md` currently defines as a
    `##` heading: Change, Change Manifest, Workflow Engine (Track/Stage/Gate), SDD Provider,
    Requirement Source / Normalized Requirement, Skill, Hook / Harness, Loop, Graph, Smart
    next-Change selection, Verification Rule / Requirement Verification, Evidence, AGENTS.md and
    the instruction hierarchy. Each row: term, one line (≤ 20 words), link to
    `concepts.md#<anchor>`.
  - A "Canonical flow" block: the command sequence `bootstrap → analyze → new-change`/`enrich →
    prompt → implement → verify → close`, one short clause per step (what it does, not how),
    linking to `workflow.md` for the full picture.
- `docs/concepts.md`'s opening paragraph gains exactly one added sentence pointing to the new
  cheat sheet for quick lookup; no other line in the file changes.
- `README.md`'s documentation table gains the cheat sheet as a row (or as a `cheat sheet` link
  appended to the existing Concepts row) — whichever keeps the table's existing structure and
  ordering intact.
- No CLI/runtime behavior changes — this Change is documentation-only.

## Acceptance Criteria

- [x] `docs/cheat-sheet.md` created, with a glossary table (13 rows: 12 concept terms +
      instruction hierarchy) and a "Canonical flow" block, per the requirements above.
- [x] Every glossary row's link (`concepts.md#<anchor>`) resolves to the correct existing heading
      (verified by matching against `docs/concepts.md`'s actual `##` headings — no invented
      anchors).
- [x] `docs/concepts.md` has exactly one added sentence; `git diff --stat` shows no other line
      changed in that file.
- [x] `README.md`'s documentation table references the new cheat sheet.
- [x] No file under `cli/src/` is touched.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
