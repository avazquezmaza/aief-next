# Change

## ID

`0141-airoadmap-false-positive-from-assistant-files`

## Type

Fix

## Objective

Every project that adopts AIEF is detected as `aiRoadmap` ("AI features on the roadmap") and gets
the `ai-workflow-governance` Skill recommended, whatever it actually does. Cause: the `aiRoadmap`
detector searches `AGENTS.md` and `CLAUDE.md` for keywords such as "ai assistants", and AIEF's own
`AGENTS.md` template says "AI assistants" on line 3. An assistant instruction file always talks
about AI assistants, so it says nothing about the project's product roadmap.

Confirmed on two real adopted Camel projects (`keyword "ai assistants" found in AGENTS.md`) and
already acknowledged as a known self-trigger in comments in `cli-skills-and-maturity.test.js`.

## Scope

### In scope

- `cli/src/skills-catalog.json`: `aiRoadmap.searchFiles` drops `AGENTS.md` and `CLAUDE.md`; keeps
  `README.md` and `docs/architecture.md`.
- Tests: regression test for the fix; the two tests that relied on the self-trigger get a
  legitimate trigger instead; one stale comment corrected.

### Out of scope

- Other weak detectors that search `AGENTS.md`/`CLAUDE.md` (`n8n`, `multitenant`, `rbac`,
  `codeGraphUnderstanding`): none of their keywords appear in AIEF's template, and a team-written
  mention there does describe the project.
- Any change to how `AGENTS.md`/`CLAUDE.md` are created or read.

## Success Criteria

- A freshly bootstrapped project with no AI mention in `README.md` does not detect `aiRoadmap`.
- `aiRoadmap` is still detected from `README.md`/`docs/architecture.md`.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, and `git diff --check` pass.
