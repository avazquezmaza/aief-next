# Change

## ID

`0108-catalog-driven-standards`

## Type

General

## Objective

Close the whole class of gap Change 0106 fixed one detector at a time: `standardsForProject()`
(`cli/src/commands/bootstrap.js`) decided which starter standards files to create from a
hand-maintained list of `project.tech` ids, disconnected from `skills-catalog.json`'s own
`standardsToRead` declarations — so every time a new Skill/detector pair recommending
`frontend-standards.md`/`backend-standards.md` was added to the catalog, this function had to be
separately, manually updated to match, and reliably fell behind (Changes 0098/0100 added 20+
detectors; Change 0106 found and fixed the resulting gap for 7 of them, but explicitly left
`nextjs`/`multitenant` out of scope for lack of a confirmed reproduction). Also adds a release
checklist note (`docs/maintainer.md`) for the unrelated but similarly-shaped gap Change 0107
fixed: a stale version number surviving a release because no step named checking for it.

## Scope

### In scope

- `cli/src/commands/bootstrap.js`: `standardsForProject()` now derives its frontend/backend
  tech-id sets from `skills-catalog.json` itself (every `when` trigger of a Skill whose own
  `standardsToRead` names the file), unioned with a small explicit baseline for ids that need a
  standards file without being a catalog Skill trigger (`react`/`tailwind` alone recommend no
  Skill yet still need frontend guidance; `postgres` is only ever mentioned in a Skill's prose,
  never in a `when` array).
- `docs/maintainer.md`: "Releasing" section gets a checklist note to grep the docs set for the
  previous version number before tagging, referencing the exact gap Change 0107 found and fixed.
- Regression tests for the newly-covered `nextjs` case, and a negative test confirming the
  existing `react`-only baseline is unaffected.

### Out of scope

- Any further catalog restructuring (e.g. merging `EXPLICIT_FRONTEND_IDS`/`EXPLICIT_BACKEND_IDS`
  into the catalog itself as a `standardsToRead`-less top-level entry) — the current union of
  "explicit baseline + catalog-derived" is the minimal change that closes the confirmed gap.
- Automating the release-version grep as a script/CI check — this Change only documents the step;
  scripting it is a separate, larger Change if the manual step proves insufficient in practice.

## Success Criteria

- A Next.js-only project (no NestJS) gets both `frontend-standards.md` AND
  `backend-standards.md` created — the case Change 0106 explicitly deferred, now covered
  automatically because it is derived from `nextjs-nestjs-architecture`'s own catalog declaration.
- A plain React (non-Next.js) project's behavior is unchanged: `frontend-standards.md` only, no
  `backend-standards.md` — the explicit baseline still governs cases with no catalog Skill trigger.
- Adding a new Skill to `skills-catalog.json` with `standardsToRead: ["backend-standards.md"]`
  and a new `when` id automatically makes `standardsForProject()` create that file for a project
  matching that id — no second edit to `bootstrap.js` required.
- `docs/maintainer.md`'s Releasing section names the exact check that would have caught Change
  0107's stale-README-version finding.

## Status

Closed (2026-09-01)
