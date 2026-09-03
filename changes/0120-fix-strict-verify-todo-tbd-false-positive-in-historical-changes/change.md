# Change

## ID

`0120-fix-strict-verify-todo-tbd-false-positive-in-historical-changes`

## Type

General

## Objective

`node cli/bin/aief.js verify --strict` (repo-wide, no `--change` filter) fails on three historical,
already-closed Changes — 0083, 0086, 0087 — with `contains an unresolved TODO/TBD`. Not a real
unresolved marker: each of these Changes documents `checkStrictCompleteness()`'s own `TODO`/`TBD`
detection rule (Change 0083 implemented it), so their prose mentions the literal words `TODO`/`TBD`
outside a backtick span, which `stripInlineCode()` doesn't exclude when the words aren't
individually backtick-quoted. Found while auditing the repo after Changes 0114–0119.

## Scope

### In scope

- Wrap every bare `TODO`/`TBD` mention in 0083/0086/0087's `change.md`/`spec.md`/`tasks.md` in
  backticks (`` `TODO` ``/`` `TBD` ``), the same convention every other code/keyword reference in
  these files already uses — no wording or meaning change, purely quoting.

### Out of scope

- Any change to `checkStrictCompleteness()`'s detection logic itself — the false positive is in the
  historical prose, not the checker (which behaves exactly as 0083 designed it to: bare `TODO`/`TBD`
  is flagged, backtick-quoted is not).
- Any other repo-wide `verify --strict` finding — repo-wide strict verify is PASS once this is
  applied; nothing else is flagged.

## Success Criteria

- `node cli/bin/aief.js verify --strict` (no `--change` filter) passes with zero `[strict]` lines.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
