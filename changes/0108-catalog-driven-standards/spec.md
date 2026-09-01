# Specification

## Goal

`standardsForProject()`'s frontend/backend tech-id sets are derived from `skills-catalog.json`
itself, so a future Skill/detector addition can never again silently leave `bootstrap` recommending
a standards file it never creates. Separately, the release process documents the exact check that
would have caught a stale version number surviving a release.

## Requirements

- R1: `standardsForProject()` in `cli/src/commands/bootstrap.js` MUST include, for both
  `frontend-standards.md` and `backend-standards.md`, every detector id that is a `when` trigger
  of a `skills-catalog.json` Skill whose own `standardsToRead` names that file — computed from the
  catalog data, not hand-listed a second time.
- R2: The existing explicit baseline (`react`, `tailwind`, `nextjs` for frontend; `nestjs`,
  `postgres`, `cognito`, `n8n` for backend) MUST remain — these ids do not all appear as catalog
  Skill `when` triggers for the relevant file, and removing them would be a regression.
- R3: `docs/maintainer.md`'s "Releasing" section MUST instruct grepping the docs set for the
  previous version number before tagging.

## Acceptance Criteria

- [x] A project detected only as `nextjs` (no `nestjs`) gets both `frontend-standards.md` and
      `backend-standards.md` created.
- [x] A project detected only as `react` still gets only `frontend-standards.md` — no
      `backend-standards.md`.
- [x] The existing `cli-bootstrap-and-standards.test.js` suite (frontend-only, unknown-stack,
      Django-only from Change 0106) passes unchanged.
- [x] `docs/maintainer.md` names the pre-tag version grep step.
