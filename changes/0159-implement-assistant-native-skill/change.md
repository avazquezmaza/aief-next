# Change

## ID

`0159-implement-assistant-native-skill`

## Type

General

## Objective

Implement ADR-039 as decided in Definition Change 0158: one self-contained `aief-change` skill
installed for Claude Code, Kiro and Codex, `AGENTS.md` reduced to policy, and the procedure carried
by `aief prompt` for assistants without a skill. Release 4.1.0.

## Scope

### In scope

- `cli/templates/skills/aief-change/SKILL.md`: the self-contained procedure.
- Installation: `aief bootstrap` installs it for the configured assistant, or all three when none
  is configured; `aief bootstrap --assistant <id>`; new `aief skill install [assistant]`.
- Updates: overwrite only a file byte-identical to a previously shipped version; `aief doctor`
  reports a modified, outdated copy.
- `AGENTS.md` (template and root): procedure moved to the skill, policy kept (~110 lines).
- `aief prompt`: includes the procedure for an assistant with no installed skill.
- Passive assistant detection must not treat an AIEF-installed skill as a user signal (installing
  all three would otherwise make every project look like a Kiro project).
- This repository's own skills become copies of the template; a test enforces it.
- Docs, tests, version 4.1.0, release notes.

### Out of scope

- Guardrails as configuration, private mode (later wave-2 Changes).
- Rewriting a project's hand-written `CLAUDE.md`.

## Success Criteria

- `aief bootstrap` in a fresh project installs the skill in `.claude/skills/`, `.kiro/skills/` and
  `.agents/skills/`, all identical to the template.
- A modified installed skill is never overwritten, and `aief doctor` reports it when outdated.
- `AGENTS.md` is ~110 lines and identical to its template.
- `npm test`, `npm run lint` and `aief verify --strict` pass.

## Status

Closed (2026-10-05)
