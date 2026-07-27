// Verification Rule: requirement-has-traceability (AIEF Core 3.0, Entrega 7,
// Change 0049, ADR-021). Checks whether a requirement's own id is cited
// anywhere in its Change's verification.md scenario table — the one real,
// organic citation convention this session's own Entregas 2-6 established
// (found by inspection, not invented). Proves the requirement was
// CONSIDERED in verification planning; never that it was SATISFIED — the
// `summary` text below states this distinction explicitly, every time.
import { isRequirementCited } from "../core/services/verification-evidence.js";

export const id = "requirement-has-traceability";
export const version = "1.0.0";
export const title = "Requirement Has Traceability";
export const description = "Checks whether a requirement's id is cited in the Change's verification.md scenario table.";
export const scope = "requirement";
export const capabilities = Object.freeze({
  readContext: true, readArtifacts: false, readEvidence: true,
  executeCommands: false, writeFiles: false, network: false, assistantRequired: false
});
export const evidenceTypes = [];

export function appliesTo(context) {
  if (!context.verificationDoc) return { applicable: false, status: "not_applicable", reason: "no verification.md for this Change" };
  return { applicable: true };
}

// Pure: reads only context.verificationDoc (already loaded, frozen) and the
// requirement's own id — never fetches anything, never mutates its inputs.
export function evaluate(context, requirement) {
  const cited = isRequirementCited(context.verificationDoc, requirement.id);
  if (cited) {
    return {
      status: "passed",
      summary: `${requirement.id} is cited in verification.md's scenario table (traceability present — this does not mean the requirement is implemented or satisfied).`
    };
  }
  return {
    status: "failed",
    summary: `${requirement.id} is not cited anywhere in verification.md — no verification scenario claims to cover it.`,
    missingEvidence: [{ type: "file_assertion", ref: "verification.md", source: "verification.md", confidence: "deterministic", state: "not_cited" }]
  };
}
