# Change

## ID

`0084-end-to-end-pre-implementation-initialization`

## Type

General

## Objective

Validate the complete pre-implementation Definition capability (Changes 0079–0083) end to end
against a realistic, disposable PRD-only project — and a real implemented-project regression
scenario — then document the flow: Definition vs Analysis, project maturity, starting from a PRD
with no code, Definition enrichment, human decision gates, durable decisions, maturity-aware
standards, `verify` vs `verify --strict`, and handoff to implementation.

## Inventory of what already exists (ADR-013 accounting)

- Every capability this Change exercises already exists (Changes 0079–0083); this Change adds no
  new code capability — only a permanent regression test codifying the end-to-end flow, and
  documentation of already-implemented, already-tested behavior. Nothing here documents behavior
  tests do not prove (commissioning brief §12).
- Doc edits extend existing reference pages (`docs/concepts.md`'s `## Change` section,
  `docs/cli.md`'s existing command tables, `docs/getting-started.md`'s existing walkthrough
  sections) rather than creating new documents — same "extend an existing surface" pattern used
  throughout this program.

## Scope

### In scope

- A disposable, realistic PRD-only fixture (multi-tenancy, authentication, RBAC, data storage,
  deployment, external integrations, audit requirements, availability, expected scale — all
  unresolved) run manually through the full flow once (recorded in this Change's evidence.md), and
  as two permanent automated regression tests in `cli.test.js`:
  1. PRD-only repo → `bootstrap` → `analyze` (Definition) → enrichment markers → `status`
     (Definition readiness) → `verify --strict` (fails while unresolved) → human approval →
     durable decision → `verify --strict` (passes) → `close` — with an explicit assertion that no
     Analysis Change and no application code (`src/`) was ever created.
  2. A real implemented Node app (`package.json` + `src/`) → `bootstrap` → `analyze` — confirms
     the maturity-routing addition is a no-op for an already-implemented project (still an
     Analysis Change, no "Detected maturity: Definition" note).
- Documentation: `docs/concepts.md` (Definition Change + Project Maturity), `docs/cli.md`
  (`analyze --maturity`, `new-change --type definition`, `status`'s Definition readiness block,
  `verify --strict`), `docs/getting-started.md` ("Starting from a PRD (no code yet)" walkthrough).

### Out of scope

- Any new CLI capability — this Change is validation and documentation only.
- Rewriting or expanding docs unrelated to this program (e.g. no changes to `workflow.md`,
  `architecture.md`, `examples.md`).

## Success Criteria

- The disposable PRD-only project completes the full flow with zero application code generated as
  a side effect, and zero Analysis Change created.
- The real implemented-project regression scenario shows byte-for-byte unchanged `analyze`
  behavior.
- Both scenarios exist as permanent, automated tests, not only as a manual demonstration.
- Documentation accurately reflects only proven, tested behavior.

## Status

Closed (2026-08-14)
