# Change

## ID

`0122-multi-agent-runtime-open-questions`

## Type

General

## Objective

Record an external proposal — "AIEF Multi-Agent Runtime Foundation" (a two-stage Claude-Code-implements /
Codex-evaluates workflow specifying ~25 new domain concepts: Governance/Execution Plane split, Run,
Attempt, ExecutionGraph, AgentProvider/Profile/Router, Executor, ToolProvider, Sandbox, Validator, Eval,
Trace, Checkpoint, HumanEscalation) as a documented, evidence-gated open question in
`docs/history/`, per the ADR-008/ADR-013 posture — not implemented, not accepted as an ADR, not
scaffolded as domain code. Documentation only; no code.

## Scope

### In scope

- Create `docs/history/multi-agent-runtime-open-questions.md` summarizing the proposal's architecture,
  the concrete overlap with the three tensions already recorded in
  `docs/history/runtime-governance-open-questions.md` (execution identity, requirement vs Change,
  tasks vs gates), and why it is not built now: ADR-008 ("validation with real projects, not
  assumptions") and ADR-013 ("no new capability enters the core unless it first removes an
  equivalent... a proposal that removes nothing is incomplete").
- Name the evidence that would justify revisiting it (e.g. a real multi-provider adoption need,
  observed friction from having no execution runtime) as a hypothesis, not a decision.
- This Change's own artifacts (`change.md`, `spec.md`, `tasks.md`, `evidence.md`).

### Out of scope

- Any code, CLI, or test change.
- Introducing `Run`, `Attempt`, `ExecutionGraph`, `AgentProvider`, `Executor`, or any other concept
  from the proposal as an implementation artifact.
- Accepting any ADR (the proposal is recorded, not decided).
- Modifying `docs/history/runtime-governance-open-questions.md` or any other existing document.
- Launching the Codex/GPT-6 Astra evaluation stage described in the proposal — there is nothing to
  evaluate because nothing is implemented.

## Success Criteria

- `docs/history/multi-agent-runtime-open-questions.md` exists, records the proposal accurately, and
  states the ADR-008/ADR-013 posture explicitly.
- No executable file changed; `aief verify --change 0122-multi-agent-runtime-open-questions --strict`
  passes; no other document modified.
