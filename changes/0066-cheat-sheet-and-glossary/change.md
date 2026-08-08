# Change

## ID

`0066-cheat-sheet-and-glossary`

## Type

General

## Objective

Reduce vocabulary friction for a first-time user. `docs/concepts.md` already documents every term
correctly, but it is a 187-line prose reference — reading it end to end is the recommended path
today, and there is no faster way to look up "what does Gate mean" mid-flow. Add a single-page,
scannable cheat sheet (one line per term, plus the canonical command sequence) that sits *beside*
`concepts.md`, not instead of it: the cheat sheet is the lookup table; `concepts.md` stays the
place to actually learn a term.

## Scope

### In scope

- New `docs/cheat-sheet.md`: one table (Term → one-line meaning → link to its `concepts.md`
  section) covering every term `concepts.md` defines (Change, Change Manifest, Track/Stage/Gate,
  SDD Provider, Requirement Source, Skill, Hook/Harness, Loop, Graph, Verification Rule, Evidence,
  AGENTS.md), plus a second short block: the canonical command sequence (`bootstrap → analyze →
  new-change`/`enrich → prompt → implement → verify → close`) with one clause per step, no prose.
- Cross-link: `docs/cheat-sheet.md` points to `concepts.md` (and `workflow.md` for the command
  sequence) for depth; `docs/concepts.md`'s intro and `README.md`'s documentation table
  (`docs/concepts.md` row) both gain a one-line pointer to the new cheat sheet.

### Out of scope

- Rewriting or shortening `docs/concepts.md` — it is not being replaced, and no content is removed
  from it. (Per the ADR-022 thaw, "documentation simplification" is permitted, but nothing here
  requires merging or deleting an existing doc — this is purely additive, the same shape as Change
  0065.)
- Any CLI/runtime change, new command, or new flag.
- A glossary of terms `concepts.md` does not already define (e.g. no new concept is introduced by
  this Change).

## Success Criteria

- A user can find any of the 12 terms above and its one-line meaning in `docs/cheat-sheet.md`
  without scrolling past unrelated content, and follow one link to read the full definition in
  `concepts.md` if needed.
- `docs/concepts.md`'s own content is byte-identical except for the added pointer line.
- No file under `cli/src/` is touched.

## Status

Closed (2026-08-08)
