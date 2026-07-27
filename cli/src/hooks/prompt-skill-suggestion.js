// Hook: prompt-skill-suggestion (AIEF Core 3.0, Entrega 6, Change 0048,
// ADR-020). Event: prompt.prepared. Recommends the allowlisted
// requirements-analysis-instructions Skill when it is ready for the
// resolved Change — never auto-renders its full instructions (that remains
// the explicit, human-driven `prompt --skill` flag's job), never claims the
// Skill "ran." Demonstrates the full Hook -> Hook Service -> Skill Service
// -> allowlist -> Normalized Skill Result path (design.md §5).
export const id = "prompt-skill-suggestion";
export const version = "1.0.0";
export const title = "Prompt Skill Suggestion";
export const description = "Recommends an applicable, allowlisted Skill when preparing a prompt.";
export const events = ["prompt.prepared"];
export const capabilities = Object.freeze({
  observe: true,
  block: false,
  invokeSkill: true,
  emitWarning: false,
  emitInstruction: true,
  writeFiles: false,
  executeCommands: false,
  network: false
});
export const allowedSkills = ["requirements-analysis-instructions"];

// Deterministic, AI-free (HK-R28): applies to any resolved Change. Whether
// the recommendation is actually useful is decided in evaluate() (via the
// allowlisted Skill's own applicability/readiness), not here — appliesTo()
// only answers "does this Hook's own precondition (a Change exists) hold."
export function appliesTo(event, context) {
  if (!context || !context.change) return { applicable: false, status: "not_applicable", reason: "no Change resolved" };
  return { applicable: true };
}

// Pure with respect to its own logic — the actual Skill invocation happens
// in the Hook Service (never here directly, HK-R35), which pre-invokes every
// id in this Hook's own `allowedSkills` and hands the results in as
// `skillResults` (a plain `{id: NormalizedSkillResult}` map) — never as part
// of the shared `context` object, which must stay identical for every Hook
// evaluated against the same event (a Hook-specific field would contaminate
// that shared shape). `evaluate()` only decides how to phrase the
// recommendation from an already-computed result.
export function evaluate(event, context, skillResults) {
  const skillResult = skillResults?.["requirements-analysis-instructions"];
  if (!skillResult || skillResult.status !== "ready") {
    return { summary: "requirements-analysis-instructions is not ready for this Change", instructions: [] };
  }
  return {
    summary: "requirements-analysis-instructions is ready",
    instructions: [`Skill "requirements-analysis-instructions" is applicable — consider: aief prompt --skill requirements-analysis-instructions --change ${context.change.basename}`]
  };
}
