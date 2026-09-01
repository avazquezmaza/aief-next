# Change

## ID

`0101-fix-dangling-references-to-deleted-docs`

## Type

General

## Objective

`docs/requirement-sources.md`, `docs/enrichment-workflow.md` and `docs/ci-gate.md` no longer
exist — their content was consolidated into `docs/configuration.md`/`docs/workflow.md` by an
earlier documentation-architecture Change (per `docs/maintainer.md`'s "small docs set" rule). Four
live code sites (outside `changes/`, `CHANGELOG.md` and `docs/history/`, which are legitimately
historical) still point at the old filenames — two of them in a user-facing runtime message.
Audited with a scan of every `docs/<name>.md` reference in `cli/src/**` and the current `docs/*.md`
set (excluding `docs/history/`) against files that actually exist on disk; these four were the
only dangling ones. Repoint them to where the content actually lives today.

## Scope

### In scope

- `cli/src/requirement-providers/jira.js` — 3 references to `docs/requirement-sources.md` (1 code
  comment, 2 user-facing messages: an `openQuestions` entry and a `consoleNotes` entry) → repointed
  to `docs/configuration.md`'s "Requirement Source providers" section.
- `cli/src/commands/enrich.js` — 1 user-facing `console.error()` reference to
  `docs/requirement-sources.md` → repointed to `docs/configuration.md`.
- `cli/src/core/services/change-verifier.js` — 1 code comment referencing
  `docs/enrichment-workflow.md` → repointed to `docs/workflow.md`'s "Starting from a Requirement
  Source" section.
- `cli/src/commands/bootstrap.js` — 1 code comment referencing `docs/ci-gate.md` → repointed to
  `docs/configuration.md`'s "CI gate" section.

### Out of scope

- Any reference inside `changes/*/`, `CHANGELOG.md`, or `docs/history/**` — those are historical
  records of what existed at the time, per `docs/maintainer.md`'s documented exception; not bugs.
- Re-creating the deleted docs or restoring the exact "Verify limitations" subsection heading that
  no longer exists — the comment in `change-verifier.js` is reworded, not pointed at a heading
  that isn't there.
- Any change to behavior — every edit is a comment or a message string, no logic touched.

## Success Criteria

- `grep -rlE "docs/[a-zA-Z0-9_-]+\.md" cli/src` cross-checked against files on disk shows zero
  missing targets.
- `npm test` and `node cli/bin/aief.js verify` pass.
- `git diff --check` passes.

## Status

Closed (2026-09-01)
