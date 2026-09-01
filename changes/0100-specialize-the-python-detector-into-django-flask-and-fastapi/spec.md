# Specification

## Goal

A project using Django, Flask or FastAPI gets a framework-aware Skill recommendation instead of
only the generic `python` signal.

## Requirements

- `django`: `files: ["manage.py"]`, plus `searchFiles: ["requirements.txt", "pyproject.toml"]` +
  `keywords: ["django"]`; `signal: "strong"` (manage.py is a reliable structural marker, same
  class of evidence as `typescript`'s `tsconfig.json`).
- `flask`: `searchFiles: ["requirements.txt", "pyproject.toml"]` + `keywords: ["flask"]` only;
  `signal: "weak"` (keyword-only, matching `spring`'s convention from Change 0098).
- `fastapi`: `searchFiles: ["requirements.txt", "pyproject.toml"]` + `keywords: ["fastapi"]` only;
  `signal: "weak"`.
- `python-backend-architecture` Skill: same field shape as `nextjs-nestjs-architecture`
  (`id`, `name`, `description`, `when`, `whenToUse`, `standardsToRead`, `promptContext`,
  `commonRisks`, `evidenceExpectations`), triggered by any of the three new detectors.
- Every new detector and the new Skill covered by a test in `cli/tests/detect.test.js`.

## Acceptance Criteria

- [ ] `cli/src/skills-catalog.json` contains the 3 new detectors and 1 new Skill, still valid
      JSON.
- [ ] `npm test` passes (existing tests + new ones), no existing test broken.
- [ ] `node cli/bin/aief.js verify` passes.
- [ ] `git diff --check` passes.
- [ ] `detect.js` has zero diff.
