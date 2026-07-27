# Evidence

## Summary

Entrega 2 ("Workflow Engine") is implemented per the approved SDD planning set
(`proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md`) and ADR-016 (Accepted). A Change
whose manifest declares a recognized `track` (`lite`/`standard`/`governed`) now gets an additive
block in `aief status`: current stage, next action, blockers, warnings, and pending (not-yet-built)
gates — all derived fresh on every invocation, nothing cached. H2 (invalid-manifest visibility) and
L3 (unhandled read error) were implemented as prerequisites, in scope. M1 (identity) is a
non-blocking warning gate. `aief verify` and `aief close` are untouched, by design — confirmed live,
not only by test (see "Close/B1 boundary" below).

**195/195 tests pass** (149 baseline + 42 from Etapas B–F + 4 from the adversarial review's fixes).
`aief status` output is byte-identical to the
pre-Entrega-2 baseline, checked repeatedly. `git status` was checked clean after every stage.

## Activities Performed

### Etapa A — ADR and baseline

1. Ran `cd cli && npm test`: 149/149 passing (baseline).
2. Captured `aief status` real output as `wf-status-baseline.txt`.
3. Confirmed `git status --porcelain` showed only the already-approved, uncommitted Entrega 1/2
   planning files — no stray artifacts.
4. Updated `knowledge/decisions.md`: ADR-016 status changed from `Proposed` to `Accepted`.

### Etapa B — H2 and L3

5. Wrapped `loadManifestChange()`'s `fs.readFileSync(manifestPath)` in try/catch
   (`change-loader.js`) — a directory-shaped or unreadable `manifest.json` now degrades to
   `manifestError` instead of throwing (L3 fix).
6. Added `invalidManifestChanges()` and wired it into `status()` (`cli.js`) as a new, additive
   "Changes with an invalid manifest.json" section.
7. Added regression tests: `change-loader.test.js` (L3, directory-shaped manifest), `cli.test.js`
   (malformed manifest, structurally-invalid manifest, no-silent-fallback, and a control test for
   the unaffected case).
8. Ran `node --test tests/change-loader.test.js`: 10/10. Ran `node --test tests/cli.test.js`: 62/62.
9. Re-captured `aief status`, diffed against the Etapa A baseline: **identical**.
10. Ran full suite: 154/154. Checked `git status --porcelain`: clean (only expected files).

### Etapa C — Contracts and definitions

11. Created `cli/src/workflows/{lite,standard,governed}.json`.
12. Wrote `cli/src/core/domain/workflow-definition.js`: `parseWorkflowDefinition()`,
    `validateWorkflowDefinition()`, `loadWorkflowDefinition()`. Added a `transitions` array to the
    definition shape during this step — not fully specified in the original design sketch, added
    because the commissioning instruction explicitly requires rejecting "transitions to nonexistent
    states," which needs an edge list to check against.
13. Wrote `workflow-definition.test.js` (11 tests): all three real definitions load; 8 structural
    rejection cases (missing fields, bad track, filename/content mismatch, bad transition,
    malformed gate id, duplicate/malformed stage id).
14. Ran `node --test tests/workflow-definition.test.js`: 11/11.
15. Ran full suite: 165/165. `git status --porcelain`: clean.

### Etapa D — Evaluation and transitions

16. Wrote `cli/src/core/services/gate-evaluator.js`: `evaluateGates()`, wrapping
    `checkChangeReadiness()` for the `readiness` gate; `status_consistency` (WF-R19) and `identity`
    (WF-R22/M1) gates; `notYetBuiltGate()` for `review`/`approval`/`security_review`; an
    internal-error path for a workflow definition referencing an unknown gate id.
17. Wrote `cli/src/core/services/transition-engine.js`: `resolveState()` (pure), `isTransitionLegal()`
    (pure, added beyond the original two-function sketch to give "valid/invalid transition"
    scenarios a direct answer — design.md §2's module-split reasoning applied one level down).
18. Wrote `gate-evaluator.test.js` (8 tests) and `transition-engine.test.js` (11 tests).
19. Ran both files standalone: 8/8 and 11/11.
20. Ran full suite: 184/184. `git status --porcelain`: clean.

### Etapa E — Integration with `status`

21. `change-loader.js`: added `track` field to all three return shapes; stopped feeding `.type`
    from `manifest.track` (`.type` now always `""` on the manifest branch — design.md §7).
22. Fixed three now-outdated Entrega-1 test assertions in `change-loader.test.js` (documented
    inline as justified by design.md §7, not silent): the one named in tasks.md plus two
    zero-drift/legacy-shape assertions affected by the same field addition.
23. Added `resolveWorkflowFor()` and `workflowChanges()` to `cli.js`; wired into `status()` as two
    new additive sections ("Workflow status" for resolved tracks, "Changes with an unrecognized or
    broken workflow track" for WF-R7 cases).
24. Added 7 end-to-end integration tests to `cli.test.js` (Lite pass/fail, Standard-never-closes,
    Governed-all-pending, unknown-track, warning-without-blocking).
25. Ran `cli.test.js`: 68/68. Ran full suite: 190/190.
26. Live-diffed `aief status` against the Etapa A baseline: **identical**.
27. Ran `aief verify` (whole project): PASS. `git status --porcelain`: clean.

### Etapa F — Full verification

28. Live-reproduced the "close stays blind to Workflow Engine" boundary (WF-R20) against a real
    temp project: created a Governed Change with complete files, a manifest declaring
    `track: "governed"`; confirmed `status` shows `Stage: approval` with a blocking `pending` gate;
    ran `close --yes`; confirmed exit code 0, `change.md` correctly stamped Closed,
    `manifest.json` byte-for-byte unchanged (`status: "open"`, `track: "governed"` untouched).
29. Added this exact scenario as a permanent regression test in `cli.test.js` ("close succeeds on a
    Governed Change even though its 'approval' workflow gate is permanently pending").
30. Ran full suite: 191/191. Re-diffed `aief status`: identical. Ran `aief verify`: PASS.
    `git status --porcelain`: clean.

### Post-review fixes (see "Adversarial Review" below)

31. Fixed R1 (high): `gate-evaluator.js`'s unknown-gate-id case changed `blocking: false` →
    `blocking: true`; added a `transition-engine.test.js` regression proving `resolveState()` no
    longer walks past a stage gated on an unevaluable gate.
32. Fixed R2 (medium): implemented `withNextActionHint()` in `transition-engine.js` — the
    `manifest.next_action`-as-hint comparison `spec.md`'s WF-R13 already promised but the code
    didn't yet deliver. 3 new tests.
33. Ran full suite: **195/195**. Re-diffed `aief status`: identical. Ran `aief verify`
    (whole project and this Change): PASS. `git status --porcelain`: clean.

### Documentation and SDD updates

31. `docs/architecture.md`: added "The declarative Workflow Engine" subsection, including an
    explicit note about the pre-existing, differently-scoped "Workflow Engine" heading (ADR-001's
    sense) already present in the document — a naming collision discovered while writing this
    section, documented rather than silently worked around or silently renamed.
32. `docs/domain-model.md`: added `Track`, `Gate`, `Workflow Stage` to the ubiquitous-language
    table.
33. Updated `changes/0044-core3-workflow-engine/{tasks.md,spec.md,verification.md}` with checked
    boxes and evidence pointers reflecting what was actually built, including every deviation from
    the original design sketch (the `transitions` array, `isTransitionLegal()`, the deferred
    `next_action`-as-hint comparison).

## Verification

```bash
# Etapa A
cd cli && npm test                                    # 149 pass, 0 fail (baseline)
node ../cli/bin/aief.js status > wf-status-baseline.txt

# Etapa B
node --test tests/change-loader.test.js                # 10 pass (was 9 + 1 L3)
node --test tests/cli.test.js                           # 62 pass (was 57 + 5 H2)
diff wf-status-baseline.txt wf-status-after-h2.txt       # (no output) IDENTICAL
npm test                                                 # 154 pass, 0 fail

# Etapa C
node --test tests/workflow-definition.test.js            # 11 pass
npm test                                                  # 165 pass, 0 fail

# Etapa D
node --test tests/gate-evaluator.test.js                  # 8 pass
node --test tests/transition-engine.test.js                # 11 pass
npm test                                                    # 184 pass, 0 fail

# Etapa E
node --test tests/change-loader.test.js tests/gate-evaluator.test.js tests/transition-engine.test.js  # 29 pass
node --test tests/cli.test.js                              # 68 pass
diff wf-status-baseline.txt wf-status-after-e.txt           # (no output) IDENTICAL
npm test                                                    # 190 pass, 0 fail
node ../cli/bin/aief.js verify                              # PASS

# Etapa F (final)
node --test tests/cli.test.js                               # 69 pass (added B1/track boundary test)
npm test                                                     # 191 pass, 0 fail
diff wf-status-baseline.txt wf-status-final.txt              # (no output) IDENTICAL
node ../cli/bin/aief.js verify                                # PASS
git status --porcelain                                        # only expected pending files

# Live reproduction: close vs. Governed's pending approval gate
node cli/bin/aief.js status   # -> Stage: approval, Blockers: approval (pending)
node cli/bin/aief.js close --yes
#   -> ✓ Closed changes/0001-governed-close-test.  (exit 0)
cat changes/0001-governed-close-test/manifest.json
#   -> unchanged: {"status":"open","track":"governed",...}

# Post-review (R1, R2 fixes)
node --test tests/transition-engine.test.js tests/gate-evaluator.test.js   # 23 pass (15 + 8)
npm test                                                                    # 195 pass, 0 fail
diff wf-status-baseline.txt wf-status-postreview.txt                       # (no output) IDENTICAL
node ../cli/bin/aief.js verify                                              # PASS
node ../cli/bin/aief.js verify --change 0044-core3-workflow-engine          # PASS
git status --porcelain                                                     # only expected pending files
```

No command or test could not be run.

## Findings

| # | Finding | Consequence |
|---|---|---|
| **F1** | The original design sketch's workflow-definition shape lacked an explicit edge list; the commissioning instruction's validation requirement ("reject transitions to nonexistent states") needed one | Added `transitions: [{from,to}]` during Etapa C, validated for referential integrity; documented in spec.md WF-R6 and tasks.md §3, not silently added |
| **F2** | `transition-engine.js`'s original two-function sketch (`resolveState`/`describeNextAction`) didn't give the "valid/invalid transition" scenarios (13/14) a direct answer independent of `resolveState()`'s own "where am I" computation | Added `isTransitionLegal()`, consistent with design.md §2's own module-split reasoning applied one level down; documented in tasks.md §8 |
| **F3** | WF-R22's text suggested reusing `nextChangeId()`/`slugify()` from `cli.js` for identity parsing — importing private command-layer functions into a `core/` module would invert the project's dependency direction | Implemented a small, self-contained regex in `gate-evaluator.js` instead, encoding the same `<digits>-<slug>` convention; documented in spec.md WF-R22 |
| **F4** | `manifest.next_action`-as-hint comparison (task 9) has no real fixture to test against — no manifest in this repository, real or test-authored elsewhere, sets this field | Deliberately not implemented; deferred with reasoning in tasks.md rather than written untested |
| **F5** | `docs/architecture.md` already had a top-level "Workflow Engine" heading (ADR-001's broad sense: the whole CLI) before this Entrega added a narrower subsystem with the same name | Documented the collision explicitly in the new subsection rather than silently renaming an already-approved ADR's subject; flagged as deferred documentation debt in tasks.md |
| **F6** | Adding the `track` field to `change-loader.js`'s three return shapes required updating three (not one) pre-existing Entrega-1 test assertions, since the zero-drift and legacy-shape tests also compare full object shape | All three are the same underlying, approved shape change (design.md §7) — documented individually in tasks.md §10 and inline in the test file, not silently bulk-edited |

## Risks

See "Risks" in `proposal.md`. None materialized as implemented:

- ADR-016 was accepted as written, with its "not yet a completed merge" consequence intact — no
  scattered `status()`/`close()` narration logic was removed by this Entrega, and that obligation
  remains recorded for a later Change.
- H2's hardening changed `status`'s output only in the conditional, currently-empty case, as
  designed — the byte-identical guarantee held at every checkpoint.
- No gate evaluator was tempted or found to report a fabricated `"passed"` — enforced by
  `notYetBuiltGate()`'s single code path and confirmed by an explicit `assert.notEqual(..., "passed")`
  test, not just absence of a counter-example.
- Track vs. `.type` conflation was avoided as designed (§7); confirmed by the corrected test
  assertions themselves failing loudly when the fields were still conflated during development.

## Recommendations

1. Resolve `docs/architecture.md`'s "Workflow Engine" naming collision (F5) as a small, standalone
   documentation Change before it causes real confusion — likely renaming the new subsection's
   concept to "Track/Gate Engine" or similar, once a human has a preference.
2. When Entrega 4 (`aief start`) first writes real manifests with `track`, revisit whether
   `manifest.next_action` should be populated and exercise WF-R13's comparison logic against a real
   fixture before trusting it — today it is entirely unimplemented (F4), not merely unused.
3. Before wiring `close` to actual gate enforcement (a distinct, later Change per ADR-016's
   consequence), re-read this Change's "Close/B1 boundary" live reproduction — it is the concrete
   demonstration of exactly what will change in *enforced* behavior when that Change happens.
4. H2/M1's remaining technical debt from Change 0043 stands: `manifestError` is now visible in
   `status` (this Entrega's whole point), but no other command reads it — `verify`/`close` remain
   as blind to it as they were before.

## Artifacts Produced

| Artifact | Location |
|---|---|
| Proposal / Spec / Design / Tasks / Verification | `changes/0044-core3-workflow-engine/*.md` |
| ADR-016 | `knowledge/decisions.md` |
| `workflow-definition.js` | `cli/src/core/domain/workflow-definition.js` |
| `gate-evaluator.js` | `cli/src/core/services/gate-evaluator.js` |
| `transition-engine.js` | `cli/src/core/services/transition-engine.js` |
| Workflow definitions | `cli/src/workflows/{lite,standard,governed}.json` |
| `change-loader.js` (`track` field, L3 fix) | `cli/src/core/domain/change-loader.js` |
| `cli.js` (H2 section, Workflow Engine integration) | `cli/src/cli.js` |
| New/extended tests | `cli/tests/{workflow-definition,gate-evaluator,transition-engine,change-loader,cli}.test.js` |
| Documentation | `docs/architecture.md`, `docs/domain-model.md` |

## Lessons Learned

1. A design sketch's pseudocode is a starting point, not a contract — `transitions` and
   `isTransitionLegal()` both emerged from taking the commissioning instruction's explicit
   validation/scenario requirements literally, not from re-reading `design.md` harder.
2. Keeping `core/` modules from depending on `cli.js`'s private functions (F3) is a real constraint,
   not a style preference — it surfaced immediately as soon as WF-R22 needed directory-name
   parsing, and a small self-contained regex was simpler than restructuring `cli.js`'s exports.
3. Live reproduction before writing the regression test (Etapa F's Governed/`close` boundary) is
   worth repeating deliberately for every "X stays blind to Y" claim, not only for bugs — it turns
   a design promise into a directly-observed fact before it becomes a permanent test assertion.
4. Checking `git status --porcelain` after every stage, not only at the end, caught nothing this
   time — but Change 0043's stray-artifact lesson (F7) is cheap enough to repeat every stage that
   there was no reason not to.

## Next Change

This Change is ready for independent adversarial review (see below) before closing. Wiring `close`
to actual gate enforcement, surfacing `manifestError` more broadly, and the `docs/architecture.md`
naming cleanup are candidate follow-ups — none proposed as a formal Change yet.

## Adversarial Review

Performed after implementation, before closing, per the commissioning instruction. Code re-read
fresh from disk (not from the implementation summary above) against ADR-016, `proposal.md`,
`spec.md`, `design.md`, `tasks.md`, `verification.md`, `git diff`, tests, and documentation,
checking specifically for the 14 items the commissioning instruction named.

### Findings

| # | Severity | Item(s) | Description | Status |
|---|---|---|---|---|
| **R1** | **High** | #3 (gates approved by default) | `gate-evaluator.js`'s "unknown gate id" internal-error case originally set `blocking: false`. Since `isGateSatisfied()` treats any non-blocking gate as satisfied regardless of status, a stage referencing a broken/unknown gate id (an AIEF-internal bug, e.g. a typo in a future workflow JSON edit) would let `resolveState()` walk past that stage as if it were fine — a Change could resolve to `"close"` past a stage the engine never actually evaluated. None of the three real shipped definitions trigger this today (confirmed by test), but the defect was real and directly contradicts ADR-016's "never trust an unverified state" premise. | **Fixed.** Changed to `blocking: true`. Added a `transition-engine.test.js` regression proving `resolveState()` now stops at that stage. `gate-evaluator.test.js` updated to assert `blocking === true`. |
| **R2** | **Medium** | #14 (requirements without evidence) | `spec.md`'s WF-R13 unconditionally promises the `manifest.next_action`-hint-vs-derived-value comparison. The initial implementation deliberately deferred it (no real fixture existed to test it against), but the requirement text was never amended to say so — `spec.md` still claimed a behavior the code didn't have, which is exactly the "requisito sin evidencia" this checklist item asks a reviewer to catch. | **Fixed.** Implemented `withNextActionHint()` in `transition-engine.js` (pure comparison, no fixture-dependency issue — it's a string comparison, testable with synthetic fixtures). 3 new tests (agree/disagree/absent). `spec.md`/`tasks.md` updated to match. |
| **R3** | Low | #6 (efficiency, not correctness) | `status()` now calls `getChangeDirs()` + `loadChangeUnified()` three separate times across `openChangeDirs()`, `invalidManifestChanges()`, and `workflowChanges()` — each Change's files are read from disk up to 3× per `status` invocation. Not a correctness issue (each call is independently correct and deterministic), just redundant I/O. | **Deferred.** Fixing this would mean restructuring `status()`'s three additive sections to share one scan — a real refactor, not in scope per the "no cosmetic refactors" restriction, and with zero real Changes exercising more than one of these paths today, the cost is currently unmeasurable. Flagged for whichever later Entrega next touches `status()`'s internals. |
| **R4** | Low | #11 (invalid workflow definitions accepted) | `validateWorkflowDefinition()` has 8 dedicated unit tests, but there is no *end-to-end* test that corrupts one of the real shipped `cli/src/workflows/*.json` files and confirms `aief status` degrades to the "broken workflow track" section without crashing — only `loadWorkflowDefinition()` is unit-tested against synthetic bad input. | **Deferred, not fixed.** These are AIEF's own shipped files, not user-editable in production; the unit-level coverage of `validateWorkflowDefinition()` plus `resolveWorkflowFor()`'s explicit internal-error branch (both read, both correct) make this a coverage gap in breadth, not depth. Worth adding if `cli/src/workflows/*.json` ever becomes user-extensible. |
| **R5** | Informational | #12 (messages hiding cause) | `status()`'s "Changes with an unrecognized or broken workflow track" section merges two different causes (WF-R7's unknown-track vs. an AIEF-internal broken-definition-file) under one heading. The per-line message still distinguishes them ("unknown track ..." vs. "internal error: ..."), so the cause is never actually hidden — only the section title is generic. | Not fixed — cosmetic, and splitting the heading would be exactly the kind of unrequested polish this task's restrictions caution against. |
| **R6** | Informational | — | `docs/architecture.md` now has two same-named "Workflow Engine" concepts (ADR-001's broad sense vs. Change 0044's narrow one) — already caught and documented during implementation (finding F5), not newly found by this review. Repeated here only to confirm the review agrees it's real and correctly disclosed, not overlooked. | Documented, deferred (tasks.md). |

### Items checked with no finding

Fallback silencioso de manifests inválidos (#1) — none: `loadChangeUnified()`'s manifest branch
never re-checks legacy inference once a manifest exists, confirmed by re-reading `change-loader.js`
line by line. Duplicación de lógica legacy/manifest (#2) — none: `readinessGate()` is the only
readiness rule anywhere, called identically regardless of branch. Transiciones que ignoren
blockers (#4) — none: `resolveState()`'s loop is a straight walk with no skip path. `next_action`
confiando en persistido (#5) — none: verified derived-first, hint-compared-second, by construction
(`withNextActionHint()` never runs before the derivation). Mutaciones durante lectura (#7) — none:
grepped every new file for `writeFileSync`/`appendFileSync`/`rename` — zero matches outside
`cli.js`'s pre-existing `markClosed()`, which this Entrega does not touch. Divergencia
change.md/manifest (#8) — handled (`status_consistency` gate, WF-R19, tested). Regresiones de
status (#9) — none: byte-identical diff re-confirmed after every fix in this review, not only
before it. Acoplamiento prematuro con verify/close (#10) — none: confirmed live (Etapa F's
Governed/`close` reproduction) and by `git diff` showing `verify`/`close`'s own code paths
completely untouched by this Change. Archivos temporales fuera de tests (#13) — none: `git status
--porcelain` clean after every stage, including after this review's own fixes.

### Corrections applied

R1 (blocking-severity fix) and R2 (medium-severity fix) — both implemented, tested, and
re-verified against the full suite (195/195), the byte-identical `status` diff, `aief verify`, and
a clean `git status`, all after the fixes, not only before them.

### Findings deferred (with reasoning, not silently)

R3, R4 — low severity, no correctness impact, real refactor/coverage-breadth cost, deferred to a
later Entrega that has a concrete reason to touch the same code. R5, R6 — informational, cosmetic,
already disclosed during implementation.

### Verdict

**`ready_to_close`**

No blocking or high-severity finding remains unresolved. R1 (high) and R2 (medium) were found and
fixed within this same review pass, with regression tests and a full re-verification — not merely
noted for later. R3–R6 are explicitly low/informational and explicitly deferred with reasoning, not
silently dropped. Every WF-R1–WF-R24 requirement has passing, named test evidence (spec.md's
Acceptance Criteria). `aief verify`, the full suite (195/195), the byte-identical `aief status`
diff, and a clean `git status` all pass as of this review's final state.
