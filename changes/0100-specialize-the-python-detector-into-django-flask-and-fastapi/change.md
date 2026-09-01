# Change

## ID

`0100-specialize-the-python-detector-into-django-flask-and-fastapi`

## Type

General

## Objective

Change 0098 added a generic `python` detector (files-based: `requirements.txt`/`pyproject.toml`/
`Pipfile`/`manage.py`) but no framework-specific detector or Skill — its own evidence.md flagged
this as a likely next step. Add `django`/`flask`/`fastapi` detectors and one Skill covering their
shared backend risk profile, the same relationship `aws`+`cognito` have to `aws-saas-platform` and
`nextjs`+`nestjs` have to `nextjs-nestjs-architecture`.

## Scope

### In scope

- Three new detectors in `cli/src/skills-catalog.json`: `django` (strong — `manage.py` is a
  reliable structural marker), `flask` and `fastapi` (weak — keyword-in-`requirements.txt`/
  `pyproject.toml` only, no distinctive file).
- One new Skill, `python-backend-architecture` (`when: ["django", "flask", "fastapi"]`), covering
  input validation at the boundary, async/blocking-call safety, and secret/settings hygiene.
- Tests in `cli/tests/detect.test.js` for all three detectors and the new Skill.

### Out of scope

- The existing generic `python` detector — untouched, stays signal-only (same as
  `typescript`/`react`/`postgres`).
- `detect.js`'s detection engine — no new detector mechanism, same shapes as every prior entry.
- Any other Python framework (Pyramid, Tornado, ...) — same "close the most visible gap, not an
  exhaustive list" scoping as Change 0098.

## Success Criteria

- `cli/src/skills-catalog.json` gains the 3 detectors and 1 Skill, valid JSON.
- `npm test` passes, including new tests for each detector and the Skill.
- `node cli/bin/aief.js verify` passes.
- No change to `detect.js` or the existing `python` detector entry.

## Status

Closed (2026-09-01)
