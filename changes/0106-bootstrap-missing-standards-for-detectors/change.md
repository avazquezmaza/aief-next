# Change

## ID

`0106-bootstrap-missing-standards-for-detectors`

## Type

General

## Objective

Fix `aief bootstrap` generating a dangling reference to `knowledge/standards/backend-standards.md`
in the generated `knowledge/skills.md`: several tech detectors added in Changes 0098/0100
(`django`/`flask`/`fastapi`, `aws` standalone, `stripe`, `docker`/`kubernetes`) trigger a Skill
recommendation whose `standardsToRead` names `backend-standards.md`, but
`standardsForProject()` — written before those detectors existed — never creates that file for
those stacks, so the generated doc links to a standards file that was never created.

## Scope

### In scope

- `cli/src/commands/bootstrap.js`: extend `standardsForProject()`'s backend-tech trigger set to
  cover every detector id that is a `when` trigger of a `skills-catalog.json` Skill whose own
  `standardsToRead` names `backend-standards.md` (`aws`, `django`, `flask`, `fastapi`, `stripe`,
  `docker`, `kubernetes` — in addition to the existing `nestjs`/`postgres`/`cognito`/`n8n`).
- A regression test proving a Django-only project gets `backend-standards.md` created.

### Out of scope

- `multitenant` and bare `nextjs` (also `when` triggers of a Skill requiring
  `backend-standards.md`) are left untouched — no reproduction confirmed a real dangling
  reference for those specific cases, and changing them risks an unverified behavior change to
  an already-tested code path (frontend-only Next.js projects). A follow-up Change can revisit
  if a similar gap is confirmed there.
- Deriving `standardsForProject()` fully from the catalog data (instead of a hand-maintained id
  list) — a larger refactor, not needed to fix the confirmed gap.

## Success Criteria

- `aief bootstrap` on a Django-only project (`manage.py` + `requirements.txt` containing
  `django`) creates `knowledge/standards/backend-standards.md`, matching what the generated
  `knowledge/skills.md` already references for the `python-backend-architecture` Skill.
- Existing frontend-only / unknown-stack bootstrap behavior (tested in
  `cli/tests/cli-bootstrap-and-standards.test.js`) is unchanged.

## Status

Closed (2026-09-01)
