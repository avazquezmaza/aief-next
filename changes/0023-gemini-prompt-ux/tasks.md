# Tasks

## Implementation

- [x] Positional assistant resolution in `prompt` with `--assistant` precedence.
- [x] Hard error with guidance for unknown assistants (positional and flag); exit 1; no prompt generated.
- [x] Explicit note when a valid assistant's instruction file is missing (no silent substitution).
- [x] Help usage + COMMAND_HELP example updated to the short form.
- [x] Analyze `Next:` hint updated to the short form.
- [x] Adoption tasks note: "can be closed before or after the Analysis Change…".

## Documentation

- [x] README: short form in flows and commands; adoption-sequence paragraph.
- [x] docs/cli.md: prompt row (both forms, fail-loud), guarantees line for the adoption sequence, flow example.
- [x] docs/Workflow.md: "The adoption Change" subsection in Level 1; short form in the with/without OpenSpec guide.
- [x] cli/README.md: flows updated to the short form.
- [x] CHANGELOG entry.

## Verification

- [x] 3 new tests (4 positional assistants, precedence, unknown-value error); suite 40/40.
- [x] Full flow re-run in sandbox with `aief prompt gemini` and the adoption guidance visible.
- [x] `aief verify` at repo root passes.

## Evidence

- [x] Update evidence.md
