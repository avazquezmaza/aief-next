# Specification

## Goal

Every tech stack whose recommended Skill declares `backend-standards.md` in `standardsToRead`
actually gets `knowledge/standards/backend-standards.md` created by `aief bootstrap`, so
`knowledge/skills.md` never links to a file that doesn't exist.

## Requirements

- R1: `standardsForProject()` in `cli/src/commands/bootstrap.js` MUST create
  `backend-standards.md` for a project detected as `aws`, `django`, `flask`, `fastapi`, `stripe`,
  `docker`, or `kubernetes` — in addition to the existing `nestjs`/`postgres`/`cognito`/`n8n`.
- R2: A project matching none of those signals (e.g. a plain library, or a frontend-only
  React/Next.js project with no backend signal) MUST NOT get `backend-standards.md` — no change
  to existing, tested negative cases.

## Acceptance Criteria

- [x] A project with `manage.py` + `requirements.txt` containing `django` (the `django`
      detector) gets `knowledge/standards/backend-standards.md` created by `aief bootstrap`.
- [x] `cli/tests/cli-bootstrap-and-standards.test.js`'s existing frontend-only and
      unknown-stack assertions (no `backend-standards.md`) still pass unchanged.
