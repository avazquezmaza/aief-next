# Tasks — Entrega 7: Verification Engine

**Executed.** ADR-021 accepted and implementation explicitly approved (2026-07-26); all tasks below
completed. See `evidence.md` for the full implementation/verification write-up and the adversarial
review, including a real correctness bug found and fixed (a second, duplicate `explain()` call within
one `verify --change --requirements` invocation) plus a proactive `manual_attestation` enforcement
gap closed before it could be exercised.

## 1. Baseline

- [x] Run `cd cli && npm test`; record the count (440/440 at planning time).
- [x] Capture real `aief verify` PASS and FAIL output as pre-change baselines.
- [x] Confirm `git status --porcelain` clean before starting.

## 2. ADR

- [x] Human review of ADR-021 (`knowledge/decisions.md`) — accept, amend, or reject.
- [x] Confirm the Structural/Requirement Verification boundary, the Evidence Model, and the deferred
      Workflow-gate/`close()` decisions (design.md §9/§10) are acceptable.

## 3. `verify()` legacy inspection

- [x] Confirm (no new code expected): `change-verifier.js`'s current rules are exhaustively
      documented in `design.md` §1. If any gap is found, document it here before writing new logic.

## 4. Structural model (unchanged, referenced)

- [x] Confirm `checkChangeReadiness()`/`verifyProject()`/`verifyChange()` remain untouched — this
      task is a verification step, not an implementation step.

## 5. Requirement model

- [x] Implement `VerifiableRequirement` (design.md §5) as a wrapper, not a mutation of the SDD
      Provider's `Requirement` contract.

## 6. Evidence model

- [x] Implement the evidence item shape and the six-type vocabulary (design.md §2) in
      `cli/src/core/domain/verification-rule.js` — `artifact_state`/`file_assertion` fully
      implemented; `test`/`manual_attestation`/`command_result`/`external_reference` defined as
      vocabulary only (the last two additionally registry-rejected if ever declared supported).

## 7. Evidence validation

- [x] Implement evidence resolution (design.md §5): `artifact_state` from `context.sdd.readiness.
      artifacts`; `file_assertion`/citation evidence from `context.verificationDoc`'s scenario-table
      scan, path-contained via Change 0045's `isPathWithin()`.

## 8. Rule descriptor

- [x] Implement the Verification Rule descriptor shape (design.md §7) — plain object, no class.
- [x] Reuse Skills'/Hooks' `ID_PATTERN`/`VERSION_PATTERN` (import from `core/domain/skill.js` or
      `hook.js` — decide during implementation based on which produces less coupling, same open
      question Entrega 6 resolved for its own contract).

## 9. Capabilities

- [x] Implement the seven-flag capability object (design.md §8).
- [x] Registry-time rejection of `writeFiles`/`executeCommands`/`network`/`assistantRequired: true`
      (VR-R14/R15).

## 10. Errors

- [x] Implement the error/outcome table (design.md, mirroring Skills'/Hooks' own) as concrete
      thrown-Error vs. normalized-result cases — `error` (engine fault) vs. `invalid` (bad input) vs.
      `failed` (real verdict) kept distinct throughout.

## 11. Registry (`cli/src/verification-rules/index.js`)

- [x] `hasRule(id)`, `getRule(id)`, `ruleIds()`, `rulesForScope(scope)` — mirrors
      `requirement-providers/`/`sdd-providers/`/`skills/`/`hooks/index.js` exactly (VR-R18).
- [x] Duplicate-id and invalid-descriptor rejection at construction time (VR-R19).
- [x] Unit tests: registration, duplicate rejection, invalid-descriptor rejection,
      forbidden-capability rejection, `rulesForScope()` filtering, deterministic order.

## 12. Context (`cli/src/core/services/verification-context.js`)

- [x] `buildVerificationContext(changeDir, cwd, operation)` — calls `workflow-service.js`'s
      `explain()` (reused, never a second call within the same `verify()` invocation), adds
      `requirements`/`tasks` (from `context.sdd`), adds the one new `verification.md` read,
      returns the frozen combined shape (design.md §4, VR-R21–R25).
- [x] Unit tests: reuses `explain()`; exactly one new read (call-count assertion); missing
      `verification.md` → `null`, not an error; zero writes; idempotent; frozen.

## 13. Result model

- [x] Implement the normalized per-rule result shape (design.md §7/VR-R31) and the seven `status`
      values, including the `not_applicable`/`blocked`/`unsupported`-only whitelist for
      `appliesTo()` (VR-R29), applied proactively (same fix Entrega 6 applied proactively for Hooks
      after Entrega 5's reactive discovery).

## 14. Aggregation

- [x] Implement the five-status aggregation policy with fixed precedence (design.md, VR-R34) —
      `ERROR > INVALID > FAIL > INCOMPLETE > PASS`.
- [x] Unit tests: every precedence combination reached by a dedicated fixture; `not_applicable`/
      `unsupported` confirmed to never affect the overall status (VR-R35).

## 15. Verification Service (`cli/src/core/services/verification-service.js`)

- [x] `evaluateRequirements(context)` — resolve requirements → resolve evidence → select/order rules
      → check applicability → apply capability policy → evaluate purely → normalize → aggregate
      (design.md §3, VR-R38).
- [x] Unit tests: every per-rule and aggregate status reached by a dedicated fixture; adversarial
      fixture rules attempting to declare effects, spoof `rule`/`requirement`, claim `passed` with
      empty evidence, mutate frozen context/requirement/evidence.

## 16. First rule — Requirement Has Traceability

- [x] `cli/src/verification-rules/requirement-has-traceability.js` (design.md §6.1).
- [x] Unit tests: `not_applicable` with no `verification.md`; `passed` when cited; `failed` when not
      cited; never claims the requirement was satisfied (summary text asserted).

## 17. Second rule — Evidence Reference Integrity

- [x] `cli/src/verification-rules/evidence-reference-integrity.js` (design.md §6.2).
- [x] Unit tests: `not_applicable` with no `file_assertion` evidence; `passed`/`failed` for a
      present/missing referenced path (synthetic fixture); `invalid` for a path-traversal attempt
      (reusing Change 0045's fixture pattern).

## 18. Third rule — not this Entrega

- [x] **Not implemented** (design.md §6.3) — `requirement-has-test-evidence`,
      `verification-scenario-covered`, and `artifact-presence` each evaluated and declined, with
      reasoning recorded in `proposal.md`/`design.md`. This line exists so the decision is visible,
      not silently absent.

## 19. CLI integration

- [x] `aief verify --requirements` (design.md, VR-R41–R45): legacy structural report renders first,
      unchanged; an additive Requirement Verification section follows; exit code governed by the
      legacy result alone when the flag is absent, by the new aggregation when present.
- [x] Confirm `aief verify` without the flag is byte-identical to Entrega 6's output (VR-R41).

## 20. Hook compatibility

- [x] Confirm `verify.completed`'s `operation.result` remains exactly the legacy structural `report`
      object, with or without `--requirements` (VR-R46) — no code change expected in
      `runVerifyCompletedHooks()`; this task is a verification step.
- [x] Confirm (grep-based review step): no Verification Rule or Service function imports
      `hook-service.js`/anything under `cli/src/hooks/` (VR-R47).

## 21. Workflow compatibility

- [x] Confirm (grep-based review step): zero diff lines in `gate-evaluator.js` and the three
      workflow definition JSONs (VR-R48). No `"verification"` gate id introduced.

## 22. Security

- [x] Regression tests: path traversal via an evidence reference is rejected (reusing Change 0045's
      fixture); a `verification.md`/requirement-text fixture containing directive-looking text
      produces a result whose `status` is unaffected — the text only ever appears inertly.
- [x] Confirm (grep-based review step): zero `fs.*` calls outside the one guarded read path in any
      `cli/src/verification-rules/*.js` file; zero `child_process`/`fetch`/`http` calls anywhere in
      the new modules.
- [x] Confirm (design constraint, not merely observed): the inherited Entrega-3 symlink-escape gap is
      not expanded (VR-R53).

## 23. Determinism

- [x] Confirm (already covered by tasks 11/14/15's own tests): registry order, aggregation
      precedence, and `evaluateRequirements()` are all pure functions of their inputs.

## 24. Unit tests

- [x] `verification-rule-model.test.js`, `verification-registry.test.js`,
      `verification-context.test.js`, `verification-service.test.js` — see design.md §13.

## 25. Integration tests

- [x] Cross-module tests confirming a real requirement (from a synthetic Change fixture with a
      `verification.md`) produces the expected end-to-end aggregated result.

## 26. CLI tests

- [x] `cli.test.js` additions for `verify --requirements` (PASS/FAIL/INCOMPLETE cases), mirroring the
      style of Entrega 6's `verify.completed` integration tests.

## 27. Documentation

- [x] `docs/architecture.md`: new subsection for the Verification Engine layer, explicitly
      distinguishing Structural Verification (existing) from Requirement Verification (new) and
      cross-referencing Review's future role (Entrega 8, not built).
- [x] `docs/domain-model.md`: add `Verification Rule`, `Verification Registry`, `Verification
      Context`, `VerifiableRequirement`, `Evidence`, `Aggregated Verification Result` to the
      ubiquitous-language table, pointing at ADR-021.
- [x] `knowledge/decisions.md`: ADR-021 status updated to `Accepted` once approved.

## 28. Adversarial review

- [x] Independent review after implementation, before closing — same discipline as Changes
      0043–0048: re-read code fresh against ADR-021/proposal/spec/design/tasks/verification/diff/
      tests/docs. Check specifically for: a rule claiming `passed` without evidence, `error`/`invalid`/
      `failed` conflated, a rule mutating its inputs, a spoofed `rule`/`requirement` id, unauthorized
      capabilities reaching a result, path traversal or symlink expansion, `verify` legacy byte
      regressions, the `appliesTo()` status-whitelist gap (found twice already, in Skills and
      partially addressed in Hooks — re-verify it was actually implemented correctly here, not just
      documented), the Hook-contract-preservation guarantee, stray fixtures, requirements without
      evidence.

## 29. Final verification

- [x] `aief verify` (this Change and whole project, both without and with `--requirements` once
      implemented).
- [x] Full test suite passes; delta from baseline (440) recorded.
- [x] `aief verify` real-output diffs: byte-identical without `--requirements`.
- [x] `git status --porcelain` clean.

## Human gates

- [x] (human) Accept, amend, or reject ADR-021.
- [x] (human) Approve `spec.md`/`design.md`, or amend either.
- [x] (human) Explicit go-ahead to begin implementation.
- [x] (review) Independent review before implementation begins, optional per Change 0044's own
      precedent.

## Deferred (explicitly out of scope for Entrega 7)

- [-] `requirement-has-test-evidence`, `verification-scenario-covered`, `artifact-presence` rules —
      each evaluated and declined (design.md §6.3).
- [-] `command_result`/`external_reference` evidence types — require execution/network.
- [-] A `"verification"` Workflow gate — evaluated, deferred without even a prepared-inert slot
      (design.md §9).
- [-] `close()` integration — evaluated, deferred (design.md §10).
- [-] `verify.completed` payload changes — the aggregated result is not plumbed into the Hook event.
- [-] `--evidence`/`--json` flags — no named consumer this Entrega.
- [-] A structured `evidence.json`/`evidence.yaml` file — no real authoring gap justifies it yet.
- [-] AI/semantic analysis, automatic test execution, automatic remediation, automatic evidence
      generation, Review-as-product, a conversational interface, Entrega 8 and beyond.
