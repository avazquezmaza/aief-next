# Evidence

## Summary

`aiRoadmap` no longer searches `AGENTS.md`/`CLAUDE.md`, so AIEF's own `AGENTS.md` template ("AI
assistants") stops flagging every adopted project as having AI on its roadmap and recommending
`ai-workflow-governance`.

## Activities Performed

- `cli/src/skills-catalog.json`: `aiRoadmap.searchFiles` is now `README.md`, `docs/architecture.md`.
- New tests: `detect.test.js` (assistant files ignored; `README.md` and `docs/architecture.md`
  still read) and `cli-bootstrap-and-standards.test.js` (`bootstrap` + `CLAUDE.md` mentioning AI
  assistants: no `aiRoadmap` in `bootstrap`/`status`, no `ai-workflow-governance` in `doctor`).
- `cli-skills-and-maturity.test.js`: three tests relied on the self-trigger to get the built-in
  `ai-workflow-governance` Skill; their `README.md` fixtures now say "with LLM features" (a
  legitimate trigger). One comment describing the self-trigger was corrected.

## Verification

- `npm test`: 1126 tests, 1126 pass, 0 fail.
- `npm run lint`: clean. `git diff --check`: clean. `node cli/bin/aief.js verify`: PASS.
- Read-only on the two real adopted Camel projects: `aiRoadmap` (previously
  `keyword "ai assistants" found in AGENTS.md`) is gone; `ai-workflow-governance` no longer
  recommended. Remaining signals are their real stack.

## Findings

- This repository still detects `aiRoadmap`, now from its own `README.md` ("AI assistants"). That
  is product documentation, so the signal is legitimate under R2.
- No user doc lists `aiRoadmap`'s search files; nothing else to update.

## Risks

- A project that documents its AI roadmap only in `CLAUDE.md`/`AGENTS.md` is no longer detected.
  Accepted: those files describe how assistants work, not what the product does.

## Recommendations

- None required.

## Artifacts Produced

- `cli/src/skills-catalog.json`
- `cli/tests/detect.test.js`, `cli/tests/cli-bootstrap-and-standards.test.js`,
  `cli/tests/cli-skills-and-maturity.test.js`

## Lessons Learned

- A detector that reads files AIEF itself writes can be triggered by AIEF's own text; the tests had
  documented the self-trigger instead of treating it as a bug.

## Next Change

- None planned.
