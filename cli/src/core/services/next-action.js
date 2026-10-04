// The single "what's next" for one Change (ADR-038, Change 0157). Replaces
// the workflow engine: every Change is judged by checkChangeReadiness(), so
// the next step is either more work (`aief prompt`) or `aief close`. Pure
// apart from loading the Change; never writes, never runs anything.
import { loadChange } from "../domain/change.js";
import { checkChangeReadiness } from "./change-verifier.js";

function actionResult({ id, status, reason, blocking, command, evidence }) {
  return { id, status, reason, blocking, command, requiresConfirmation: false, evidence };
}

export function deriveNextAction({ change }) {
  if (change.closed) {
    return actionResult({ id: "closed", status: "complete", reason: "Change is closed.", blocking: false, command: null, evidence: [] });
  }
  const problems = checkChangeReadiness(change);
  return problems.length
    ? actionResult({ id: "close", status: "blocked", reason: problems.join("; "), blocking: true, command: `aief prompt --change ${change.basename}`, evidence: problems })
    : actionResult({ id: "close", status: "available", reason: "Readiness checks passed.", blocking: false, command: `aief close --yes --change ${change.basename}`, evidence: [] });
}

// explain(changeDir) -> { change, action }: the loaded Change and its next
// action, computed once and shared by status, prompt, verify's Hook and the
// Skill context.
export function explain(changeDir) {
  const change = loadChange(changeDir);
  return { change, action: deriveNextAction({ change }) };
}

export function nextAction(changeDir) {
  return explain(changeDir).action;
}
