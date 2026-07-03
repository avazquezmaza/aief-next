# Specification

## Goal

Make AIEF easier to adopt in existing projects by turning the CLI into a guided workflow instead of a simple folder generator.

## Requirements

- Commands must explain their purpose.
- Commands must state whether they modify files.
- `doctor` must inspect environment and project readiness.
- `adopt` must prepare minimum AIEF structure for existing projects.
- `analyze` must create an Analysis Change with useful defaults.
- `prompt` must generate a ready-to-paste assistant prompt.
- `close` must provide a Change closure checklist.
- Help must be available per command.
- CLI must recommend possible Skills based on project signals.
- CLI must remain dependency-free.

## Acceptance Criteria

- [ ] `aief help doctor` explains doctor.
- [ ] `aief doctor` recommends next step.
- [ ] `aief adopt` creates minimum AIEF files without modifying source code.
- [ ] `aief analyze` creates an Analysis Change.
- [ ] `aief prompt --profile architect` generates a useful prompt.
- [ ] `aief close` prints closure checklist.
- [ ] `aief verify` still works.
- [ ] CLI docs are updated.
