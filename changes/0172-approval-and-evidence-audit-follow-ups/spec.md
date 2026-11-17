# Specification

## Goal

An approval line cannot enter a Change already resolved without a person noticing, whichever
assistant wrote it; evidence completeness follows a rule the owner chose; and 0171's open
references are resolved.

## Requirements

- R1 (F2): `aief-approval-guard.mjs` refuses an Edit/Write/MultiEdit (and Gemini `write_file` /
  `replace`) whose result contains a `(human)`/`(review)` line in state `[x]` or `[-]` that was not
  already in that state before the edit. This covers a new line, a new file, and an existing
  unchecked line rewritten with different text. Adding an unchecked line stays allowed; an edit
  that leaves an already-resolved line untouched stays allowed.
- R2 (F2): the refusal message names the new resolved line(s) the same way it names checked or
  removed ones today.
- R3 (F2): the shipped guard and its tests stay dependency-free; existing guard tests keep passing.
- R4 (F2b): implement the option chosen in decision D1 (see tasks.md), with tests. D1 resolved to
  (a): the `verify --strict` git-history notice; the Continue rule (b) was dropped.
- R5 (F3): implement the rule chosen in decision D2, with tests; if D2 keeps the current rule,
  document the trade-off where `classifyEvidence()` is described and add a test that pins it.
- R6 (F4): record the outcome of decision D3 in 0171 and here.
- R7: 0171's `change.md`, `spec.md` and `evidence.md` replace the bare `F3`/`F4` references with a
  pointer to this Change, without altering anything else in 0171.

## Acceptance Criteria

- [x] R1–R3 implemented, with tests for: new resolved line, new file with a resolved criterion,
      rewritten unchecked line, new unchecked line (allowed), untouched resolved line (allowed).
- [x] R4–R7 implemented according to the recorded decisions.
- [x] `npm test`, `npm run lint`, `git diff --check` and `aief verify --strict --change 0172` pass.
- [x] (human) Owner reviews the diff before merge.
