# Change

## ID

`0058-change-graph-dependency-model`

## Type

General

## Objective

Establish AIEF's official Change dependency model: an optional `manifest.json` `dependsOn` field,
a pure, reusable Graph domain module that builds and validates the dependency structure across a
project's Changes, and read-only exposure via `aief status`/`aief status --graph`/`aief verify
--change <id>`. This is the foundation `status --next`, automatic planning and Change navigation
will build on later — none of those are implemented here.

## Inventory of what already exists (read before designing)

- **No existing dependency/Graph concept anywhere** in `cli/src/` — confirmed by inspection
  (`grep -rn "dependsOn|prerequisite|Graph"` across `cli/src` found nothing beyond incidental
  uses of the English word "dependency" in unrelated comments).
- **`manifest.json`** (`change-manifest.js`) already hosts three optional, additive fields —
  `sdd`, `harness`, `loop` — each structurally validated for shape only, with any cross-Change or
  registry-backed resolution left to a separate layer. `dependsOn` follows the exact same pattern.
- **`statusOverview()`**'s existing additive-section convention (`invalidManifestChanges()`,
  `workflowChanges()`, `sddChanges()` — each a small `cli.js` function filtering
  `getChangeDirs().map(loadChangeUnified)` by manifest content, rendered in a conditional block) is
  the established, correct integration point for a new cross-Change overview section — reused
  directly, not reinvented.
- **Harness (0056) and Loop (0057)** both established: manifest field → structural validation in
  `change-manifest.js` → a pure, filesystem-free service/domain module → additive, non-blocking
  CLI wiring. The Graph follows the same shape.
- **`aief verify --change <id>`** already has a clean, established additive-output slot (after the
  report, after Hook output, after Loop) for non-blocking, informational context.

## Scope

### In scope

- `manifest.json` optional `dependsOn: string[]` field — an array of other Changes' ids/basenames
  this Change depends on. Structurally validated (shape only) in `change-manifest.js`.
- `cli/src/core/domain/change-graph.js` (new): `buildGraph(nodes)` — pure, deterministic
  construction **and** validation (missing/duplicate/self dependency, cycle detection, topological
  order) from a plain `[{id, dependsOn}]` input. No filesystem access, no CLI dependency,
  independently unit-testable.
- `cli.js`: `buildProjectGraph()` (gathers real Changes via the existing `getChangeDirs()`/
  `loadChangeUnified()` pattern, calls `buildGraph()`); a new, conditional "Dependency Graph:"
  section in `aief status` (overview) — present only when at least one Change declares
  `dependsOn`; a new `aief status --graph` flag rendering the full graph (every Change, even with
  no dependencies) — nodes, edges, topological order or cycle report, issues; a small, additive,
  non-blocking dependency-issue note in `aief verify --change <id>` when the targeted Change has
  Graph issues concerning it.
- ADR-028, docs (`workflow.md`, `architecture.md`, `concepts.md`, `configuration.md`, `cli.md`).

### Out of scope (explicit, per commissioning instruction)

- `aief status --next`, automatic planning, Change navigation/suggestions — the Graph is the
  foundation for these, not their implementation.
- Any change to `aief doctor` — no clearly Graph-related improvement was identified; `status`
  already owns cross-Change overview rendering (see spec.md "Non-goals").
- Any change to Bootstrap, LIDR (Skills/Standards), Harness, or Loop's own behavior — zero diff to
  `ai-specs.js`, `harness-service.js`, `loop-service.js`, `detect.js`.
- Blocking `aief verify`/`aief close` on Graph issues — informational only, never gates anything,
  matching the non-blocking discipline Harness/Loop already established.
- Any storage beyond `manifest.json` itself — the Graph is derived, on every invocation, from
  official project files only; no cache, no `.aief/` state, no new persisted artifact.

## Status

Closed (2026-07-30)
