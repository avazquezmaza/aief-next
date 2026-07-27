// The Hook Registry (AIEF Core 3.0, Entrega 6, Change 0048, ADR-020).
// Mirrors cli/src/requirement-providers/index.js, cli/src/sdd-providers/
// index.js and cli/src/skills/index.js exactly: a plain, statically-imported
// module list — no directory scan, no dynamic import() of a path built from
// user input, no filesystem load, no npm resolution, no runtime mutation.
//
// A registration LIST (not a plain object keyed by import name) is used
// deliberately, same reasoning as skills/index.js: it lets createRegistry()
// catch a genuine id collision — two different files both declaring the
// same `id` — which a plain object literal's own key uniqueness could not
// detect. Import/registration order is still fully static and deterministic
// (HK-R19): the array's own literal order.
import { validateDescriptor } from "../core/domain/hook.js";
import { hasSkill } from "../skills/index.js";
import * as promptSkillSuggestion from "./prompt-skill-suggestion.js";
import * as postVerifyNextAction from "./post-verify-next-action.js";

const MODULES = [promptSkillSuggestion, postVerifyNextAction];

// createRegistry(modules) -> { id -> module } or throws. Exported so tests
// can exercise duplicate-id / invalid-descriptor / forbidden-capability /
// unknown-allowlisted-Skill rejection against small fixture modules, without
// needing real files on disk (HK-R16/R17).
export function createRegistry(modules) {
  const registry = {};
  for (const mod of modules) {
    const { ok, errors } = validateDescriptor(mod);
    if (!ok) {
      throw new Error(`Invalid Hook descriptor "${mod && mod.id ? mod.id : "(unknown)"}": ${errors.join("; ")}`);
    }
    if (registry[mod.id]) {
      throw new Error(`Duplicate Hook id "${mod.id}" — already registered.`);
    }
    if (Array.isArray(mod.allowedSkills)) {
      for (const skillId of mod.allowedSkills) {
        if (!hasSkill(skillId)) throw new Error(`Hook "${mod.id}" declares allowedSkills entry "${skillId}", which is not a registered Skill.`);
      }
    }
    registry[mod.id] = mod;
  }
  return registry;
}

const HOOKS = createRegistry(MODULES);

export function hasHook(id) {
  return Boolean(HOOKS[id]);
}

// getHook(id) -> the Hook module, or null for an unknown id — never
// `undefined` silently propagated into a TypeError at a later call site
// (HK-R18).
export function getHook(id) {
  return HOOKS[id] || null;
}

// Deterministic order: MODULES' own literal order, never filesystem order
// (HK-R19).
export function hookIds() {
  return MODULES.map((mod) => mod.id);
}

// hooksForEvent(eventId) -> Hook ids subscribed to eventId, in registry
// order — the Hook Service's only way to find candidates for a fired event.
export function hooksForEvent(eventId) {
  return hookIds().filter((id) => HOOKS[id].events.includes(eventId));
}

export function describeHook(mod) {
  return { id: mod.id, version: mod.version, title: mod.title, description: mod.description, events: [...mod.events], capabilities: { ...mod.capabilities } };
}

export function listDescriptors() {
  return hookIds().map((id) => describeHook(HOOKS[id]));
}
