# Specification

## Goal

An approval task can no longer be resolved silently with `[-]`, and whoever runs `close` sees
which approvals the close relies on. AIEF still does not claim to know who checked a box.

## Requirements

### R1: Approval-line parser

- One function returns every approval line in `tasks.md` as
  `{ label: "human" | "review" | "gate:<id>", state: "checked" | "unchecked" | "abandoned", text }`.
- Accepts `-`, `*`, `+` bullets and `x`/`X` (same tolerance as `countOpenTasks()` and
  `taskLabelGate()`).
- Lives next to the existing task parsing; no second copy of the regex in callers.

### R2: `[-]` does not resolve `(human)`/`(review)`

- `checkChangeReadiness()` adds one problem per abandoned `(human)` or `(review)` line:
  `` (human) approval marked [-]: "<text>" — an approval cannot be abandoned; check it, or remove the label and say why ``
  (`(review)` likewise).
- `checkStrictCompleteness()` reports the same lines under `--strict`.
- `(gate:<id>)` behavior is unchanged (ADR-037 already treats `[-]` as missing).
- Plain `aief verify` (no `--strict`) is unchanged.

### R3: Non-blocking notice

- Under `verify --strict` only: an Analysis or Definition Change (`## Type`) with no `(human)` line
  gets a warning line, not an error, so the verdict does not change.
- Text: `` ! <change>: [strict] no (human) approval line — Analysis and Definition Changes normally require one ``.

### R4: Approvals shown at close

- When readiness passes (tracked or untracked), `aief close` prints, before closing:
  `Approvals relied on:` followed by one line per checked approval (`(human)`, `(review)`,
  `(gate:<id>)`) with its text, or `Approvals relied on: none`.
- Printed with and without `--yes`; nothing else in the output changes.

### R5: Documentation

- `docs/security-model.md` Known Gaps: what is now enforced (`[-]`, close-time listing,
  strict notice), the residual risk (no identity verification; a solo owner whose assistant shares
  identity and tokens), and recommended platform controls for teams (branch protection, a required
  review by another account, CODEOWNERS on `changes/**`, an assistant token that cannot approve or
  merge).
- `docs/cli.md`: `close` row (approvals listed, `[-]` rule) and `verify --strict` row (rule and notice).
- `AGENTS.md` and `templates/agents/AGENTS.md`, kept identical: one sentence in "Tasks and gates"
  saying `[-]` does not resolve `(human)`, `(review)` or `(gate:<id>)`.
- `docs/history/governance-conventions.md` §2: the same rule for `[-]`.

### R6: No regression on history

- Before and after: project-wide `aief verify` and `aief verify --strict` give the same verdict on
  this repository.

## Acceptance Criteria

- [x] R1: Parser with unit tests (bullets, case, three states, gate ids).
- [x] R2: `close` blocks and `--strict` fails on `[-] (human)` and `[-] (review)`; gates unchanged; tests.
- [x] R3: Notice appears under `--strict` for Analysis/Definition without `(human)`; verdict unchanged; tests.
- [x] R4: `close` lists relied-on approvals, with and without `--yes`, tracked and untracked; tests.
- [x] R5: Docs updated; AGENTS.md and template identical.
- [x] R6: Same project-wide verdicts before and after.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, `git diff --check` pass.
- [x] (review) Independent review of the change to approval semantics (completed by Gemini).
- [x] (human) Approve the new approval semantics before close (approved by owner Andrés Vázquez).
