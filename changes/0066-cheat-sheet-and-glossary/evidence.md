# Evidence

## Summary

Added `docs/cheat-sheet.md`, a one-page glossary + canonical-flow lookup, complementary to
`docs/concepts.md`. Linked it from `docs/concepts.md`'s intro and from `README.md`'s documentation
table. No CLI/runtime code touched.

## Activities Performed

- Extracted the 13 real `##` headings from `docs/concepts.md` (did not guess anchors from memory).
- Derived each heading's GitHub anchor slug programmatically and cross-checked against the
  repo's own existing anchor usage (`workflow.md#harness--hooks-runtime-visibility-and-configuration`,
  etc.) to confirm the slugging rule (punctuation stripped, `—`/`/` collapse to a double hyphen,
  spaces become hyphens, hyphens inside text are preserved).
- Wrote `docs/cheat-sheet.md`: a 13-row glossary table (term / one-line meaning / link to
  `concepts.md`) and a 7-step "Canonical flow" block linking to `docs/workflow.md`.
- Added exactly one sentence to `docs/concepts.md`'s opening paragraph pointing to the new file.
- Added a cheat-sheet link to the existing Concepts row of `README.md`'s documentation table
  (no reordering, no new row).

## Verification

- Ran a script (Python, ad hoc) that parses `docs/concepts.md`'s real headings, computes their
  anchors, and checks every `concepts.md#...` link in the new `docs/cheat-sheet.md` against them:
  13/13 resolved, 0 missing.
- `npm test` (root, delegates to `cli` and `examples/todo-app`): 756/756 passing.
- `node cli/bin/aief.js verify` (full repo): PASS.
- `git diff --check`: clean (no whitespace errors).
- `git diff --stat docs/concepts.md`: 1 file changed, 2 insertions(+), 1 deletion(-) — the single
  added sentence (counted as +2/-1 because it was appended to the existing paragraph's last line).
- Confirmed via `git status --short`: only `README.md`, `docs/concepts.md` modified and
  `docs/cheat-sheet.md`, `changes/0066-cheat-sheet-and-glossary/` added — nothing under `cli/src/`.

## Findings

- `docs/concepts.md` had no prior quick-lookup path; a reader had to scan 187 lines of prose to
  find one term.
- The repo's anchor-slugging convention (double hyphen for em-dash/slash) is undocumented but
  consistent across every existing internal link — worth confirming programmatically rather than
  guessing, which this Change did.

## Risks

- None identified. Purely additive documentation; no behavior change; no removed content.

## Artifacts Produced

- `docs/cheat-sheet.md` (new)
- `docs/concepts.md` (1 sentence added)
- `README.md` (1 link added to an existing table cell)

## Lessons Learned

- Verifying anchors programmatically (rather than by inspection) caught that a naive slugifier
  (simple lowercase + hyphenate) would have produced single-hyphen anchors for headings with
  em-dashes or slashes, which would have silently 404'd on GitHub — worth doing for any future doc
  Change that links into `concepts.md` or `workflow.md`.

## Next Change

None required by this Change. Ready for `aief close --yes --change 0066-cheat-sheet-and-glossary`.
Per the roadmap, the next planned Change is #9 (ejemplos ejecutables) or #13 (pulir UX de
status/mensajes) — see conversation history for the agreed sequence.
