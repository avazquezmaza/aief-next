# Evidence

## Summary

An external document proposed a "Multi-Agent Runtime Foundation" — ~25 new domain concepts (Run,
Attempt, ExecutionGraph, AgentProvider/Router, Executor, ToolProvider, Sandbox, Validator, Eval,
Trace, Checkpoint, HumanEscalation) plus a Codex/GPT-6 Astra independent-evaluation stage — as a
single large implementation Change. Inspection against this repository's own accepted ADRs
(ADR-008: validation over speculation; ADR-013: no capability without an equivalent removal) and its
prior adversarial-review record (`docs/history/runtime-governance-open-questions.md`) found the
proposal conflicts with both: no cited real-adoption evidence, no removal named, and it re-specifies
in much larger form a question that record already left open pending evidence (Execution Identity,
H5/H6). Per user decision, this Change records the proposal as a deferred open question instead of
implementing it.

## Activities Performed

- Read `AGENTS.md`, `CLAUDE.md`, `docs/maintainer.md`, `docs/assistant-workflow.md`.
- Read `knowledge/decisions.md` (ADR-008, ADR-009, ADR-012, ADR-013) and
  `docs/history/runtime-governance-open-questions.md` in full.
- Surveyed `cli/src/core/domain/` and `cli/src/core/services/` to confirm the proposal's target
  concepts (`ChangeGraph`, loop/harness services) have no existing `Run`/`Attempt`/`ExecutionGraph`
  counterpart to extend.
- Presented the ADR conflict to the user with concrete options; user selected "don't build this now."
- Scaffolded Change `0122-multi-agent-runtime-open-questions` via `aief new-change`, then renamed the
  (uncommitted) directory to reflect the record-only scope.
- Wrote `docs/history/multi-agent-runtime-open-questions.md` summarizing the proposal, the ADR-008/
  ADR-013 rationale, the overlap with `runtime-governance-open-questions.md`, and an explicit
  evidence gate for revisiting it.
- Linked the new document from `docs/history/README.md`.

## Verification

- `node cli/bin/aief.js verify --change 0122-multi-agent-runtime-open-questions --strict`: PASS.
- `git diff --stat`: confirms only `changes/0122-multi-agent-runtime-open-questions/`,
  `docs/history/multi-agent-runtime-open-questions.md`, and `docs/history/README.md` changed — no
  executable file touched.

## Findings

- The proposal's closest real analogue (Execution Identity / "what composed a Run") is already on
  record in `runtime-governance-open-questions.md`, unresolved pending H5/H6. This Change does not
  resolve it; it notes the overlap so a future reader does not treat the new proposal as unrelated.

## Risks

- None from this Change (documentation only). The deferred risk is architectural drift if a future
  Change adopts pieces of the proposal without going through the evidence gate this document names.

## Recommendations

- If real evidence accumulates (see the document's "Evidence gate" section), scope any future ADR
  narrowly — start from the single most-evidenced tension, not the full proposal.

## Artifacts Produced

- `docs/history/multi-agent-runtime-open-questions.md`
- `docs/history/README.md` (index entry added)

## Lessons Learned

- Large external "implement this whole architecture" prompts should be checked against this
  repository's own ADR log before any spec/task drafting begins, per [[adr-precedence-over-specs]].

## Next Change

None. Revisit only if the evidence gate in `docs/history/multi-agent-runtime-open-questions.md` is
met.
