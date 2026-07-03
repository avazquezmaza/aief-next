# Change

## ID

`0022-visible-skills`

## Type

General

## Objective

Make the recommended Skills visible in the adopted project as `knowledge/skills.md` — a readable artifact showing which Skills apply, why, and how to use them as context — without introducing a new system, commands or execution semantics.

## Scope

### In scope

- `aief adopt` writes `knowledge/skills.md` with only the Skills recommended for the detected project: name, why recommended (detection reasons), when to use, related standards, prompt context, common risks, evidence expectations; honest "No operational content yet." for Skills without content.
- Never overwrite an existing `knowledge/skills.md`; report it and stay idempotent.
- Compact adopt output: no full signal/skill dump (points to `aief doctor` and skills.md); "Skills documented:" / "already exists" lines.
- `analyze` seeded context and `prompt` reference `knowledge/skills.md` when present. The catalog remains the technical source.

### Out of scope

- Skills as commands, execution, plugins or new hierarchy; new commands; hidden state; replacing AGENTS.md; anything beyond the single file.

## Success Criteria

- An adopted project shows its Skills and reasons in `knowledge/skills.md`.
- Adopt remains safe, additive and idempotent.
- Full suite passes; `aief verify` passes.

## Status

Closed (2026-07-03)
