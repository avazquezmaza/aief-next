# Tasks

## Implementation

- [x] `cli/src/commands/bootstrap.js`: added `idsRequiringStandard(standardFile, catalog)`,
      derives frontend/backend tech-id sets as the union of a small explicit baseline and the
      catalog-derived set; `standardsForProject()` now takes an optional `catalog` parameter
      (defaults to `loadCatalog()`).
- [x] `docs/maintainer.md`: added the pre-tag version-grep checklist note to "Releasing".

## Documentation

- [x] Inline comment above the two explicit-baseline constants explains why each id is there
      despite the catalog derivation, and references Change 0106's precedent this Change replaces.

## Verification

- [x] Added two regression tests in `cli/tests/cli-bootstrap-and-standards.test.js`: a
      Next.js-only project now gets `backend-standards.md` (previously deferred in Change 0106);
      a React-only project still does not (baseline unaffected).
- [x] `npm test` (repo root) — 1017/1017 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Confirmed every pre-existing standards test (frontend-only, unknown-stack, Django-only)
      still passes unchanged.

## Evidence

- [x] Update evidence.md
