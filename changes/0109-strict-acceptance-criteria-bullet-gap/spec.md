# Specification

## Goal

`aief verify --strict` flags an untouched Acceptance Criteria placeholder regardless of which
CommonMark bullet character (`-`, `*`, `+`) it uses.

## Requirements

- R1: `checkStrictCompleteness()` MUST treat `spec.md`'s Acceptance Criteria section as an
  untouched placeholder when it holds exactly one unchecked, unlabeled box — `-`, `*` or `+`
  followed by `[ ]` and nothing else.
- R2: Real Acceptance Criteria content (a labeled checkbox item, multiple items, or a checked
  box) MUST NOT be flagged, regardless of bullet character — no change to the existing positive
  case.

## Acceptance Criteria

- [x] `checkStrictCompleteness()` reports "spec.md Acceptance Criteria is empty" for a
      section holding only `* [ ]`.
- [x] Same for `+ [ ]`.
- [x] The existing `- [ ]` case and the existing filled-in (no-problem) case are unaffected.
