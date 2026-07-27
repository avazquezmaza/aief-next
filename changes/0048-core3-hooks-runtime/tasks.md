# Tasks — Entrega 6: Hooks Runtime

**Executed.** ADR-020 accepted and implementation explicitly approved (2026-07-26); all tasks below
completed. See `evidence.md` for the full implementation/verification write-up and the adversarial
review, including two real findings (Skill-result forgery via a mutable map, event-phase spoofing)
found and fixed before close.

## 1. Baseline

- [x] Run `cd cli && npm test`; record the count (360/360 at planning time).
- [x] Capture real `aief prompt`/`aief verify` output as pre-change baselines.
- [x] Confirm `git status --porcelain` clean before starting.

## 2. ADR

- [x] Human review of ADR-020 (`knowledge/decisions.md`) — accept, amend, or reject.
- [x] Confirm the closed two-event catalog (design.md §3) and the deferred `close()` decision
      (design.md §9) are acceptable.

## 3. Event contract

- [x] Implement `{id, phase, timestamp, operation}` (design.md §7) as a documented contract in
      `cli/src/core/domain/hook.js` — same discipline as the Skill contract's module comment.

## 4. Event catalog

- [x] Implement the closed two-event catalog (`prompt.prepared`, `verify.completed`) as a constant in
      `cli/src/core/domain/hook.js` — an event id outside this list is rejected (HK-R3).

## 5. Hook descriptor

- [x] Implement the Hook descriptor shape (design.md §5) — plain object, no class.
- [x] Reuse Skills' `ID_PATTERN`/`VERSION_PATTERN` (import from `core/domain/skill.js` or promote to
      a shared location if duplication would otherwise occur — decide during implementation, not
      here, based on which produces less coupling).

## 6. Capabilities

- [x] Implement the eight-flag capability object (design.md §6).
- [x] Registry-time rejection of `writeFiles`/`executeCommands`/`network: true` (HK-R10).
- [x] Registry-time requirement: `capabilities.invokeSkill: true` requires a non-empty
      `allowedSkills` array (HK-R14/R17).

## 7. Errors

- [x] Implement the error/outcome table (design.md, mirroring Skills' design.md §8) as concrete
      thrown-Error vs. normalized-result cases.

## 8. Registry (`cli/src/hooks/index.js`)

- [x] `hasHook(id)`, `getHook(id)`, `hookIds()`, `hooksForEvent(eventId)` — mirrors
      `requirement-providers/`/`sdd-providers/`/`skills/index.js` exactly (HK-R15).
- [x] Duplicate-id, invalid-descriptor, and out-of-catalog-event rejection at construction time
      (HK-R16/R17).
- [x] Unit tests: registration, duplicate rejection, invalid-descriptor rejection,
      forbidden-capability rejection, `allowedSkills`-required-with-`invokeSkill` rejection,
      `hooksForEvent()` filtering, deterministic order.

## 9. Hook Context Builder (`cli/src/core/services/hook-context.js`)

- [x] `buildHookContext(event, {project, change, workflow, sdd, skill, operation})` — a thin,
      non-fetching normalizer (design.md §4's "Hook Context asymmetry") — never calls `explain()`/
      `buildSkillContext()`/`resolveSddProvider()` itself.
- [x] Unit tests: zero additional file reads/provider calls (spy/counter assertion, not only
      byte-comparison — HK-R22), preserves manifest/provider errors passed in unedited, frozen
      result, idempotent.

## 10. Result model

- [x] Implement the normalized Hook Result shape (design.md §8) and the six `status` values.
- [x] Implement the non-applicable-status whitelist (`not_applicable`/`blocked`/`unsupported` only)
      proactively — the same fix Entrega 5's adversarial review had to apply to Skills after the
      fact (HK-R31).

## 11. Applicability

- [x] Each Hook's `appliesTo(event, context)` returns `{applicable, status?, reason?}` (design.md
      §8's distinction).
- [x] Unit tests: deterministic, AI-free (grep-confirmed: no network/model call in any `appliesTo`).

## 12. Ordering

- [x] `hookIds()`/`hooksForEvent()` return array-literal order — alphabetical by `id` is the
      registration order chosen for this Entrega's two Hooks (design.md, no numeric priority
      introduced — no real tie-breaking case exists).

## 13. Hook Service (`cli/src/core/services/hook-service.js`)

- [x] `evaluateEvent(event, context)` — resolve via `hooksForEvent()`, iterate in order, check
      applicability, apply capability policy (strip unauthorized `blockers`, enforce `block` only for
      `phase: "pre"`, enforce `effects: []`), call `evaluate()` (and the Skill Service, if
      `invokeSkill` + allowlisted), catch unexpected errors into `status: "failed"`, normalize,
      aggregate.
- [x] Unit tests: every one of the six `status` values reached by a dedicated fixture; adversarial
      fixture Hooks attempting to declare effects, spoof `hook`/`event`, return unauthorized
      blockers, invoke a non-allowlisted Skill, mutate the frozen context.

## 14. Skill integration

- [x] `evaluateEvent()` calls the Skill Service's `runSkill()` only for a Hook declaring
      `capabilities.invokeSkill: true` and only for an id present in that Hook's own `allowedSkills`
      (HK-R14/R35).
- [x] Confirm (grep-based review step): zero direct imports of any `cli/src/skills/*.js` module from
      any `cli/src/hooks/*.js` file.
- [x] Unit tests: a Skill's `ready` result embedded unedited in `skillResults`, never re-labeled
      `completed` (HK-R37); an attempt to invoke a non-allowlisted Skill id is rejected before the
      Skill Service is called.

## 15. First Hook — Prompt Skill Suggestion

- [x] `cli/src/hooks/prompt-skill-suggestion.js` (design.md §5, proposal.md's "Initial Hooks" §1).
- [x] Unit tests: applies to any resolved Change; `matched` with one short additive instruction when
      `requirements-analysis-instructions` is `ready`; silent (or `not_applicable`) otherwise; never
      embeds the Skill's full instructions.

## 16. Second Hook — Post-Verify Next Action

- [x] `cli/src/hooks/post-verify-next-action.js` (design.md, proposal.md's "Initial Hooks" §2) — uses
      `workflow-service.js`'s `nextAction()`, never the Skill Service.
- [x] Unit tests: `matched` with a recommended next command for a resolved, single Change;
      `not_applicable` for the whole-project `verify` (no single Change context); never changes
      `report.passed`.

## 17. `prompt` integration

- [x] Emit `prompt.prepared` (design.md §7) after `skillSection` is computed; render each `matched`
      Hook result as one additional, clearly-labeled section (same renderer pattern as
      `renderSkillSection()`).
- [x] Confirm `prompt`/`prompt --skill`'s byte output is unchanged without an applicable Hook result
      (HK-R45/R46).

## 18. `verify` integration

- [x] Emit `verify.completed` (design.md §7) after `report` is computed; render each `matched` Hook
      result as one additional line after `renderReport()`'s own output.
- [x] Confirm `verify`'s PASS/FAIL and exit code are unchanged (HK-R48).

## 19. `close` integration — explicitly deferred

- [x] **Not implemented this Entrega** (design.md §9). This line exists so the decision is visible in
      the task list, not silently absent (same discipline as Entrega 4's `start` non-task).

## 20. Security

- [x] Regression tests: path traversal via `context.sdd` still rejected (reusing Change 0045's
      fixture); a spec/requirement fixture containing directive-looking text produces a result whose
      `status` is unaffected — the text only ever appears inertly (via `skillResults` passthrough).
- [x] Confirm (grep-based review step): zero `fs.*`/`child_process.*`/`http*`/`fetch` calls and zero
      direct Skill-module imports in any `cli/src/hooks/*.js` file.
- [x] Confirm (design constraint, not merely observed): no Hook this Entrega performs a new
      filesystem read — the inherited Entrega-3 symlink-escape gap is not expanded (HK-R41).

## 21. Compatibility

- [x] Zero-drift regression: `prompt`/`verify` unchanged for every real Change (no applicable Hook
      result exists in this repository today).
- [x] Regression: `status()`/`status --next`/`close()`/`propose()`'s write path byte-unchanged
      (`git diff` contains zero lines touching those functions).

## 22. Unit tests

- [x] `hook-model.test.js`, `hook-registry.test.js`, `hook-context.test.js`, `hook-service.test.js` —
      see design.md §12.

## 23. CLI integration tests

- [x] `cli.test.js` additions for `prompt.prepared`/`verify.completed` integration, mirroring the
      style of Entrega 5's `prompt --skill`/`--list-skills` tests.

## 24. Documentation

- [x] `docs/architecture.md`: new subsection for the Hook Registry/Service/Context layer, explicitly
      cross-referencing the Skill Catalog/Skills Runtime distinction (Entrega 5) so a reader does not
      conflate three different "Hook"-adjacent or "Skill"-adjacent concepts.
- [x] `docs/domain-model.md`: add `Hook`, `Hook Registry`, `Hook Context`, `Normalized Hook Result`,
      `Lifecycle Event` to the ubiquitous-language table, pointing at ADR-020.
- [x] `knowledge/decisions.md`: ADR-020 status updated to `Accepted` once approved.

## 25. Adversarial review

- [x] Independent review after implementation, before closing — same discipline as Changes
      0043–0047: re-read code fresh against ADR-020/proposal/spec/design/tasks/verification/diff/
      tests/docs. Check specifically for: a registered Hook with `writeFiles`/`executeCommands`/
      `network` reachable, a Hook reading the filesystem directly, `matched` reported where
      `appliesTo()` actually failed, unauthorized blockers honored, a Hook importing a Skill
      directly, Hook→Skill→Hook recursion, `prompt`/`verify` byte regressions, duplicated
      context-building logic diverging from the calling operation's own already-computed values,
      prompt injection content altering runtime behavior, the `appliesTo()` status-spoofing gap
      recurring (HK-R31 — proactively fixed this time, but re-check it was actually implemented that
      way, not merely documented), stray fixtures, requirements without evidence.

## 26. Final verification

- [x] `aief verify` (this Change and whole project).
- [x] Full test suite passes; delta from baseline (360) recorded.
- [x] `aief prompt`/`aief verify` real-output diffs: byte-identical where design requires it.
- [x] `git status --porcelain` clean.

## Human gates

- [x] (human) Accept, amend, or reject ADR-020.
- [x] (human) Approve `spec.md`/`design.md`, or amend either.
- [x] (human) Explicit go-ahead to begin implementation.
- [x] (review) Independent review before implementation begins, optional per Change 0044's own
      precedent.

## Deferred (explicitly out of scope for Entrega 6)

- [-] `close.requested`/`change.closed` events and any Close Readiness Guard Hook — evaluated,
      deferred (design.md §9).
- [-] `change.created`/`change.inspected` events — no justified consumer this Entrega.
- [-] `before_work`/`after_work`/`before_review`/`after_review` (vision document §13) — no
      CLI-observable emission point exists yet.
- [-] `capabilities.block` exercised by any real Hook — contract vocabulary only, structurally inert.
- [-] `capabilities.writeFiles`/`executeCommands`/`network: true` (Model C) — structurally
      unregisterable.
- [-] Numeric Hook priority — no real tie-breaking case exists; alphabetical `id` only.
- [-] Async events, background jobs, a daemon, event queues/persistence, cron, webhooks, external
      integrations, remote Hooks, plugins, a marketplace, a sandbox.
- [-] Semantic Verification, Review-as-product, a conversational interface, Entrega 7 and beyond.
