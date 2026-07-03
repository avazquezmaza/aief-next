# Tasks

## Implementation

- [x] Review LIDR Specboot repository (concepts extracted: modular standards, agents/roles, skills as reusable knowledge, single source of truth).
- [x] Review real OpenSpec repository (finding: `propose` is an assistant slash command; `openspec-ai/openspec` URL is 404 — real repo is Fission-AI/OpenSpec).
- [x] Create 6 standards templates under `cli/templates/standards/`.
- [x] `adopt` creates signal-matched standards, never overwrites, prints and registers what it created.
- [x] Extend `skills-catalog.json` with operational Skill content (6 skills + honest fallback without content).
- [x] `recommendSkills` passes full skill content through.
- [x] `analyze` seeds Detected Context (signals, skills, standards, inferred risks, open questions) + confirmation tasks.
- [x] `prompt` includes standards and Skill context with explicit honesty notes.

## Documentation

- [x] ADR-010 in `knowledge/decisions.md`.
- [x] OpenSpec adapter: official workflow + slash-command finding + honest validation status.
- [x] README (standards & Skills section, updated flow descriptions), `docs/cli.md` (3-concept anatomy, standards), `cli/README.md`.
- [x] CHANGELOG entry.

## Verification

- [x] 6 new tests (standards creation/no-overwrite, unknown stack, analyze seeding, prompt context, honest no-content path, verify after adopt).
- [x] Full suite: 31/31 pass.
- [x] `aief verify` at repo root passes.

## Evidence

- [x] Update evidence.md
