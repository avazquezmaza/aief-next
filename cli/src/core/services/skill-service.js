// Skill Service (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019).
//
// Orchestrates: resolve the Skill (registry) -> check applicability
// -> apply capability policy -> invoke buildInstructions()/execute()
// -> normalize the result -> enforce the runtime invariants below. Every
// function here is a pure function of its inputs (SK-R31) — nothing is
// cached, nothing is retried, nothing reads global mutable state.
//
// This module is the ONLY place that decides `ready` vs. `completed`,
// constructs the final `skill`/`version`/`status`/`effects` fields of a
// result, and enforces that `effects` is always `[]` this Entrega — a Skill
// implementation never gets to set these fields directly (SK-R7/R22/R24).
// A Skill's buildInstructions()/execute() return a plain value (a string, or
// a plain data object); this module is what turns that into a Normalized
// Skill Result, discarding anything a Skill tried to smuggle into fields it
// does not own (a hostile or buggy `execute()` returning
// `{status: "completed", skill: "other-id", effects: [...]}` has every one
// of those fields ignored — the Service decides `skill`/`status`/`effects`
// itself, never trusting the Skill's return value for them).
import { getSkill, skillIds, describeSkill } from "../../skills/index.js";
import { STATUS_VALUES } from "../domain/skill.js";

// The only three statuses appliesTo() is ever trusted to select (SK-R20) —
// a non-applicable outcome can never become "ready"/"completed" this way,
// however that string was invented. Anything else, including an attempt to
// claim "completed" or "ready" from appliesTo() itself, falls back to the
// safe default below.
const APPLICABILITY_STATUSES = ["not_applicable", "blocked", "unsupported"];

// A plain Error with a distinguishing `.name`, not a class — zero ES6
// classes exist anywhere in cli/src/ (the same discipline requirement-
// providers/index.js's own `throw new Error(...)` already follows); a
// caller distinguishes this from any other thrown error via
// `err.name === "UnknownSkillError"` (isUnknownSkillError() below), never
// `instanceof`.
export function unknownSkillError(id) {
  const err = new Error(`Unknown skill "${id}".`);
  err.name = "UnknownSkillError";
  err.skillId = id;
  return err;
}

export function isUnknownSkillError(err) {
  return Boolean(err) && err.name === "UnknownSkillError";
}

function baseResult(mod, overrides) {
  const result = {
    skill: mod.id,
    version: mod.version,
    status: "invalid",
    summary: "",
    instructions: null,
    findings: [],
    artifacts: [],
    evidence: [],
    warnings: [],
    errors: [],
    effects: [],
    ...overrides,
    // Re-asserted after the spread so no `overrides` value (however it was
    // produced) can override the Skill's own real id/version or reintroduce
    // a non-empty `effects` array — this Entrega authorizes none (SK-R7).
    skill: mod.id,
    version: mod.version,
    effects: []
  };
  if (!STATUS_VALUES.includes(result.status)) {
    result.status = "invalid";
    result.errors = [...result.errors, `internal: unrecognized status was discarded`];
  }
  return result;
}

function messageOf(err) {
  return err && err.message ? err.message : String(err);
}

// listSkillDescriptors() -> every registered Skill's static descriptor
// (id/version/title/description/capabilities), with no Change resolved and
// no context built — the CLI layer's `--list-skills` surface must not load
// a Change, execute a Skill, or resolve an SDD provider at all (project
// owner's explicit instruction); this is a thin, deterministic passthrough
// to the registry, kept here (not called directly from cli.js) so the CLI
// never imports cli/src/skills/index.js itself (CLI -> Service -> Registry,
// never CLI -> Registry).
export function listSkillDescriptors() {
  return skillIds().map((id) => describeSkill(getSkill(id)));
}

// listSkills(context) -> every registered Skill's descriptor plus its
// applicability for this context, WITHOUT ever calling buildInstructions()/
// execute() (SK-R40) — a listing must never do a Skill's work just to
// describe it.
export function listSkills(context) {
  return skillIds().map((id) => {
    const mod = getSkill(id);
    const descriptor = describeSkill(mod);
    try {
      const applicability = mod.appliesTo(context);
      return { ...descriptor, applicable: Boolean(applicability && applicability.applicable === true), reason: applicability && applicability.reason };
    } catch (err) {
      return { ...descriptor, applicable: false, reason: `appliesTo() failed: ${messageOf(err)}` };
    }
  });
}

// runSkill(id, context, input = {}) -> Normalized Skill Result. Never throws
// for a normal outcome (not_applicable/blocked/unsupported/invalid/failed
// are all results, not exceptions) — only an unknown Skill id throws
// (SK-R11/R27/R29), since that is a caller bug, not a per-invocation outcome.
// Resolves the id against the real registry, then delegates every actual
// invocation/enforcement decision to runSkillModule() — kept as a separate,
// exported function so tests can exercise the Service's enforcement
// invariants against an isolated fixture module (never registered in the
// real registry) without needing a second copy of this logic.
export function runSkill(id, context, input = {}) {
  const mod = getSkill(id);
  if (!mod) throw unknownSkillError(id);
  return runSkillModule(mod, context, input);
}

export function runSkillModule(mod, context, input = {}) {
  let applicability;
  try {
    applicability = mod.appliesTo(context);
  } catch (err) {
    return baseResult(mod, { status: "failed", summary: `appliesTo() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!applicability || applicability.applicable !== true) {
    const requested = applicability && applicability.status;
    const status = APPLICABILITY_STATUSES.includes(requested) ? requested : "not_applicable";
    const summary = (applicability && applicability.reason) || "not applicable";
    return baseResult(mod, { status, summary, warnings: [] });
  }

  const wantsExecution = input && input.mode === "execute";
  if (wantsExecution) return runExecution(mod, context, input);
  return runInstructions(mod, context, input);
}

function runInstructions(mod, context, input) {
  if (mod.capabilities.instructions !== true) {
    return baseResult(mod, { status: "unsupported", summary: `${mod.id} does not provide instructions` });
  }
  let text;
  try {
    text = mod.buildInstructions(context, input);
  } catch (err) {
    return baseResult(mod, { status: "failed", summary: `buildInstructions() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (typeof text !== "string" || !text.trim()) {
    return baseResult(mod, { status: "invalid", summary: "buildInstructions() did not return usable text", errors: ["buildInstructions() must return a non-empty string"] });
  }
  const summary = safeSummarize(mod, { status: "ready" }) || `${mod.id}: instructions ready`;
  return baseResult(mod, { status: "ready", summary, instructions: text });
}

// Reachable only when a future Skill declares capabilities.deterministicExecution
// (neither Skill this Entrega does — exercised by a synthetic fixture in
// skill-service.test.js, same "no real producer yet" precedent Entrega 4
// used for the Normalized Action's own "unsupported" outcome).
function runExecution(mod, context, input) {
  if (mod.capabilities.deterministicExecution !== true) {
    return baseResult(mod, { status: "unsupported", summary: `${mod.id} does not support deterministic execution` });
  }
  let raw;
  try {
    raw = mod.execute(context, input);
  } catch (err) {
    return baseResult(mod, { status: "failed", summary: `execute() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return baseResult(mod, { status: "invalid", summary: "execute() did not return a result object", errors: ["execute() must return a plain object"] });
  }
  // Only these fields are ever trusted from a Skill's own execute() return
  // value — anything else (an attempted `status`/`skill`/`version`/`command`/
  // a non-empty `effects`) is silently discarded by omission, not merged.
  const findings = Array.isArray(raw.findings) ? raw.findings : [];
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  const warnings = Array.isArray(raw.warnings) ? raw.warnings : [];
  const attemptedEffects = Array.isArray(raw.effects) ? raw.effects : [];
  if (attemptedEffects.length) {
    return baseResult(mod, {
      status: "invalid",
      summary: `${mod.id} attempted to report ${attemptedEffects.length} effect(s); none are permitted this Entrega`,
      errors: ["Skill attempted a forbidden effect."]
    });
  }
  const summary = safeSummarize(mod, { status: "completed" }) || `${mod.id}: completed`;
  return baseResult(mod, { status: "completed", summary, findings, evidence, warnings });
}

function safeSummarize(mod, partialResult) {
  if (typeof mod.summarize !== "function") return null;
  try {
    const value = mod.summarize(partialResult);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
