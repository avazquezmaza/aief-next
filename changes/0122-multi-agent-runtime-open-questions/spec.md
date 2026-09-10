# Specification

## Goal

An external "Multi-Agent Runtime Foundation" proposal is captured in one document as an
evidence-gated open question (ADR-008/ADR-013 posture), so a future decision about it arrives as an
ADR backed by named evidence, and none of its ~25 proposed domain concepts slips into implementation
informally.

## Requirements

- **Document**: `docs/history/multi-agent-runtime-open-questions.md`, new file. `docs/history/README.md`
  gains one index entry linking to it — the one existing-document edit this Change authorizes, so
  the new document is discoverable from the index that lists every other document there; no other
  existing document is modified. **(Correction, external audit finding C0130-F3, Change 0133-era
  follow-up):** this requirement originally read "no existing document modified" while the
  Acceptance Criteria below and evidence.md both correctly recorded the index-entry edit — a
  spec/evidence inconsistency, not an undisclosed scope violation. Corrected here to match what was
  actually done and already disclosed.
- **Summarize the proposal**: a Governance Plane / Execution Plane split, with Run, Attempt,
  ExecutionNode, ExecutionGraph, ExecutionPolicy, AgentProvider, AgentProfile, AgentCapabilities,
  AgentRouter, Executor, ToolProvider, Sandbox, Validator, Eval, Trace, Checkpoint, and
  HumanEscalation as new domain types, plus a two-stage workflow (Claude Code implements, a second
  agent independently evaluates).
- **State why it is not built now**, citing:
  - ADR-008 — no cited observed failure or real-adoption evidence motivates this proposal; it is
    speculative by its own text ("architecture-first", "contracts and fake/test providers only").
  - ADR-013 — the proposal adds ~25 concepts and removes none; it is "ambitious", not "complete" by
    this ADR's accounting rule.
  - `docs/history/runtime-governance-open-questions.md` — an adversarial review already considered
    the closest real analogue (execution identity: which assistant/model/profile composed a Run) and
    recorded it as an unvalidated hypothesis (H5/H6), explicitly not authorized for implementation.
- **Name the overlap** between the proposal and the three tensions already on record (Requirement vs
  Change, Tasks vs Gates, Execution Identity) so a future reader does not treat this as an unrelated
  new idea.
- **State the evidence gate**: what would need to be observed (e.g. a real need to run different
  Change tasks through different coding-agent providers, evidenced friction from the current
  single-assistant-per-prompt model) before any part of this is worth an ADR.
- **Constraints**: no code, no CLI change, no test change, no file moves, no new implementation
  concepts, no ADR acceptance, no launch of the proposal's Codex/Astra evaluation stage.

## Acceptance Criteria

- [x] `docs/history/multi-agent-runtime-open-questions.md` created, summarizing the proposal and the
      ADR-008/ADR-013 rationale for not building it now.
- [x] The document names its overlap with `docs/history/runtime-governance-open-questions.md`.
- [x] The document states an explicit evidence gate for revisiting the proposal.
- [x] No file outside this Change was created or modified, except `docs/history/README.md`'s one
      authorized index entry linking to the new document.
- [x] `aief verify --change 0122-multi-agent-runtime-open-questions --strict` PASS.
- [x] Tests not run/not required: no executable file changed (documentation only).
