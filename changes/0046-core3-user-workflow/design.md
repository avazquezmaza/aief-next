# Design — Entrega 4: User Workflow

## 1. Architecture observed today

```text
cli.js: status()
  ├── openChangeDirs() → isClosed() → loadChangeUnified()            [Entrega 1]
  ├── invalidManifestChanges() → loadChangeUnified()                  [Entrega 1/2]
  ├── workflowChanges() → resolveWorkflowFor()
  │     → loadWorkflowDefinition() → evaluateGates() → resolveState() [Entrega 2]
  ├── sddChanges() → resolveSddProvider() → provider.validate()       [Entrega 3]
  └── printNext("aief adopt" | "aief analyze" | "aief prompt" | ...)  [pre-Entrega-2, STATIC]

cli.js: prompt()
  → resolveExplicitChange()/resolveImplicitChange() → matchChanges()  [Change 0043]
  → composes standards/skills/evidence-guard context, prints text     [knows nothing about track/gates/SDD]

isTransitionLegal() — zero production call sites (confirmed by grep; only used in tests)
```

**Confirmed finding**: `status()`'s bottom-line suggestion (`cli.js` lines 854–857) and its
per-Change `Workflow status` block compute "what's next" two different ways, in the same function,
and can disagree for the same Change. This is the concrete evidence behind ADR-018 §1's facade
justification — not a hypothetical need.

**Confirmed finding**: the full command surface today is exactly `help, doctor, status, adopt,
analyze, init, new-change, enrich, propose, prompt, close, use-profile, verify, release` — no
`start`/`next`/`work`. `resolveExplicitChange()`/`resolveImplicitChange()` (`cli.js`) are already
the single, shared Change resolver — every Change-oriented command (`prompt`, `close`, `verify
--change`, `propose --change`) already calls them, never a second implementation.

**Confirmed finding (exit codes)**: the entire codebase uses only `0` and `1` (grep-confirmed, no
other value appears in `cli.js`). `close` without `--yes` reports unresolved readiness problems and
exits `0`; only `close --yes` failing an attempted write exits `1`. This is the precedent ADR-018
§3 generalizes.

## 2. Architecture proposed

```text
CLI command (status / prompt / next-or-equivalent, per Path A or B)
        │
        ▼
Change Resolver (resolveExplicitChange/resolveImplicitChange — UNCHANGED, reused)
        │
        ▼
workflow-service.js  (NEW — cli/src/core/services/workflow-service.js)
        │
        ├── loadWorkflowDefinition() / evaluateGates() / resolveState() / isTransitionLegal()  [Entrega 2, unchanged]
        └── resolveSddProvider()                                                                [Entrega 3, unchanged]
        │
        ▼
Normalized Action  { id, status, reason, blocking, requiresConfirmation, ... }  (§5)
        │
        ▼
Human renderer (status()'s bottom line / a next-shaped surface / prompt()'s new blocks)
```

No box replaces anything Entregas 1–3 shipped. `workflow-service.js` is the only new module in the
domain/service layer; everything else is either a thin CLI-layer render change or, for Path A, one
new command handler that itself delegates immediately to the service layer (never contains
`if`/`else` over stages/tracks/gates itself — the forbidden shape the commissioning instruction
names explicitly).

## 3. `workflow-service.js` — function list, derived from real call sites

Not speculative — each function corresponds to a computation `status()` or `prompt()` already
needs today, confirmed in §1, or a computation `next`/`work` cannot avoid needing per spec.md:

```js
// cli/src/core/services/workflow-service.js — plain functions, no class
// (ADR-017's precedent: zero classes anywhere in cli/src/).

export function inspect(changeDir, cwd) { ... }
// Loads the Change (loadChangeUnified), resolves its workflow (if track present) and its SDD
// provider (if sdd present) — returns { change, workflow, sdd }, one shape combining what
// resolveWorkflowFor()/sddChanges() in cli.js currently compute separately. Read-only.

export function nextAction(changeDir, cwd) { ... }
// The ONE computation behind both status()'s bottom line and next's answer (ADR-018 §1). Wraps
// inspect() and produces one Normalized Action (§5) — never two different heuristics again.

export function canTransition(changeDir, cwd, fromStage, toStage) { ... }
// Thin wrapper over isTransitionLegal() — gives isTransitionLegal() its first production call
// site. Read-only: answers "would this be legal," performs nothing.
// **Correction found while writing this module's own tests** (documented here rather than
// silently fixed): `fromStage` cannot default to `workflow.state.stage`. resolveState() only ever
// reports a stage as "current" when that stage's OWN gates are unsatisfied — it walks straight
// past any stage whose gates already pass. A caller defaulting `fromStage` to the derived current
// stage could therefore never observe `legal: true` for any real Change: by construction, you are
// only ever "at" a stage you cannot yet leave. Both stages are explicit parameters instead.

export function explain(changeDir, cwd) { ... }
// Renders inspect()'s result into the "Qué entendí / Qué encontré / Qué falta / Qué sigue"
// structure the vision document's own §20 describes — a formatting concern layered over
// inspect()'s data, not a new computation.
```

`workflowService.inspect/next/canTransition/explain` — the exact four names the commissioning
instruction sketched — are adopted **because inspection confirmed each maps to a real, distinct
existing or newly-required computation**, not adopted by default. No fifth function is added
speculatively (principle repeated from every prior Entrega's design.md: no abstraction without an
immediate, cited use case).

## 4. CLI exposure — two designed paths (ADR-018 §4)

### Path A — new commands

```text
aief next [--change <id>]              read-only; prints the Normalized Action
aief prompt [...existing args]         evolves to include Workflow/SDD blocks ("work")
                                        (no new command — prompt already exists)
```

No separate `start` command (see §6 — its useful function is Path-B-shaped either way). Requires an
explicit ADR-015 exception or partial thaw, recorded as an amendment to ADR-018 §4, not assumed.

### Path B — new flags on existing commands

```text
aief status --change <id>              deep, single-Change view (today: status ignores --change
                                        entirely — confirmed by inspecting its signature,
                                        `status(project, showNext)`, no Change selector)
aief status --change <id> --next       same view, focused on the Normalized Action only
aief prompt [...existing args]         same evolution as Path A — already a flag-compatible command
```

Zero new command verbs. A defensible reading of ADR-015's literal text (freezes commands, not
flags) — recorded as the recommended default in this design, pending the project owner's decision.

**Both paths share every layer below `workflow-service.js`** — the choice only changes which CLI
function calls `nextAction()`/`explain()`, never their implementation. This is why the two paths
could be designed together without duplicating the bulk of this document.

## 5. Normalized Action contract

```js
{
  id: "verify",                     // the stage/gate id this action concerns, or "close"
  status: "available" | "blocked" | "pending" | "unsupported" | "complete" | "invalid",
  reason: "readiness: failed — spec.md missing",   // traced to an existing GateResult/SDD message
  blocking: true,                    // mirrors the underlying GateResult's own field — never re-derived
  command: "aief prompt --change 0046-core3-user-workflow",  // suggested next command, string only —
                                      // never executed by the service layer itself (UX-R5)
  requiresConfirmation: false,       // true only if a future write-capable surface would ask before acting —
                                      // always false in this Entrega, since nothing here writes
  evidence: []                       // pass-through from the underlying GateResult, unchanged shape
}
```

**Evaluated against `GateResult` and the commissioning's own sketch, field by field**:

- Kept `id`/`status`/`reason`/`blocking`/`evidence` — direct pass-through fields, avoiding a
  translation layer that could drift from `GateResult`'s own meaning (the duplication risk Change
  0043's finding M3 already taught this project to avoid).
- `status` enum **not** identical to `GateResult`'s (`passed`/`failed`/`pending`/`warning`/
  `not_applicable`) — an *action* is a recommendation to a human, not a gate's internal verdict;
  `available`/`blocked`/`complete` are meaningfully different concepts from `passed`/`failed`, and
  conflating the two vocabularies would be exactly the "duplicating the gate contract" the
  commissioning instruction warns against avoiding. The mapping is one small, explicit function
  (`design.md` pseudocode in `nextAction()`), not a parallel enum meant to replace `GateResult`.
  `unsupported` is new — it covers an SDD capability gap (`CAPABILITIES.create === false`, etc.),
  which no `GateResult` status represents.
- `command` is a **string only** — never a callable, never auto-executed. This is what makes
  `next`/`work` safely read-only under UX-R5: the service layer suggests, it does not invoke.
- `effects` (from the commissioning sketch) is **dropped** — this Entrega has no write-capable
  action to describe effects for; reintroduce it only when a transition-executing surface exists.

## 6. `start` — resolved

**Decision: no `start` command or flag is introduced.** Evaluated against every case the
commissioning instruction lists:

- *Explicit existing Change, single/multiple open Changes, closed Change, legacy Change* — all
  already handled identically by `resolveExplicitChange()`/`resolveImplicitChange()`, reused by
  every existing Change-oriented command. Nothing new to build.
- *Manifest/track/SDD-local/SDD-OpenSpec/invalid-provider/invalid-manifest* — these are exactly
  what `workflow-service.inspect()` (§3) reports; under Path B this is `status --change <id>`,
  under Path A it could be `next`'s own output header.
- *Creation* — explicitly not `start`'s job (UX-R14): `new-change`/`propose` already own it, and
  giving `start` a creation mode would create the two-contradictory-paths risk the commissioning
  instruction names directly.

So "starting a session" is not a distinct operation this codebase needs — it is `new-change` (to
create) followed by `status --change <id>` or `next` (to inspect), both already designed above. No
third path is added for a concept that decomposes cleanly into two already-designed ones.

## 7. `next` — responsibilities

Pure orchestration, no domain logic of its own:

```text
1. Resolve the Change (resolveExplicitChange/resolveImplicitChange) — UX-R1/R2.
2. workflowService.inspect(changeDir, cwd) — loads Change + workflow (if track) + SDD (if sdd).
3. workflowService.nextAction(changeDir, cwd) — the one Normalized Action.
4. Render: human text by default (§9) — id/status/reason/command, blockers/warnings listed by
   name, never invented.
5. Exit 0 (query answered — including "blocked"/"pending"/"unsupported"/"complete") or 1 (query
   itself failed: no Change resolved, invalid manifest, invalid provider, invalid workflow — see §11).
```

No stage is written. No file is touched. `canTransition()` (§3) is available for a future
transition-executing surface to call before attempting a write — this Entrega does not add that
surface, only the read-only question it would need answered first.

## 8. `work` — responsibilities (as `prompt`'s evolution)

`prompt()`'s existing composition (`cli.js`) gains two new, conditional blocks — additive only,
same discipline `standardsBlock`/`skillsBlock` already use (empty string when not applicable,
never a header with nothing under it):

```text
Workflow context (only if change.track is set):
  Stage: <state.stage>
  Next: <state.nextAction>
  Blockers: <from state.blockers, if any>

SDD context (only if change.manifest?.sdd is set):
  Provider: <resolution.provider.PROVIDER_ID>
  Pending tasks: <provider.getTasks(change, cwd) — incomplete only, from Entrega 3's existing parser>
  Requirements: <provider.getRequirements(change, cwd), shown only if the caller finds them useful —
                 e.g. omitted when zero, per "no ruido informativo">
```

No task is marked complete by this composition. No code is generated. No claim of work performed is
made anywhere in the new text — it only shows context and pending items, exactly like `prompt`'s
existing standards/skills blocks already do for their own dimensions.

## 9. Output and exit codes

**Human output only in this Entrega** (UX-R28) — no `--json`. Checked for a concrete consumer per
the commissioning instruction's own requirement ("justifica un consumidor real o difiérelo"): none
is named in the commissioning request beyond a hypothetical `aief next 0045 --json` example: no CI
pipeline, script, or downstream tool in this repository currently parses AIEF's CLI output as
structured data (the one automation surface that exists, `cli/templates/ci/aief-verify.yml`, calls
`aief verify` and checks its **exit code**, never parses stdout) — deferred, matching Change 0044's
own WF-R16 precedent exactly.

**Exit codes** (ADR-018 §3, ADR-015-independent — applies under either exposure path):

| Outcome | Exit code | Precedent |
|---|---|---|
| Query answered, action `available` | `0` | `status`'s existing unconditional `0` |
| Query answered, action `blocked`/`pending`/`unsupported`/`complete` | `0` | `close` without `--yes` reporting problems, still `0` |
| Change not found / ambiguous selection | `1` | `resolveExplicitChange`/`resolveImplicitChange`'s existing `1` |
| Invalid manifest / unavailable provider / invalid workflow definition | `1` | The query itself could not be answered — same class as "Change not found" |

No `2`/`3`/`4`. `verify`'s own exit-1-on-check-failure and `close`'s exit-1-only-on-failed-write
are untouched — this table only governs the new/extended read-only surfaces.

## 10. Read vs. write — explicit classification

| Operation | Reads | Writes |
|---|---|---|
| `workflowService.inspect/nextAction/canTransition/explain` | Change files, manifest, workflow definitions, SDD artifacts | **Nothing** |
| `next` (Path A) / `status --next` (Path B) | (via the service layer) | **Nothing** |
| `prompt`/`work` (extended) | Change files, manifest, SDD artifacts, standards, skills | **Nothing** (unchanged from today) |
| `status --change <id>` (Path B, if `start`'s inspection role is exposed this way) | Change files, manifest, workflow, SDD | **Nothing** |
| `close` (unmodified) | Change files | `change.md` only (unchanged, Change 0043's B1-fixed boundary) |

Every operation this Entrega adds or extends is in the read column. The only write anywhere in the
affected code paths is `close`'s pre-existing one, untouched.

## 11. Errors

| Case | Outcome |
|---|---|
| No Change resolves (none open, or explicit id/slug not found) | Exit 1, existing `resolveExplicitChange`/`resolveImplicitChange` message, unchanged |
| Ambiguous selection (multiple open, no `--change`) | Exit 1, existing message, unchanged |
| Invalid manifest | Normalized Action `status: "invalid"`, exit 1 — `next`/`work` must not regress Change 0043's "never falls back to legacy" guarantee (UX-R24) |
| Unknown/unavailable explicit SDD provider | Normalized Action `status: "invalid"`, exit 1 — must not regress Change 0045's "never falls back" guarantee (UX-R25) |
| Unrecognized workflow track | Normalized Action `status: "invalid"`, exit 1 |
| A gate/capability with no evaluator (`review`/`approval`/`security_review`) | Normalized Action `status: "pending"`, exit 0 — an honest, successful answer |
| An SDD capability the resolved provider lacks (`create`/`archive`) | Normalized Action `status: "unsupported"`, exit 0 |
| Workflow reached `close` | Normalized Action `status: "complete"`, exit 0 |
| Change already closed | Normalized Action `status: "complete"`, `id: "closed"` — distinguished from "reached close" per UX-R8 |

## 12. Security

Inherits Change 0045's path-traversal fix (`isPathWithin()` in `openspec.js`) unchanged — no new
path construction is introduced anywhere in `workflow-service.js` (it only calls existing provider/
gate/transition functions, never builds a filesystem path itself). No new external command is
introduced; `canTransition()`/`nextAction()` never shell out.

## 13. Compatibility

Restated from `proposal.md`'s "Compatibility" section, made a design constraint: `status()`'s
existing output is unchanged in wording for every branch that doesn't involve a track-carrying,
unambiguously-selected Change; the *only* observable change is that a track-carrying Change's
bottom-line suggestion now agrees with its `Workflow status` block instead of potentially
disagreeing — which is a bug fix, not new behavior, per ADR-018 §1.

## 14. Tests (planned; full plan in `verification.md`)

`workflow-service.test.js` (pure-function tests, no CLI spawn needed for `inspect`/`nextAction`/
`canTransition`/`explain`), plus CLI-level tests for whichever surface Path A/B produces, plus a
zero-drift regression proving `status`'s bottom line is unchanged for every real Change (all of
which lack `track` today, so the consolidation's only observable branch has zero real instances —
same "additive and dormant" proof technique every prior Entrega used).

## 15. Rollback

Every new file (`workflow-service.js` + its test) is deletable with no trace. The `status()`
consolidation and `prompt()` extension are small, additive/replacing edits, revertible as a plain
code revert. No data migration exists to undo.

## 16. Future evolution (not built here)

A transition-executing surface (writing a stage, if the state model ever needs one beyond what
Change 0044 already decided) — `canTransition()` is designed as its prerequisite read, not built as
a write here. Real evaluators for `review`/`approval`/`security_review` (Entregas 7/8) turn their
`pending` actions into `available`/`blocked` without changing this design. `--json` output, once a
real consumer is named. `start` remains explicitly not needed unless a future Entrega finds a case
`new-change` + `status --change`/`next` doesn't cover.
