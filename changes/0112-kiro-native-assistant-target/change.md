# Change

## ID

`0112-kiro-native-assistant-target`

## Type

General

## Objective

Register **Kiro** as a fifth native assistant target, symmetric with `claude`/`gemini`/`codex`/
`cursor`, and fix a real fallback bug in `aief prompt` that would otherwise make `aief prompt kiro`
silently include `CLAUDE.md` — Claude's own instructions — in a Kiro prompt.

Kiro has no `KIRO.md`-style root instruction file (confirmed against a real Kiro installation:
Kiro auto-discovers every `AGENTS.md` in the workspace as "steering" and merges it — see
`evidence.md` for the exact validation). Its native artifact is a workspace **Skill**
(`.kiro/skills/<id>/SKILL.md`, the same package shape validated for `ai-specs/skills/` in Change
0110). This Change adds `.kiro/skills/aief-change/SKILL.md` — pure procedure (select a Change,
read `change.md`/`spec.md`/`tasks.md`, work an increment, respect `(human)`/`(review)` gates,
update `evidence.md`) — and registers it as Kiro's native file in `assistant-resolver.js`, so
`aief prompt kiro`, `AIEF_ASSISTANT=kiro`, `aief prompt --set-assistant kiro`, and passive
detection all work the same way they already do for the other four assistants.

Separately, `cli/src/commands/prompt.js` currently falls back to `CLAUDE.md` whenever the
resolved/requested assistant has no native file of its own and `CLAUDE.md` happens to exist in the
project (`prompt.js:92` and `:130`). This is real, reproducible behavior — not a documentation
typo — and `docs/cli.md` already (incorrectly) describes the intended behavior as "falls back to
AGENTS.md-only". Fixed here for every assistant, not just Kiro, since Kiro would otherwise inherit
the same bug on day one.

## Scope

### In scope

- `cli/src/core/domain/assistant-resolver.js`: add `kiro` to `ASSISTANT_FILES`, pointing at
  `.kiro/skills/aief-change/SKILL.md`.
- `cli/src/commands/prompt.js`: remove the hardcoded `CLAUDE.md` fallback (lines 92, 130); when the
  resolved assistant has no native file present, the prompt includes no assistant-specific file at
  all (the existing, correct "generic, AGENTS.md-only" case).
- `cli/src/commands/doctor.js`: `DOCTOR_GROUPS`'s "Assistants (optional)" list derives from
  `assistantIds()` instead of a separate hardcoded array, so a future fifth/sixth assistant does
  not need this file touched again.
- `cli/src/commands/misc.js`: help text's assistant list.
- `.kiro/skills/aief-change/SKILL.md`: new file — procedure only, no copied content from
  `AGENTS.md`/`spec.md`/`tasks.md`.
- `docs/cli.md`, `README.md`: add Kiro to the assistant compatibility tables; correct the
  fallback description to match actual code (AGENTS.md-only, never another assistant's file).
- Tests: extend `cli/tests/assistant-resolver.test.js` for `kiro`; add/extend a CLI-level test
  covering the fallback fix for an assistant with no native file present.

### Out of scope

- Kiro Specs (`.kiro/specs/`), steering files that duplicate `AGENTS.md`, Agent Hooks, Custom
  Agents, or MCP — no evidence in this project justifies any of them yet (see `evidence.md`).
- A "compact prompt" mode for workspace-aware assistants (Hypothesis C from the prior analysis) —
  a separate, general improvement to the prompt compositor, not specific to Kiro.
- Mitigating the nested `AGENTS.md` fixtures under `changes/0096-run-usability-validation-study/`
  appearing as Kiro steering — real (confirmed against Kiro's own docs, see `evidence.md`), but
  those fixtures are frozen evidence of a closed Change; renaming them is out of scope here and
  would need its own justification.

## Success Criteria

- `aief prompt kiro` succeeds (no longer "unknown assistant"), includes
  `.kiro/skills/aief-change/SKILL.md` when present, and never includes `CLAUDE.md`.
- `aief prompt gemini` (or any assistant without its native file present) no longer includes
  `CLAUDE.md` even when it exists in the project — matches `docs/cli.md`'s documented behavior.
- `aief doctor` lists `kiro` under Assistants without a second hardcoded list to maintain.
- `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.

## Status

Closed (2026-09-02)
