# Specification

## Goal

Assistant selection is intuitive and fail-loud, and the post-adoption Change sequence is self-explanatory — with documentation that matches CLI behavior exactly.

## Requirements

- `prompt` resolves the assistant as: explicit `--assistant` > first positional argument > none. Recognized: claude, gemini, codex, cursor.
- Unknown requested assistant (positional or flag): print `Unknown assistant "<value>".`, the known-assistants list, and `If you meant a role, use: --profile <value>`; exit 1; do not generate a prompt.
- Valid assistant whose instruction file is missing in the project: print an explicit note (no silent substitution).
- Help usage and COMMAND_HELP example show the positional form first with the long form noted.
- All doc flows use `aief prompt <assistant>` as the primary form.
- Adoption sequence guidance (three facts: closing adoption first is not required; latest open Change is active automatically; close order is irrelevant) present in docs/Workflow.md Level 1, README adoption section, docs/cli.md guarantees, and the generated adoption tasks note using the agreed wording.

## Acceptance Criteria

- [ ] `aief prompt gemini|claude|codex|cursor` selects the matching instruction file (tests).
- [ ] `aief prompt gemini --assistant codex` uses CODEX.md (test).
- [ ] `aief prompt architect` exits 1 with the guidance error and no prompt output (test).
- [ ] Full flow re-validated (doctor → adopt → verify → analyze → prompt → verify) with the new syntax.
- [ ] Full suite passes; `aief verify` passes; Change closed via `aief close --yes`.
