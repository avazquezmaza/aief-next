# Change

## ID

`0163-gemini-skill-parity-and-full-assistant-parity-tests`

## Type

Feature

## Objective

Give Gemini CLI the `aief-change` skill and cover all five registered assistants in the parity
tests. ADR-039 and Change 0159 assumed "Gemini CLI has no skill mechanism"; Gemini CLI 0.64.0
discovers project skills in `.agents/skills/` (the path AIEF already writes for Codex) when the
folder is trusted. `cli/tests/assistant-parity.test.js` covered 3 of the 5 assistants in
`ASSISTANT_FILES` (no Cursor, no Kiro).

## Decision (human)

The owner set the scope on 2026-10-21 (feasibility assessment, initiative I3, proposed Change 0163):
map Gemini to the shared `.agents/skills/aief-change/SKILL.md`, keep installs idempotent when two
assistants share one path, point `aief prompt gemini` at the installed skill, correct the outdated
docs, and extend the parity tests to the five assistants.

## Scope

### In scope

- `SKILL_TARGETS.gemini` = `.agents/skills/aief-change/SKILL.md`, shared with Codex.
- Installer, updater, `update` and `doctor`: one action and one report line per physical path.
- `aief prompt gemini`: pointer to the installed skill instead of the inline procedure.
- `GEMINI.md`, code comments and user docs (`docs/assistant-workflow.md`, `docs/cli.md`,
  `README.md`) no longer say Gemini has no skill mechanism; they name the trusted-folder condition.
- `assistant-parity.test.js` covers claude, codex, gemini, cursor and kiro, including the skill
  path each one gets; `assistant-skill.test.js` updated.

### Out of scope

- A native skill for Cursor (needs verification against a real installation).
- Gemini hooks/guardrails (Change 0164).
- `new-change --type <feature|fix|documentation>` writing `Type: General` in `change.md` (found
  while opening this Change; follow-up).
- Amending ADR-039's text; version bump and release notes.

## Success Criteria

- `aief skill install gemini` writes `.agents/skills/aief-change/SKILL.md`; a second run, or an
  install for both Codex and Gemini, writes and reports that path once.
- `aief prompt gemini` points to the skill when it is installed, and carries the procedure when not.
- Parity tests pass for all five assistants.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --change 0163 --strict` pass.

## Status

Closed (2026-10-22)
