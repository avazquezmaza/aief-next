# Specification

## Goal

`main` at 3.3.0-readiness accurately documents everything shipped since 3.2.0, with no dangling
doc reference and no stale count, matching the bar Change 0087 set for 3.2.0.

## Requirements

- `docs/workflow.md`'s Skills Runtime paragraph names all 5 registered Skills
  (`change-context`, `requirements-analysis-instructions`, `architecture-definition`,
  `data-definition`, `adversarial-review`), each with a one-clause description, consistent with
  the existing prose style in that paragraph.
- No other documentation edit unless the audit finds a second real gap — this Change fixes what
  it verified is broken, not a speculative rewrite.
- Remote branch deletion happens only after explicit user confirmation, named for each branch.

## Acceptance Criteria

- [ ] `docs/workflow.md` updated, Skill count and list accurate.
- [ ] `npm test` passes, `node cli/bin/aief.js verify` passes, `git diff --check` passes.
- [ ] 4 merged remote branches deleted (only after user confirmation).
