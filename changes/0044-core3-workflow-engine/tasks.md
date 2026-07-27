# Tasks — Entrega 2: Workflow Engine

**Implemented.** Every task below is checked with a pointer to its evidence (file, test, or
command run). Full transcript in `evidence.md`.

## 1. ADR

- [x] Human review of ADR-016 (`knowledge/decisions.md`) — **Accepted** 2026-07-25, alongside the
      rest of this Change's planning artifacts. Status line updated in `knowledge/decisions.md`.

## 2. H2 hardening (prerequisite, WF-R1–R4)

- [x] Extended `status()` (`cli/src/cli.js`) with `invalidManifestChanges()`, a second pass over
      `getChangeDirs()` collecting Changes with a non-null `manifestError`, rendered as the new,
      additive "Changes with an invalid manifest.json" section.
- [x] Fixed L3 as part of this task: `loadManifestChange()`'s `fs.readFileSync(manifestPath)`
      (`change-loader.js`) wrapped in try/catch — a directory-shaped or unreadable `manifest.json`
      now degrades to `manifestError` instead of throwing uncaught.
- [x] Regression tests: `change-loader.test.js` ("a manifest.json that is actually a directory is
      reported, not thrown — L3 regression"); `cli.test.js` (malformed manifest, structurally
      invalid manifest, "no silent fallback" — Change still shows in Open Changes too, and a
      control test proving a valid/absent manifest never triggers the new section).
- [x] Byte-identical diff of real `aief status` output before/after H2 — confirmed (see
      `evidence.md` §Etapa B).

## 3. Schemas / contracts

- [x] `GateResult` shape documented as a module comment in `gate-evaluator.js` (no standalone JSON
      Schema file — same reasoning as Change 0043's manifest schema, design.md §6 of that Change).
- [x] Workflow-definition shape implemented and validated in `workflow-definition.js`:
      `{ schema, track, stages: [{ id, gateIds? }], transitions: [{ from, to }] }` — the
      `transitions` array (not in the original design sketch) was added during implementation to
      make "transition to a nonexistent stage" a concretely rejectable case, per the commissioning
      instruction's explicit validation requirement; documented as a design change below.

## 4. Workflow definitions (WF-R5)

- [x] `cli/src/workflows/lite.json` — stages `work → verify (readiness) → close`.
- [x] `cli/src/workflows/standard.json` — stages `work → verify (readiness) → review (review) → close`.
- [x] `cli/src/workflows/governed.json` — stages `approval (approval) → work → verify (readiness) →
      security_review (security_review) → review (review) → close`.
- [x] All three load and validate successfully: `workflow-definition.test.js`, "all three real,
      shipped definitions load and validate correctly".

## 5. Workflow loader

- [x] `cli/src/core/domain/workflow-definition.js`: `loadWorkflowDefinition(track)` — unknown track
      rejected distinctly from a load/parse/validation failure (each its own error message).

## 6. Workflow validator

- [x] `validateWorkflowDefinition()` — rejects: missing/wrong schema, unrecognized track,
      filename/content track mismatch, missing/empty stages, duplicate stage ids, malformed stage
      ids, malformed `gateIds` entries, missing/empty transitions, transitions referencing
      undeclared stages. 11 dedicated tests in `workflow-definition.test.js`.

## 7. Gate evaluator

- [x] `cli/src/core/services/gate-evaluator.js`: `evaluateGates(change, workflowDefinition)`.
- [x] `readiness` gate: thin wrapper over `loadChange()` + `checkChangeReadiness()` — verified by
      test to reuse `checkChangeReadiness()`'s own failure reasons verbatim, not reimplemented.
- [x] `status_consistency` gate (WF-R19): `not_applicable` when `change.md` declares no status;
      `warning` (never blocking) on disagreement; `passed` on agreement.
- [x] `identity` gate (WF-R22, M1): `passed` on agreement; `warning` (never blocking, never an
      error) on `id`/`slug` mismatch against the directory name.
- [x] `review`/`approval`/`security_review` gates: always `{status: "pending", blocking: true}` via
      `notYetBuiltGate()` — no code path in the module can produce `"passed"` for these ids.
      Additionally, an unknown gate id referenced by a (malformed/future) definition produces a
      `"failed"`, non-blocking, clearly-labeled internal-error result rather than being silently
      dropped — a defensive case beyond the original task list, added because `KNOWN_GATE_IDS` made
      it nearly free to test.

## 8. Transition engine

- [x] `cli/src/core/services/transition-engine.js`: `resolveState()` — pure, no filesystem access
      (confirmed: the module imports nothing from `node:fs`).
- [x] `describeNextAction()` (inline in `resolveState()`'s closure) — honest-incompleteness
      messaging confirmed by test: Standard/Governed fixtures with a pending gate never resolve to
      `"close"` and always state "no automated evaluator yet."
- [x] `isTransitionLegal()` — added beyond the original two-function sketch, to give the "valid
      transition accepted / invalid transition rejected" scenarios (13, 14 in `verification.md`) a
      direct, independently-testable answer distinct from `resolveState()`'s own "where am I"
      computation (design.md §2's stated split between the two modules).

## 9. Next-action resolver

- [x] Folded into `transition-engine.js` as planned — no separate module.
- [x] `manifest.next_action`-as-hint comparison: **implemented** as `withNextActionHint()`. First
      deferred during initial implementation (no real manifest sets this field, so there was no
      fixture to test against) — then implemented during the independent review, once the review
      identified that spec.md's WF-R13 text made an unconditional promise the code didn't keep.
      Tested against synthetic fixtures (agree/disagree/absent) since no real one exists yet; the
      logic itself needs no real-world fixture to be correct — it is a pure string comparison.

## 10. Integration with `status`

- [x] `change-loader.js`: added the `track` field to all three return shapes
      (`manifestErrorShape`, `loadManifestChange`, `mapLegacyChange`) for consistent shape; `.type`
      no longer fed from `manifest.track` (now always `""` on the manifest branch, matching a
      legacy Change with no `## Type`).
- [x] `status()`: `resolveWorkflowFor()` + `workflowChanges()` wire `loadChangeUnified()` →
      `loadWorkflowDefinition()` → `evaluateGates()` → `resolveState()`, rendered as an additive
      "Workflow status" section (resolved tracks) and a separate "unrecognized or broken workflow
      track" section (WF-R7).
- [x] Updated `change-loader.test.js`'s three assertions that depended on the old `.type` behavior
      (the one named in this task, plus two zero-drift/legacy-shape assertions that also needed the
      new `track` field accounted for — all three are the same underlying shape change, not three
      unrelated edits). Each edit's comment states which approved requirement (design.md §7)
      justifies it.

## 11. Compatibility

- [x] Zero-drift regression: `change-loader.test.js`'s existing regression test (unmodified in its
      assertions beyond the `track` field noted above) re-passed across all 44 real Changes
      (43 + this Change's own directory) — none produce a Workflow Engine or invalid-manifest
      section.
- [x] B1 non-repetition regression, extended: `cli.test.js` — `close --yes` on a Governed Change
      with a permanently-pending, blocking `approval` gate still succeeds, and `manifest.json` is
      byte-for-byte untouched. This is a new test beyond the original task list, covering exactly
      the scenario the commissioning instruction most wanted guaranteed ("no acoplamiento
      prematuro con close").
- [x] Entrega-1-era manifest (no `track`) compatibility: covered by `cli.test.js`'s existing H2
      tests (a valid manifest without `track` never enters `workflowChanges()`'s filter) — no
      additional dedicated test was needed since the filter condition is the same code path
      already exercised.

## 12. Tests

- [x] `workflow-definition.test.js` (11), `gate-evaluator.test.js` (8), `transition-engine.test.js`
      (11) — new.
- [x] `change-manifest.test.js`: no change needed (L3 lives in `change-loader.js`, not
      `change-manifest.js` — corrected understanding from the original task text, see design.md
      §4's actual scope).
- [x] `change-loader.test.js`: extended with the L3 regression test and the three `track`-field
      shape corrections above.
- [x] `cli.test.js`: extended with 5 H2 scenarios + 7 Workflow Engine integration scenarios + 1 B1
      non-repetition/track scenario = 13 new end-to-end tests.
- [x] Full scenario list from the commissioning request (20 items) — mapped and resolved in
      `verification.md`'s scenario table, each with a named test.
- [x] `cd cli && npm test` — 195/195 passing (149 baseline + 42 from Etapas B–F + 4 from the
      adversarial review's fixes). Every pre-existing assertion
      that changed is named above with the requirement that justified it; no other pre-existing
      assertion was touched.

## 13. Documentation

- [x] `docs/architecture.md`: new "The declarative Workflow Engine" subsection, including an
      explicit naming-collision note against the pre-existing, broader "Workflow Engine" heading
      (ADR-001's sense) — a naming overlap discovered during this task, documented rather than
      silently worked around.
- [x] `docs/domain-model.md`: added `Track`, `Gate`, `Workflow Stage` to the ubiquitous-language
      table, each pointing at ADR-016.
- [x] `knowledge/decisions.md`: ADR-016 status updated to `Accepted`.

## 14. Verification (final)

- [x] `aief verify` passes on this Change (`0044-core3-workflow-engine`).
- [x] `aief verify` (whole project) passes — every other Change unaffected.
- [x] Full test suite: 195/195 passing. Delta from Etapa A's baseline (149): +42.
- [x] `aief status` real-output diff (before/after the entire Entrega): byte-identical.
- [x] `git status --porcelain` checked after every stage (Etapas A–F); clean of stray artifacts
      throughout — no repeat of Change 0043's finding F7.

## Human gates

- [x] (human) Accept, amend, or reject ADR-016 — **Accepted**, 2026-07-25.
- [x] (human) Approve `spec.md`/`design.md` — **Approved**, 2026-07-25, alongside the rest of the
      planning artifacts.
- [x] (human) Explicit go-ahead to begin implementation — given 2026-07-25 ("Implementa ahora
      únicamente la Entrega 2").
- [x] (review) Independent review of the implementation — performed 2026-07-25, per the explicit
      commissioning instruction ("realiza una revisión adversarial independiente"). Findings: R1
      (high), R2 (medium), fixed within the same review pass and re-verified (195/195 tests,
      byte-identical `status`, `aief verify` PASS). Full findings: `evidence.md`'s "Adversarial
      Review" section. Verdict: `ready_to_close`. Recorded transparently as performed by the same
      session that implemented — the review's value came from re-reading the code fresh against
      the approved spec/design rather than trusting the implementation summary, not from a
      different person; the user directed this step explicitly and reviews the findings in this
      report.

## Deferred (explicitly out of scope for Entrega 2, or newly identified during implementation)

- [-] Wiring `close`'s actual gate enforcement to `evaluateGates()` — a distinct, later Change.
- [-] `aief work`/`aief review` gate-awareness — Entregas 4/7.
- [-] Real evaluators for `review`/`approval`/`security_review` — later Entregas; represented as
      `pending` here.
- [-] `status --json`/`--verbose` (WF-R16).
- [-] L1, L2 (Change 0043 debt not required for H2 or this Entrega).
- [-] `docs/architecture.md`'s "Workflow Engine" naming collision (§13) — a documentation-only
      cleanup (likely a rename of one of the two sections), not resolved here to avoid touching an
      already-approved heading structure as a side effect of this Entrega.
- [-] Any new command or flag (ADR-015 still frozen).
- [-] Entregas 3, and 5–8.
