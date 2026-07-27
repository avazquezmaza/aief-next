# Proposal — Entrega 6: Hooks Runtime

## Problem

Nothing in this codebase today can react to "something happened in the lifecycle of a Change"
without being hand-written directly into the command that does it. Every additive context block
introduced so far (Entrega 4's Workflow/SDD blocks, Entrega 5's Skill section) is a bespoke `if` in
`prompt()`/`status()` itself — which is fine for a handful of blocks, but there is still no general
answer to "when X happens, let a small set of declared, versioned reactions observe it and add
information," and no boundary that would let a future Verification/Review Entrega (7/8) plug in
without `cli.js` growing another bespoke conditional per reaction. Grep confirms no `hook`, `hooks`,
`callback`, `middleware`, `lifecycle`, `event`, `listener`, or `trigger` concept exists anywhere in
`cli/src/` today (the one incidental hit, `detect.js`'s `triggers` variable, is unrelated — Skill
Catalog detector-matching, not a lifecycle mechanism).

## Existing capabilities that already behave like phases of a lifecycle

Inspection of `cli/src/cli.js` found real, inspectable phase boundaries in three commands, none of
them named or reused as a general concept:

- **`close()`** (`cli.js:776-800`): resolve Change → check already-closed → compute readiness
  `problems` (pure, via `checkChangeReadiness()`) → print → **if not `--yes`, stop (dry-run, no
  write)** → if `problems.length`, stop (exit 1, no write) → `markClosed()` (**the only write**) →
  confirm. The point right after `problems` is computed and before any write is the one place a
  future guard could observe already-authoritative blockers — but per the commissioning
  instruction's own caution about write-critical paths, this Entrega evaluates that point and
  defers wiring anything to it (see "Close integration" below).
- **`verify()`** (`cli.js:811-833`): resolve Change (or whole project) → run `verifyChange()`/
  `verifyProject()` (pure, produces a `report` object) → `renderReport()` prints it and sets the exit
  code. The point right after `report` is computed, before `renderReport()` prints it, is a real,
  low-risk observation point (verify is already 100% read-only) — this Entrega uses it.
- **`prompt()`** (`cli.js:647-741`, as extended by Entregas 4/5): resolve Change → compute
  `standardsBlock`/`skillsBlock`/`workflowBlock`/`sddBlock`/`skillSection` → print the assembled
  body. The point right after every existing block is computed, before the final `console.log`, is
  this Entrega's second real, low-risk observation point.
- **`new-change`/`propose`/`enrich`/`analyze`** all call `createChange()`, which writes Change files
  immediately with no distinct pre/post phase a Hook could usefully observe beyond "a Change now
  exists" — and no candidate Hook this Entrega has a justified consumer for that fact. Not adopted as
  an event this Entrega (see "Events" below).

No error-handling, rollback, or atomic-write mechanism exists beyond `writeFile()`'s own
overwrite-guard (Change 0043) and `close()`'s dry-run gate — there is no transaction concept to
preserve or violate.

## Objective

Introduce a minimal, deterministic, capability-gated Hook Registry/Service/Context so a small,
versioned set of internal Hooks can observe two real lifecycle points (`prompt.prepared`,
`verify.completed`) and, for exactly one of them, invoke an allowlisted Skill through the Skill
Service (Entrega 5) — without ever redefining what a gate/transition/provider/readiness means, and
without introducing writes, external commands, network access, or any form of blocking authority not
already produced by an existing, authoritative source.

## Proposed definition

A **Hook** (Entrega 6) is a versioned, internally-registered reaction that:

1. declares which event(s) it observes (`events: [...]`, from the closed catalog only);
2. declares `capabilities` explicitly (default: none);
3. implements `appliesTo(event, context)` — deterministic, AI-free;
4. implements `evaluate(event, context)` — pure, returns observations (never writes, never executes
   a command, never reaches the network — structurally impossible, mirroring Skills' `writeFiles`/
   `executeCommands`/`network` rejection);
5. for `capabilities.invokeSkill: true`, may call the Skill Service (never a Skill module directly)
   against an explicit allowlist declared in its own descriptor;
6. for `capabilities.block: true` (**unexercised by any Hook this Entrega, structurally available for
   a future pre-event Hook**), may return `blocking: true` — and only when the event's own `phase` is
   `"pre"` (neither event this Entrega is pre-phase, so no Hook this Entrega can actually block
   anything; the Hook Service enforces this regardless of what a Hook's `evaluate()` returns).

This is Model A, fully — an observer that can recommend, warn, and (through the Skill Service only)
surface an existing Skill's already-safe, zero-effect result. Model B's blocking authority exists in
the contract's vocabulary (so a future pre-event Hook does not need a contract change) but is
structurally inert this Entrega, the same "adopted but unused" treatment ADR-019 gave Skills'
`deterministicExecution`. Model C (writing files, executing commands, reaching the network) is
rejected at registration, exactly as `FORBIDDEN_CAPABILITIES` already does for Skills.

## Initial events (closed catalog, this Entrega)

Only two — both with a confirmed emission point (above) and a justified consumer (below):

1. **`prompt.prepared`** (phase: `post`) — emitted by `prompt()` after every existing context block
   is computed, before the final render.
2. **`verify.completed`** (phase: `post`) — emitted by `verify()` after the `report` object is
   computed, before `renderReport()` prints it.

**Not adopted this Entrega, with reasons:**

- **`change.created`/`change.inspected`** — real emission points exist (`createChange()`,
  `loadChangeUnified()`), but no initial Hook has a justified use for either; adding them now would
  be "an event for every internal function," which the commissioning instruction explicitly warns
  against.
- **`close.requested`/`change.closed`** — a real emission point for `close.requested` was identified
  (`cli.js:791`, right after `problems` is computed, before any write) — deliberately **not** added to
  the closed catalog this Entrega. `close()` is this codebase's only destructive Change-lifecycle
  write; wiring an event into it — even a read-only, non-blocking one — changes the risk profile of
  the one command where a mistake is hardest to reverse, for a Hook (Close Readiness Guard, see
  below) whose only justified content would be to restate `problems`/`checkChangeReadiness()`'s
  output, which `close()`'s own dry-run output already shows. No real value is left on the table by
  deferring this.
- **`before_work`/`after_work`/`before_review`/`after_review`** (vision document §13) — these are
  Workflow-stage-shaped events, not CLI-command-shaped ones; nothing in this codebase executes "work"
  or "review" as a discrete, observable phase (`canTransition()`, Entrega 4, only ever answers "would
  this be legal," nothing executes a transition yet) — adopting them now would be inventing an
  emission point that does not exist. Deferred until a future Entrega gives the Workflow Engine an
  actual transition-execution surface.

## Initial Hooks (this Entrega's validation set)

Two, chosen from the commissioning instruction's own candidate list:

1. **Prompt Skill Suggestion Hook** (`prompt.prepared`) — `capabilities.invokeSkill: true`,
   allowlisted to `["requirements-analysis-instructions"]` only. Calls the Skill Service's
   `runSkill()` for that one Skill; if the result is `"ready"`, adds **one short, clearly-labeled
   line** recommending `aief prompt --skill requirements-analysis-instructions --change <id>` — it
   never embeds the Skill's full instructions automatically (that remains the explicit, human-driven
   `--skill` flag's job) and stays silent for any other status (`not_applicable`/`blocked`/
   `unsupported`), per the commissioning instruction's "no ejecuta automáticamente la Skill salvo que
   el diseño lo justifique" — invocation is justified here specifically to validate the
   Hook→Skill-Service→allowlist→result machinery end to end, while the *visible* change stays a
   single additive line, not a duplicated Skill section.
2. **Post-Verify Next Action Hook** (`verify.completed`) — uses `workflow-service.js`'s `nextAction()`
   (Entrega 4) — never the Skill Service — to add one line recommending the next command after a
   `verify` run, for the one Change `--change <id>` targeted. Never changes PASS/FAIL, never touches
   `evidence.md`.

**Not included, with reasons** (from the commissioning instruction's own candidate list):

- **Close Readiness Guard** — its own inclusion condition ("únicamente si `close()` puede integrarlo
  sin cambiar su semántica ni duplicar validación") is not met, since `close.requested` itself is
  deferred (see "Events" above).
- **Change Context Prompt Hook** — would duplicate `prompt --skill change-context` (Entrega 5)
  without new value, exactly the case the commissioning instruction says to discard it for.

## Scope

**In scope:** event contract (`id`, `phase`), closed two-event catalog, Hook descriptor/contract,
capability model, Hook Registry (mirrors `requirement-providers/`/`sdd-providers/`/`skills/`), Hook
Context (reuses already-computed `project`/`change`/`workflow`/`sdd` — never re-derives them), Hook
Service (resolve → order → applicability → capability policy → evaluate → Skill Service call when
permitted → normalize → aggregate), normalized Hook Result, two initial Hooks, `prompt`/`verify`
integration (additive, no new command verb), error/outcome model, recursion prevention
(Hook→Skill→Hook is structurally impossible: the Skill Service does not emit Hooks), security threat
model, determinism, documentation, adversarial review.

**Out of scope:** `close()` integration, asynchronous/background/daemon/queued/persisted events, cron,
webhooks, external integrations, network, external commands, writes from Hooks, remote Hooks,
plugins, a marketplace, a sandbox, general transactional rollback, automatic assistant execution,
automatic code generation, task modification, automatic gate approval, semantic Verification,
Review-as-product, a conversational interface, Entrega 7.

## Relationship to Entregas 1–5

- **Entrega 1–3** (Change Foundation, Workflow Engine, SDD Provider): Hook Context reuses their
  already-normalized facts (`change`, `workflow`, `sdd`) exactly as Entrega 4/5 already do — never a
  third re-derivation.
- **Entrega 4** (User Workflow): the Post-Verify Next Action Hook calls `workflow-service.js`'s
  `nextAction()` directly — the same single canonical computation `status`/`prompt` already share,
  never a fourth copy of "what's next" logic.
- **Entrega 5** (Skills Runtime): the Hook Service calls the Skill Service's `runSkill()` — never a
  Skill module directly, never re-implementing capability enforcement, applicability, or result
  normalization. The Skill Service does not call back into the Hook Service or emit any event —
  Hook→Skill is one-directional, structurally, preventing Hook→Skill→Hook recursion by construction
  (there is no code path for a Skill invocation to raise a new event).

## Relationship to ADR-013 (no capability without removal/merge)

Real merge, not just an addition: `prompt()`'s bespoke-block pattern (four independent bodies stacked
by Entregas 4/5) does not grow a sixth this Entrega — the Prompt Skill Suggestion Hook's one line is
produced by the Hook Service's shared renderer, the same "one general mechanism instead of one more
`if`" consolidation ADR-019 already started for Skills. `verify()` gains its first-ever additive,
non-error render line via the same mechanism, rather than a bespoke one-off.

## Compatibility

- `status`, `status --next`, `close`, `propose` are untouched (zero diff lines).
- `prompt`/`prompt --skill` are byte-identical for every Change without an applicable Hook result —
  which is every real Change in this repository today (none carries `sdd`), so the zero-drift
  regression corpus stays empty-diff in practice.
- `verify`'s PASS/FAIL/exit code are unchanged; the Hook's recommendation is a strictly additive line
  after the existing report output.
- No new persisted state; no new write path; no new command verb.

## Risks

- **Two "next action" computations existing side by side** (Entrega 4's `nextAction()`, reused
  verbatim by the Post-Verify Hook, vs. a hypothetical future Hook re-deriving it) — mitigated by the
  Hook contract requiring `workflow-service.js` reuse, restated as an HK-R the same way SK-R12 already
  restated UX-R21–R23 for Skills.
- **`prompt`'s output silently growing over time as more Hooks are added** — mitigated by every Hook
  result being clearly labeled with its own `hook:`/`event:` identity (never merged into an unlabeled
  paragraph) and by this Entrega shipping only two Hooks, each justified individually.
- **Deferring `close()` integration leaves the vision document's "before_close" guard unbuilt** — an
  accepted, explicit debt (not silent), revisited only when a future Change is willing to take on the
  risk of instrumenting the write-critical path, per this proposal's own reasoning above.

## Security

Full threat model in `design.md` §11. Summary: no Hook reads the filesystem directly (only the
already-hardened Context sources do); `writeFiles`/`executeCommands`/`network: true` are
registry-rejected exactly as Skills' are; a Hook's `invokeSkill` capability is allowlist-gated per
descriptor, and the Hook Service — never the Hook itself — is what calls the Skill Service, so a Hook
cannot bypass Skill Service enforcement or falsify a Skill's result (the Service reads the Skill
Service's own returned object, never lets a Hook substitute one); Hook→Skill→Hook recursion is
structurally impossible (Skill Service never emits an event); repository content (a requirement's
title, a Change's spec text) reaching a Hook's output is treated as data, inheriting the same fenced,
labeled discipline Skills' `requirements-analysis-instructions` already established; the inherited
Entrega-3 symlink-escape gap is **not** expanded (no Hook performs a new filesystem read — confirmed
during inspection, restated as an explicit design constraint, not merely an observation).

## Alternatives considered

- **A general async Event Bus with subscriber registration.** Rejected — no evidence of a need for
  asynchronous reactions, background work, or third-party subscribers; adds a concurrency/ordering
  surface this project has no validated use for (ADR-008's evidence discipline).
- **Wiring `close.requested` anyway, restricted to non-blocking observation only.** Considered;
  rejected because even a read-only Hook changes the trust profile of the one write-critical command,
  for zero content a dry-run `close` doesn't already show — not worth the risk for this Entrega.
- **A class-based `Hook` interface.** Rejected — zero classes exist anywhere in `cli/src/` (confirmed
  again this Entrega, including the one violation Entrega 5's own review found and fixed); Hooks
  mirror the same plain-module pattern as `requirement-providers/`/`sdd-providers/`/`skills/`.
- **Letting a Hook import a Skill module directly** (`require("./skills/change-context")`). Rejected
  — recreates exactly the coupling ADR-019 already forbade for the CLI layer; a Hook goes through the
  Skill Service, full stop, same as every other consumer.

## Success criteria

- The closed event catalog contains exactly the events with a real, cited emission point and a
  justified consumer — no speculative events, no vision-document stage names adopted without
  inspection.
- `close()` integration is evaluated and explicitly deferred with reasoning, not silently dropped.
- At least one shipped Hook demonstrates the full Hook→Skill Service→allowlist→normalized-result path.
- `prompt`/`prompt --skill`/`status`/`status --next`/`verify`'s PASS-FAIL/`close`/`propose` behavior
  is unchanged for every Change without an applicable Hook result (100% of this repository today).
- No new public command verb; ADR-015 respected.
- Hook Registry/Context/Service/Result are each demonstrated against real, reused-not-duplicated data
  sources (`workflow-service.js`, the Skill Service) — never a third computation of the same fact.
