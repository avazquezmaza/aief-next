# Change

## ID

`0127-scope-complete-stop-directive`

## Type

Fix

## Objective

Change 0096's usability study (`consolidation.md` §6 row 4, the study's own "major finding")
observed a senior participant satisfy `TASK.md`'s literal ask at M-T3 (closing
`0003-expose-reporting-api`), then continue unprompted and build a full second Change
(`0004-create-reporting-service`) — real, correct, well-tested work, but beyond the scoped
task, with **nothing in the flow signaling that the scoped task was already done**. Recorded
facts-only (no recommendation) per that Change's own scope; an external audit flagged this as
the study's most actionable, concrete finding and recommended a lightweight "stop once scope is
satisfied" directive — not a new subsystem, just an explicit instruction.

This Change adds that directive to the two places an assistant actually reads instructions
from: `AGENTS.md` (read by every assistant, regardless of whether `aief prompt` was used) and
`aief prompt`'s generated per-Change prompt (read at the exact moment work begins).

## Scope

### In scope

- `AGENTS.md` (and its byte-identical canonical template, `cli/templates/agents/AGENTS.md`):
  one new General Rule stating that once a Change's acceptance criteria are satisfied, the
  assistant stops rather than opportunistically extending scope.
- `cli/src/commands/prompt.js`: the generated prompt gains the same directive, immediately
  after the existing "Respect the scope..." line — applies to every Change type (general,
  enrichment, analysis, definition), not only the general-implementation branch, since scope
  creep is not unique to implementation work.
- `cli/tests/agents-canonical.test.js`'s `CANONICAL_RULES` list: add the new rule's text, so
  `aief bootstrap`-adopted projects are guaranteed to receive it (the same guarantee every
  other normative rule in that list already has).
- A test confirming the new prompt text renders for a real Change.

### Out of scope

- Any automated enforcement (a "scope diff" checker, a hook, a gate) — this is a prompt-level
  instruction only, matching the audit's own recommendation to keep this a lightweight
  primitive, not a new subsystem. An eval measuring "unrequested diff" (also suggested by the
  audit) requires an evals harness that does not exist yet (tracked separately, lower
  priority per this repository's own current backlog ordering).
- Any change to the usability-study Change (0096) itself — its consolidation stays facts-only,
  unmodified; this Change is the follow-up its own evidence.md pointed to.
- Rewording or restructuring any other AGENTS.md rule.

## Success Criteria

- `AGENTS.md` and its canonical template state the STOP directive, identically.
- `aief prompt`'s generated prompt states it for every Change type.
- `aief bootstrap`-adopted projects receive the rule (covered by the existing canonical-rules
  guard test).
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0127-scope-complete-stop-directive --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-09)
