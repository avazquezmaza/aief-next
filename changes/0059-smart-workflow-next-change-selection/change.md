# Change

## ID

`0059-smart-workflow-next-change-selection`

## Type

General

## Objective

Give `aief status --next` (without `--change`) a real answer when more than one Change is open,
instead of today's hard "select one explicitly" error: deterministically identify and explain the
next eligible Change, reusing Change 0058's `buildGraph()` and the existing Workflow Engine's gate
blockers — never inferring anything from Change id, folder name, or date.

## Inventory of what already exists (read before designing)

- **`aief status --next`** (Change 0046, ADR-018) already exists, but only for the
  **single-open-Change** case: `resolveImplicitChange()` returns that one Change; with zero open
  Changes it errors "No open Change found"; with **more than one**, it errors "Multiple open
  Changes ... not selecting one implicitly" and stops — the exact scenario this Change addresses.
- **`buildGraph()`** (Change 0058, ADR-028) already computes, deterministically: resolved edges
  (`dependsOn` targets that exist), and `issues` (`missing_dependency`, `self_dependency`,
  `duplicate_dependency`, `cycle`) — reused unmodified, not recomputed.
- **The Workflow Engine's gate blockers** (`resolveWorkflowFor()`, `workflow.state.blockers`,
  Change 0044/0046, ADR-018) are the **one existing, official, already-blocking condition** in
  this codebase — reused as-is for "no está bloqueado por otra condición oficial ya existente."
  Loop (0057) and Harness (0056) are both explicitly, deliberately **non-blocking by design**
  (ADR-026/027) — neither is used as an eligibility condition here (see spec.md "Non-goals").
- **`getChangeDirs()`'s sort** (alphabetical basename, which is numeric order for zero-padded
  Change ids) is already the ubiquitous ordering convention across `buildGraph()`'s `nodes`,
  `statusOverview()`'s listings, etc. — reused as the deterministic tie-break, not invented.

## Deliberate, documented behavior change

`cli/tests/cli.test.js`'s `"status --next with multiple open Changes produces an actionable
ambiguity error, exit 1, no guess"` test encoded the *old* design intentionally. This Change
replaces that behavior **only** for the multiple-open-Changes case — exactly the scenario
commissioned — with a deterministic recommendation or an honest "no eligible Change" report. The
single-open-Change and zero-open-Change paths are untouched, byte-identical, still tested. This is
the same kind of explicit, instructed replacement Change 0052 applied to `init`/`adopt`, not an
accidental regression — recorded here and in ADR-029 rather than silently changed.

## Scope

### In scope

- `cli/src/core/services/next-change-service.js` (new): `selectNextChange(changes, graph)` — pure,
  deterministic eligibility evaluation and tie-break over already-computed facts. No filesystem
  access, no CLI dependency, independently unit-testable.
- `cli.js`: gathers real Changes' facts (open/closed, manifest validity, workflow blockers) and
  the project Graph (`buildProjectGraph()`, unmodified), calls `selectNextChange()`, renders the
  result. Wired into `aief status --next` (no `--change`) **only** when more than one Change is
  open — the 0/1-open-Change paths are completely untouched.
- ADR-029, docs (`workflow.md`, `architecture.md`, `concepts.md`, `cli.md`).
- Updates the one existing test whose assertion encoded the superseded behavior; adds new
  coverage for the new one.

### Out of scope (explicit, per commissioning instruction)

- Loop/Harness state as an eligibility condition — both are non-blocking by design (ADR-026/027);
  using either here would silently give them new blocking authority never granted.
- Any change to `aief status --change <id> --next` (explicit single-Change compact view),
  `aief status --graph`, `aief verify`, `aief close`, `aief prompt`, Bootstrap, or LIDR.
- Inferring dependencies or priority from Change id, folder name, or date — eligibility and
  tie-break both read only real, already-official facts (`dependsOn`, `closed`, Graph issues,
  Workflow gate blockers); the sort-by-id tie-break is applied strictly *after* eligibility is
  already decided from those facts, never used to decide eligibility itself.
- Automatic planning beyond picking one next Change; no multi-step plan, no reordering suggestion.

## Status

Closed (2026-07-31)
