# Tasks — Entrega 5: Skills Runtime

**Executed.** ADR-019 accepted and implementation explicitly approved (2026-07-26); all tasks below
completed. See `evidence.md` for the full implementation/verification write-up and the adversarial
review, including one convention violation (an ES6 class) found and fixed during the review.

## 1. Baseline

- [x] Run `cd cli && npm test`; record the count (287/287 at planning time).
- [x] Capture real `aief prompt` output as a pre-change baseline (with and without an open Change
      carrying `track`/`sdd`, mirroring Entrega 4's own baseline discipline).
- [x] Confirm `git status --porcelain` clean before starting (aside from this Change's own planning
      artifacts).

## 2. ADR

- [x] Human review of ADR-019 (`knowledge/decisions.md`) — accept, amend, or reject.
- [x] Confirm the ADR-010 relationship (design.md §1) is acceptable — the Skills catalog stays
      unmigrated and untouched.

## 3. Descriptor contract

- [x] Implement the Skill descriptor shape (design.md §4) as a documented module-comment contract in
      the registry (`cli/src/skills/index.js`) — same discipline as `GateResult`'s/`SddProvider`'s
      own contract comments.
- [x] No `validateInput`/`execute` required by the contract unless a Skill declares the matching
      capability — confirmed by the registry validator (task 6), not by convention alone.

## 4. Capabilities

- [x] Implement the six-flag capability object (design.md §5) as plain data — no enum library, no
      new dependency.
- [x] Registry-time rejection of `writeFiles`/`executeCommands`/`network: true` (SK-R6) — a thrown
      error at module load, with a test asserting a deliberately-malformed fixture Skill fails to
      register.

## 5. Errors

- [x] Implement the error/outcome table (design.md §8) as concrete thrown-Error vs. normalized-result
      cases — no single generic `SkillError` class swallowing the distinction.

## 6. Registry (`cli/src/skills/index.js`)

- [x] `hasSkill(id)`, `getSkill(id)`, `skillIds()` — mirrors `requirement-providers/index.js`/
      `sdd-providers/index.js` exactly (SK-R8).
- [x] Duplicate-id and invalid-descriptor rejection at construction time (SK-R9/R10).
- [x] Unit tests: registration, duplicate rejection, invalid-descriptor rejection, forbidden-capability
      rejection, deterministic `skillIds()` order.

## 7. Skill Context Builder (`cli/src/core/services/skill-context.js`)

- [x] `buildSkillContext(changeDir, cwd)` — calls `workflow-service.js`'s `explain()`, adds `project`
      via `detectProject(cwd)`, returns the combined shape (design.md §3/§4, SK-R12/R13).
- [x] Unit tests: legacy/track-only/sdd-only/track+sdd/invalid-manifest/invalid-provider/traversal
      fixtures (reused from Entrega 3/4's own fixtures where possible, not rebuilt), idempotence,
      zero-writes byte-comparison, "built once per Change" (task 10 exercises this via the Service,
      not this module alone).

## 8. Result model

- [x] Implement the normalized Skill Result shape (design.md §7) and the seven `status` values as a
      documented contract, same discipline as the Normalized Action contract (Entrega 4).
- [x] Implement the `ready`-vs-`completed` enforcement in the Skill Service (task 10), not per-Skill.

## 9. Applicability

- [x] Each Skill's `appliesTo(context)` returns `{applicable, reason?}` (design.md §7's
      not_applicable/blocked/unsupported distinction lives in the Skill Service's interpretation of
      the Skill's own `appliesTo`/`buildInstructions` outcomes, not a second parallel field).
- [x] Unit tests: deterministic, AI-free (grep-confirmed: no network/model call in any `appliesTo`).

## 10. Skill Service (`cli/src/core/services/skill-service.js`)

- [x] `listSkills(context)` — every registered Skill mapped through `appliesTo(context)`, zero
      `buildInstructions()` calls (SK-R40).
- [x] `runSkill(id, context, input)` — resolve via registry (SK-R11/R29 error shape), check
      applicability, check capability before invoking `execute()`, invoke `buildInstructions()`
      (and/or `execute()` if declared), catch unexpected errors into `status: "failed"` (SK-R26),
      assert `effects === []` (SK-R7), normalize into the Result shape.
- [x] Unit tests: every one of the seven `status` values reached by a dedicated fixture (including a
      synthetic case for any status neither initial Skill's real fixtures reach naturally — same
      "synthetic where needed" precedent as Entrega 4's `unsupported` test).

## 11. First Skill — `change-context`

- [x] `cli/src/skills/change-context.js` (design.md §6.1).
- [x] Unit tests: applies to any resolved Change, `ready` result, content matches
      `workflow-service.js`'s `explain()` output, never `completed`.

## 12. Second Skill — `requirements-analysis-instructions`

- [x] `cli/src/skills/requirements-analysis-instructions.js` (design.md §6.2).
- [x] Unit tests: `not_applicable` with no `sdd`; `unsupported`/`blocked` with an unavailable/invalid
      SDD provider (reusing Change 0045's fixtures); `ready` with a valid `sdd`; content reflects only
      counts/presence, never inferred interpretation of requirement text.

## 13. Workflow Engine integration

- [x] Confirm (no new code expected beyond what task 7/10 already build): no Skill Service/Skill
      function calls `evaluateGates()`/`resolveState()`/`isTransitionLegal()` directly — only
      `explain()` does. Grep-confirmed as a review step (task 21), not a separate implementation task.

## 14. SDD Provider integration

- [x] Confirm (same as task 13): no Skill Service/Skill function calls `resolveSddProvider()`/a
      provider module directly — only `explain()`/the Skill Context Builder does.

## 15. `prompt` integration

- [x] `--list-skills` flag (design.md §9) — read-only, zero writes.
- [x] `--skill <id>` flag (design.md §9) — unknown id → exit 1 before any prompt text prints; known
      non-applicable/blocked/unsupported → prompt prints in full plus one honest status line; known
      applicable → one new, clearly-labeled section appended, rendered by a shared renderer (never
      per-Skill phrasing) so no Skill's own text can claim completion (SK-R25/R42).
- [x] Confirm `prompt`'s byte output without either flag is unchanged from Entrega 4 (SK-R39).

## 16. Compatibility

- [x] Zero-drift regression: `prompt` unchanged for every real Change (no `--skill`/`--list-skills`).
- [x] Regression: `status()`/`verify()`/`close()`/`propose()`'s write path byte-unchanged (`git diff`
      contains zero lines touching those functions beyond `prompt()`'s flag additions).

## 17. Security

- [x] Regression tests (through the new surface): path traversal via `context.sdd` still rejected
      (reusing Change 0045's fixture); a spec/requirement fixture containing directive-looking text
      ("ignore previous instructions", "delete all files") produces a result whose `status`/
      `applicable` outcome is unaffected — the text only appears, inertly, inside `instructions`.
- [x] Confirm (grep-based review step): zero `fs.*`/`child_process.*`/`http*`/`fetch` calls in any
      `cli/src/skills/*.js` file.

## 18. Unit tests

- [x] `skill-context.test.js`, `skill-registry.test.js` (or folded into a `skills-index.test.js`,
      matching whichever naming convention `sdd-provider-registry.test.js` established),
      `skill-service.test.js` — see design.md §13.

## 19. CLI integration tests

- [x] `cli.test.js` additions for `prompt --list-skills`/`prompt --skill <id>`, mirroring the style of
      Entrega 4's `status --change`/`--next` and `prompt` context-block tests.

## 20. Documentation

- [x] `docs/architecture.md`: new subsection for the Skill Registry/Service/Context layer, explicitly
      distinguishing it from the existing Skills catalog section (if one exists) or adding both
      side-by-side with a cross-reference.
- [x] `docs/domain-model.md`: add `Skill` (this Entrega's contract), `Skill Registry`, `Skill
      Context`, `Skill Result` — and, if not already present, a distinct row for "Skills catalog"
      (ADR-010) so the two are never conflated in the ubiquitous-language table.
- [x] `knowledge/decisions.md`: ADR-019 status updated to `Accepted` once approved.

## 21. Adversarial review

- [x] Independent review after implementation, before closing — same discipline as Changes
      0043–0046: re-read code fresh against ADR-019/proposal/spec/design/tasks/verification/diff/
      tests/docs. Check specifically for: a registered Skill with `writeFiles`/`executeCommands`/
      `network` reachable, a Skill reading the filesystem directly, `ready` reported as `completed`,
      a non-applicable Skill silently omitted instead of explained, `prompt` byte regressions without
      the new flags, duplicated context-building logic diverging from `workflow-service.js`,
      duplicated registry logic diverging from `requirement-providers/`/`sdd-providers/`, prompt
      injection content altering runtime behavior, stray fixtures, requirements without evidence.

## 22. Final verification

- [x] `aief verify` (this Change and whole project).
- [x] Full test suite passes; delta from baseline (287) recorded.
- [x] `aief prompt` real-output diffs: byte-identical without `--skill`/`--list-skills`.
- [x] `git status --porcelain` clean.

## Human gates

- [x] (human) Accept, amend, or reject ADR-019.
- [x] (human) Approve `spec.md`/`design.md`, or amend either.
- [x] (human) Explicit go-ahead to begin implementation.
- [x] (review) Independent review before implementation begins, optional per Change 0044's own
      precedent (direct human approval of a fully-resolved plan can satisfy this).

## Deferred (explicitly out of scope for Entrega 5)

- [-] Hooks (event registry, trigger policy, `after_*`/`before_*` runner) — Entrega 5's vision-doc
      sibling, deferred to a later Entrega per the commissioning instruction.
- [-] `capabilities.writeFiles`/`executeCommands`/`network: true` (Model C) — structurally
      unregisterable this Entrega (SK-R6); revisit only per design.md §2's falsifiable condition.
- [-] Migrating `cli/src/skills-catalog.json` entries into registered Skills — the contract supports
      it; this Entrega does not require or perform it.
- [-] Task Execution Instructions / Evidence Checklist Skills — see proposal.md's "Initial Skills"
      for why each is deferred.
- [-] AI-driven Skill selection or applicability — `appliesTo()` stays deterministic code, always.
- [-] A Skill marketplace, remote Skills, npm-resolved Skills, Skill installation.
- [-] Semantic Verification, Review-as-product, advanced Skill profiles, a conversational interface,
      Entrega 6 and beyond.
