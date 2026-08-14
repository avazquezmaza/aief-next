# Specification

## Goal

`aief verify --strict` gives an opt-in, deterministic completeness check on top of the default
structural verifier, catching objectively unfinished work default `verify` structurally accepts —
with zero change to default `verify`'s behavior.

## Requirements

- `checkStrictCompleteness(change)` returns a `string[]` of objective problems:
  - `<file> contains an unresolved TODO/TBD` for `change.md`/`spec.md`/`tasks.md`, scanning
    outside inline-code spans (backtick-delimited, including a span a Markdown line-wrap carries
    across a newline).
  - `change.md Scope › In scope`/`Out of scope`/`Success Criteria is still the scaffold
    placeholder` when that section exists and its content is exactly `-` or empty.
  - `spec.md Requirements is empty` / `spec.md Acceptance Criteria is empty` when that heading
    exists and its content is exactly `-`, empty, or (Acceptance Criteria only) the bare `- [ ]`
    placeholder.
  - For a Definition Change (`type === "definition"`): `Decisions Required has content but
    Decision (human) records no outcome yet` when `analyzeDefinitionSections()` reports
    `Decisions Required` as known and `Decision (human)` as missing.
  - `unresolved required human decision: <text>` for every unchecked `- [ ] (human) <text>` line
    in `tasks.md`.
- `aief verify --strict` and `aief verify --strict --change <id>` pass `strict: true` through to
  `verifyProject()`/`verifyChange()`, which pass it to `addChangeLines()`, which — only for a
  Change with no missing/empty files — appends one `error`-level `[strict]` line per problem,
  after the existing per-Change judgment line. `report.passed` follows the existing `addLine()`
  contract (any `error` line flips it false).
- Without `--strict`, `checkStrictCompleteness()` is never called and the report is identical to
  before this Change.

## Acceptance Criteria

- [ ] `checkStrictCompleteness()` unit tests cover: untouched generic scaffold (all 5 checks
      fire), a filled-in Change (zero problems), TODO/TBD in each of the three files, a heading
      absent from a scaffold never flagged, TODO/TBD inside a backtick span never flagged, a
      Definition Change with an unresolved vs. an approved `Decision (human)`, and an unchecked
      `(human)` task.
- [ ] `aief verify` (no `--strict`) on an objectively incomplete Change is unaffected — same
      output, same exit code, as before this Change.
- [ ] `aief verify --strict` on the same Change fails, with one `[strict]` line per problem.
- [ ] `aief verify --strict --change <id>` scopes to one Change.
- [ ] `aief verify --strict` passes once placeholder content is filled in.
- [ ] `aief verify --strict` on the real AIEF repository reports only genuine, already-known
      unresolved `(human)` decisions — no false positive from an inline code span.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
