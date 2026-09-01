# Evidence

## Summary

`docs/requirement-sources.md`, `docs/enrichment-workflow.md` and `docs/ci-gate.md` were
consolidated away by an earlier documentation-architecture Change, but 4 live code sites still
pointed at the old filenames — two of them in messages a real user would see (an `aief enrich`
error and a `jira` local-export-missing message). Repointed all 4 to where the content actually
lives today (`docs/configuration.md`, `docs/workflow.md`).

## Activities Performed

- Scanned every `docs/<name>.md` reference across the repo, cross-checked against files that
  actually exist on disk. Confirmed the hits inside `changes/**`, `CHANGELOG.md` and
  `docs/history/**` are legitimately historical (per `docs/maintainer.md`'s documented exception)
  and left untouched. Scoped the fix to the 4 hits in live `cli/src/**` code — the current
  `docs/*.md` set itself had zero dangling internal references.
- `cli/src/requirement-providers/jira.js`: repointed a header comment and two user-facing message
  strings (`openQuestions`, `consoleNotes`) from `docs/requirement-sources.md` to
  `docs/configuration.md`, "Requirement Source providers".
- `cli/src/commands/enrich.js`: repointed the "provider not implemented" `console.error()` the
  same way.
- `cli/src/core/services/change-verifier.js`: repointed a comment from
  `docs/enrichment-workflow.md`, "Verify limitations" (a subsection that no longer exists) to
  `docs/workflow.md`, "Starting from a Requirement Source" — the closest still-current section,
  worded so it doesn't claim a heading that isn't there.
- `cli/src/commands/bootstrap.js`: repointed a comment from `docs/ci-gate.md` to
  `docs/configuration.md`, "CI gate".

## Verification

- Re-ran the scan after editing: `for f in $(grep -rlE "docs/[a-zA-Z0-9_-]+\.md" cli/src ...)` —
  zero missing targets remain.
- `npm test` (full suite) — 1009/1009 passing, unchanged from before this Change (no behavior
  touched, so no test count change expected or needed).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.
- `git status --short` confirms only the 4 named files changed outside this Change's own
  directory.

## Findings

The dangling references were a byproduct of a documentation consolidation Change that updated
`docs/*.md` cross-links but missed the corresponding pointers inside `cli/src/**` — a class of
drift a doc-consolidation Change's own checklist could catch mechanically in the future (see
Recommendations).

## Risks

None — text-only change to comments and message strings, no logic touched, confirmed by
`git diff` showing only string literal edits.

## Recommendations

- A future documentation-consolidation Change could add the scan used here
  (`grep -rlE "docs/[a-zA-Z0-9_-]+\.md" cli/src` cross-checked against files on disk) to its own
  verification step, so a renamed/merged doc's code-side pointers get caught in the same Change
  that does the consolidation, not discovered later.

## Artifacts Produced

- `cli/src/requirement-providers/jira.js`, `cli/src/commands/enrich.js`,
  `cli/src/core/services/change-verifier.js`, `cli/src/commands/bootstrap.js` — 6 string/comment
  edits total.

## Lessons Learned

A plain `grep` cross-check of doc references against the filesystem found a real, small, easily
missed drift that no test caught (nothing asserts on these message strings) — worth keeping as an
ad hoc check after any future doc reorganization.

## Next Change

None proposed — this closes the gap found. No further dangling references remain in live code or
the current docs set.
