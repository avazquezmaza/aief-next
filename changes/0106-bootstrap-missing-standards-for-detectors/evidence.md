# Evidence

## Summary

Fixed `aief bootstrap` generating a dangling reference to `knowledge/standards/backend-standards.md`
for several tech stacks. `standardsForProject()` decides which starter standards files to create
by checking a hand-maintained list of `project.tech` flags — but that list was written before
Changes 0098/0100 added 20+ new detectors and Skills, and was never updated to match. Several
Skills the catalog now recommends (`python-backend-architecture`, `aws-saas-platform` standalone,
`payments-reviewer`, `container-deployment-reviewer`) declare `backend-standards.md` in their own
`standardsToRead`, and that reference is written into the generated `knowledge/skills.md` — but
the file itself was never created for those stacks.

## Activities Performed

- Reproduced the gap before the fix: bootstrapped a minimal Django project (`manage.py` +
  `requirements.txt` containing `django`) and confirmed `knowledge/standards/` only contained
  `base-standards.md`, `documentation-standards.md`, `testing-standards.md`,
  `security-standards.md` — no `backend-standards.md` — while `knowledge/skills.md` referenced
  `knowledge/standards/backend-standards.md` for the recommended `python-backend-architecture`
  Skill.
- Cross-checked `skills-catalog.json` for every Skill whose `standardsToRead` includes
  `backend-standards.md`, and every `when` id that triggers it: `nestjs`, `postgres`, `cognito`,
  `n8n` (already covered), plus `aws`, `django`, `flask`, `fastapi`, `stripe`, `docker`,
  `kubernetes` (missing).
- Extended `BACKEND_TECH_IDS` in `cli/src/commands/bootstrap.js` to include the missing ids.
- Left `multitenant` and bare `nextjs` (also triggers of a backend-standards.md-requiring Skill)
  out of scope — no reproduction confirmed a dangling reference for those specific cases, and
  `nextjs` already has tested frontend-only behavior this fix must not disturb.
- Added a regression test asserting a Django-only project gets `backend-standards.md` created and
  that `knowledge/skills.md` references it.

## Verification

- Re-ran the same Django reproduction after the fix: `knowledge/standards/backend-standards.md`
  is now created, and `knowledge/skills.md`'s reference resolves to a real file.
- `npm test` (repo root): 1010/1010 passing.
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Confirmed the pre-existing negative-case tests (`cli-bootstrap-and-standards.test.js`:
  frontend-only project gets no backend-standards.md; unknown-stack project gets only base
  standards) still pass unchanged.

## Findings

- The same class of gap likely exists for other Skills the catalog might add in the future
  (`standardsToRead` naming a file `standardsForProject()` doesn't know to create) — the
  hand-maintained-list approach is inherently prone to drifting again as the catalog grows. Noted
  under Recommendations rather than fixed here, to keep this Change's diff small and focused on
  the confirmed, reproduced gap.

## Risks

- None introduced. The fix only adds new positive cases (more stacks get
  `backend-standards.md`); every existing tested case (frontend-only, unknown-stack, the
  original `nestjs`/`postgres`/`cognito`/`n8n` triggers) is unchanged.

## Artifacts Produced

- `cli/src/commands/bootstrap.js` (fix)
- `cli/tests/cli-bootstrap-and-standards.test.js` (1 new regression test)
- `changes/0106-bootstrap-missing-standards-for-detectors/` (this Change)

## Lessons Learned

- A hand-maintained list mirroring data that already exists elsewhere (here, `skills-catalog.json`'s
  own `standardsToRead`/`when` declarations) will drift as the source of truth grows unless
  something enforces the two stay in sync. A follow-up Change could derive
  `standardsForProject()`'s sets directly from the catalog instead of a parallel list — flagged
  under Recommendations, not done here to keep this fix minimal and reviewable.

## Next Change

Optional follow-up: derive `standardsForProject()`'s frontend/backend tech-id sets directly from
`skills-catalog.json` (`standardsToRead` × `when`) instead of a hand-maintained list, so a future
Skill/detector addition can never reintroduce this class of gap. Not required — the confirmed gap
is fixed.
