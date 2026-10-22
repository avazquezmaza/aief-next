# Specification

## Goal

Gemini CLI gets the same installed `aief-change` skill as Claude Code, Kiro and Codex, and the
parity tests exercise every assistant in `ASSISTANT_FILES`.

## Requirements

- R1: `SKILL_TARGETS` (`cli/src/core/domain/assistant-skill.js`) maps `gemini` to
  `.agents/skills/aief-change/SKILL.md`. Verified before implementation: Gemini CLI 0.64.0 lists
  that file under `gemini skills list` in a trusted folder, and skips project skills in an
  untrusted one (output in `evidence.md`).
- R2: Installing for assistants that share a path is idempotent: `skillTargetsFor(null)` and
  `aief update`/`aief doctor` act on, and report, each physical path once; `aief skill install
gemini` after Codex's install reports "up to date" and writes nothing.
- R3: `aief prompt gemini` says "Follow the aief-change skill (.agents/skills/aief-change/SKILL.md)"
  when the file exists, and carries the inline procedure when it does not (unchanged ADR-039 D5
  rule, now reaching Gemini). Cursor keeps the inline procedure.
- R4: `GEMINI.md`, `skill-installer.js` and `prompt.js` comments, `docs/assistant-workflow.md`,
  `docs/cli.md` and `README.md` describe Gemini's skill support and its trusted-folder condition;
  none says Gemini has no skill mechanism.
- R5: `cli/tests/assistant-parity.test.js` runs its per-assistant tests for claude, codex, gemini,
  cursor and kiro, and checks the procedure each one gets: the pointer to `SKILL_TARGETS[id]` once
  the skill is installed, the inline procedure for Cursor.

## Acceptance Criteria

- [x] R1–R5 implemented with tests.
- [x] `npm test`, `npm run lint`, `git diff --check` and `aief verify --change 0163 --strict` pass.
- [x] (human) Owner reviews the diff and the Gemini discovery evidence before merge.
