# Specification

## Goal

Every `docs/<name>.md` reference inside `cli/src/**` points to a file that actually exists, and
the two user-facing runtime messages (jira.js's local-export-missing message, enrich.js's
unimplemented-provider message) point users somewhere real.

## Requirements

- No behavior change — every edit is text inside a comment or a message string.
- New doc targets: `docs/configuration.md` for provider-implementation/export-path content,
  `docs/workflow.md` for the Requirement Source workflow narrative, `docs/configuration.md`'s "CI
  gate" section for the bootstrap comment.
- No test asserts the old filename literally (confirmed: `grep -rn "requirement-sources.md" cli/tests`
  returns nothing), so no existing test needs updating.

## Acceptance Criteria

- [ ] All 4 dangling references fixed, verified against the actual `docs/*.md` file list.
- [ ] `npm test` passes, `node cli/bin/aief.js verify` passes, `git diff --check` passes.
- [ ] `git diff` touches only the 4 named files plus this Change's own files.
