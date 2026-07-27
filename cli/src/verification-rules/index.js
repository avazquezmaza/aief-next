// The Verification Registry (AIEF Core 3.0, Entrega 7, Change 0049,
// ADR-021). Mirrors cli/src/requirement-providers/index.js,
// cli/src/sdd-providers/index.js, cli/src/skills/index.js and
// cli/src/hooks/index.js exactly: a plain, statically-imported module list —
// no directory scan, no dynamic import() of a path built from user input, no
// filesystem load, no npm resolution, no runtime mutation.
//
// A registration LIST (not a plain object keyed by import name) is used
// deliberately, same reasoning as skills/index.js and hooks/index.js: it
// lets createRegistry() catch a genuine id collision — two different files
// both declaring the same `id` — which a plain object literal's own key
// uniqueness could not detect. Import/registration order is still fully
// static and deterministic (VR-R20): the array's own literal order.
import { validateDescriptor } from "../core/domain/verification-rule.js";
import * as requirementHasTraceability from "./requirement-has-traceability.js";
import * as evidenceReferenceIntegrity from "./evidence-reference-integrity.js";

const MODULES = [requirementHasTraceability, evidenceReferenceIntegrity];

// createRegistry(modules) -> { id -> module } or throws. Exported so tests
// can exercise duplicate-id / invalid-descriptor / forbidden-capability
// rejection against small fixture modules, without needing real files on
// disk (VR-R19).
export function createRegistry(modules) {
  const registry = {};
  for (const mod of modules) {
    const { ok, errors } = validateDescriptor(mod);
    if (!ok) {
      throw new Error(`Invalid Verification Rule descriptor "${mod && mod.id ? mod.id : "(unknown)"}": ${errors.join("; ")}`);
    }
    if (registry[mod.id]) {
      throw new Error(`Duplicate Verification Rule id "${mod.id}" — already registered.`);
    }
    registry[mod.id] = mod;
  }
  return registry;
}

const RULES = createRegistry(MODULES);

export function hasRule(id) {
  return Boolean(RULES[id]);
}

// getRule(id) -> the rule module, or null for an unknown id — never
// `undefined` silently propagated into a TypeError at a later call site
// (VR-R18).
export function getRule(id) {
  return RULES[id] || null;
}

// Deterministic order: MODULES' own literal order, never filesystem order
// (VR-R20).
export function ruleIds() {
  return MODULES.map((mod) => mod.id);
}

// rulesForScope(scope) -> rule ids whose own `scope` matches, in registry
// order — the Verification Service's only way to find candidates for a
// requirement-scoped (or, in the future, change-scoped) evaluation pass.
export function rulesForScope(scope) {
  return ruleIds().filter((id) => RULES[id].scope === scope);
}

export function describeRule(mod) {
  return { id: mod.id, version: mod.version, title: mod.title, description: mod.description, scope: mod.scope, capabilities: { ...mod.capabilities }, evidenceTypes: [...(mod.evidenceTypes || [])] };
}

export function listDescriptors() {
  return ruleIds().map((id) => describeRule(RULES[id]));
}
