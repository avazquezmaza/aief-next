# Evidence

## Summary

Entrega 6 (Change 0048, ADR-020, Path B) is implemented, tested, and reviewed. A Hooks Runtime —
event contract, closed two-event catalog, Hook contract, Registry, non-fetching Context Builder,
Service — is introduced and wired additively into `prompt`/`verify`; no new command verb. Two initial
Hooks ship: `prompt-skill-suggestion` (the one Hook exercising real Skill Service invocation, via an
explicit allowlist) and `post-verify-next-action` (reuses `workflow-service.js`'s
`deriveNextAction()`). `close()` integration was evaluated and explicitly deferred. 440/440 tests
pass (360 baseline + 80 new). `aief verify` PASS. `aief prompt`/`aief verify` byte-identical without
an applicable Hook result. `git status --porcelain` clean except this Change's own files. The formal
adversarial review (44-point checklist) found and fixed two real, exploitable issues before close —
both described below with proof-of-exploit, fix, and regression test.

## Activities Performed

- Etapa A: baseline captured (360/360 tests; `prompt`, `prompt --skill`, `prompt --list-skills`,
  `verify` PASS, `verify` FAIL, `status`, `close` dry-run output snapshots against real/scratch
  fixtures). Confirmed via grep that no `hook`/`callback`/`middleware`/`lifecycle`/`listener`
  mechanism existed anywhere in `cli/src/` prior to this Entrega. ADR-020 changed from `Proposed` to
  `Accepted`.
- Etapa B: the event contract and closed catalog (`cli/src/core/domain/hook.js`) —
  `EVENT_CATALOG`/`EVENT_IDS`/`isKnownEvent`/`phaseOf` (exactly `prompt.prepared`/`verify.completed`,
  both `phase: "post"`), the Hook descriptor contract (`KNOWN_CAPABILITIES`, `FORBIDDEN_CAPABILITIES`,
  `STATUS_VALUES`, `APPLICABILITY_STATUSES` — the last one applied *proactively*, the same fix
  Entrega 5's review had to apply to Skills after the fact), `validateDescriptor()` (reusing Skills'
  own `ID_PATTERN`/`VERSION_PATTERN`, not reinventing them). 19 tests (`hook-model.test.js`), written
  and passing before any Hook or the registry existed, per the explicit "no implementes Hooks antes
  de estabilizar estos contratos" instruction.
- Etapa C: the two initial Hook modules (`cli/src/hooks/prompt-skill-suggestion.js`,
  `post-verify-next-action.js`) and the Hook Registry (`cli/src/hooks/index.js`) — `createRegistry()`
  (array-based, catching genuine duplicate-id collisions, mirroring `skills/index.js`'s own
  reasoning), `hasHook`/`getHook`/`hookIds`/`hooksForEvent`/`describeHook`/`listDescriptors`, plus a
  registry-time check (new relative to Skills) that every `allowedSkills` entry names a Skill actually
  present in the real Skill Registry. 13 tests (`hook-registry.test.js`).
- Etapa D: the Hook Context Builder (`cli/src/core/services/hook-context.js`) — deliberately
  **non-fetching**, the opposite of Skills' own Context Builder: `buildEvent(id, operationLabel,
  timestamp?)` and `buildHookContext(event, {project, change, workflow, sdd, skill, operation})`
  accept already-computed values and never call `explain()`/`resolveSddProvider()`/
  `buildSkillContext()` themselves — structurally guaranteed by having no `changeDir`/`cwd` parameter
  at all. 12 tests (`hook-context.test.js`), including a source-grep proof (not just a spy) that the
  module imports none of those functions.
- Etapa E: the Hook Service (`cli/src/core/services/hook-service.js`) — `evaluateEvent(event,
  context)`/`evaluateHook(mod, event, context)` (resolve → applicability → capability policy →
  evaluate → Skill Service call when permitted → normalize → aggregate). 28 tests
  (`hook-service.test.js`), including a battery of adversarial fixture Hooks attempting to declare
  effects, spoof `hook`/`event`, return unauthorized blockers, invoke a non-allowlisted Skill,
  mutate the frozen context — plus, added during the formal review, two more adversarial fixtures
  that found and locked in real fixes (see Findings).
- Etapa F/G: the two Hooks' full logic — `prompt-skill-suggestion` (`capabilities.invokeSkill: true`,
  `allowedSkills: ["requirements-analysis-instructions"]`, recommends running `prompt --skill`
  without auto-rendering the Skill's full instructions) and `post-verify-next-action`
  (`capabilities.invokeSkill: false`, calls `workflow-service.js`'s `deriveNextAction()` directly on
  Hook Context's own already-loaded `change`/`workflow`/`sdd` — a pure combination of already-loaded
  facts, not a new fetch).
- Etapa H: wired `prompt.prepared` (fires after `skillSection` is computed, before the final render;
  `promptChange` is captured from the same `explainWorkflow()` call `prompt()` already made for its
  own Workflow/SDD blocks — zero new fetches) and `verify.completed` (fires after `renderReport()`
  has already printed PASS/FAIL and set the exit code; for `--change <id>`, one new `explainWorkflow()`
  call is made — the *first* one `verify()` ever makes, specifically to support the Hook, not a
  re-derivation of anything `verify()` had already computed; the whole-project path skips this call
  entirely since no single Change exists for the Hook to act on). 9 new `cli.test.js` tests.
- Etapa I: compatibility regressions — confirmed via `git diff` hunk-by-hunk inspection that
  `close()`, `propose()`, `markClosed()`, `checkChangeReadiness()` have zero touched lines;
  `main()`'s dispatcher gained zero new `case` entries (tested: `aief hooks` → "Unknown command",
  exit 1); `aief status`/`aief prompt`/`aief prompt --skill`/`aief prompt --list-skills`/`aief verify`
  real output byte-identical against the Etapa A baselines; live-reproduced both Hooks firing on a
  real scratch Change (`sdd: {provider: "local"}`, `track: "lite"`) and confirmed the exact expected
  additive output for both `prompt` and `verify --change`.
- Documentation: `docs/architecture.md` (new "Hooks Runtime" subsection), `docs/domain-model.md`
  (five new ubiquitous-language rows: Lifecycle Event, Hook, Hook Registry, Hook Context, Normalized
  Hook Result).
- Formal adversarial review (44-point checklist, this session, after Etapa J) — see below.

## Verification

```
cd cli && npm test
# 440/440 pass (360 baseline + 80 new), 0 fail
node ../cli/bin/aief.js verify        # whole project: PASS
git status --porcelain                # clean (except this Change's own in-progress files)
```

`aief status`/`aief prompt`/`aief prompt --skill`/`aief prompt --list-skills`/`aief verify` real
output diffs against the Etapa A baseline: **byte-identical, zero diff lines** — re-confirmed after
both adversarial-review fixes, not only before them.

Live CLI checks performed directly: a scratch Change with `track: "lite"` + `sdd: {provider:
"local"}` produced exactly the expected `─── Hook: prompt-skill-suggestion ───` section in `prompt`
and `Hook recommendation:` line in `verify --change`; `aief hooks` (an unregistered verb) → "Unknown
command", exit 1.

Scenario table (`verification.md`, 53 scenarios mapped to HK-R1–R56): **all 53 PASS**, each backed by
a dedicated automated test.

## Findings

### Formal adversarial review (44-point checklist, post-implementation)

Re-read `cli/src/core/domain/hook.js`, `cli/src/hooks/*.js`,
`cli/src/core/services/hook-context.js`/`hook-service.js`, and `cli.js`'s `prompt()`/
`runVerifyCompletedHooks()`/`verify()` fresh against each item:

| # | Check | Result |
|---|---|---|
| 1 | Evento desconocido aceptado | None — `evaluateEvent()` throws on `!isKnownEvent(event.id)` (tested). |
| 2 | Phase falsificada | **Found and fixed** (see below). |
| 3 | Capability ausente permitida | None — every capability check uses strict `=== true`; absence behaves as `false` (tested). |
| 4-6 | `writeFiles`/`executeCommands`/`network` aceptado | None — `FORBIDDEN_CAPABILITIES` rejected at registry-construction time (tested). |
| 7 | Hook post-event bloqueando | None — `canBlock` requires `phaseOf(event.id) === "pre"`; no catalog event is `"pre"` (tested, plus the phase-spoofing fix closes the one bypass that existed). |
| 8 | Blockers sin permiso | None — stripped, `status: "invalid"`, error recorded (tested). |
| 9 | Effects no vacíos | None — same mechanism, `effects` always `[]` (tested). |
| 10 | Status spoofing desde `appliesTo` | None — `APPLICABILITY_STATUSES` whitelist applied proactively this Entrega (tested), the same fix Entrega 5 had to apply reactively. |
| 11 | Id de resultado falsificado | None — `baseResult()` re-asserts `hook: mod.id` after the spread (tested). |
| 12 | Evento de resultado falsificado | None — same mechanism, `event: event.id` (tested). |
| 13 | Duplicados | None — `createRegistry()` throws (tested). |
| 14 | Orden accidental | None — `hookIds()`/`hooksForEvent()` return `MODULES`'s own array order (tested). |
| 15 | Mutación del Registry | None — `HOOKS` built once from frozen ES-module namespace objects; no exported "register" function. |
| 16 | Carga externa | None — zero dynamic `import()`/`require()` anywhere in `cli/src/hooks/`. |
| 17 | Context Builder leyendo filesystem | None — zero `fs.*` calls, zero imports of `explain()`/`resolveSddProvider()`/`buildSkillContext()` (source-grep tested). |
| 18-19 | Rederivación de Workflow/SDD | None — `prompt()` captures `change`/`workflow`/`sdd` from its single existing `explainWorkflow()` call; `verify()`'s single new `explainWorkflow()` call (added this Entrega, for the Hook) is never called twice within one invocation. |
| 20 | Contexto mutable | None — `buildHookContext()` deep-freezes; a mutation attempt throws, caught, `status: "failed"` (tested). |
| 21 | Hook importando Skill directamente | None — grep-confirmed zero imports of `skills/change-context.js`/`skills/requirements-analysis-instructions.js` under `cli/src/hooks/` (tested). |
| 22 | Skill fuera de allowlist | None — `invokeAllowedSkills()` only iterates `mod.allowedSkills`, structurally; no code path lets `evaluate()` request a different id. |
| 23 | Skill `ready` convertida en `completed` | None — the Skill Service's own returned object is embedded, never re-labeled (tested). |
| 24 | Skill result alterado | **Found and fixed** (see below). |
| 25 | Recursión Hook→Skill→Hook | None — grep-confirmed `skill-service.js` has zero references to any Hook module or `hook-service`. |
| 26 | Doble emisión | None — `evaluateEvent()`/`runVerifyCompletedHooks()` each called exactly once per real code path (confirmed by reading every call site). |
| 27 | Prompt injection | None — neither shipped Hook echoes raw repository content; `prompt-skill-suggestion`'s and `post-verify-next-action`'s output strings are entirely synthesized (command templates), not quoted spec/requirement text — even safer than the design anticipated. Repository content that does reach a Hook (via `skillResults`) is already Entrega 5's fenced/labeled data, passed through unedited. |
| 28 | Contenido del repo alterando capabilities | None — capabilities are fixed, frozen module constants; no code path lets any input mutate them. |
| 29-30 | Hook cambiando `verify` PASS/FAIL o exit code | None — `renderReport(report)` runs, and both the printed result and `process.exitCode` are fully decided, *before* `runVerifyCompletedHooks()` is even called (tested). |
| 31 | Hook creando evidence | None — `evidence` field is only ever populated from a Hook's own `evaluate()` return, never written to disk. |
| 32 | Hook modificando archivos | None — zero-writes tests confirm the Change directory is byte-unchanged after any Hook-bearing `prompt`/`verify` call. |
| 33-35 | OpenSpec / proceso externo / red | None — zero `child_process`/`fetch`/`http` calls anywhere in the new modules (grep-confirmed). |
| 36 | `prompt` legacy modificado | None — byte-identical diff confirmed, before and after both fixes. |
| 37 | `prompt --skill` roto | None — byte-identical diff confirmed; coexistence test confirms both sections render, correctly ordered. |
| 38 | `status` roto | None — byte-identical diff confirmed; `git diff` shows zero lines inside `status()`/`statusOverview()`/`statusSingleChange()`'s own bodies (the visible diff hunk there is Entrega 4's pre-existing rename, not this Entrega's). |
| 39 | `verify` legacy roto | None — byte-identical diff confirmed for the no-Hook-match case; PASS/FAIL/exit code unchanged when a Hook does match. |
| 40 | `close` modificado | None — `git diff` hunk inspection confirms zero lines inside `close()`'s body (the hunk boundary sits entirely within `markClosed()`, a pre-existing Change-0043 comment, before `close()` starts). |
| 41 | `propose` modificado | None — zero diff lines; `propose()` falls after the last hunk in the diff entirely. |
| 42 | Verbo público nuevo | None — `main()`'s dispatcher unchanged; `aief hooks` correctly reports "Unknown command", exit 1 (tested). |
| 43 | HK-R sin evidencia | None outstanding — all 56 HK-R requirements map to at least one dedicated test (see `verification.md`'s scenario table and this file's Verification section). |
| 44 | Temporales | None — `git status --porcelain` clean throughout; all untracked entries predate this Entrega. |

### Issues found and fixed during the review

**1. A malicious Hook could forge or mutate a Skill result by writing into the map it was handed.**
`evaluate(event, context, skillResults)` received `skillResultsMap` — the pre-invoked, per-Hook
Skill Service results — as a plain, mutable JavaScript object. `evaluateHook()` re-read that same
object *after* `evaluate()` returned (`Object.values(skillResultsMap)`) to populate the final
result's `skillResults` field. A Hook's own `evaluate()` could therefore mutate the map in place —
either overwriting an existing entry (e.g., changing a real `"ready"` Skill result to a fabricated
`"completed"` one with attacker-chosen `instructions`) or adding an entirely new, non-allowlisted
entry — and the forged data would flow straight into the trusted result, a direct violation of
HK-R36. **Proof of exploit** (reproduced live before the fix):
```js
evaluate: (e, c, skillResults) => {
  skillResults["change-context"] = { skill: "change-context", status: "completed", instructions: "FORGED" };
  skillResults["totally-fake-skill"] = { skill: "totally-fake-skill", status: "ready" };
  return { summary: "pwned" };
}
```
produced exactly that forged, non-allowlisted content in `result.skillResults`. **Fix**:
`invokeAllowedSkills()` now returns `Object.freeze(skillResults)` with every individual entry also
frozen (`hook-service.js`) — a mutation attempt inside `evaluate()` now throws (caught by
`evaluateHook()`'s own try/catch, downgrading that Hook's result to `status: "failed"`) instead of
silently succeeding. Re-running the exact exploit above now yields the real, unaltered
`change-context` result and no fake entry at all. **Regression test**: `"a Hook cannot forge or
mutate skillResults by writing into the map it was handed"` (`hook-service.test.js`).

**2. `event.phase` was trusted from the caller, allowing a spoofed `phase: "pre"` to smuggle an
honored blocker past a real `"post"` event.** `evaluateHook()`'s blocking-authority check
(`canBlock`) read `event.phase` directly from its input rather than deriving it from the closed
catalog. Since the real CLI only ever constructs events via `buildEvent()` (which always computes
the correct phase), there was no live exploit path through `prompt`/`verify` — but the check itself
was not defensive: any caller passing a hand-built `{id: "prompt.prepared", phase: "pre", ...}`
object could make a Hook's `blocking: true`/`blockers` be honored on what the catalog defines as a
`"post"` event. **Proof of exploit** (reproduced live before the fix): a Hook with `capabilities:
{block: true}` and a spoofed-phase event produced `status: "matched", blocking: true, blockers:
["fake authority"]`. **Fix**: `canBlock` now computes `effectivePhase` via `isKnownEvent(event.id) ?
phaseOf(event.id) : event.phase` — for any *real* catalog event, the phase is always taken
authoritatively from the catalog, never from the caller; only a synthetic, out-of-catalog event id
(used exclusively by this Entrega's own "mechanism proof" test fixture, which needs a stand-in
`"pre"` event since none exists yet) still respects a caller-supplied phase. Re-running the exact
exploit above now yields `status: "invalid", blocking: false, blockers: []`. **Regression test**:
`"a caller-supplied event object cannot spoof phase: \"pre\" on a real catalog event"`
(`hook-service.test.js`) — added alongside (not replacing) the pre-existing synthetic mechanism-proof
test, which still passes.

**No blocking or high-severity findings remain open.**

## Risks

- **`close()` integration remains deferred** — the vision document's "before_close" guard is not
  built; revisited only when a future Change is explicitly willing to take on the risk of
  instrumenting the write-critical path (design.md §9's falsifiable condition).
- **Only one of the two Hooks exercises `invokeSkill`** — `post-verify-next-action` demonstrates the
  `workflow-service.js` reuse path instead. Both integration paths (Skill Service, WorkflowService)
  are proven, but a third Hook combining both was not built, since no real use case justified it.
- Naming/exposure surface for Hooks (currently: no CLI-facing configuration at all — internal-only,
  evaluated automatically at the two fixed emission points) may need revisiting once a real user
  wants to disable/inspect Hook behavior; deferred per the commissioning instruction's explicit "no
  agregues opciones para habilitar o deshabilitar Hooks."

## Recommendations

- When Entrega 7/8 (Verification/Review) need a `"pre"`-phase event, reuse the already-built and
  already-tested `canBlock`/`blocking`/`blockers` enforcement path in `hook-service.js` rather than
  building a second blocking mechanism — it already does the right thing the moment a real
  `phase: "pre"` catalog entry exists.
- Any future code that hands a Hook (or a Skill) a pre-computed data structure by reference should
  default to freezing it, not just the top-level context — this Entrega's Finding 1 is exactly the
  gap between "the context is frozen" and "everything reachable from evaluate() is frozen."

## Artifacts Produced

- `cli/src/core/domain/hook.js` (new)
- `cli/src/hooks/index.js`, `cli/src/hooks/prompt-skill-suggestion.js`,
  `cli/src/hooks/post-verify-next-action.js` (new)
- `cli/src/core/services/hook-context.js`, `cli/src/core/services/hook-service.js` (new)
- `cli/tests/hook-model.test.js`, `cli/tests/hook-registry.test.js`,
  `cli/tests/hook-context.test.js`, `cli/tests/hook-service.test.js` (new, 80 tests)
- `cli/tests/cli.test.js` (extended: 9 new tests)
- `cli/src/cli.js` (extended: `prompt()`'s `prompt.prepared` emission, `verify()`'s
  `runVerifyCompletedHooks()`, `renderHookResults()`)
- `cli/package.json` (test script includes the four new Hook test files)
- `knowledge/decisions.md` (ADR-020: `Accepted`)
- `docs/architecture.md`, `docs/domain-model.md` (documentation)
- `changes/0048-core3-hooks-runtime/{change.md,spec.md,tasks.md,verification.md,evidence.md}` (this
  Change's own artifacts, updated to reflect execution)

## Lessons Learned

- Both real findings this Entrega share the same root shape as prior Entregas' own bugs: trusting a
  value's *presence* (a status string, an event's phase field) without verifying it came from an
  *authoritative* source, rather than from a return value the reviewed code itself does not fully
  control. Entrega 5 found this for Skills' `appliesTo()`; this Entrega found it twice more — once in
  the same class (proactively fixed before review, via `APPLICABILITY_STATUSES`) and once in a new
  shape (mutable shared state, not just a spoofable string) that the proactive fix didn't anticipate.
  Worth treating as a standing category for future adversarial reviews: "does this Service trust
  anything about its own inputs' *shape* that a hostile implementer of the plugin-shaped thing could
  control?" — separately from "does this Service trust the *content* of what it's told."
- The Hook Context asymmetry (non-fetching, unlike Skills' Context Builder) held up cleanly through
  implementation — no test or real usage needed to bend that design decision, which suggests the
  upfront inspection (confirming `prompt()`/`verify()` already compute what a Hook would need) was
  accurate rather than optimistic.

## Next Change

Entrega 7 (Verification) is explicitly out of scope for this Change, per the user's instruction. This
Change closes here; Entrega 7 planning begins as a separate, later conversation/Change.
