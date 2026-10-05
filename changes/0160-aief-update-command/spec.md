# Specification

## Goal

`aief update` brings every AIEF-shipped file in a project to the current version, and only those
nobody edited.

## Requirements

- R1: `templates/agents/previous-versions.json` holds the sha256 of every `AGENTS.md` template and
  root version in this repository's history.
- R2: `core/domain/shipped-file.js` classifies content as missing, current, shipped-older or
  modified; `assistant-skill.js` and the new `agents-file.js` use it.
- R3: `aief update` replaces shipped-older `AGENTS.md` and installed skills, leaves modified ones,
  skips missing ones, lists skill-capable assistants without the skill, and is idempotent.
- R4: `aief doctor` lists `AGENTS.md` under "AIEF-shipped files" and points older unmodified files
  to `aief update`.
- R5: Docs, ADR-040, version 4.2.0, release notes.

## Acceptance Criteria

- [x] R1–R5 implemented with tests.
- [x] `npm test`, `npm run lint`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
