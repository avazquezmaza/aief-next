# Change

## ID

`0023-gemini-prompt-ux`

## Type

General

## Objective

Remove the two UX frictions detected during the real Gemini validation on trk-orchestrator-portal: assistant selection via CLI arguments (silent Claude fallback when typing `aief prompt gemini`) and the unexplained adoption-Change sequence. No new capabilities, no architecture changes, no workflow changes.

## Scope

### In scope

- `aief prompt <assistant>` positional syntax alongside `--assistant` (claude, gemini, codex, cursor); explicit `--assistant` wins when both are given; unknown values fail with a clear multi-line error including the `--profile` hint. Never a silent fallback (including a note when the selected assistant file is missing from the project).
- Documentation and CLI help aligned: short form shown as the primary example (README, docs/cli.md, docs/Workflow.md, cli/README.md, help usage, analyze hint).
- Adoption-Change sequence documented: not required to close it first; latest open Change is automatically active; close before or after the Analysis Change with `aief close --yes --change adopt-aief`; order does not affect AIEF. Documented in docs/Workflow.md (canonical), README, docs/cli.md and the generated adoption tasks text.

### Out of scope

- embed-standards; changes to Prompt content blocks, Analyze, Verify, Standards, Skills, Profiles, OpenSpec.
- Positional arguments for other commands (e.g. `aief close 0002`) — documented as a future recommendation only.

## Success Criteria

- Both syntaxes work; unknown assistant values error with guidance; docs match CLI behavior exactly.
- The adoption-Change question is answered wherever a user would look.
- Full suite passes; `aief verify` passes.

## Status

Closed (2026-07-03)
