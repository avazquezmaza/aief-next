# Change

## ID

`0171-close-rewrites-status-declarations-instead-of-appending`

## Type

Fix

## Objective

`aief close` marks a Change Closed by patching `change.md` with a regex that does not match
the parser reading the result. Depending on the file's format it appends a contradictory second
`Status` declaration, rewrites a valid file into an invalid one, or deletes the heading that
follows a valueless `## Status` — and in that last case the Change still reads as closed, so the
loss passes verification. This Change makes the write a transformation the parser validates.

## Scope

### In scope

- A pure `markClosedContent(md, date)` in the domain layer that rewrites every accepted status
  declaration in place.
- `markClosed()` verifying the candidate with `isClosedContent()` before writing, and writing
  nothing when that check fails.
- Rewording `statusProblem()` so it no longer recommends `aief close` for an unreadable status.
- Invariant tests over all accepted formats, plus an end-to-end `close --yes` test.

### Out of scope

- F2: the approval guard lets a `- [x] (human)` line be invented.
- F3: evidence placeholder ratio.
- F4.
- Any change to `parseChangeStatus()`'s accepted tokens or to the `unknown` semantics.

## Success Criteria

- Closing a Change whose status is inline, an H2 or an H3 leaves exactly one status declaration,
  reading `closed`.
- No accepted format loses content; the heading after a valueless `## Status` survives.
- `close` never writes `change.md` unless the result verifies as closed.
- The unreadable-status message no longer points at a command that cannot fix it.
- Full suite with no new failures (the pre-existing `cli/tests/diagrams.test.js` ImageMagick
  failure aside), lint, `git diff --check` and `aief verify --strict` pass.

## Status

Closed (2026-11-17)
