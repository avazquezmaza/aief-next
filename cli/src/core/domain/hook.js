// Hook contract — event catalog, descriptor shape, capability vocabulary,
// status vocabulary and structural validation (AIEF Core 3.0, Entrega 6,
// Change 0048, ADR-020).
//
// This module owns the *shape*, not the registry (cli/src/hooks/index.js)
// and not orchestration (core/services/hook-service.js) — same three-layer
// split ADR-016/017/019 already used (domain model / service / registry).
//
// No class — every Hook is a plain module export, mirroring
// requirement-providers/*.js, sdd-providers/*.js and skills/*.js. `id`/
// `version` reuse Skills' own ID_PATTERN/VERSION_PATTERN (ADR-019) rather
// than reinventing an equivalent rule — the same identity discipline applies
// to both kinds of registered thing.
import { ID_PATTERN, VERSION_PATTERN } from "./skill.js";

export { ID_PATTERN, VERSION_PATTERN };

// The closed, two-event catalog (design.md §3) — grounded in real, inspected
// CLI emission points. No event is added here speculatively; each has a
// confirmed emission point and a justified consumer among this Entrega's own
// Hooks. `close.requested`/`change.closed`/`change.created`/`change.inspected`
// are real emission points too, deliberately NOT included here — see
// proposal.md's "Initial events" section for why each is deferred.
export const EVENT_CATALOG = Object.freeze({
  "prompt.prepared": Object.freeze({ phase: "post" }),
  "verify.completed": Object.freeze({ phase: "post" })
});

export const EVENT_IDS = Object.freeze(Object.keys(EVENT_CATALOG));

export function isKnownEvent(eventId) {
  return Object.prototype.hasOwnProperty.call(EVENT_CATALOG, eventId);
}

export function phaseOf(eventId) {
  return isKnownEvent(eventId) ? EVENT_CATALOG[eventId].phase : undefined;
}

// The full capability vocabulary. Absent === false (HK-R9) — same discipline
// as Skills' KNOWN_CAPABILITIES; the descriptor validator enforces the
// converse (a method/field may only exist if its capability says so).
export const KNOWN_CAPABILITIES = Object.freeze([
  "observe",
  "block",
  "invokeSkill",
  "emitWarning",
  "emitInstruction",
  "writeFiles",
  "executeCommands",
  "network"
]);

// Model C (ADR-020 §"Why Model B's blocking authority is kept... unexercised"):
// these three cannot be declared `true` by any Hook this Entrega — identical
// mechanism to Skills' FORBIDDEN_CAPABILITIES (ADR-019).
export const FORBIDDEN_CAPABILITIES = Object.freeze(["writeFiles", "executeCommands", "network"]);

// Six distinguishable outcomes (HK-R29) — no "completed" analog: a Hook
// observes, it does not execute. See design.md §8 for the precise meaning
// of each.
export const STATUS_VALUES = Object.freeze(["matched", "not_applicable", "blocked", "unsupported", "invalid", "failed"]);

// HK-R31: the only three statuses a Hook's own appliesTo() may select for a
// non-applicable outcome — proactively applied here, the same fix Entrega
// 5's adversarial review had to apply to Skills after the fact (see
// core/services/skill-service.js's APPLICABILITY_STATUSES).
export const APPLICABILITY_STATUSES = Object.freeze(["not_applicable", "blocked", "unsupported"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// validateDescriptor(mod) -> { ok, errors[] }. Structural validation only —
// no filesystem access, no side effect, safe to call at module-load time
// (the registry does exactly that, for every registered Hook, before any
// command can run).
export function validateDescriptor(mod) {
  const errors = [];
  if (!mod || typeof mod !== "object") return { ok: false, errors: ["descriptor is not an object"] };

  if (!isNonEmptyString(mod.id) || !ID_PATTERN.test(mod.id)) {
    errors.push(`id must be a non-empty lowercase-kebab-case string (got ${JSON.stringify(mod.id)})`);
  }
  if (!isNonEmptyString(mod.version) || !VERSION_PATTERN.test(mod.version)) {
    errors.push(`version must be a "x.y.z" string (got ${JSON.stringify(mod.version)})`);
  }
  if (!isNonEmptyString(mod.title)) errors.push("title must be a non-empty string");
  if (!isNonEmptyString(mod.description)) errors.push("description must be a non-empty string");

  if (!Array.isArray(mod.events) || mod.events.length === 0) {
    errors.push("events must be a non-empty array");
  } else {
    for (const eventId of mod.events) {
      if (!isKnownEvent(eventId)) errors.push(`events declares an event outside the closed catalog: ${JSON.stringify(eventId)} — known: ${EVENT_IDS.join(", ")}`);
    }
  }

  const capabilities = mod.capabilities;
  if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)) {
    errors.push("capabilities must be an object");
  } else {
    for (const key of Object.keys(capabilities)) {
      if (!KNOWN_CAPABILITIES.includes(key)) {
        errors.push(`capabilities declares an unknown key "${key}" — unrecognized capabilities are rejected as a risk, not ignored`);
        continue;
      }
      if (typeof capabilities[key] !== "boolean") errors.push(`capabilities.${key} must be a boolean`);
    }
    for (const forbidden of FORBIDDEN_CAPABILITIES) {
      if (capabilities[forbidden] === true) {
        errors.push(`capabilities.${forbidden} cannot be true this Entrega — Model C (effects) is deferred, ADR-020`);
      }
    }

    const wantsInvokeSkill = capabilities.invokeSkill === true;
    if (wantsInvokeSkill && (!Array.isArray(mod.allowedSkills) || mod.allowedSkills.length === 0)) {
      errors.push("capabilities.invokeSkill is true but allowedSkills is not a non-empty array");
    }
    if (!wantsInvokeSkill && mod.allowedSkills !== undefined) {
      errors.push("allowedSkills is defined but capabilities.invokeSkill is not true");
    }
    if (Array.isArray(mod.allowedSkills)) {
      for (const skillId of mod.allowedSkills) {
        if (!isNonEmptyString(skillId) || !ID_PATTERN.test(skillId)) errors.push(`allowedSkills contains an invalid Skill id: ${JSON.stringify(skillId)}`);
      }
    }
  }

  if (typeof mod.appliesTo !== "function") errors.push("appliesTo(event, context) must be a function");
  if (typeof mod.evaluate !== "function") errors.push("evaluate(event, context) must be a function");

  return { ok: errors.length === 0, errors };
}
