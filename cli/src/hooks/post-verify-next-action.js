// Hook: post-verify-next-action (AIEF Core 3.0, Entrega 6, Change 0048,
// ADR-020). Event: verify.completed. Recommends the next command after a
// `verify` run, for the one Change targeted by `--change <id>`, reusing
// next-action.js's deriveNextAction() on context's already-loaded `change`.
// Never changes PASS/FAIL, never touches evidence.md.
import { deriveNextAction } from "../core/services/next-action.js";
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

// The same single "what's next" computation status/prompt share.
export function evaluate(event, context) {
  const action = deriveNextAction({ change: context.change });
  return {
    summary: `Next action for ${context.change.basename}: ${action.command || `(none — ${action.status})`}`,
    instructions: action.command ? [action.command] : []
  };
}
