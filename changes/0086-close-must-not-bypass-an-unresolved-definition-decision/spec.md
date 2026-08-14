# Specification

## Goal

`aief close` cannot mark a Definition Change Closed while a `Decisions Required` entry has no
recorded `Decision (human)` outcome — regardless of whether its `(human)` approval tasks are
checked — closing a real governance bypass found by pre-merge review, with the smallest change
that reuses existing primitives.

## Requirements

- `definitionDecisionOutcomeProblem(change)` (exported from `change-verifier.js`): for a
  `type === "definition"` Change, returns the problem string when
  `analyzeDefinitionSections(changeMd)` reports `Decisions Required` as known (not in `missing`)
  and `Decision (human)` as missing (still the placeholder) — `null` otherwise, including for
  every non-Definition Change type.
- `checkStrictCompleteness()` calls this shared function instead of duplicating the check —
  behavior byte-identical to before this Change.
- `checkChangeReadiness()` (the function `aief close`'s readiness check and its "resolve the items
  above" listing both use) always includes this problem for a Definition Change when present —
  not gated on any flag.
- No change to `verifyProject()`/`verifyChange()`/`addChangeLines()` (default `aief verify`
  output) — confirmed `checkChangeReadiness()` has exactly one caller (`close()` in `cli.js`).

## Acceptance Criteria

- [ ] Case 1 (decision missing, approval unchecked): `close` blocked — unchanged.
- [ ] Case 2 (decision missing, approval **checked**): `close` blocked — **the fix**.
- [ ] Case 3 (decision present, approval unchecked): `close` blocked — unchanged.
- [ ] Case 4 (decision present, approval checked): `close` succeeds — unchanged.
- [ ] A non-Definition Change with the same shape (Decisions Required text + a `(human)` task) is
      unaffected by this Change (regression guard — `definitionDecisionOutcomeProblem` is a no-op
      for it, and always was).
- [ ] `checkStrictCompleteness()`'s existing tests (Change 0083) still pass unmodified — proving
      the extraction preserved behavior exactly.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
