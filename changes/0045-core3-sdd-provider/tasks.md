# Tasks — Entrega 3: SDD Provider

**Implemented.** Every task below is checked with a pointer to its evidence. Full transcript in
`evidence.md`.

## 1. Baseline

- [x] `cd cli && npm test` before any code change: 195/195 (baseline).
- [x] Captured real `aief status` output as `sdd-status-baseline.txt`.
- [x] Confirmed `git status --porcelain` clean before starting.

## 2. ADR

- [x] ADR-017 (`knowledge/decisions.md`) — **Accepted** 2026-07-25, alongside the rest of this
      Change's planning artifacts.

## 3. Contracts

- [x] `SddProvider` function-shape contract documented as a module comment in each of
      `cli/src/sdd-providers/{local,openspec}.js` — plain functions, not a class.
- [x] Normalized artifact/requirement/task/readiness shapes documented in
      `cli/src/core/domain/sdd-model.js`.
- [x] `CAPABILITIES` constant shape documented and implemented per provider.

## 4. Errors

- [x] Every error/state case in design.md §11 implemented as a concrete return shape (never an
      exception on a read path).

## 5. Provider registry / resolver

- [x] `cli/src/sdd-providers/index.js` — `hasProvider()`/`getProvider()`/`providerIds()`, mirroring
      `requirement-providers/index.js`.
- [x] `cli/src/core/domain/sdd-provider-resolver.js` — `resolveSddProvider(change, cwd)`,
      precedence steps 1/3/4 implemented; step 2 (project configuration) reserved, not built.
- [x] Tests: `sdd-provider-registry.test.js` (7).

## 6. `LocalSddProvider`

- [x] `cli/src/sdd-providers/local.js` — `detect()`, `resolveChange()`, `getArtifacts()` (required
      files via `readChangeFiles()`; optional files — `design.md`/`adr.md`/`notes.md` per AGENTS.md,
      plus `proposal.md`/`verification.md` per the project owner's explicit instruction),
      `getRequirements()`/`getTasks()`, `validate()`.
- [x] Zero-drift regression across every real Change: `sdd-provider-local.test.js` (10 tests).

## 7. `OpenSpecProvider`

- [x] `cli/src/sdd-providers/openspec.js` — `detect()`, `resolveChange()`, `getArtifacts()`,
      `getRequirements()`/`getTasks()`, `validate()`.
- [x] **Design deviation from this task's original text**: `detect()` does **not** relocate
      `openspecInfo()`'s logic — it has its own small, self-contained `run()`/`commandExists()`.
      Relocating a helper still meant editing `cli.js`, the file `propose()` lives in, which the
      commissioning instruction explicitly forbade touching in any way. Documented in `design.md`'s
      module comment and `evidence.md`; a deliberate, bounded duplication, not an oversight.
- [x] Verified live against the real, locally-installed OpenSpec CLI (v1.5.0) — see evidence.md
      Etapa A. Flagged as an open risk: no real OpenSpec-generated `spec.md` exists to validate the
      requirement-extraction pattern against (creating one requires an assistant slash command).
- [x] Tests: `sdd-provider-openspec.test.js` (14, after the review's security fix).

## 8. Normalization of artifacts

- [x] Shared `makeArtifact()`/`readArtifactFile()` in `sdd-model.js`, used by both providers.

## 9. Requirements

- [x] Shared `parseRequirements()` in `sdd-model.js`. **Independent review finding R2**: the
      original pattern matched real, pre-existing content in
      `changes/0041-delete-review-package/spec.md` as fake requirements — fixed (id must contain a
      digit) and re-verified against every real Change's `spec.md`.

## 10. Tasks

- [x] Shared `parseTasks()` in `sdd-model.js`. Task-to-requirement linking (SDD-R21) is
      `unsupported` for both providers — `requirements: []` always, never invented.

## 11. Readiness

- [x] `validate()` implemented per provider (design.md §10's shape).
- [x] `specificationGate()` in `gate-evaluator.js` — added to `KNOWN_GATE_IDS`, unit-tested in
      isolation, **not** added to any of `lite.json`/`standard.json`/`governed.json`. Test confirms
      all three files are byte-unchanged.

## 12. Manifest

- [x] `change-manifest.js`: optional `sdd` block validation (`provider` enum, `change_id` type
      check). Absence of `sdd` never triggers any check.
- [x] Regression tests (`change-manifest.test.js`, +6): zero-drift corpus unaffected; unknown
      provider; invalid `change_id`; `change_id` without `provider` (structurally valid, resolution
      reports it unusable at runtime); non-object `sdd`.

## 13. Integration with Change

- [x] Confirmed `loadChangeUnified()` needed no changes — the provider layer reads
      `change.manifest?.sdd` directly from the existing return shape.

## 14. Integration with Workflow Engine

- [x] `gate-evaluator.js`: `"specification"` added to `KNOWN_GATE_IDS`; `specificationGate()` added.
      `transition-engine.js` confirmed unchanged (SDD-R33).

## 15. Additive integration with `status`

- [x] `cli.js`: `sddChanges()` (mirrors `workflowChanges()`) + additive "SDD provider status"
      section, shown only for a Change with `change.manifest?.sdd`.
- [x] Byte-identical `aief status` diff, before/after — re-confirmed after the review's fixes too.

## 16. Compatibility

- [x] Zero-drift regression across every real Change (45 at implementation time).
- [x] Regression confirmed: `close`/`verify` completely unaffected — `git diff cli/src/cli.js`
      contains zero lines touching `propose`/`verify`/`close`/`markClosed`.

## 17. Tests

- [x] All tests named above, plus the 30-scenario list from the commissioning request — mapped in
      `verification.md`.
- [x] `cd cli && npm test` — 251/251. The one pre-existing assertion changed post-implementation
      (`sdd-provider-openspec.test.js`'s `cliPresent` expectation) is named with the review finding
      (R3) that justified it — not `openspecInfo()`'s relocation, since that relocation did not
      happen (see task 7's deviation note).

## 18. Documentation

- [x] `docs/architecture.md`: new "The SDD Provider boundary" subsection.
- [x] `docs/domain-model.md`: added `SDD Provider`, `Normalized Artifact`, `SDD Readiness`.
- [x] `adapters/openspec/mapping.md`: **not modified** — implementation followed its documented
      shape without finding a concrete correction needed (the version-drift finding, F1 in
      evidence.md, is about the surrounding CLI's newer subcommands, not the per-change directory
      shape mapping.md documents, which remains the best available reference).
- [x] `knowledge/decisions.md`: ADR-017 status updated to `Accepted`.

## 19. Adversarial review

- [x] Performed 2026-07-25. Findings: R1 (blocking — path traversal via `sdd.change_id`), R2
      (high — false-positive requirement extraction against real repository content), R3 (high —
      unnecessary `openspec` binary execution during `status`), R4/R5 (low/informational, deferred
      with reasoning). All blocking/high findings fixed and re-verified. Full detail: `evidence.md`.

## 20. Final verification

- [x] `aief verify` (this Change and whole project): PASS.
- [x] Full test suite: 251/251. Delta from baseline (195): +56 (52 implementation + 4 review fixes).
- [x] `aief status` real-output diff: byte-identical.
- [x] `git status --porcelain` clean, checked after every stage including post-review.

## Human gates

- [x] (human) Accept, amend, or reject ADR-017 — **Accepted**, 2026-07-25.
- [x] (human) Approve `spec.md`/`design.md` — **Approved**, 2026-07-25.
- [x] (human) Explicit go-ahead to begin implementation — given 2026-07-25.
- [x] (review) Independent review — performed post-implementation (task 19); the plan-level review
      was satisfied directly by the human's explicit approval of a fully-resolved plan with all
      four originally-blocking questions already answered.

## Deferred (explicitly out of scope for Entrega 3)

- [-] `createChange()`/`archive()` real implementations — write paths, need their own review.
- [-] Wiring `propose()` to the new provider (ADR-017's recorded, deferred obligation).
- [-] Adding `specification` to any shipped workflow definition.
- [-] Project-level SDD configuration (precedence step 2).
- [-] Verifying requirement/task extraction against real OpenSpec-generated content (F2, no such
      content exists in this environment — flagged, not fabricated).
- [-] R4/R5 from the adversarial review (low/informational) — see evidence.md.
- [-] Entrega 4 and beyond (`start`/`work`/`next`, assistant execution, Skills, Hooks, Profiles,
      semantic Verification, Review-as-feature, conversational interface).
- [-] Any new command (`aief sdd`, `aief provider`) — ADR-015 still in effect until Change 0042 is
      consolidated.
