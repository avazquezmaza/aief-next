# Specification

## Goal

Every adopting project gets a working `aief-change` skill from AIEF itself, and every assistant
session loads only policy until Change work starts.

## Requirements

### R1: Template

- `cli/templates/skills/aief-change/SKILL.md` with frontmatter `name: aief-change`, a trigger-focused
  `description`, and `metadata.version`. The body is the full procedure and references no file that
  only exists in AIEF's repository.

### R2: Installation

- Targets: `claude` → `.claude/skills/aief-change/SKILL.md`, `kiro` → `.kiro/skills/aief-change/SKILL.md`,
  `codex` → `.agents/skills/aief-change/SKILL.md`.
- `aief bootstrap` installs for the configured assistant (`--assistant <id>`, else
  `knowledge/assistant.json`), or all three when none is configured. A configured assistant without
  a skill target (Gemini, Cursor) gets none.
- `aief skill install [assistant]` installs the same way on demand.
- Each install reports one of: created, updated, up to date, modified (left alone).

### R3: Updates

- An existing file is replaced only when byte-identical to a previously shipped version (known
  hashes). A modified file is never written.
- `aief doctor` reports a modified copy whose `metadata.version` is older than the template's.

### R4: AGENTS.md

- Procedure sections (AIEF Workflow, Required Completion Checklist, Evidence Guidance and the
  procedural part of Working with Changes) move to the skill. Policy stays. About 110 lines.
  Root and template stay identical.

### R5: Prompt

- When the resolved assistant has no installed skill, `aief prompt` includes the procedure (the
  template body without frontmatter). When it has one, the prompt says to follow it.

### R6: Detection

- Passive assistant detection ignores a skill file byte-identical to any shipped template version.

### R7: Repository, docs, release

- This repository's skills are copies of the template (test). Docs updated. Version 4.1.0 and
  `releases/v4.1.0.md`.

## Acceptance Criteria

- [x] R1–R7 implemented with tests.
- [x] `npm test`, `npm run lint`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
