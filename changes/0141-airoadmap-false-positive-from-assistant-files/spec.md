# Specification

## Goal

`aiRoadmap` reflects the project's own documentation, never the text of assistant instruction
files.

## Requirements

- R1: `aiRoadmap` does not search `AGENTS.md` or `CLAUDE.md`.
- R2: `aiRoadmap` still matches its keywords in `README.md` and `docs/architecture.md`.
- R3: No other detector changes.

## Acceptance Criteria

- [x] `bootstrap` on a project whose `README.md` has no AI keyword: `aiRoadmap` not detected and
      `ai-workflow-governance` not recommended.
- [x] A `CLAUDE.md` mentioning "AI assistants" alone does not detect `aiRoadmap`.
- [x] A `README.md` mentioning an LLM still detects `aiRoadmap`.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, and `git diff --check` pass.
