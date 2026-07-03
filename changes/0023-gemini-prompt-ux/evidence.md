# Evidence

## Summary

Both frictions from the real Gemini validation are closed. `aief prompt gemini` (and claude/codex/cursor) now works as a positional argument, `--assistant` keeps working and wins when both are given, and unknown values fail loudly with actionable guidance — the silent Claude fallback is gone in every path, including an explicit note when the selected assistant's instruction file is missing from the project. The adoption-Change sequence is now answered everywhere a user would look: canonical explanation in docs/Workflow.md, one paragraph in README, one guarantee line in docs/cli.md, and the generated adoption tasks carry the agreed wording ("this Change can be closed before or after the Analysis Change; the Analysis Change becomes the active Change automatically"). No behavior beyond prompt's argument parsing changed; no new commands; no hidden state.

## Activities Performed

- Assistant resolution in `prompt` (`cli/src/cli.js`): explicit `--assistant` > first positional > none; unknown values print the specified multi-line error (`Unknown assistant "<value>".` + known list + `If you meant a role, use: --profile <value>`), exit 1, and generate no prompt. Valid-but-missing assistant files produce an explicit note instead of silent substitution.
- Help usage line and `aief help prompt` example show the positional form first (`aief prompt gemini --profile architect (or: aief prompt --assistant gemini)`); the analyze `Next:` hint uses the short form.
- Documentation aligned to the short form as primary in README (flows, commands list, prompt step description), docs/cli.md (flow, prompt row noting fail-loud behavior), docs/Workflow.md (with/without OpenSpec guide), cli/README.md (both flow blocks). A repo-wide grep confirmed no remaining doc flow uses only the long form.
- Adoption sequence guidance added: docs/Workflow.md Level 1 subsection "The adoption Change" (three facts: no need to close first; latest open Change is automatically active; close order irrelevant, with the exact command), README adoption paragraph, docs/cli.md guarantees line, and the generated adoption tasks note (textual change only — no behavior change, no automatic closing).

## Verification

- CLI suite: **40/40 pass** (3 new tests: positional selection for all four assistants asserting the right instruction file per case; `aief prompt gemini --assistant codex` → CODEX.md and not GEMINI.md; `aief prompt architect` → exit 1, guidance message with `--profile architect` hint, and no prompt output).
- Full-flow re-validation in a sandbox project (Next.js + postgres + n8n/multitenant README + GEMINI.md): doctor → adopt (skills.md + standards + self-evidence + the new adoption note visible in tasks) → verify (Next hint) → analyze → `aief prompt gemini` (GEMINI.md, knowledge/skills.md and all six standards listed) → `aief prompt architect` (guidance error) → verify (Next pointing at the active Analysis Change).
- `aief verify` at repo root: PASS (after closing this Change).

## Findings

- The positional slot in `prompt` was completely unused, so the addition is unambiguous today; if a future positional meaning is ever wanted for `prompt`, the assistant names are now reserved.
- The pre-existing unknown-`--assistant` path was a warning + fallback; it now shares the hard-error path with positionals, which is what the "never silent fallback" criterion actually required.

## Risks

- None functional. The only behavior change outside prompt parsing is textual (generated adoption tasks note; analyze hint wording).

## Recommendations

- Future Change (out of scope here, as instructed): the same silent-positional pattern exists in `close` and `verify` (`aief close 0002` ignores the `0002`; selection requires `--change`) — same friction class, fix with the same recipe when a validation surfaces it.

## Artifacts Produced

- `cli/src/cli.js` (assistant resolution, error path, help texts, analyze hint, adoption tasks note)
- `cli/tests/cli.test.js` (+3 tests)
- `README.md`, `docs/cli.md`, `docs/Workflow.md`, `cli/README.md`, `CHANGELOG.md`

## Lessons Learned

- Silent fallbacks are the most expensive kind of bug for trust: the fix was trivial, but only a real validation with a non-default assistant surfaced it.
- "Documentation matches behavior" is cheapest to enforce right after changing behavior — the grep-and-align pass took minutes because 0019 had already centralized the workflow docs.

## Next Change

From future validations only. Candidate backlog already recorded: positional `--change` shorthand for close/verify, Analysis profile default (#5), aiRoadmap semantic false positive (#7), profile content (#8).
