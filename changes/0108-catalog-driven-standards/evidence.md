# Evidence

## Summary

Two related, small process improvements, requested together as one Change:

1. `standardsForProject()` now derives its frontend/backend tech-id sets from
   `skills-catalog.json` itself, instead of a hand-maintained list — closing the whole class of
   gap Change 0106 fixed one detector at a time (and had explicitly deferred for `nextjs`/
   `multitenant`, for lack of a confirmed reproduction at the time).
2. `docs/maintainer.md`'s Releasing section now names the exact check (grep the docs set for the
   previous version number) that would have caught Change 0107's stale-`README.md`-version
   finding before it shipped.

## Activities Performed

### 1. Catalog-derived standards

- Added `idsRequiringStandard(standardFile, catalog)`: walks `catalog.skills`, and for every Skill
  whose `standardsToRead` includes `standardFile`, collects every id in that Skill's `when` array.
- `standardsForProject()` now unions this derived set with a small, explicit baseline
  (`EXPLICIT_FRONTEND_IDS = ["nextjs","react","tailwind"]`,
  `EXPLICIT_BACKEND_IDS = ["nestjs","postgres","cognito","n8n"]`) — kept because not every id that
  needs a standards file is a catalog Skill's `when` trigger (`react`/`tailwind` alone recommend
  no Skill; `postgres` is only ever mentioned in a Skill's prose, never a `when` array).
- Confirmed by reading `skills-catalog.json` that the catalog-derived backend set now
  automatically includes everything Change 0106 hand-added (`aws`, `django`, `flask`, `fastapi`,
  `stripe`, `docker`, `kubernetes`) plus the two ids Change 0106 explicitly deferred
  (`nextjs`, `multitenant`, from `nextjs-nestjs-architecture` and `multitenant-saas-architect`
  respectively) — so the hand-maintained list Change 0106 grew is now redundant and was removed.
- Verified the newly-covered `nextjs` case is a deliberate, catalog-sourced decision (a Next.js
  app commonly has its own API routes, hence `nextjs-nestjs-architecture`'s own
  `standardsToRead: ["frontend-standards.md","backend-standards.md"]`), not an accidental
  behavior change — added a regression test for it, and a negative test confirming a plain
  React-only project is unaffected.

### 2. Release checklist note

- Confirmed the root cause of Change 0107's README finding: Change 0102 ("release readiness...
  refresh documentation so it stays accurate") and Change 0103 (version bump) both ran without
  any step that would have caught the stale "AIEF 3.2" string, because neither Change's scope
  named checking for one.
- Added a short paragraph to `docs/maintainer.md`'s "Releasing" section instructing a grep of the
  docs set for the previous version number before tagging, citing Change 0107 as the concrete
  precedent.

## Verification

- `npm test` (repo root): 1017/1017 passing (was 1015 before the two new tests).
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Confirmed every pre-existing `cli-bootstrap-and-standards.test.js` assertion (frontend-only
  React project, unknown-stack project, Django-only project from Change 0106) still passes
  unchanged — the catalog-derivation only adds new positive cases, never removes an existing one.

## Findings

- `postgres` genuinely has no catalog Skill `when` trigger anywhere — only mentioned in
  `aws-saas-platform`'s description prose ("RDS PostgreSQL"). Confirmed it must stay in the
  explicit baseline; a pure catalog-derivation would have silently dropped it.

## Risks

- None introduced. The only observable behavior change is additive (a Next.js-only project now
  also gets `backend-standards.md`), matches what the catalog's own Skill declaration already
  says it needs, and is covered by a new test; every previously-tested case is unchanged.

## Recommendations

- None outstanding. The release-checklist note is a manual step, not an automated check — if it
  proves insufficient in practice (missed again on a future release), a follow-up Change could
  script the version grep into `aief release` or the CI workflow.

## Artifacts Produced

- `cli/src/commands/bootstrap.js` (fix)
- `docs/maintainer.md` (release checklist note)
- `cli/tests/cli-bootstrap-and-standards.test.js` (2 new regression tests)
- `changes/0108-catalog-driven-standards/` (this Change)

## Lessons Learned

- Both the original Change 0106 gap and this Change's fix are the same lesson repeated: when two
  pieces of data need to stay in sync (a Skill's declared `standardsToRead` and the file that
  actually gets created), deriving one from the other closes the gap permanently; hand-listing
  both and hoping they're kept in sync manually reopens it the next time either side grows.

## Next Change

None required.
