# Change

## ID

`0109-strict-acceptance-criteria-bullet-gap`

## Type

General

## Objective

Fix a gap in `aief verify --strict`'s Acceptance Criteria placeholder check
(`checkStrictCompleteness()`, `cli/src/core/services/change-verifier.js`): it only recognized the
exact string `"- [ ]"` as the untouched scaffold placeholder, so a `spec.md` whose Acceptance
Criteria section held only `* [ ]` or `+ [ ]` (equally valid CommonMark bullets — the same
tolerance `change.js`'s `countOpenTasks()` already applies to `tasks.md` since Change 0075) was
silently accepted as real content, and `--strict` passed where it should have failed. This is the
same class of bug found and fixed in `definition-enrichment.js` (Change 0107), found here during a
follow-up sweep for the same pattern elsewhere in the codebase.

## Scope

### In scope

- `cli/src/core/services/change-verifier.js`: widen the Acceptance Criteria placeholder check to
  accept `-`, `*`, `+` bullets.
- Regression tests for `*` and `+` bullets.

### Out of scope

- Any other exact-string placeholder checks in this module (`isPlaceholderContent()`'s
  `content === "-"` for Success Criteria/In scope/Out of scope/Requirements) — those sections'
  placeholder is a bare `-` with no checkbox, and any non-`-`-bullet content replacing it is
  already correctly treated as "known" (real content), regardless of which bullet character was
  used — there is no equivalent gap there.

## Success Criteria

- `aief verify --strict` on a Change whose `spec.md` Acceptance Criteria section holds only
  `* [ ]` (or `+ [ ]`) reports `spec.md Acceptance Criteria is empty`, same as `- [ ]` already did.
- A Change with real, filled-in Acceptance Criteria (any bullet character) is unaffected.

## Status

Closed (2026-09-01)
