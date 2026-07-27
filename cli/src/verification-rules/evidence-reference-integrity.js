// Verification Rule: evidence-reference-integrity (AIEF Core 3.0, Entrega 7,
// Change 0049, ADR-021). For each file_assertion evidence reference resolved
// for a requirement (backtick-quoted, path-shaped tokens cited alongside the
// requirement's own id in verification.md — verification-evidence.js),
// verifies the reference stays within the project boundary (reusing Change
// 0045's isPathWithin() logic) and reports its real filesystem state. Proves
// only that a cited reference is safe and its target exists — never that the
// requirement itself is satisfied.
export const id = "evidence-reference-integrity";
export const version = "1.0.0";
export const title = "Evidence Reference Integrity";
export const description = "Verifies that file_assertion evidence references cited for a requirement are safe (contained) and resolve to a real, present target.";
export const scope = "requirement";
export const capabilities = Object.freeze({
  readContext: true, readArtifacts: true, readEvidence: true,
  executeCommands: false, writeFiles: false, network: false, assistantRequired: false
});
export const evidenceTypes = ["file_assertion"];

// Applies only when at least one file_assertion reference was resolved for
// this requirement — a requirement with none cited gets not_applicable
// (nothing this rule is equipped to check, not a failure of the requirement).
export function appliesTo(context, requirement, evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return { applicable: false, status: "not_applicable", reason: "no file_assertion evidence cited for this requirement" };
  }
  return { applicable: true };
}

// Pure: evaluates the already-resolved `evidence` array (built once by the
// Verification Service, never fetched here) — this rule never touches the
// filesystem itself.
export function evaluate(context, requirement, evidence) {
  const invalid = evidence.filter((e) => e.state === "invalid");
  const notPresent = evidence.filter((e) => e.state === "missing" || e.state === "empty");
  if (invalid.length) {
    return {
      status: "invalid",
      summary: `${invalid.length} evidence reference(s) for ${requirement.id} failed path containment.`,
      evidence,
      errors: invalid.map((e) => e.diagnostic || `${e.ref} is not a valid project-relative path`)
    };
  }
  if (notPresent.length) {
    return {
      status: "failed",
      summary: `${notPresent.length} of ${evidence.length} evidence reference(s) for ${requirement.id} do not resolve to a present, non-empty file.`,
      evidence,
      missingEvidence: notPresent
    };
  }
  return {
    status: "passed",
    summary: `All ${evidence.length} evidence reference(s) for ${requirement.id} are safe and present (this does not mean the requirement is satisfied).`,
    evidence
  };
}
