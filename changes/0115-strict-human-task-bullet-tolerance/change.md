# Change

## ID

`0115-strict-human-task-bullet-tolerance`

## Type

General

## Objective

`checkStrictCompleteness()`'s scan for unresolved `(human)` decision tasks in `tasks.md` only
recognizes the `-` bullet (`/^\s*-\s*\[\s\]\s*\(human\)\s*(.+)$/i`). CommonMark allows `-`, `*` and
`+` interchangeably as unordered-list markers, and this codebase has already fixed this exact gap
twice elsewhere in the same file's neighborhood: `change.js`'s `countOpenTasks()` (Change 0075) and
this very file's own Acceptance Criteria placeholder check (Change 0109) both use `[-*+]`. A pending
`(human)` decision written with `*` or `+` is silently invisible to `aief verify --strict`, so
governance can pass while a real open decision sits unflagged.

## Scope

### In scope

- Widen the `(human)` task regex in `checkStrictCompleteness()`
  (`cli/src/core/services/change-verifier.js`) to accept `[-*+]`, matching the tolerance
  `countOpenTasks()` and the Acceptance Criteria check already apply.
- Test coverage: a `tasks.md` with an unresolved `(human)` task written as `* [ ] (human) ...` and
  `+ [ ] (human) ...` is flagged by `verify --strict`, same as `- [ ] (human) ...` already is.

### Out of scope

- Any other bullet-detection logic outside this one regex — `countOpenTasks()` and the Acceptance
  Criteria check already handle `[-*+]` correctly and are untouched.
- Changing what counts as a "resolved" `(human)` decision (checked-box semantics unchanged).

## Success Criteria

- `verify --strict` flags an unresolved `(human)` task regardless of whether it's written with
  `-`, `*`, or `+`.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
