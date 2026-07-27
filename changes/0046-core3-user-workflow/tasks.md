# Tasks — Entrega 4: User Workflow

**Executed.** ADR-018 §4 resolved to Path B (2026-07-26); all tasks below completed. See
`evidence.md` for the full implementation/verification write-up and the adversarial review.

## 1. Baseline

- [x] Run `cd cli && npm test`; record the count (251/251 at planning time).
- [x] Capture real `aief status` and `aief prompt` output as pre-change baselines.
- [x] Confirm `git status --porcelain` clean before starting.

## 2. ADR

- [x] Human review of ADR-018 (`knowledge/decisions.md`) — accept, amend, or reject §1–§3.
- [x] **Human decision: Path A (new commands, requires an ADR-015 exception/thaw) or Path B (new
      flags on existing commands)** — recorded as an amendment to ADR-018 §4, not assumed.

## 3. Change resolver

- [x] Confirm (no new code expected): `resolveExplicitChange()`/`resolveImplicitChange()`/
      `matchChanges()` already satisfy UX-R1–R4 as-is. If any gap is found, document it here before
      writing new selection logic — do not duplicate the resolver.

## 4. Action contract

- [x] Implement the Normalized Action shape (design.md §5) as a plain object contract, documented
      as a module comment in `workflow-service.js` — same discipline as `GateResult`'s comment.
- [x] Implement the `GateResult.status` → Action `status` mapping as one small, explicit function.

## 5. Error model

- [x] Implement the error/outcome table in design.md §11 as concrete return shapes.

## 6. Workflow facade (`workflow-service.js`)

- [x] `inspect()`, `nextAction()`, `canTransition()`, `explain()` (design.md §3) — plain functions,
      no class.
- [x] Unit tests: each function pure, deterministic, no filesystem write.

## 7. SDD integration

- [x] Confirm `workflow-service.js` calls `resolveSddProvider()`/`provider.validate()`/
      `getArtifacts()`/`getTasks()`/`getRequirements()` exactly as Change 0045 shipped them — no new
      path construction, no new OpenSpec/local-format knowledge in the service layer (UX-R23).

## 8. `start`

- [x] **No implementation task** — design.md §6 concludes no `start` command/flag is introduced.
      This line exists so the decision is visible in the task list, not silently absent.

## 9. `next` (Path A) / `status --next` (Path B)

- [x] Command handler (Path A) or flag handling (Path B) — thin: resolve Change, call
      `workflowService.nextAction()`, render, set exit code per design.md §9. No `if`/`else` over
      stages/tracks/gates in the handler itself (commissioning instruction, directly).

## 10. `work` (as `prompt`'s evolution)

- [x] Extend `prompt()` with the two conditional blocks (design.md §8) — additive, same pattern as
      `standardsBlock`/`skillsBlock`.
- [x] Confirm `prompt`'s byte output is unchanged for a Change with no `track`/`sdd`.

## 11. Transition behavior

- [x] **Not implemented this Entrega.** `canTransition()` (task 6) is the read-only prerequisite;
      no surface calls it to attempt a write. Recorded as deferred, not silently skipped.

## 12. Human render

- [x] Text renderer for the Normalized Action (design.md §7) — id/status/reason/command, blockers/
      warnings listed by name.

## 13. Structured render

- [x] **Not implemented this Entrega** (UX-R28) — no concrete consumer named. Deferred with
      reasoning, matching Change 0044's WF-R16 precedent.

## 14. Exit codes

- [x] Implement the table in design.md §9. Tests: query-fails → 1; query-succeeds-but-blocked → 0;
      existing `verify`/`close` codes unchanged (regression test).

## 15. Manifest and provider failures

- [x] Regression tests (through the new surface, not only Entregas 1/3's original tests): invalid
      manifest never falls back (UX-R24); unknown/unavailable provider never falls back (UX-R25);
      path traversal rejected (UX-R26); unrecognized track produces `invalid`, not a crash (UX-R27).

## 16. Compatibility

- [x] Zero-drift regression: `status`'s bottom line unchanged for every real Change (all lack
      `track` today).
- [x] Regression: `propose()`/`verify()`/`close()`'s write path byte-unchanged (`git diff` contains
      zero lines touching those functions beyond `status()`'s consolidation itself).

## 17. Unit tests

- [x] `workflow-service.test.js` — all four functions, every Normalized Action status value reached
      by a dedicated fixture.

## 18. CLI integration tests

- [x] End-to-end tests for whichever surface Path A/B produces, mirroring the style of
      `cli.test.js`'s existing Workflow/SDD scenarios (Changes 0044/0045).

## 19. Documentation

- [x] `docs/architecture.md`: new subsection for the User Workflow application layer.
- [x] `docs/domain-model.md`: add `Normalized Action`, `User Workflow Service` (or equivalent) to
      the ubiquitous-language table, pointing at ADR-018.
- [x] `knowledge/decisions.md`: ADR-018 status updated to `Accepted` once §4 is resolved.

## 20. Adversarial review

- [x] Independent review after implementation, before closing — same discipline as Changes
      0043–0045: re-read code fresh against ADR-018/proposal/spec/design/tasks/verification/diff/
      tests/docs. Check specifically for: hidden session state, a command handler containing
      stage/track/gate conditionals directly, `next`/`work` performing any write, exit-code
      regressions on existing commands, `status`/`prompt` byte regressions, an action reported
      `available` without a real passed gate, duplicated resolver logic, path traversal
      reintroduced, AI-generated explanation text, stray fixtures, requirements without evidence.

## 21. Final verification

- [x] `aief verify` (this Change and whole project).
- [x] Full test suite passes; delta from baseline recorded.
- [x] `aief status`/`aief prompt` real-output diffs: byte-identical where design requires it.
- [x] `git status --porcelain` clean.

## Human gates

- [x] (human) Accept, amend, or reject ADR-018.
- [x] (human) **Resolve the ADR-015 collision (Path A vs. Path B)** — the single blocking decision
      of this Entrega.
- [x] (human) Approve `spec.md`/`design.md`, or amend either.
- [x] (human) Explicit go-ahead to begin implementation.
- [x] (review) Independent review before implementation begins, optional per Change 0044's own
      precedent (direct human approval of a fully-resolved plan can satisfy this).

## Deferred (explicitly out of scope for Entrega 4)

- [-] A transition-executing (write) surface — `canTransition()` built as its prerequisite only.
- [-] `--json`/structured output — no named consumer yet.
- [-] `start` as any kind of command or flag — design.md §6 concludes it decomposes into
      `new-change` + `status --change`/`next`, already covered.
- [-] Real evaluators for `review`/`approval`/`security_review` — later Entregas.
- [-] Wiring `propose()` to the SDD Provider — ADR-017's deferred obligation, still deferred.
- [-] Refactoring `close()`'s write path or `checkChangeReadiness()` — no operation in this Entrega
      needed it.
- [-] Skills, Hooks, assistant execution, semantic Verification, Review-as-feature, Entrega 5.
