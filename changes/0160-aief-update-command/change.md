# Change

## ID

`0160-aief-update-command`

## Type

General

## Objective

Resolve F2 from Change 0159: give projects a safe way to bring `AGENTS.md` and installed
`aief-change` skills up to date after an AIEF upgrade, without ever overwriting an edited file.

## Decision (human)

The owner chose, on 2026-10-05, a new `aief update` command over extending `aief skill install` or
relaxing `bootstrap`'s never-overwrite rule. Recorded as ADR-040.

## Scope

### In scope

- `aief update`: replace `AGENTS.md` and installed skills that are unmodified older AIEF versions;
  never write an edited file; never create a missing one; list skill-capable assistants without
  the skill.
- Known hashes of every `AGENTS.md` template this repository shipped.
- One shared classifier for shipped files, used by `AGENTS.md` and the skill.
- `aief doctor` reports an older unmodified `AGENTS.md` and points to `aief update`.
- Tests, docs, ADR-040, version 4.2.0, release notes.

### Out of scope

- Running `aief update` in any project (the owner decides when).
- Changing `bootstrap` or `aief skill install` behavior.

## Success Criteria

- An unmodified old `AGENTS.md` is replaced; an edited one is untouched; a missing one is not
  created.
- `npm test`, `npm run lint` and `aief verify --strict` pass.

## Status

Closed (2026-10-05)
