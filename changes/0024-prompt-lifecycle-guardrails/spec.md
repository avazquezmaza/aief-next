# Specification

## Goal

The generated prompt is safe across the whole Change lifecycle: first run, re-run over completed work, and runs that include meta-asks about AIEF itself.

## Requirements

- Evidence-state detection: real content = evidence.md exists, non-empty after trim, and not the placeholder template (reuses `evidenceIsPlaceholder`); empty or template evidence is the normal fresh case and produces no warning.
- Guardrail text (only when real content): "evidence.md already exists and has real content" + do not overwrite blindly + review/amend only if needed + preserve validated evidence + report re-verification when nothing changed.
- "Where results belong" block always present: project evidence → `<change>/evidence.md`; AIEF/tooling feedback → assistant response, separate file only on explicit request.
- Analysis branch: "complete or amend" (not "complete only"); tasks.md not marked by the assistant unless explicitly asked; assistant reports which tasks appear complete. Implementation branch unchanged.
- No behavior changes outside the `prompt` function.

## Acceptance Criteria

- [ ] Prompt over real evidence includes the guardrail (test).
- [ ] Prompt over fresh/template and over empty evidence excludes the strong warning (test).
- [ ] Prompt includes the results-destination block and the tasks-ownership clarification for Analysis Changes (test).
- [ ] Existing suite still passes; `aief verify` passes; Change closed via `aief close --yes`.
