# Change

## ID

`0012-adoption-engine-cli-ux`

## Objective

Improve the CLI experience for adopting AIEF in existing projects by making commands self-explanatory, adding adoption/analyze/prompt/close flows, and recommending Skills based on detected project signals.

## Scope

### In scope

- Add `aief adopt`.
- Add `aief analyze`.
- Add `aief prompt`.
- Add `aief close`.
- Add `aief help <command>` / `aief explain <command>`.
- Redesign command output to explain purpose, reads, writes and next step.
- Add basic project signal detection.
- Add basic Skill recommendations.
- Update CLI documentation.
- Add analysis Change templates.

### Out of scope

- Real ChatGPT Skill packaging.
- Installing Skills automatically.
- Interactive prompts.
- Full OpenSpec API integration.
- GitHub release automation.
