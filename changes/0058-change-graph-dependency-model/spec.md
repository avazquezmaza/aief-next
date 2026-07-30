# Specification

## Goal

A Change may declare `manifest.json` `dependsOn: [<other Change id>, ...]`. AIEF derives, on every
invocation, a deterministic dependency graph across every Change in `changes/` — never persisted,
never cached — and surfaces it read-only via `aief status`, `aief status --graph`, and (for the
targeted Change only) `aief verify --change <id>`. A project with no `dependsOn` anywhere behaves
exactly as before this Change.

## Configuration model

```json
{
  "dependsOn": ["0002-user-model", "0003-add-login"]
}
```

- `dependsOn` — optional array of non-empty strings, each naming another Change's directory
  basename (the same identifier `--change <id>` already accepts). Absent (every existing Change)
  → no dependencies, zero behavior change.
- Referential validity (does the named Change exist? is there a cycle?) is **not** checked by
  manifest structural validation — it is a cross-Change, project-wide fact only the Graph itself
  can determine, exactly as `sdd.change_id`'s real resolution is deferred past
  `change-manifest.js` to a separate layer.

## Non-goals

- **`status --next`, automatic planning, navigation.** This Change provides the data model these
  will read; it does not implement any of them.
- **`aief doctor` changes.** No Graph fact is naturally doctor-shaped (doctor is environment/
  registry-level, e.g. Skills/Hooks that exist regardless of any Change; the Graph is inherently
  cross-Change project state, which `status` already owns — Workflow/SDD/Harness's own per-Change
  and cross-Change facts all surface through `status`, not `doctor`, and the Graph follows that
  same precedent).
- **No gating.** A missing dependency, a cycle, or any other Graph issue never blocks `aief
  verify`, `aief close`, or changes any exit code — informational only, mirroring Harness/Loop's
  own non-blocking discipline.
- **No storage beyond `manifest.json`.** No `graph.json`, no cache, no `.aief/` file — the Graph
  is rebuilt from `changes/*/manifest.json` on every invocation (ADR-009).

## Requirements

- **R1 — Structural validation lives in `change-manifest.js`.** `validateManifest()` gains a
  `dependsOn` shape check: must be an array of non-empty strings when present. No registry or
  cross-Change dependency — mirrors `sdd.change_id`'s own shape-only precedent exactly.
- **R2 — `change-graph.js` is pure and independent of the CLI.** `buildGraph(nodes)` takes a plain
  `[{id, dependsOn}]` array and returns `{nodes, edges, order, cycles, issues}` — no filesystem
  access, no `getChangeDirs()` call, no console output. Fully unit-testable with synthetic input,
  the same discipline `harness-service.js`/`loop-service.js` already established.
- **R3 — Construction and validation are one pass, not two.** Building the edge set and detecting
  `missing_dependency`/`duplicate_dependency`/`self_dependency` happen together, per source node,
  in `dependsOn`'s own declared order — never a second, separate validation traversal that could
  disagree with what was actually built.
- **R4 — Self-dependency is reported and excluded, never a silent edge.** A Change listing itself
  in `dependsOn` produces one `self_dependency` issue; no self-loop edge is ever created.
- **R5 — A duplicate target is reported once and creates exactly one edge.** Listing the same
  dependency twice (or more) produces one `duplicate_dependency` issue per extra occurrence; the
  first occurrence's edge is the only one created — never two parallel edges.
- **R6 — A missing dependency is reported and excluded, never a dangling edge.** A `dependsOn`
  entry naming a Change id absent from the current node set produces one `missing_dependency`
  issue; no edge is created toward a nonexistent node.
- **R7 — Cycle detection covers the whole graph, reported once per connected cyclic group.**
  Kahn's algorithm (topological sort by removing zero-remaining-dependency nodes) determines
  `order`; any node(s) left over once no more can be removed are in a cycle — reported as one
  `cycle` issue naming every such node, `order` is `null` in that case (a cycle has no valid total
  order, and no partial/best-effort order is fabricated).
- **R8 — Deterministic, always.** Node iteration order is always the sorted Change id list; ties in
  topological-sort candidate selection are broken by sorted id; the `edges` array is sorted by
  `(from, to)`. Same input, same output, every call — proven by a dedicated repeated-call test.
- **R9 — `buildProjectGraph()` (cli.js) is the only place that reads real Changes for this
  feature.** Gathers `getChangeDirs().map(loadChangeUnified)`, extracts `{id: basename,
  dependsOn}` only from Changes with **no** `manifestError` (an invalid manifest's `dependsOn`, if
  any, is never trusted — mirrors `sddChanges()`/`workflowChanges()`'s own guard exactly), and
  calls `buildGraph()`. No second implementation of this gathering step exists anywhere.
- **R10 — `aief status` (overview) gains a conditional "Dependency Graph:" section.** Present only
  when at least one Change declares `dependsOn` (edges or issues exist) — absent otherwise, so
  every existing project (none of which declares `dependsOn`) sees byte-identical `status` output.
  Lists each dependency-declaring Change's dependencies and any issues.
- **R11 — `aief status --graph` renders the full graph.** Every Change is a node, whether or not it
  declares dependencies; all edges; the topological order (or an honest "unavailable — cycle"
  statement); every issue. A new, additive flag — no existing `status` flag's behavior changes.
- **R12 — `aief verify --change <id>` gains a small, non-blocking dependency note.** When the
  targeted Change has any Graph issue naming it (as source or as a cycle member), one informational
  block is printed after Loop's own output — never affecting `report.passed`, `renderReport()`'s
  exit code, or `close()`'s readiness check. Silent when the Change has no dependency issues
  (including every Change today, since none declares `dependsOn`).
- **R13 — No storage beyond `manifest.json`.** `change-graph.js` and its `cli.js` wiring never
  write a file — read-only, exactly like `status`'s and `doctor`'s existing guarantee.

## Compatibility

- No `dependsOn` field anywhere → `aief status` (overview and `--change`), `aief verify` (whole-
  project and `--change`), `aief doctor` (untouched entirely) are byte-identical to before this
  Change. `aief status --graph` is a brand-new flag with no prior baseline to match.
- Bootstrap (0052), LIDR Skills/Standards (0054/0055), Harness (0056), Loop (0057): zero diff, zero
  behavior change — `change-graph.js` is not imported by, and does not import, any of
  `ai-specs.js`/`detect.js`/`harness-service.js`/`loop-service.js`.

## Acceptance Criteria

- [x] `buildGraph([])` returns `{nodes: [], edges: [], order: [], cycles: null, issues: []}`.
- [x] `buildGraph()` with one Change, no `dependsOn`: one node, no edges, order `[id]`, no issues.
- [x] Multiple Changes with valid dependencies: correct edges, correct topological order
      (dependencies before dependents).
- [x] A missing dependency, a self-dependency, and a duplicate dependency each produce exactly the
      documented issue type, named by the correct Change id, and never create an invalid/duplicate
      edge.
- [x] A cycle (2-node and 3-node cases) is detected, reported once naming every member, and
      `order` is `null`.
- [x] `buildGraph()` is deterministic across repeated calls with the same input, including under
      differently-ordered (but equivalent) input arrays.
- [x] A project with no `dependsOn` anywhere: `aief status`, `aief verify` (whole-project and
      `--change`) byte-identical to the pre-Change baseline.
- [x] A project with at least one `dependsOn`: `aief status`'s "Dependency Graph:" section appears
      with correct content; `aief status --graph` renders every Change, including ones without
      dependencies.
- [x] `aief verify --change <id>` on a Change with a Graph issue prints one non-blocking note;
      `report.passed`/exit code are unaffected either way.
- [x] Full CLI test suite (676 baseline) passes with only additive new tests; `aief verify`
      passes; `git diff --check` is clean.
