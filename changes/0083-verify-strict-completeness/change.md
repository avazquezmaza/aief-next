# Change

## ID

`0083-verify-strict-completeness`

## Type

General

## Objective

Add an optional `aief verify --strict` that detects objective, deterministic incompleteness
(unresolved TODO/TBD, untouched scaffold placeholders, empty Requirements/Acceptance Criteria, a
Definition decision recorded with no outcome, an unresolved required human decision) on top of
default `aief verify`'s structural checks — without changing default `aief verify`'s behavior or
exit semantics in any way, and without any subjective quality scoring.

## Inventory of what already exists (ADR-013 accounting)

- `verifyProject()`/`verifyChange()`/`addChangeLines()` (`change-verifier.js`) already own every
  rule `aief verify` applies; this Change adds one new, purely additive function
  (`checkStrictCompleteness()`) called only when a new `strict` parameter (default `false`) is
  `true` — the exact same "additive, absent by default" shape `checkEnrichmentChange()` already
  established for Enrichment-specific rules.
- `analyzeDefinitionSections()` (Change 0081) is reused directly for the "Definition decision with
  no outcome" check — no second Definition-content reader.
- The `(human)` task-marker convention (Change 0079) is reused directly for the "unresolved
  required human decision" check — no new marker invented.
- `KNOWN_FLAGS.verify` already exists (`change`, `requirements`); this Change adds one flag,
  `strict`, the same additive-flag pattern `--requirements` (Change 0049) already established —
  not a new command.
- ADR-013: no capability is removed, but this Change replaces the previous state — where an
  objectively empty/placeholder Change looked identical to a genuinely-worked one to `aief
  verify` — with an explicit, opt-in way to tell them apart. Default `aief verify` is provably
  unchanged (see spec.md's acceptance criteria and the regression test asserting byte-for-byte
  absence of any `[strict]` line without the flag).

## Scope

### In scope

- `checkStrictCompleteness(change)` (`change-verifier.js`): TODO/TBD (excluding inline code
  spans), untouched `change.md` Scope/Success Criteria placeholders, empty `spec.md`
  Requirements/Acceptance Criteria (only when those headings exist in the scaffold), a Definition
  Change's `Decisions Required` with no `Decision (human)` outcome, unresolved `(human)` tasks.
- `aief verify --strict` / `aief verify --strict --change <id>`: strict problems render as
  additional `[strict]`-prefixed error lines, on top of (never instead of) the existing judgment
  line for that Change.
- `aief help verify` documents `--strict`.

### Out of scope

- Any change to default `aief verify` (no `--strict`) output or exit code.
- Subjective quality scoring, style/readability judgments, or anything requiring semantic
  understanding rather than a literal, deterministic condition.
- `aief close`'s own readiness rules (`checkChangeReadiness()`) — untouched; `--strict` is a
  verify-only, opt-in, informational-until-you-ask-for-it check.

## Success Criteria

- Default `aief verify` (no `--strict`) is byte-for-byte unaffected by an objectively incomplete
  Change that default verify already accepted.
- `aief verify --strict` fails (non-zero exit, `Result: FAIL`) on an untouched scaffold that
  default `aief verify` accepts.
- Every strict check is objective (a literal file condition), never a heuristic score.
- Run against AIEF's own repository, `--strict` truthfully reports pre-existing, real unresolved
  `(human)` decisions (Changes 0036/0037/0038/0039/0042, already known-frozen pending the AIEF 2.0
  usability study) — not manufactured findings, not false positives from inline code spans
  documenting vocabulary tokens.

## Status

Closed (2026-08-14)
