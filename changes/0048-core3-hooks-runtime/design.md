# Design — Entrega 6: Hooks Runtime

## 1. Current architecture, confirmed by inspection

No `hook`/`callback`/`middleware`/`lifecycle`/`listener`/`trigger` concept exists anywhere in
`cli/src/` (grep-confirmed; the one incidental hit, `detect.js`'s `triggers` local variable, is
Skill-Catalog detector-matching, unrelated). Three commands have real, inspectable phase boundaries:

```text
close()   resolve → already-closed? → problems = checkChangeReadiness() (pure) → print
              → --yes? no: STOP (dry-run, no write) → problems? STOP (exit 1, no write)
              → markClosed() (THE ONLY WRITE) → confirm
verify()  resolve (or whole project) → report = verifyChange()/verifyProject() (pure)
              → renderReport(report) (prints + sets exit code)
prompt()  resolve → standardsBlock/skillsBlock/workflowBlock/sddBlock/skillSection (all computed)
              → final console.log (renders the assembled body)
```

`close()`'s only-ever write is `markClosed()`; nothing before it writes. `verify()`/`prompt()` write
nothing at all. No transaction/rollback mechanism exists beyond `writeFile()`'s overwrite guard
(Change 0043) and `close()`'s own dry-run gate — there is no atomicity to preserve or violate.

## 2. What is a Hook: the three models, evaluated against real evidence

| | Model A — pure observer | Model B — guard | Model C — effects |
|---|---|---|---|
| Shape | `Event + Context → Hook → Result` | `Pre-event + Context → Hook → allow|block` | `Post-event → Hook → Effects` |
| Real emission point available this Entrega | `prompt.prepared`, `verify.completed` (both `post`) | None — no `phase: "pre"` event is in this Entrega's catalog (§3) | None |
| Existing evidence of authority to block | `checkChangeReadiness()` (used by `close()`'s own dry-run) already produces authoritative blockers — but wiring `close.requested` is deliberately deferred (§9) | — | — |
| Decision this Entrega | **Adopted, fully** — both initial Hooks are pure observers | **Contract vocabulary adopted, structurally unexercised** — `capabilities.block`/`blocking`/`blockers` exist and are validated, but no Hook this Entrega sets `block: true`, and the Hook Service would refuse to honor it even if one did (no `"pre"` event exists to attach it to) | **Rejected at registration** — `writeFiles`/`executeCommands`/`network: true` cannot be declared, identical mechanism to Skills' `FORBIDDEN_CAPABILITIES` |

**Why Model B's vocabulary is kept, unexercised, rather than omitted:** the same reasoning ADR-019
gave Skills' `deterministicExecution` — a future pre-event (`close.requested`, if a later Change
takes on that risk) must not require a contract-shape change. Keeping `block`/`blocking`/`blockers`
in the contract now, inert, costs nothing; the Hook Service's own enforcement (HK-R11) is what
prevents an unexercised capability from becoming a live one by accident.

**Falsifiable condition for wiring `close.requested`:** a future Change explicitly willing to
instrument the one write-critical command, with its own reviewed reasoning for why the risk is
worth it — not "it would complete the vision document's sketch."

## 3. Event catalog (closed, this Entrega)

| Event id | Phase | Emission point | Consumer |
|---|---|---|---|
| `prompt.prepared` | `post` | `cli.js`'s `prompt()`, after `skillSection` is computed, before the final `console.log` | Prompt Skill Suggestion Hook |
| `verify.completed` | `post` | `cli.js`'s `verify()`, after `report`/`renderReport(report)` — specifically, after `report` exists, evaluated before or alongside `renderReport()`'s own printing | Post-Verify Next Action Hook |

**Identified, not adopted, with reasons** (real emission points exist; no consumer justifies them
this Entrega — see `proposal.md`'s "Initial events" section for the full reasoning):
`change.created` (`createChange()`), `change.inspected` (`loadChangeUnified()`/`explain()`),
`close.requested` (`cli.js:791`, right after `problems` is computed, before any write),
`change.closed` (right after `markClosed()` succeeds). None of these four exists in the Hook Registry
or is emitted by any command this Entrega — they are documented here so a future Entrega does not
have to re-inspect `cli.js` from scratch, the same "prepared, not wired" precedent Entrega 3 used for
the `specification` gate.

**Not adopted at all** (no CLI-observable emission point exists): the vision document's
`before_work`/`after_work`/`before_review`/`after_review` — these are Workflow-*stage*-shaped, and
nothing in this codebase executes a stage transition yet (`canTransition()`, Entrega 4, only answers
legality — nothing calls it to actually perform one).

## 4. Architecture

```text
CLI (prompt(), verify())
        │
        ▼
Lifecycle event: {id, phase, timestamp, operation}
        │
        ▼
Hook Service (cli/src/core/services/hook-service.js)
  evaluateEvent(event, context) -> aggregated Hook Results
        │
        ├──▶ Hook Registry (cli/src/hooks/index.js)     -- hasHook/getHook/hookIds/hooksForEvent,
        │      mirrors requirement-providers/sdd-providers/skills exactly
        │
        ├──▶ Hook Context (built by the CALLER, not fetched by a Hook Context "Builder" the way
        │      Skills' is — see §"Hook Context asymmetry" below)
        │
        └──▶ Skill Service (cli/src/core/services/skill-service.js) — ONLY when a Hook declares
               capabilities.invokeSkill and the requested id is in its own allowedSkills
                    │
                    ▼
               Normalized Skill Result (Entrega 5, unedited, passed through into skillResults)
```

A Hook module (`cli/src/hooks/prompt-skill-suggestion.js`, etc.) imports nothing from `cli.js`,
nothing from a Skill module directly, nothing from `fs`/`child_process`/network APIs. The Hook
Service is the only caller of the Skill Service on a Hook's behalf.

### Hook Context asymmetry (deliberate, not an inconsistency)

Skills' Context Builder (`skill-context.js`) *fetches*: it calls `workflow-service.js`'s `explain()`
itself, because a Skill can be invoked (`prompt --skill <id>`) without `prompt()` having computed a
workflow/SDD view for any other reason. Hooks are different: both `prompt.prepared` and
`verify.completed` fire from inside a command that **already computed** `change`/`workflow`/`sdd`
(and, for `prompt`, possibly a Skill result) for its own rendering. A Hook Context Builder that
fetched independently would call `explain()`/`buildSkillContext()` a second time in the same
invocation — exactly the "two callers assumed to agree" risk Change 0043's B1 finding named, this
time for Hooks instead of Skills. The Hook Context is therefore built by a thin, non-fetching
normalizer that the **caller** (`prompt()`/`verify()`) hands its own already-computed pieces to:

```js
// cli/src/core/services/hook-context.js
export function buildHookContext(event, { project, change, workflow, sdd, skill = null, operation }) {
  return Object.freeze({ event, project, change, workflow, sdd, skill, operation });
}
```

No `changeDir`/`cwd` parameter exists on this function — it cannot fetch anything, structurally
(HK-R20/R22).

## 5. Hook contract

```js
// cli/src/hooks/prompt-skill-suggestion.js (concrete example, not the sketch)
export const id = "prompt-skill-suggestion";
export const version = "1.0.0";
export const title = "Prompt Skill Suggestion";
export const description = "Recommends an applicable, allowlisted Skill when preparing a prompt.";
export const events = ["prompt.prepared"];
export const capabilities = Object.freeze({
  observe: true,
  block: false,
  invokeSkill: true,
  emitWarning: false,
  emitInstruction: true,
  writeFiles: false,
  executeCommands: false,
  network: false
});
export const allowedSkills = ["requirements-analysis-instructions"];
export function appliesTo(event, context) {
  return context.change ? { applicable: true } : { applicable: false, status: "not_applicable", reason: "no Change resolved" };
}
export function evaluate(event, context) { /* returns {summary, instructions?, warnings?}; calls the Skill Service through the Hook Service, never directly */ }
```

Every field/method justified against the real emission points and the two initial Hooks — not
adopted from the sketch verbatim:

| Field/method | Justification | Change from the sketch |
|---|---|---|
| `id`, `version`, `title`, `description` | Same as Skills — registry lookup, human-readable identification | Kept |
| `events` | HK-R8 — restricts to the closed catalog; a Hook Service needs this to build `hooksForEvent()` | Kept, validated against the catalog at registration (Skills have no analog — a Skill doesn't subscribe to anything) |
| `capabilities` | HK-R9/R10/R11/R14 — the entire capability-gating model depends on this | Kept, with the exact eight-flag list below (§6) — the sketch's ad hoc list is made canonical |
| `allowedSkills` | HK-R14 — required whenever `capabilities.invokeSkill: true`; absent otherwise | **New**, not in the sketch — the sketch's `invokeSkill: true` alone had no allowlist mechanism, which the commissioning instruction explicitly asks for ("La preferencia es una allowlist explícita") |
| `priority` (sketch) | **Dropped.** No real case among the two initial Hooks needs tie-breaking beyond alphabetical `id` (HK-R19) — introducing a numeric priority now would be ordering machinery with no evidenced need, and the commissioning instruction itself says to prefer id-alphabetical "si no existe un caso real" | Not adopted |
| `appliesTo(event, context)` | HK-R28/R30/R31 — same discipline as Skills' `appliesTo`, extended with `event` since a Hook may (in principle) subscribe to more than one event and needs to know which one fired | Kept, `event` parameter added |
| `evaluate(event, context)` | The one method every Hook this Entrega implements — pure, returns observations, may call the Skill Service (via the Hook Service, never directly) | Renamed from the sketch's `evaluate` — kept the same name, clarified it is never a direct Skill call |
| `block`/`blocking` fields (sketch's implicit) | Kept in `capabilities`, gated by HK-R11 (only honorable for `phase: "pre"`, unreachable this Entrega) | Kept, structurally inert |

## 6. Capabilities

Eight explicit boolean flags, all default-`false`:

```text
observe            -- implements evaluate() and returns observational content; every Hook this
                       Entrega: true
block               -- may return blocking: true — HK-R11: only ever honored for a phase: "pre"
                       event; neither Hook this Entrega: true (structurally inert, not merely unused)
invokeSkill         -- may call the Skill Service, gated by allowedSkills (HK-R14); one Hook this
                       Entrega: true
emitWarning         -- may populate the result's warnings array
emitInstruction     -- may populate the result's instructions array
writeFiles          -- HK-R10: registry rejects true, unconditionally
executeCommands     -- HK-R10: registry rejects true, unconditionally
network             -- HK-R10: registry rejects true, unconditionally
```

`emitWarning`/`emitInstruction` are split (not a single "observe implies both") because the two
initial Hooks actually differ: the Prompt Skill Suggestion Hook only ever emits an instruction (a
suggested command), the Post-Verify Next Action Hook only ever emits... also an instruction (a
recommended next command) — neither emits a `warnings`-array entry this Entrega, so both flags exist
in the vocabulary for a future Hook that does (e.g., a future Hook warning about a stale
`evidence.md`), kept separate so the Hook Service can enforce "you didn't declare this, so I won't
render it" per-field, the same discipline `writeFiles`/`executeCommands`/`network` already models.

## 7. Initial events, precisely

### `prompt.prepared`

- **Emission point**: `cli.js`'s `prompt()`, immediately after `skillSection` is computed (Entrega 5,
  `cli.js` ~line 730-741), before the final `console.log` that renders the prompt body.
- **Has the main operation already occurred?** Yes — every other block (`standardsBlock` through
  `skillSection`) is fully computed; only the final print has not happened yet.
- **Can it block?** No — `phase: "post"`; `capabilities.block` is inert regardless of a Hook's own
  declaration (HK-R11).
- **What result does it receive?** `operation.result: null` (nothing has rendered), `operation.input:
  {profile, assistant, changeName}`, `skill` set to the already-computed `--skill` result if `--skill`
  was passed, else `null`.
- **What happens if a Hook fails?** `status: "failed"` for that Hook only; `prompt` still renders its
  full body; the failed Hook's own section is replaced by nothing (no partial/garbled content) — a
  Hook failure is invisible to the human unless a future `--verbose`-shaped surface is added (out of
  scope, matches Change 0044's WF-R16 precedent for deferring structured/verbose output).
- **Is anything printed?** Yes — each `matched` Hook result becomes one additional, clearly-labeled
  section, exactly the pattern `renderSkillSection()` (Entrega 5) already established.
- **Exit code?** Unaffected — `prompt`'s existing exit-code policy (Entrega 5) is untouched; a failed
  Hook never sets `process.exitCode`.
- **Writes?** None.

### `verify.completed`

- **Emission point**: `cli.js`'s `verify()`, immediately after the `report` object exists (both the
  `--change <id>` branch's `verifyChange()` call and the whole-project `verifyProject()` call),
  before/alongside `renderReport(report)`'s own printing.
- **Has the main operation already occurred?** Yes — verification itself is complete; `report.passed`
  is already decided.
- **Can it block?** No — same reasoning as above.
- **What result does it receive?** `operation.result: report` (the whole `VerificationReport`
  object), `operation.input: {changeId: parsed.change ?? null}`.
- **What happens if a Hook fails?** `status: "failed"` for that Hook only; `verify`'s own PASS/FAIL
  text and exit code (already computed by `renderReport()`) are entirely unaffected (HK-R33/R48).
- **Is anything printed?** Yes — one additional, clearly-labeled line after `renderReport()`'s
  existing output (never interleaved with it).
- **Exit code?** Unaffected — set by `renderReport()` before any Hook result is requested.
- **Writes?** None.

## 8. Normalized Hook Result

```js
{
  hook: "prompt-skill-suggestion",   // always the invoked Hook's own id — Service-owned (HK-R32)
  event: "prompt.prepared",          // always the event actually matched — Service-owned
  status: "matched",                 // one of six values below
  blocking: false,                   // always false this Entrega (HK-R11) — Service-enforced
  summary: "...",
  warnings: [],                      // only populated if capabilities.emitWarning
  blockers: [],                      // only populated if capabilities.block AND phase "pre" (never this Entrega)
  instructions: [],                  // only populated if capabilities.emitInstruction
  skillResults: [],                  // only populated if capabilities.invokeSkill — each entry is an
                                      // unedited Normalized Skill Result (Entrega 5)
  evidence: [],                      // facts this result is traceable to — never a claim of
                                      // verification performed
  errors: [],
  effects: []                        // always [] this Entrega (HK-R13)
}
```

### Status values, precisely distinguished

```text
matched         appliesTo() returned applicable, evaluate() ran successfully — the terminal success
                state for every Hook this Entrega ships. Never "completed" — a Hook observes, it does
                not execute.
not_applicable  appliesTo() returned {applicable: false} for this Hook's own declared condition
                (e.g. no Change resolved). Never an error.
blocked         applicable, but a precondition currently blocks a useful result (e.g. the
                allowlisted Skill's own result is "blocked").
unsupported     the condition is met but the underlying capability is not supported (e.g. the
                allowlisted Skill itself returns "unsupported").
invalid         a descriptor/context/allowlist-violation problem, surfaced before evaluate() runs.
failed          an unexpected runtime error inside evaluate(), caught and structured by the Hook
                Service (HK-R34) — never an uncaught exception.
```

"Hook registrado" (`hasHook(id)` true) vs. "Hook candidato" (subscribed to the fired event, via
`hooksForEvent()`) vs. "Hook aplicable" (`appliesTo()` true) vs. "Hook ejecutado" (`matched` —
`evaluate()` ran) vs. "Hook bloqueante" (structurally unreachable this Entrega) vs. "Hook fallido"
(`failed`/`invalid`) are six distinct concepts, never collapsed.

## 9. Close integration — evaluated and deferred

`close()`'s dry-run branch already prints `checkChangeReadiness()`'s `problems` before any write
occurs — the one place a `close.requested` guard Hook could attach. This Entrega evaluates that point
(§3, "identified, not adopted") and defers wiring it, for three reasons: (1) `close()` is the only
command in this codebase with a real write path outside `adopt`/`enrich`/`propose`/`new-change`'s
Change-creation writes, and even a strictly read-only, non-blocking Hook changes the trust profile of
that one command; (2) a Close Readiness Guard Hook's only justified content would restate
`problems`, which `close()`'s own dry-run output already shows in full — no information is gained;
(3) the commissioning instruction explicitly prefers deferring `close()` integration when it
"aumenta el riesgo" without a concrete, offsetting value. `close()` gains zero diff lines this
Entrega (HK-R49).

## 10. Determinism

- Registry: array literal order (HK-R19), identical precedent to Skills.
- Context: pure function of the caller-supplied pieces (HK-R20) — no Hook Context Builder ever reads
  a file or calls a provider.
- Aggregation: pure function of `(event, context)` (HK-R25/R53) — no Hook reads `Date.now()`/env vars
  for its `status` decision; `event.timestamp` may appear in `summary` text (informational) but never
  affects `status`/ordering/aggregation (HK-R2/R54).

## 11. Security — threat model

| Threat | Mitigation |
|---|---|
| Hook id manipulated | Static-object lookup only (HK-R43), mirrors SK-R35 |
| Event id manipulated | Unknown event id is rejected at the Hook Service boundary (HK-R3) before any Hook is resolved |
| Invalid descriptor | Rejected at registry-construction time (HK-R17) |
| Capability escalation | `writeFiles`/`executeCommands`/`network: true` cannot be registered (HK-R10); `block` inert outside `phase: "pre"` (HK-R11), which does not exist this Entrega |
| Hook attempts to write | Structurally absent — no Hook has filesystem access (HK-R39) |
| Hook attempts to execute commands | Structurally absent — `executeCommands` cannot be registered `true` |
| Hook attempts network access | Structurally absent — `network` cannot be registered `true` |
| Hook imports a Skill directly | Structurally absent — no Hook module imports `cli/src/skills/*`; the Hook Service is the only caller of the Skill Service, gated by `allowedSkills` (HK-R14/R35) |
| Hook alters its own context | Context is deep-frozen (same `deepFreeze` pattern as `skill-context.js`); a mutation attempt throws, caught by the Hook Service, surfaced as `status: "failed"` for that Hook only |
| Hook returns blockers without capability | Stripped by the Hook Service, logged as an error, never silently honored (HK-R12) |
| Hook falsifies a Skill's result | The Hook Service reads the Skill Service's own return value directly into `skillResults`; a Hook's `evaluate()` has no path to substitute a different object (HK-R36) |
| Repository content as prompt injection | Content only ever reaches a Hook's output via `skillResults` (already-fenced/labeled, Entrega 5) or a Hook's own static `summary`/`instructions` text, which never echoes raw repository content unescaped (HK-R42) |
| Path traversal | Inherited fix (Change 0045), reused unchanged via `context.sdd`, exercised again (HK-R40) |
| Symlink escape | Not expanded — no Hook performs any new filesystem read (HK-R41, confirmed by inspection, restated as a design constraint) |
| Denial of service via loops | No Hook can invoke another Hook; `evaluateEvent()` iterates a fixed, finite registry once per call — no recursion, no unbounded loop |
| Hook→Skill→Hook recursion | Structurally impossible — the Skill Service never emits an event and has no reference to the Hook Service (HK-R38, confirmed by inspection: `skill-service.js` imports nothing hook-related) |
| Multiple accidental executions | `evaluateEvent()` is called exactly once per real emission point per CLI invocation — verified by a call-count assertion in tests, not merely byte-comparison |

## 12. Testing strategy

- `hook-model.test.js` — mirrors `skill-model.test.js`: descriptor validation, capability rules,
  event-catalog membership, `allowedSkills` requirement.
- `hook-registry.test.js` — mirrors `skill-registry.test.js`: registration, duplicate/invalid
  rejection, forbidden-capability rejection, `hooksForEvent()` filtering, deterministic order.
- `hook-context.test.js` — mirrors `skill-context.test.js`, adjusted for the no-fetch asymmetry:
  asserts `buildHookContext()` performs zero `explain()`/`resolveSddProvider()` calls (spy/counter),
  preserves manifest/provider errors passed in, is frozen.
- `hook-service.test.js` — mirrors `skill-service.test.js`: every one of the six status values
  reached by a dedicated fixture, adversarial fixture Hooks attempting to declare effects, spoof
  `hook`/`event`, return unauthorized blockers, invoke a non-allowlisted Skill, mutate the frozen
  context — every one caught safely, same battery of tests Entrega 5's review already proved
  valuable for Skills.
- `cli.test.js` additions — `prompt.prepared`/`verify.completed` integration, byte-identical without
  an applicable Hook result, zero additional `explain()`/`buildSkillContext()` calls.

## 13. Compatibility and rollback

Every file this design adds is new (`cli/src/hooks/*.js`, `cli/src/core/services/hook-service.js`,
`cli/src/core/services/hook-context.js`, `cli/src/core/domain/hook.js`, their tests) or a small
additive edit to `prompt()`/`verify()`'s existing flow. `status`/`status --next`/`close`/`propose`
gain zero diff lines. `git diff` after implementation must show only additive/consolidating changes.

## 14. Evolution toward Verification and Review (boundary only, not implemented)

Entrega 7 (Verification) will likely want a `verify.requested` (pre-phase) event and possibly a real
guard use of `capabilities.block` once a semantic verifier exists to be authoritative about. Entrega
8 (Review) will likely want its own event(s) around a Review artifact's lifecycle. Neither is designed
here beyond confirming the Hook Service's `evaluateEvent(event, context)` shape does not need to
change to add a `"pre"`-phase event later — `HK-R11`'s enforcement already keys off `event.phase`,
not off which event fired, so adding a `"pre"` event in a future Entrega activates existing,
already-tested blocking-enforcement logic rather than requiring new machinery.
