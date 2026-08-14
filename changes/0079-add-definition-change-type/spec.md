# Specification

## Goal

`aief new-change <name> --type definition` produces a Change scaffold oriented to
pre-implementation definition work, and `aief prompt` on such a Change instructs the assistant
accordingly — reusing existing mechanisms (`## Type`, `(human)` tasks, `knowledge/decisions.md`),
adding no new command, no new approval mechanism, no hidden state.

## Requirements

- `createChange()` gains a `definition` branch (`definitionChangeFiles()`) producing
  `change.md`/`spec.md`/`tasks.md`/`evidence.md` with every section listed in change.md's Scope.
- `change.md`'s `## Decision (human)` section must never be pre-filled with an approval — it must
  read as pending until a human edits it.
- `tasks.md` must include at least one `(human)` task gating approval, and it must remain
  unchecked by default (never auto-checked by this Change's own tooling).
- `changeType(changeDir)` must resolve `Definition` scaffolds to `"definition"` — no change to
  `changeTypeFromContent()` itself is needed since it is already free-text/case-insensitive.
- `prompt()` must recognize `type === "definition"` and print instructions that: forbid
  implementing application code; ask the assistant to work through Context → Open Questions →
  Decisions Required → Options Considered → Recommendation; forbid the assistant from filling in
  `## Decision (human)` or checking off `(human)` tasks; ask that approved decisions be recorded
  in `knowledge/decisions.md`.
- `aief help new-change` documents `--type definition` with an example.
- No change to `checkChangeReadiness()`, `verifyProject()`, `verifyChange()`, or the manifest
  schema — Definition Changes must be governed by exactly the same close/verify rules every other
  typed Change already uses (missing/empty files, unresolved status, evidence completeness, open
  tasks including `(human)` ones).

## Acceptance Criteria

- [ ] `aief new-change "x" --type definition` creates a Change whose `change.md` declares
      `## Type` / `Definition` and contains every section listed in the Scope above.
- [ ] `aief prompt` on that Change prints "This is a Definition Change", "Do not implement
      application code", and a warning against self-approving `(human)` decisions.
- [ ] `aief close --yes` on a fresh Definition Change is refused while its `(human)` Human
      Approval tasks are unchecked, using the existing open-tasks rule (no new code path).
- [ ] `aief verify` reports a Definition Change the same way it reports any other typed Change
      with no missing/empty files (no Definition-specific branch added to the verifier).
- [ ] Existing Analysis/Enrichment/General `new-change` and `prompt` behavior is byte-identical
      (regression tests pass unchanged).
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
