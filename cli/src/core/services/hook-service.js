// Hook Service (AIEF Core 3.0, Entrega 6, Change 0048, ADR-020).
//
// Orchestrates: validate the event -> resolve registered Hooks for it (in
// deterministic order) -> check applicability -> apply capability policy
// -> evaluate purely -> invoke the Skill Service when permitted (never
// directly by the Hook) -> normalize -> aggregate. Every function here is a
// pure function of its inputs (HK-R53) — no caching, no retry, no global
// mutable state, no event bus, no async dispatch, no background job
// (HK-R27).
//
// This module is the ONLY place that decides `matched` vs. every other
// status, constructs the final `hook`/`event`/`blocking`/`effects` fields
// of a result, and enforces every capability a Hook did NOT declare — a
// Hook's own evaluate() return value is never trusted for these fields
// (mirrors skill-service.js's "the Service decides, never the reaction"
// discipline, SK-R7/R22/R24).
import { hooksForEvent, getHook } from "../../hooks/index.js";
import { isKnownEvent, phaseOf, STATUS_VALUES, APPLICABILITY_STATUSES } from "../domain/hook.js";
import { runSkill } from "./skill-service.js";

function messageOf(err) {
  return err && err.message ? err.message : String(err);
}

function baseResult(mod, event, overrides) {
  const result = {
    hook: mod.id,
    event: event.id,
    status: "invalid",
    blocking: false,
    summary: "",
    warnings: [],
    blockers: [],
    instructions: [],
    skillResults: [],
    evidence: [],
    errors: [],
    effects: [],
    ...overrides,
    // Re-asserted after the spread — never taken from a Hook's own return
    // value, however it was produced (HK-R32).
    hook: mod.id,
    event: event.id,
    effects: []
  };
  if (!STATUS_VALUES.includes(result.status)) {
    result.status = "invalid";
    result.errors = [...result.errors, "internal: unrecognized status was discarded"];
  }
  return result;
}

// Builds a Skill-Context-shaped object purely from Hook Context's own
// already-loaded fields — no new fetch (HK-R20/R22): Hook Context already
// carries exactly the facts skill-context.js's buildSkillContext() would
// have fetched (`project`/`change`/`workflow`/`sdd`). `action` is omitted
// (neither shipped Skill reads it) rather than re-derived.
function skillContextFrom(hookContext) {
  return Object.freeze({ project: hookContext.project, change: hookContext.change, workflow: hookContext.workflow, sdd: hookContext.sdd, action: null });
}

// Pre-invokes every id in a Hook's own `allowedSkills` — never any other id
// — and returns a FROZEN plain `{id: NormalizedSkillResult}` map (each
// entry frozen too). Never called for a Hook without `capabilities.
// invokeSkill` (no allowlist would exist to bound it). The Skill Service's
// own result is embedded unedited (HK-R36) — frozen specifically so a
// Hook's evaluate() cannot mutate the map it was handed to fabricate or
// alter a Skill result (a Hook receives this by reference, as its third
// argument, so read-only is enforced structurally, not by convention).
function invokeAllowedSkills(mod, hookContext) {
  const skillContext = skillContextFrom(hookContext);
  const skillResults = {};
  for (const skillId of mod.allowedSkills || []) {
    skillResults[skillId] = Object.freeze(runSkill(skillId, skillContext, {}));
  }
  return Object.freeze(skillResults);
}

// Exported (in addition to evaluateEvent()) so tests can exercise the
// Service's enforcement invariants against an isolated fixture Hook module
// — never registered in the real registry — the same "runSkillModule()"
// precedent skill-service.js already established.
export function evaluateHook(mod, event, context) {
  let applicability;
  try {
    applicability = mod.appliesTo(event, context);
  } catch (err) {
    return baseResult(mod, event, { status: "failed", summary: `appliesTo() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!applicability || applicability.applicable !== true) {
    const requested = applicability && applicability.status;
    const status = APPLICABILITY_STATUSES.includes(requested) ? requested : "not_applicable";
    const summary = (applicability && applicability.reason) || "not applicable";
    return baseResult(mod, event, { status, summary });
  }

  let skillResultsMap = {};
  if (mod.capabilities.invokeSkill === true) {
    try {
      skillResultsMap = invokeAllowedSkills(mod, context);
    } catch (err) {
      return baseResult(mod, event, { status: "failed", summary: `Skill invocation failed: ${messageOf(err)}`, errors: [messageOf(err)] });
    }
  }

  let raw;
  try {
    raw = mod.evaluate(event, context, skillResultsMap);
  } catch (err) {
    return baseResult(mod, event, { status: "failed", summary: `evaluate() failed: ${messageOf(err)}`, errors: [messageOf(err)] });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return baseResult(mod, event, { status: "invalid", summary: "evaluate() did not return a result object", errors: ["evaluate() must return a plain object"] });
  }

  // Every field below is enforced against the Hook's OWN declared
  // capabilities — "no confíes solo en Hooks bien comportados." Any
  // unauthorized content is stripped and the result is downgraded to
  // "invalid" (uniform violation class, same severity as an attempted
  // effect — HK-R12/R13).
  const violations = [];
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  if (effects.length) violations.push("Hook attempted to report effects; none are permitted this Entrega.");

  // event.phase is NEVER trusted from the caller for a REAL catalog event —
  // recomputed from the closed catalog itself (found via adversarial review:
  // a caller-supplied event object with a spoofed `phase: "pre"` on a real,
  // catalog `"post"` event id could otherwise smuggle an honored blocker
  // past HK-R11). An id outside the catalog (only ever reachable directly
  // through evaluateHook(), never through evaluateEvent()'s own
  // isKnownEvent() guard) falls back to the caller's own `phase` — the
  // mechanism this Entrega's own synthetic "no real pre-event exists yet"
  // test fixture relies on, the same precedent Entrega 4/5 used for
  // outcomes no real producer exercises yet.
  const rawBlocking = raw.blocking === true;
  const effectivePhase = isKnownEvent(event.id) ? phaseOf(event.id) : event.phase;
  const canBlock = mod.capabilities.block === true && effectivePhase === "pre";
  if (rawBlocking && !canBlock) violations.push("Hook attempted blocking: true without authority (capabilities.block and a phase: \"pre\" event are both required).");
  const rawBlockers = Array.isArray(raw.blockers) ? raw.blockers : [];
  if (rawBlockers.length && !canBlock) violations.push("Hook attempted to return blockers without block capability or outside a pre-event.");

  const rawWarnings = Array.isArray(raw.warnings) ? raw.warnings : [];
  if (rawWarnings.length && mod.capabilities.emitWarning !== true) violations.push("Hook attempted to return warnings without capabilities.emitWarning.");

  const rawInstructions = Array.isArray(raw.instructions) ? raw.instructions : [];
  if (rawInstructions.length && mod.capabilities.emitInstruction !== true) violations.push("Hook attempted to return instructions without capabilities.emitInstruction.");

  const rawSkillResults = Array.isArray(raw.skillResults) ? raw.skillResults : [];
  if (rawSkillResults.length) violations.push("Hook attempted to set skillResults directly; only the Hook Service's own Skill Service invocation is trusted.");

  if (violations.length) {
    return baseResult(mod, event, { status: "invalid", summary: raw.summary || "Hook result violated its own declared capabilities", errors: violations });
  }

  const summary = typeof raw.summary === "string" && raw.summary.trim() ? raw.summary : `${mod.id}: matched`;
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  return baseResult(mod, event, {
    status: "matched",
    summary,
    warnings: mod.capabilities.emitWarning === true ? rawWarnings : [],
    instructions: mod.capabilities.emitInstruction === true ? rawInstructions : [],
    skillResults: mod.capabilities.invokeSkill === true ? Object.values(skillResultsMap) : [],
    evidence,
    blocking: canBlock ? rawBlocking : false,
    blockers: canBlock ? rawBlockers : []
  });
}

// evaluateEvent(event, context) -> { event, results, warnings, blockers, instructions }.
// `results` preserves every Hook's own full result, in hooksForEvent()'s
// deterministic order (HK-R19/R25); the top-level warnings/blockers/
// instructions are the ordered concatenation of every `matched` Hook's own
// (capability-filtered) contribution — never re-sorted, never deduplicated.
export function evaluateEvent(event, context) {
  if (!event || !isKnownEvent(event.id)) {
    throw new Error(`Unknown event "${event && event.id}" — not part of the closed catalog.`);
  }
  const ids = hooksForEvent(event.id);
  const results = ids.map((id) => evaluateHook(getHook(id), event, context));
  const matched = results.filter((r) => r.status === "matched");
  return {
    event: event.id,
    results,
    warnings: matched.flatMap((r) => r.warnings),
    blockers: matched.flatMap((r) => r.blockers),
    instructions: matched.flatMap((r) => r.instructions)
  };
}
