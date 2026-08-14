// The Skill Registry (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019).
// Mirrors cli/src/requirement-providers/index.js and
// cli/src/sdd-providers/index.js exactly: a plain, statically-imported
// module list — no directory scan, no dynamic import() of a path built from
// user input, no filesystem load, no npm resolution, no runtime mutation.
// Adding a third Skill means adding one file here and one entry in
// MODULES, not touching any caller (Skill Service, prompt()).
//
// A registration LIST (not a plain object keyed by import name, unlike the
// two precedents above) is used deliberately: it lets createRegistry() catch
// a genuine id collision — two different files both declaring the same
// `id` string, e.g. by copy-paste — which a plain object literal's own key
// uniqueness could not detect (a mistaken duplicate object key would just
// silently keep the last one). Import/registration order is still fully
// static and deterministic (SK-R8/R30): the array's own literal order.
import { validateDescriptor } from "../core/domain/skill.js";
import * as changeContext from "./change-context.js";
import * as requirementsAnalysisInstructions from "./requirements-analysis-instructions.js";
import * as architectureDefinition from "./architecture-definition.js";

const MODULES = [changeContext, requirementsAnalysisInstructions, architectureDefinition];

// createRegistry(modules) -> { id -> module } or throws. Exported (in
// addition to the static registry built from it below) so tests can exercise
// duplicate-id / invalid-descriptor / forbidden-capability rejection against
// small fixture modules, without needing real files on disk (SK-R9/R10).
export function createRegistry(modules) {
  const registry = {};
  for (const mod of modules) {
    const { ok, errors } = validateDescriptor(mod);
    if (!ok) {
      throw new Error(`Invalid Skill descriptor "${mod && mod.id ? mod.id : "(unknown)"}": ${errors.join("; ")}`);
    }
    if (registry[mod.id]) {
      throw new Error(`Duplicate Skill id "${mod.id}" — already registered.`);
    }
    registry[mod.id] = mod;
  }
  return registry;
}

// Constructed once, at module load — an invalid or duplicate Skill fails
// loudly the first time anything imports this module (npm test, or the CLI
// itself), never silently at first real use (SK-R10/R27).
const SKILLS = createRegistry(MODULES);

export function hasSkill(id) {
  return Boolean(SKILLS[id]);
}

// getSkill(id) -> the Skill module, or null for an unknown id — never
// `undefined` silently propagated into a TypeError at a later call site
// (SK-R11).
export function getSkill(id) {
  return SKILLS[id] || null;
}

// Deterministic order: MODULES' own literal order, never filesystem order,
// never registration-timing-dependent (SK-R30).
export function skillIds() {
  return MODULES.map((mod) => mod.id);
}

export function describeSkill(mod) {
  return { id: mod.id, version: mod.version, title: mod.title, description: mod.description, capabilities: { ...mod.capabilities } };
}

export function listDescriptors() {
  return skillIds().map((id) => describeSkill(SKILLS[id]));
}
