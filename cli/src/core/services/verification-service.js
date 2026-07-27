// Verification Service (AIEF Core 3.0, Entrega 7, Change 0049, ADR-021).
//
// Orchestrates: resolve requirements -> resolve evidence once per
// requirement (shared across every rule, never re-resolved per rule) ->
// select rules for scope "requirement" (deterministic order) -> check
// applicability -> evaluate purely -> normalize -> aggregate per
// requirement -> aggregate overall (with Structural Verification's own
// result). Every function here is a pure function of its inputs (VR-R40) —
// no caching, no retry, no global mutable state, no test execution, no
// command execution, no network (VR-R39).
//
// This module is the ONLY place that decides `passed` vs. every other
// per-rule status, constructs the final `rule`/`requirement`/`effects`
// fields of a result, and enforces every claim a rule makes against the
// evidence the Service itself resolved — a rule's own evaluate() return
// value is never trusted for these fields (mirrors skill-service.js's/
// hook-service.js's "the Service decides, never the reaction" discipline).
import { rulesForScope, getRule } from "../../verification-rules/index.js";
import { STATUS_VALUES, APPLICABILITY_STATUSES } from "../domain/verification-rule.js";
import { resolveEvidenceForRequirement } from "./verification-evidence.js";

function messageOf(err) {
  return err && err.message ? err.message : String(err);
}

function baseResult(mod, requirement, overrides) {
  const result = {
    rule: mod.id,
    requirement: requirement.id,
    status: "invalid",
    summary: "",
    findings: [],
    evidence: [],
    missingEvidence: [],
    warnings: [],
    errors: [],
    effects: [],
    ...overrides,
    // Re-asserted after the spread — never taken from a rule's own return
    // value, however it was produced (VR-R31).
    rule: mod.id,
    requirement: requirement.id,
    effects: []
  };
  if (!STATUS_VALUES.includes(result.status)) {
    result.status = "invalid";
    result.errors = [...result.errors, "internal: unrecognized status was discarded"];
  }
  return result;
}

// Every evidence item a rule returns (in `evidence`/`missingEvidence`) must
// be one the Service itself resolved and handed to that rule — reference
// equality, not a fabricated lookalike object (VR-R6: "no inventes
// evidence"). A rule wanting to report a subset of what it received returns
// exactly those objects, unedited.
function onlyResolvedItems(items, resolvedEvidence) {
  return Array.isArray(items) ? items.every((item) => resolvedEvidence.includes(item)) : items === undefined;
}

// Exported (in addition to evaluateRequirement()'s use inside
// evaluateRequirements()) so tests can exercise the Service's enforcement
// invariants against an isolated fixture rule module — never registered in
// the real registry — the same "runSkillModule()"/"evaluateHook()"
// precedent skill-service.js/hook-service.js already established.
export function evaluateRule(mod, context, requirement, evidence) {
  let applicability;
  try {
    applicability = mod.appliesTo(context, requirement, evidence);
  } catch (err) {
    return baseResult(mod, requirement, { status: "error", summary: `appliesTo() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!applicability || applicability.applicable !== true) {
    const requested = applicability && applicability.status;
    const status = APPLICABILITY_STATUSES.includes(requested) ? requested : "not_applicable";
    const summary = (applicability && applicability.reason) || "not applicable";
    return baseResult(mod, requirement, { status, summary });
  }

  let raw;
  try {
    raw = mod.evaluate(context, requirement, evidence);
  } catch (err) {
    return baseResult(mod, requirement, { status: "error", summary: `evaluate() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return baseResult(mod, requirement, { status: "invalid", summary: "evaluate() did not return a result object", errors: ["evaluate() must return a plain object"] });
  }
  if (!STATUS_VALUES.includes(raw.status)) {
    return baseResult(mod, requirement, { status: "invalid", summary: raw.summary || "evaluate() returned an unrecognized status", errors: [`evaluate() returned status ${JSON.stringify(raw.status)}`] });
  }

  const violations = [];
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  if (effects.length) violations.push("Rule attempted to report effects; none are permitted this Entrega.");
  // Only `evidence` (claimed SUPPORT for a status) is checked against what the
  // Service actually resolved — inventing evidence to justify a false
  // `passed` is the real risk (VR-R6). `missingEvidence` only ever describes
  // an ABSENCE (e.g. "no citation found," "verification.md has no path token
  // for this requirement") — a rule is free to describe what it looked for
  // and didn't find in its own words; that can never manufacture a false
  // `passed`, so it is not held to the same "must be a real resolved item"
  // rule.
  if (!onlyResolvedItems(raw.evidence, evidence)) violations.push("Rule reported evidence not present in the Service's own resolved evidence — invented evidence is rejected.");
  // Defense-in-depth (VR-R6): a rule that declares it consumes evidence
  // types, yet received none, cannot report "passed" — appliesTo() should
  // already have kept evaluate() from running in that case; this is a
  // second, independent check, not a substitute for that one.
  if (raw.status === "passed" && (mod.evidenceTypes || []).length > 0 && evidence.length === 0) {
    violations.push("Rule declared evidence types but reported passed with zero resolved evidence.");
  }
  // VR-R7: manual_attestation is real information but never verifiable —
  // it can never, by itself, justify a "passed" verdict. If a rule's
  // resolved evidence is non-empty but every single item is
  // manual_attestation (no artifact_state/file_assertion among them),
  // "passed" is rejected regardless of what the rule itself concluded.
  if (raw.status === "passed" && evidence.length > 0 && evidence.every((e) => e.type === "manual_attestation")) {
    violations.push("Rule reported passed backed only by manual_attestation evidence, which can never be sufficient alone.");
  }

  if (violations.length) {
    return baseResult(mod, requirement, { status: "invalid", summary: raw.summary || "Rule result violated its own contract", errors: violations });
  }

  return baseResult(mod, requirement, {
    status: raw.status,
    summary: typeof raw.summary === "string" && raw.summary.trim() ? raw.summary : `${mod.id}: ${raw.status}`,
    findings: Array.isArray(raw.findings) ? raw.findings : [],
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    missingEvidence: Array.isArray(raw.missingEvidence) ? raw.missingEvidence : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    errors: Array.isArray(raw.errors) ? raw.errors : []
  });
}

// evaluateRequirements(context) -> { requirementResults, warnings, errors }.
// `requirementResults` is `[{requirement, evidence, ruleResults}]`, one entry
// per requirement in `context.requirements`'s own array order (VR-R20),
// each `ruleResults` entry in `rulesForScope("requirement")`'s own
// deterministic order. Evidence is resolved exactly once per requirement,
// shared by every rule evaluated against it (never re-resolved per rule).
export function evaluateRequirements(context) {
  const ruleIds = rulesForScope("requirement");
  const requirementResults = context.requirements.map((requirement) => {
    // Frozen — an array and every entry — before any rule sees it (VR-R17):
    // a rule cannot mutate the evidence it was handed to fabricate or alter
    // a claim, the same fix Change 0048's own adversarial review applied to
    // Hooks' skillResults map, designed in from the start here.
    const evidence = Object.freeze(resolveEvidenceForRequirement(context, requirement).map((e) => Object.freeze(e)));
    const ruleResults = ruleIds.map((id) => evaluateRule(getRule(id), context, requirement, evidence));
    return { requirement, evidence, ruleResults };
  });
  const allRuleResults = requirementResults.flatMap((r) => r.ruleResults);
  return {
    requirementResults,
    warnings: allRuleResults.flatMap((r) => r.warnings),
    errors: allRuleResults.flatMap((r) => r.errors)
  };
}

// aggregateVerificationResult(structuralPassed, requirementResults) -> one of
// AGGREGATE_PRECEDENCE's five values, computed via the fixed precedence
// order (VR-R34) — never a boolean reduction. `not_applicable`/`unsupported`
// never affect the outcome (VR-R35); missing evidence (`blocked`) never
// becomes PASS (VR-R36).
export function aggregateVerificationResult(structuralPassed, requirementResults) {
  const allRuleResults = requirementResults.flatMap((r) => r.ruleResults);
  const has = (status) => allRuleResults.some((r) => r.status === status);
  if (has("error")) return "ERROR";
  if (has("invalid")) return "INVALID";
  if (!structuralPassed || has("failed")) return "FAIL";
  if (has("blocked")) return "INCOMPLETE";
  return "PASS";
}
