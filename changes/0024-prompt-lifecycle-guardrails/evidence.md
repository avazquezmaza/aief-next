# Evidence

## Summary

Both frictions from the Claude Code validation on trk-orchestrator-portal are closed with prompt-text guardrails only — no new commands, no hidden state, verify/close untouched. Re-running `aief prompt` on a Change whose evidence.md already has real content now tells the assistant explicitly: do not overwrite blindly, review and amend only if needed, preserve validated evidence, and report a re-verification when nothing changed. Every prompt now states where results belong (project evidence in evidence.md; AIEF/tooling feedback in the assistant's response unless a feedback file is explicitly requested). The "complete only evidence.md" vs `close` contradiction is resolved in the Analysis branch: complete **or amend** evidence.md, leave tasks.md to humans unless explicitly delegated, and report which tasks appear complete.

## Activities Performed

- Analyzed current `prompt` behavior first: it never inspected evidence state; `evidenceIsPlaceholder()` (0017) was reusable, but empty/missing evidence had to be handled separately since the placeholder check only counts "Pending." lines — real content = non-empty after trim AND not template.
- Added the re-run guardrail block (rendered only when real content exists) and the always-present "Where results belong" block, both derived purely from files.
- Rewrote the Analysis-branch instructions per the conservative default: complete/amend evidence.md; do not mark tasks.md unless the Change or the user explicitly asks; tell the user which tasks appear complete. The implementation branch is unchanged; `close` is unchanged.
- One guarantee bullet in docs/cli.md; CHANGELOG entry.

## Verification

- CLI suite: **43/43 pass** (3 new tests: guardrail present when evidence has real content — including the "report that the evidence was re-verified" line; strong warning absent both for a fresh template evidence and for an explicitly emptied evidence.md; Analysis prompt contains the results-destination block, the tasks-ownership rule and "complete or amend").
- Existing prompt tests (positional assistants, precedence, standards/skills blocks, CRLF analysis detection) unaffected — same run.
- `aief verify` at repo root: PASS (after closing this Change).

## Findings

- The validation that motivated this Change had already demonstrated the correct target behavior manually: the assistant amended the portal's completed evidence with a re-verification note instead of overwriting, and delivered AIEF feedback in its response. This Change encodes that behavior into the prompt so it no longer depends on assistant judgment.
- The empty-evidence edge case (trim-empty file would have been classified as "real content" by the placeholder check alone) was caught during analysis and is covered by a dedicated test.

## Risks

- Prompt length keeps growing with each contextual block; still moderate (~70 lines worst case), but a future validation should watch for assistant attention dilution.

## Recommendations

- On the next real validation, confirm assistants actually follow the re-run guardrail (the text is new; its effectiveness is an assumption until observed).
- Revisit the always-on "Where results belong" block if prompt length becomes a measured problem — it could become conditional on meta-asks, but only with evidence.

## Artifacts Produced

- `cli/src/cli.js` (prompt function only), `cli/tests/cli.test.js` (+3 tests), `docs/cli.md`, `CHANGELOG.md`.

## Lessons Learned

- Lifecycle safety belongs in the artifact the assistant actually reads (the prompt), not in documentation the assistant never sees.
- "Derived from files, no hidden state" keeps holding: both guardrails needed zero new state, just reading what already exists.

## Next Change

Per the milestone review: proceed to the operational-knowledge roadmap (standards `(adapt)` seeding from detected scripts) or the next validation gate (external user / cross-stack), whichever the user prioritizes.
