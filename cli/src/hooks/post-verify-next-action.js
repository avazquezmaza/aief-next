// Hook: post-verify-next-action (AIEF Core 3.0, Entrega 6, Change 0048,
// ADR-020). Event: verify.completed. Recommends the next command after a
// `verify` run, for the one Change targeted by `--change <id>`, reusing
// workflow-service.js's deriveNextAction() (Entrega 4) — never the Skill
// Service. deriveNextAction() is a pure combination of already-loaded facts
// (no filesystem/provider access of its own — Entrega 4's whole point in
// splitting it from inspect()) so calling it here on context's own
// already-computed `change`/`workflow`/`sdd` fields re-derives nothing new;
// it never re-fetches them (HK-R20). Never changes PASS/FAIL, never touches
// evidence.md.
import { deriveNextAction } from "../core/services/workflow-service.js";
export const id = "post-verify-next-action";
export const version = "1.0.0";
export const title = "Post-Verify Next Action";
export const description = "Recommends the next command after a verify run for a single targeted Change.";
export const events = ["verify.completed"];
export const capabilities = Object.freeze({
  observe: true,
  block: false,
  invokeSkill: false,
  emitWarning: false,
  emitInstruction: true,
  writeFiles: false,
  executeCommands: false,
  network: false
});

// Applies only when verify targeted exactly one Change (operation.input's
// changeId is set) and that Change resolved — the whole-project `verify`
// (no single Change) has no single "next action" to recommend (HK-R "no
// inventa una acción" when context is insufficient).
export function appliesTo(event, context) {
  if (!context.operation?.input?.changeId) return { applicable: false, status: "not_applicable", reason: "verify targeted the whole project, not a single Change" };
  if (!context.change) return { applicable: false, status: "not_applicable", reason: "no Change resolved" };
  return { applicable: true };
}

// Pure: combines context's own already-loaded change/workflow/sdd via
// deriveNextAction() — the same single canonical "what's next" computation
// status/prompt already share (Entrega 4) — never re-derived a second way.
export function evaluate(event, context) {
  const action = deriveNextAction({ change: context.change, workflow: context.workflow, sdd: context.sdd });
  return {
    summary: `Next action for ${context.change.basename}: ${action.command || `(none — ${action.status})`}`,
    instructions: action.command ? [action.command] : []
  };
}
