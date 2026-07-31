# Tasks

## Design (this Change)

- [x] Confirmed by inspection: no existing dependency/Graph concept anywhere in `cli/src/`.
- [x] Read `change-manifest.js` (sdd/harness/loop precedent), `statusOverview()`'s
      `invalidManifestChanges()`/`workflowChanges()`/`sddChanges()` additive-section pattern,
      Harness (0056) and Loop (0057) ADRs for the manifest-field → structural-validation → pure-
      module → additive-CLI-wiring shape, `verify()`'s `--change` branch additive-output slot.
- [x] Decided `dependsOn` is keyed by Change basename (same identifier `--change <id>` accepts) —
      no new identifier scheme.
- [x] Decided construction and validation are one pass in `buildGraph()` — not two separate
      functions that could disagree.
- [x] Decided `doctor` is out of scope — no Graph fact is doctor-shaped; `status` already owns
      cross-Change overview rendering.
- [x] Decided to implement `aief status --graph` (explicitly permitted, conditionally, by the
      commissioning instruction) — full-graph view distinct from the overview's conditional
      section, documented in ADR-028.
- [x] Wrote ADR-028, `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/domain/change-manifest.js`: `dependsOn` structural validation (array of
      non-empty strings).
- [x] `cli/src/core/domain/change-graph.js` (new): `buildGraph(nodes)` — pure construction +
      validation + Kahn's-algorithm topological order/cycle detection.
- [x] `cli/src/cli.js`:
  - `buildProjectGraph()` — gathers real Changes (guarded by `!manifestError`, mirroring
    `sddChanges()`), calls `buildGraph()`.
  - `statusOverview()`: new conditional "Dependency Graph:" section.
  - `statusGraph()` (new): renders the full graph; wired into `status(args)` via `--graph`.
  - `verify()`'s `--change` branch: `runGraphCheck()` — non-blocking dependency-issue note.
- [x] `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`: documented the Graph/
      `dependsOn` model. `docs/configuration.md`: `dependsOn` field + example. `docs/cli.md`:
      `status`/`status --graph`/`verify --change` rows updated.
- [x] `knowledge/decisions.md`: ADR-028.

## Tests

- [x] `cli/tests/change-manifest.test.js`: 6 new tests — no `dependsOn`, valid array, empty array,
      non-array rejected, invalid entries rejected (table-driven), referential validity
      deliberately not checked structurally.
- [x] `cli/tests/change-graph.test.js` (new, 15 tests): empty graph, one Change (no deps, and with
      `dependsOn` omitted entirely), multiple Changes with a valid chain, multiple dependencies per
      Change, missing dependency, self-dependency, duplicate dependency, 2-node cycle, 3-node
      cycle, a cycle alongside an unrelated acyclic node, a mix of valid + missing + self-dependent
      in one graph, deterministic repeated calls, reordered-but-equivalent input produces identical
      output, edges always sorted.
- [x] `cli/tests/cli.test.js`: 9 new end-to-end tests — no-`dependsOn` byte-identical baseline
      (`status` overview, `verify` whole-project and `--change`), `doctor` completely unaffected
      (default and `--verbose`), `status` overview Dependency Graph section (dependencies +
      issues, only real edges listed — a missing dependency never appears in the "depends on:"
      line, only under Issues), `status --graph` full rendering (nodes without deps included,
      topological order, cycle case with explicit "unavailable" statement), `verify --change`
      dependency-issue note (missing dependency, self-dependency, absent when no issues — none
      ever affecting exit code/PASS-FAIL), Bootstrap/LIDR/Harness/Loop tests unmodified and still
      passing. One test's assertion needed correcting during verification (see Findings in
      `evidence.md`) — a real, not a code, mistake.
- [x] Ran `cd cli && npm test`: **706/706 passing** (676 baseline + 6 + 15 + 9 new = 706), 0
      regressions.
- [x] `aief verify` (whole project): PASS.
- [x] `git diff --check`: clean.

## Close

- [x] `evidence.md`: test transcript, manual walkthrough (valid chain, missing dep, cycle,
      duplicate, self-dep, `status --graph`, `verify --change` note), byte-identical compatibility
      proof.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] Marked `change.md` Closed.
- [x] Created the local commit (this session's explicit instruction) — no push.
