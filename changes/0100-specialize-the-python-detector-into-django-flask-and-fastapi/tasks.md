# Tasks

## Implementation

- [x] Add `django` (strong, `manage.py` + keyword), `flask` and `fastapi` (weak, keyword-only)
      detectors to `cli/src/skills-catalog.json`.
- [x] Add `python-backend-architecture` Skill covering all three.

## Documentation

- [x] No separate doc needed — data-only change, catalog is self-describing.

## Verification

- [x] `npm test` — 1009/1009 passing (1005 pre-existing + 4 new).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] Confirmed zero diff in `cli/src/detect.js` and in the existing `python` detector entry.

## Evidence

- [x] Update evidence.md
