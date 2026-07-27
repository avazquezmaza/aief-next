// Transition engine (AIEF Core 3.0, Entrega 2 — Workflow Engine, Change
// 0044). Pure functions only: no filesystem access, no model calls, no
// randomness, no clock — resolveState() and isTransitionLegal() are
// deterministic functions of their arguments (WF-R23), reproducible from any
// process. Nothing here writes anything (WF-R24); nothing here decides a
// transition by consulting an AI assistant (WF-R12).

function warningsOf(gateResults) {
  return gateResults.filter((g) => g.status === "warning");
}

function isGateSatisfied(gate) {
  // A gate that isn't declared as blocking never holds up a transition,
  // regardless of its status (WF-R10) — only `blocking: true` gates with a
  // non-"passed" status count as a blocker.
  if (!gate.blocking) return true;
  return gate.status === "passed";
}

function describeNextAction(stage, blockingGates) {
  const unimplemented = blockingGates.filter((g) => g.status === "pending");
  if (unimplemented.length) {
    return `${stage.id} — blocked on: ${unimplemented.map((g) => g.id).join(", ")} (no automated evaluator yet; a human must confirm manually)`;
  }
  return `${stage.id} — blocked on: ${blockingGates.map((g) => g.id).join(", ")}`;
}

// WF-R13: `manifest.next_action` (accepted, unused since Entrega 1) is
// never authoritative — only ever a hint compared against the derived
// value. A disagreement is reported as a non-blocking warning; the derived
// `nextAction` is still what's returned. No manifest in this repository
// sets this field yet, so this path is exercised only by tests today — it
// exists so the first real use of the field is compared, not silently
// trusted, from day one.
function withNextActionHint(change, result) {
  const hint = change.manifest?.next_action;
  if (typeof hint !== "string" || !hint.trim() || result.nextAction === null || hint === result.nextAction) {
    return result;
  }
  return {
    ...result,
    warnings: [
      ...result.warnings,
      {
        id: "next_action_hint",
        status: "warning",
        blocking: false,
        reason: `manifest.next_action (${JSON.stringify(hint)}) disagrees with the derived next action (${JSON.stringify(result.nextAction)}) — the derived value governs, not the stored hint`,
        evidence: []
      }
    ]
  };
}

// resolveState(change, workflowDefinition, gateResults) -> { stage, blockers, warnings, nextAction }
// Walks the definition's stages in declared order (design.md §6): the first
// stage with an unsatisfied blocking gate is where the Change currently is.
// If every stage's blocking gates are satisfied, the Change is ready to
// close. A closed Change short-circuits to a terminal state — nothing left
// to derive.
export function resolveState(change, workflowDefinition, gateResults) {
  if (change.closed) {
    return withNextActionHint(change, { stage: "closed", blockers: [], warnings: warningsOf(gateResults), nextAction: null });
  }

  const gatesById = new Map(gateResults.map((g) => [g.id, g]));
  for (const stage of workflowDefinition.stages) {
    const stageGates = (stage.gateIds || []).map((id) => gatesById.get(id)).filter(Boolean);
    const blockers = stageGates.filter((g) => !isGateSatisfied(g));
    if (blockers.length) {
      return withNextActionHint(change, {
        stage: stage.id,
        blockers,
        warnings: warningsOf(gateResults),
        nextAction: describeNextAction(stage, blockers)
      });
    }
  }

  return withNextActionHint(change, { stage: "close", blockers: [], warnings: warningsOf(gateResults), nextAction: "close" });
}

// isTransitionLegal(workflowDefinition, gateResults, fromStageId, toStageId)
// -> { legal, reason?, blockers? }
// Answers a specific "may I move from X to Y right now" question,
// independent of resolveState()'s own "where am I" computation — evaluated,
// never executed, in this Entrega (WF-R11): nothing calls this to actually
// perform a transition.
export function isTransitionLegal(workflowDefinition, gateResults, fromStageId, toStageId) {
  const edge = workflowDefinition.transitions.find((t) => t.from === fromStageId && t.to === toStageId);
  if (!edge) {
    return { legal: false, reason: `no declared transition from "${fromStageId}" to "${toStageId}"` };
  }
  const fromStage = workflowDefinition.stages.find((s) => s.id === fromStageId);
  const gatesById = new Map(gateResults.map((g) => [g.id, g]));
  const blockers = (fromStage?.gateIds || [])
    .map((id) => gatesById.get(id))
    .filter((g) => g && !isGateSatisfied(g));
  if (blockers.length) {
    return { legal: false, reason: `blocked by: ${blockers.map((g) => g.id).join(", ")}`, blockers };
  }
  return { legal: true };
}
