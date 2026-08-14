# Specification

## Goal

`analyzeDefinitionSections(changeMd)` gives a deterministic Known/Missing/Ambiguous/Decision
required/Human approval required/Deferred classification of a Definition Change's own content,
surfaced through `aief status --change <id>` and explained to assistants through `aief prompt` —
with zero new command, zero new persistence, zero overlap with the existing Jira/manual
Enrichment.

## Requirements

- `DEFINITION_SECTIONS` lists the 18 section headings `definitionChangeFiles()` (Change 0079)
  writes, in order.
- `analyzeDefinitionSections(changeMd)` returns `{ known, missing, deferred, ambiguous,
  decisionRequired, humanApprovalRequired }`.
  - A section is `missing` if its content is the literal placeholder `-`, empty, or — for
    `Decision (human)` specifically — still the scaffold's "Pending human approval..." sentence.
    Otherwise it is `known`.
  - A bullet line (`- ...`) ending in `(deferred)` / `(ambiguous)` / `(decision required)` /
    `(human)` is classified into the matching bucket; a line with no such marker is never
    classified into any of the four. At most one marker classification per line (first match
    wins).
  - CRLF-tolerant, matching `changeTypeFromContent()`'s own discipline.
- `aief status --change <id>`: when the resolved Change's `type === "definition"`, print a
  "Definition readiness" block after the existing Harness block (if present) and before "Next:" —
  `known.length/DEFINITION_SECTIONS.length` sections filled in, then Missing/Decision
  required/Ambiguous/Human approval required/Deferred lines, each present only when non-empty.
  Absent entirely for every other Change type (byte-identical output to before this Change).
- `aief prompt` on a Definition Change documents the four markers and states that `aief status`
  derives its readiness view only from them — no prose inference.
- No write anywhere in this Change: `analyzeDefinitionSections()` and `printDefinitionReadiness()`
  are pure/read-only; `aief enrich`, `knowledge/decisions.md`, and Change 0079's `(human)` task
  gate are all untouched.

## Acceptance Criteria

- [ ] A fresh Definition Change: `status --change` reports 0/18 known, all 18 in Missing.
- [ ] Filling in a section moves it from Missing to Known; a real `Decision (human)` entry (no
      longer the pending sentence) counts as Known.
- [ ] Each of the four line markers is classified correctly in isolation; an unmarked line is
      classified into none of them (explicit negative test).
- [ ] `status --change` on a non-Definition Change never prints "Definition readiness".
- [ ] `aief prompt` on a Definition Change mentions all four markers and states the "no prose
      inference" guarantee.
- [ ] `aief enrich manual|jira` behavior and its existing tests are unchanged.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
