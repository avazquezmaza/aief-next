# Tasks

## Implementation

- [x] Extend `BACKEND_TECH_IDS` in `standardsForProject()` (`cli/src/commands/bootstrap.js`) with
      `aws`, `django`, `flask`, `fastapi`, `stripe`, `docker`, `kubernetes`.

## Documentation

- [x] Comment above `BACKEND_TECH_IDS` explains the invariant this list must maintain (every
      backend-standards.md-requiring Skill's `when` triggers) and why `multitenant`/bare `nextjs`
      were left out of scope.

## Verification

- [x] Added a regression test in `cli/tests/cli-bootstrap-and-standards.test.js`: a Django-only
      project now gets `knowledge/standards/backend-standards.md` created, matching what the
      generated `knowledge/skills.md` already references.
- [x] `npm test` (repo root) — 1010/1010 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Confirmed the pre-existing negative-case tests (frontend-only, unknown-stack) are
      unaffected.

## Evidence

- [x] Update evidence.md
