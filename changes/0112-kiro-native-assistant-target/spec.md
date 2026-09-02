# Specification

## Goal

`aief prompt kiro` works exactly like `aief prompt claude`/`gemini`/`codex`/`cursor` — resolved
the same way, through the same four layers (explicit, `AIEF_ASSISTANT`, `knowledge/assistant.json`,
passive detection) — and never includes another assistant's instruction file as a fallback.

## Requirements

- R1: `ASSISTANT_FILES` (the single registry `assistant-resolver.js` documents as "the single
  source of truth for known assistants") gains `kiro: ".kiro/skills/aief-change/SKILL.md"`.
  `hasAssistant("kiro")`, `assistantIds()`, passive detection, and every existing resolver
  precedence rule apply to it unchanged — no new code path.
- R2: `prompt.js` no longer falls back to `CLAUDE.md` when the resolved assistant's own file is
  absent. When no native file is found for the resolved assistant, the prompt includes no
  assistant-specific file line at all (today's documented, and now actually correct, "generic
  AGENTS.md-only" case) — for every assistant, not only `kiro`.
- R3: The warning previously printed at `prompt.js:92` ("...including CLAUDE.md instead") is
  removed or rephrased to no longer claim a substitution that no longer happens.
- R4: `doctor.js`'s "Assistants (optional)" group lists exactly `assistantIds()`, in the same
  order the resolver returns them — not a separately maintained array.
- R5: `.kiro/skills/aief-change/SKILL.md` exists with YAML frontmatter (`name`, `description`, at
  minimum) and a body describing, as procedure only: select a Change, read
  `change.md`/`spec.md`/`tasks.md`, work one increment/task at a time, never check a `(human)` or
  `(review)` task, update `evidence.md`, run `aief verify --change <id>`. It MUST NOT restate
  `AGENTS.md`'s policy content or copy any Change's `spec.md`/`tasks.md`.
- R6: `misc.js` help text and `docs/cli.md`/`README.md`'s assistant tables list `kiro` alongside
  the existing four, with the corrected fallback description.

## Acceptance Criteria

- [ ] `aief prompt kiro` in a project with `.kiro/skills/aief-change/SKILL.md` present includes
      that path in the generated prompt.
- [ ] `aief prompt kiro` in a project **without** that Skill present succeeds (not "unknown
      assistant"), includes no assistant-specific file line, and prints no `CLAUDE.md` mention —
      even when `CLAUDE.md` exists in the project.
- [ ] `aief prompt gemini` (or `codex`/`cursor`) in a project with only `CLAUDE.md` present no
      longer includes `CLAUDE.md` in the generated prompt.
- [ ] `AIEF_ASSISTANT=kiro aief prompt` and `aief prompt --set-assistant kiro` both work
      identically to the existing four assistants.
- [ ] `aief doctor` lists `kiro` under "Assistants (optional)".
- [ ] `npm test` passes, including new/updated tests for the above.
- [ ] `node cli/bin/aief.js verify --change 0112-kiro-native-assistant-target --strict` passes.
