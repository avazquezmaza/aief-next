# Specification

## Goal

Finish the first usable AIEF MVP without adding unnecessary complexity.

## Requirements

- Add role-based profiles under `profiles/`.
- Keep profiles short and model-agnostic.
- Add `adapters/specboot/`.
- Add practical docs:
  - `learning-path.md`
  - `migration-guide.md`
  - `choosing-your-workflow.md`
  - `project-lifecycle.md`
- Add release/community files:
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `SUPPORT.md`
  - `releases/v1.0.0.md`
- Add GitHub issue templates.
- Add basic Markdown validation workflow.

## Acceptance Criteria

- [ ] Profiles exist and are readable in minutes.
- [ ] Specboot adapter is optional and does not replace AIEF.
- [ ] Developer docs are practical and concise.
- [ ] Release files are present.
- [ ] Change evidence is complete.

## Constraints

- Do not over-engineer.
- Do not introduce dependencies.
- Do not require Specboot.
- Keep v1 focused on usability.
