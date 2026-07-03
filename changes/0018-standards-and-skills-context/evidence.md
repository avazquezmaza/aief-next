# Evidence

## Summary

AIEF now gives adopted projects a real knowledge base, inspired by LIDR Specboot's concepts without copying it: `adopt` creates editable project standards matched to detected signals, `analyze` seeds the Analysis Change with everything doctor detects (closing validation friction FR-3), and `prompt` injects standards plus operational Skill content as honest context (closing the substance of FR-2/FR-17). OpenSpec remains the spec workflow engine; research confirmed its official `propose` is an assistant slash command, so AIEF's loud local fallback is the *normal* terminal path — now documented. 31/31 tests, `aief verify` PASS.

## Activities Performed

- **Specboot review (concepts adopted, nothing copied):** modular standards documents (base/backend/frontend/documentation), role- and skill-based knowledge for assistants, and single-source-of-truth instruction files. Adapted as: `cli/templates/standards/` (6 original templates with `(adapt)` markers), operational Skill fields in the existing catalog, and the existing AGENTS.md hierarchy (already covered by ADR-004).
- **Not copied, and why:** Specboot's `ai-specs/agents/` (AIEF already has profiles), its skill files as separate documents (AIEF keeps Skill content in the catalog to preserve the detector→recommendation→content pipeline), symlinked assistant files (AIEF's assistant files are independent by design), and `api-spec.yml`/`data-model.md` templates (deferred — noted as a possible future `knowledge/api|data/` extension rather than shipping empty shells).
- **OpenSpec research:** `openspec-ai/openspec` returns 404; the real project is Fission-AI/OpenSpec. Its official workflow is Explore → Propose → Apply → Archive, where `propose` is an assistant slash command (`/opsx:propose`), not a terminal command; the terminal CLI covers init/update/config. Documented in the adapter with the honest consequence: `aief propose` terminal delegation is expected to fall back locally.
- **Implementation:** standards creation in `adopt` (signal-matched, never overwrites, registered in the adoption Change), Detected Context seeding in `analyze` (signals with reasons, Skills, standards, risks marked "inferred", open questions, confirmation tasks), enriched `prompt` (standards to follow; Skills with promptContext + commonRisks under "included as context, not executed"; honest line for content-less Skills; scope/acceptance reminder), catalog v2 with full Skill content for 6 skills (fallback reviewer intentionally left without promptContext so the honest path is real and tested).

## Verification

- CLI suite: **31/31 pass** (6 new tests: standards created and never overwritten; React-only → frontend + base, no backend; unknown stack → exactly 4 base standards; analyze seeds real detections marked as inference; prompt includes standards and Skill context with honesty notes; verify passes right after adopt).
- Smoke test on a React+Postgres+multitenant fixture: adopt created 6 standards; analyze seeded 3 signals, 2 skills, 6 standards; prompt showed standards, tenant-isolation context and "Watch out for" risks.
- `aief verify` at repo root: PASS.
- Flow exercised with neither OpenSpec nor Specboot installed (this environment) — fully functional.

## Findings

- The three-concept split (detector / recommendation / content) fit the existing catalog naturally — no engine changes beyond passing full skill objects through `recommendSkills`.
- Templates shipped inside `cli/templates/` (not repo-level `templates/`) so `npm link` installs keep working.

## Risks

- Skill promptContext is authored knowledge — it can go stale; it should be reviewed when the corresponding technology usage changes.
- Standards conditionals (frontend/backend) are heuristic; a wrong classification only means a missing (or extra) editable template, never data loss.
- OpenSpec facts come from repository documentation review, not from an installed release (recorded honestly in the adapter).

## Recommendations

- Re-run the fresh-adoption validation (as in Change 0016) on Flux Portal to see the new standards/seeding experience end-to-end and re-check the remaining frictions (verify Next hint, profile default for Analysis Changes, status context-awareness).
- Consider `knowledge/api/openapi.yml` and `knowledge/data/data-model.md` templates once a real project asks for them.
- Update `starter-project/` to include a `knowledge/standards/` example.

## Artifacts Produced

- `cli/templates/standards/` (6 new templates)
- `cli/src/skills-catalog.json` (Skill content v2), `cli/src/detect.js` (full content pass-through), `cli/src/cli.js` (standards helpers, adopt, seeded analyze, enriched prompt)
- `cli/tests/cli.test.js` (+6 tests)
- `knowledge/decisions.md` (ADR-010), `adapters/openspec/README.md`, `README.md`, `docs/cli.md`, `cli/README.md`, `CHANGELOG.md`

## Lessons Learned

- Reference repositories are best mined for *shapes* (what knowledge exists, where it lives) rather than files; every adapted concept had to be re-expressed in AIEF's own vocabulary to avoid becoming a fork.
- Verifying upstream facts (the OpenSpec 404 and slash-command discovery) changed the integration story from "unvalidated assumption" to "documented reality" in one fetch.

## Next Change

Re-validate the full adoption experience on Flux Portal with standards and seeded analysis (fresh-user protocol from 0016), and address the remaining validation frictions (verify Next hint, Analysis profile default, status context-awareness).
