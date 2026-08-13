# Change

## ID

`0075-support-standard-markdown-task-bullets`

## Type

General

## Objective

Fix Finding F1 from the completed technical audit: `countOpenTasks()` in `change.js` only
recognizes `- [ ]` (hyphen-bulleted) unchecked tasks. A genuinely incomplete task written with a
standard CommonMark `*` or `+` bullet is invisible to the close/verify readiness gate, letting an
incomplete Change report "All readiness checks passed."

## Scope

### In scope

- `countOpenTasks()` in `core/domain/change.js`: broaden the bullet-character match from a literal
  hyphen to a character class covering `-`, `*`, `+`.
- Regression tests in `cli/tests/change-verifier.test.js` proving all three bullet characters
  block on unchecked, and none block when checked.

### Out of scope

- Fenced-code-block awareness (a checkbox-looking line inside a ```` ``` ```` block is currently
  over-counted as an open task — the audit classified this as the safer-direction error, not a
  confirmed bug, and explicitly scoped it out of this Change).
- Any other malformed-checkbox pattern (`[ x ]`, mismatched brackets, etc.) — no confirmed bug was
  found there.
- Any change to `evidence.md` classification (`classifyEvidence()`), which is a separate function.
- Full Markdown-parser behavior (nested lists already work today via the existing `\s*` leading-
  whitespace match; not touched).

## Success Criteria

- `- [ ] task`, `* [ ] task`, `+ [ ] task` (unchecked, any of the three standard bullets) all
  block `close`/`verify`'s readiness check.
- `- [x] task`, `* [x] task`, `+ [x] task` (checked, any bullet, either case) do not block.
- Every existing generated `tasks.md` template (which only ever uses `-`) is unaffected.

## Status

Closed (2026-08-13)
