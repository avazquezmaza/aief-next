# Multi-Agent Runtime — Open Questions

> Product architecture, no implementation. This document records an external proposal —
> "AIEF Multi-Agent Runtime Foundation" — as an evidence-gated open question, per
> [ADR-008](../../knowledge/decisions.md#adr-008-improvements-come-from-validation-with-real-projects-not-assumptions)
> and [ADR-013](../../knowledge/decisions.md#adr-013-aief-20-is-a-redesign--no-capability-enters-the-core-without-removing-an-equivalent).
> Nothing here is a decision to build. Change
> [0122-multi-agent-runtime-open-questions](../../changes/0122-multi-agent-runtime-open-questions/change.md)
> exists only to place this record; it authorizes no code, no ADR, no domain concept.

Companion reading: [runtime-governance-open-questions.md](runtime-governance-open-questions.md) (the
prior, closely related open-questions record — see "Overlap" below), [knowledge/decisions.md](../../knowledge/decisions.md)
(ADR-008, ADR-013).

---

## The proposal, summarized

An external document ("AIEF — Multi-Agent Runtime Foundation") specified a two-stage workflow for
this repository: Claude Code implements a large architectural Change, then a second agent ("Codex /
GPT-6 Astra") independently evaluates it. The Change it specified would introduce, in one pass:

- A **Governance Plane / Execution Plane** split at the architecture level.
- New domain types: `Run`, `RunStatus`, `Attempt`, `ExecutionNode`, `ExecutionGraph` (distinct from
  the existing `ChangeGraph`), `ExecutionPolicy`.
- A multi-agent provider layer: `AgentProvider`, `AgentProfile`, `AgentCapabilities`, `AgentRouter`,
  `AgentSelection` — designed so Codex, Claude Code, Gemini CLI, Kiro and future agents are
  interchangeable adapters, with deterministic (non-AI) routing for this stage.
- Execution machinery: `Executor`, `AgentRequest`/`AgentResult`, `ToolProvider`, `Sandbox`.
- Quality/audit machinery: `Validator`/`ValidationResult`, `Eval`/`EvalResult`, `Trace`/`TraceEvent`,
  `Checkpoint`, `HumanEscalation`.
- A new ADR ("Separation of Governance Plane and Execution Plane").
- Comprehensive tests for all of the above, plus a second-stage independent audit (Codex/Astra)
  scoring the result against a 25-row acceptance matrix and a PASS/CONDITIONAL PASS/FAIL verdict.

Explicitly out of scope in the proposal itself: real invocation of any provider, real shell/network
execution, real sandboxing, parallel workers, adaptive/AI routing, LLM-as-judge — everything ships as
contracts plus fake/test adapters "for architecture only."

## Why this is not built now

**ADR-008.** "Every fix in this repo should trace to an observed failure... not to speculative
features." No adoption, real Change, or dogfooding session on record has surfaced a need to route
different Change tasks to different coding-agent providers, or a gap from the absence of a `Run`/
`Attempt`/`ExecutionGraph` model. The proposal is speculative by its own text — "architecture-first,"
contracts and fake providers only, no real invocation. This is the same failure mode the repo's own
history names directly: AIEF v4 accumulated an "8:1 ratio of Markdown to production code" — capability
built ahead of validated need.

**ADR-013.** "No new capability enters AIEF's core unless it first removes, merges or replaces an
equivalent capability... A proposal that removes nothing is incomplete, not merely ambitious." The
proposal adds roughly twenty-five new domain types and removes none. It does not name what existing
concept `ExecutionGraph` replaces, what `LoopPolicy`/`Attempt` supersede in the current
`loop-service.js`, or what shrinks so `AgentRouter` can exist. By ADR-013's accounting rule alone, the
proposal as written is incomplete regardless of its architectural merit.

**Scale.** Even bracketing ADR-008/013, the proposal is not "small, focused and reviewable"
([AGENTS.md](../../AGENTS.md)) — it specifies one Change containing ~25 new domain types, a new ADR,
comprehensive test suites, and a second independent-agent evaluation stage this session cannot itself
execute (there is no Codex/GPT-6 Astra evaluator available here; `/code-review ultra` is this
repository's closest analogue to an independent review step, and it reviews a diff, not an
unimplemented proposal).

## Overlap with the existing open-questions record

[runtime-governance-open-questions.md](runtime-governance-open-questions.md) already carries the
closest real analogue to this proposal, under tension **3, Execution Identity**: whether AIEF should
record *what composed a Run* — assistant, model, profile, standards/skills, timestamp, prompt hash.
That document's own posture applies here without modification:

- Three rungs must not be conflated: procedural evidence (`evidence.md`, exists today), a composition
  record (open question, H5/H6 — "zero occurrences so far"), and strong attestation (explicitly out
  of scope, "zero validated demand today").
- Any future rung-2 record must stay visible/versionable (ADR-009), reference rather than copy, be
  owned by Verification & Governance rather than Prompt Composition (ADR-012), and never be sold as
  enforcement.
- The proven path is: manual convention first, dogfooded on AIEF's own Changes; formalize only if the
  convention demonstrates value and its manual form demonstrates friction.

This proposal's `Run`/`Attempt`/`AgentProvider`/`Trace` model is a fully-specified, much larger answer
to the same question that document deliberately left open pending evidence. Building it now would
retroactively decide H5/H6 by fiat instead of by the validation ADR-008 requires.

## Evidence gate for revisiting this

Not a roadmap commitment — the conditions that would make this worth an ADR, per ADR-008's
discipline:

- A real Change, run through this repository's own governance, that needed to route different tasks
  to different coding-agent providers and had no way to represent that — not a hypothetical future
  topology.
- Observed friction from the current model (`aief prompt <assistant>` renders one prompt for one
  human-selected assistant per invocation) that a team using AIEF reports, not one this session
  infers.
- H5/H6 from `runtime-governance-open-questions.md` confirming first: a real, unsatisfied need to
  answer "what composition produced this work?" retroactively, and the cheap manual-convention
  experiment (a hand-written "Composition" line in `evidence.md`) demonstrably failing to satisfy it.

Until then: no `Run`, `Attempt`, `ExecutionGraph`, `AgentProvider`, `Executor`, or related concept
enters `cli/src/core/`. If evidence accumulates, the resulting ADR should scope down from this
proposal, not adopt it wholesale — likely starting with whichever single tension (Execution Identity
is the most concretely evidenced candidate) has real signal, rather than the full twenty-five-type
runtime in one pass.

---

*Recorded 2026-09-09, Change [0122-multi-agent-runtime-open-questions](../../changes/0122-multi-agent-runtime-open-questions/change.md).
This document records a proposal and the reasons it is deferred, not a decision: any future decision
must arrive as an ADR, backed by the evidence named above.*
