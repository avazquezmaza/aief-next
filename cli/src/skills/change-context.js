// Skill: change-context (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019).
// Model A only (capabilities.instructions: true, nothing else) — a
// normalized, human-readable summary of one Change's identity, status and
// next action, reusing exactly the fields next-action.js's explain()
// already computed (via the Skill Context Builder — this module never calls
// explain() itself).
//
// Never claims to have analyzed or executed anything: it renders what is
// already known, the same facts `aief status --change <id>` prints, exposed
// through the Skill contract instead of console output.

export const id = "change-context";
export const version = "1.0.0";
export const title = "Change Context";
export const description = "Normalized, human-readable summary of one Change's identity, status and next action.";
export const capabilities = Object.freeze({
  instructions: true,
  deterministicExecution: false,
  writeFiles: false,
  executeCommands: false,
  network: false,
  assistantRequired: false
});

// Applies to any context with a resolved Change — unconditional beyond that
// (design.md §6.1). A context whose Change failed to resolve at all is not
// something this Skill is ever invoked against (the CLI/Service resolve the
// Change before building a context in the first place).
export function appliesTo(context) {
  if (!context || !context.change) return { applicable: false, status: "not_applicable", reason: "no Change resolved" };
  return { applicable: true };
}

export function buildInstructions(context) {
  const { change, action } = context;
  const lines = [];
  lines.push(`Change: ${change.basename}`);
  lines.push(`Status: ${change.closed ? "closed" : "open"}`);
  if (action) {
    lines.push(`Next: ${action.command || `none (${action.status})`}`);
    if (action.status === "blocked") lines.push(`Blockers:\n${action.evidence.map((p) => `  - ${p}`).join("\n")}`);
  }
  if (change.dependsOn && change.dependsOn.length) lines.push(`Depends on: ${change.dependsOn.join(", ")}`);
  return lines.join("\n");
}

export function summarize(result) {
  return result.status === "ready" ? "Change context summary ready." : `change-context: ${result.status}`;
}
