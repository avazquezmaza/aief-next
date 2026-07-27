// Skill: change-context (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019).
// Model A only (capabilities.instructions: true, nothing else) — a
// normalized, human-readable summary of one Change's identity, Workflow
// stage/blockers/warnings and SDD readiness, reusing exactly the fields
// workflow-service.js's explain() already computed (via the Skill Context
// Builder — this module never calls explain()/evaluateGates()/
// resolveSddProvider() itself, per design.md §3/§10).
//
// Never claims to have analyzed or executed anything: it renders what is
// already known, the same facts `aief status --change <id>` prints, exposed
// through the Skill contract instead of console output.

export const id = "change-context";
export const version = "1.0.0";
export const title = "Change Context";
export const description = "Normalized, human-readable summary of one Change's identity, Workflow stage and SDD readiness.";
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

function renderGateLines(label, gates) {
  if (!gates || !gates.length) return "";
  return `${label}:\n${gates.map((g) => `  - ${g.id}: ${g.status} — ${g.reason}`).join("\n")}\n`;
}

export function buildInstructions(context) {
  const { change, workflow, sdd } = context;
  const lines = [];
  lines.push(`Change: ${change.basename}`);
  lines.push(`Status: ${change.closed ? "closed" : "open"}`);

  if (change.manifestError) {
    lines.push("Manifest: invalid");
    for (const err of change.manifestError) lines.push(`  ${err.field}: ${err.message}`);
  } else if (workflow && workflow.kind === "resolved") {
    lines.push(`Track: ${change.track}`);
    lines.push(`Stage: ${workflow.state.stage}`);
    lines.push(`Next: ${workflow.state.nextAction === null ? "none (closed)" : workflow.state.nextAction}`);
    const blockerLines = renderGateLines("Blockers", workflow.state.blockers);
    if (blockerLines) lines.push(blockerLines.trimEnd());
    const warningLines = renderGateLines("Warnings", workflow.state.warnings);
    if (warningLines) lines.push(warningLines.trimEnd());
  } else if (workflow) {
    lines.push(`Workflow: invalid — ${workflow.error}`);
  } else {
    lines.push("Workflow: no track declared (legacy readiness only).");
  }

  if (sdd && !sdd.error) {
    lines.push(`SDD provider: ${sdd.providerId}`);
    lines.push(`SDD readiness: ${sdd.readiness.status}`);
    if (sdd.readiness.blockers?.length) lines.push(`  Blockers: ${sdd.readiness.blockers.join("; ")}`);
    if (sdd.readiness.warnings?.length) lines.push(`  Warnings: ${sdd.readiness.warnings.join("; ")}`);
  } else if (sdd?.error) {
    lines.push(`SDD provider: ${sdd.error}`);
  }

  return lines.join("\n");
}

export function summarize(result) {
  return result.status === "ready" ? "Change context summary ready." : `change-context: ${result.status}`;
}
