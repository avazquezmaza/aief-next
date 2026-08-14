# Specification

## Goal

Prove, with a real (disposable) end-to-end run and a permanent regression test, that AIEF can
carry a repository from a PRD with no code through a governed Definition process to an
implementation-ready handoff — and that this adds zero regression for already-implemented
projects — then document exactly that proven behavior.

## Requirements

- A manually-run, disposable PRD-only project (kept in evidence.md's Activities Performed as a
  transcript, not committed as a fixture) exercises: `bootstrap` → `analyze` (Definition
  detected) → filling in Definition sections with `(decision required)`/`(ambiguous)`/`(deferred)`/
  `(human)` markers → `status --change` (Definition readiness reflects them) → `verify --strict`
  (fails: unresolved decision + unresolved human task) → human approval recorded in
  `Decision (human)` + `knowledge/decisions.md` → `verify --strict` (passes) → `close --yes`.
- The same flow exists as an automated `cli.test.js` test, asserting at minimum: Definition Change
  (not Analysis) created; `status --change` reflects Decision required/Human approval required
  counts; `verify --strict` fails before approval and passes after; `close` succeeds; no `src/`
  directory exists afterward; the closed Change's `## Type` is never `Analysis`.
- A second automated test proves a real implemented Node app (real `package.json` dependencies +
  `src/`) is unaffected: `analyze` still creates an Analysis Change, with no "Detected maturity:
  Definition" line in its output.
- `docs/concepts.md` documents the Definition Change type and the Project Maturity model
  (Implemented/Definition/Ambiguous), consistent with `classifyMaturity()`'s actual rules.
- `docs/cli.md` documents `analyze`'s maturity routing and `--maturity` override, `new-change
  --type definition`, `status --change`'s Definition readiness block, and `verify --strict` — each
  citing the Change that introduced it, matching every other row in that reference.
- `docs/getting-started.md` adds a walkthrough section for the PRD-only flow, using the same
  commands and output shape actually produced (no invented command or output not exercised by a
  test).

## Acceptance Criteria

- [ ] The end-to-end automated test passes: Definition routing, enrichment markers reflected in
      `status`, `verify --strict` fails-then-passes around the human-approval step, `close`
      succeeds, no Analysis Change or `src/` ever created.
- [ ] The implemented-project regression test passes: unchanged Analysis routing.
- [ ] `docs/concepts.md`, `docs/cli.md`, `docs/getting-started.md` updated; no behavior documented
      that a test does not exercise.
- [ ] Full existing suite passes unmodified.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
