// Skill contract — descriptor shape, capability vocabulary, status vocabulary
// and structural validation (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019).
//
// This module owns the *shape*, not the registry (cli/src/skills/index.js)
// and not orchestration (core/services/skill-service.js) — same three-layer
// split ADR-016/017 already used (domain model / service / registry).
//
// Distinct from cli/src/skills-catalog.json (ADR-010, "Skill Catalog" —
// static, unexecuted contextual recommendations, untouched by this Entrega).
// This module defines the "Skills Runtime" contract: a versioned, internally
// registered capability with explicit capabilities, a deterministic
// appliesTo(context), and (for every Skill this Entrega ships)
// buildInstructions(context, input). No class — every Skill is a plain
// module export, mirroring requirement-providers/*.js and sdd-providers/*.js.

// The full capability vocabulary. Absent === false (SK-R4/R5) — the Skill
// Service never infers a capability from the presence of a method; the
// descriptor validator below enforces the converse (a method may only exist
// if its capability says so), so the two can never drift apart.
export const KNOWN_CAPABILITIES = Object.freeze([
  "instructions",
  "deterministicExecution",
  "writeFiles",
  "executeCommands",
  "network",
  "assistantRequired"
]);

// Model C (ADR-019 §"Why Model C is deferred, not merely discouraged"): these
// three cannot be declared `true` by any Skill this Entrega — registration
// itself fails, so a mis-declared Skill cannot silently gain the capability
// by a typo or an unreviewed edit.
export const FORBIDDEN_CAPABILITIES = Object.freeze(["writeFiles", "executeCommands", "network"]);

// Seven distinguishable outcomes (SK-R23), never collapsed. See design.md §7
// for the precise meaning of each.
export const STATUS_VALUES = Object.freeze(["ready", "completed", "not_applicable", "blocked", "unsupported", "invalid", "failed"]);

// Stable, deterministic, normalized, CLI-safe, unambiguous (spec.md
// "Descriptor, identity, versioning"): lowercase kebab-case, no path
// separators, no leading/trailing/double dashes, no traversal sequences —
// by construction, since only `[a-z0-9-]` is allowed at all.
export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Metadata only (SK-R3) — no semver library, no range/comparison support.
// Three numeric segments, "1.0.0"-shaped, nothing more is asserted.
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// validateDescriptor(mod) -> { ok, errors[] }. Structural validation only —
// no filesystem access, no side effect, safe to call at module-load time
// (the registry does exactly that, for every registered Skill, before any
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
        errors.push(`capabilities.${forbidden} cannot be true this Entrega — Model C (effects) is deferred, ADR-019`);
      }
    }
    const wantsInstructions = capabilities.instructions === true;
    const hasInstructionsMethod = typeof mod.buildInstructions === "function";
    if (wantsInstructions && !hasInstructionsMethod) errors.push("capabilities.instructions is true but buildInstructions() is not a function");
    if (!wantsInstructions && hasInstructionsMethod) errors.push("buildInstructions() is defined but capabilities.instructions is not true");

    const wantsExecution = capabilities.deterministicExecution === true;
    const hasExecuteMethod = typeof mod.execute === "function";
    if (wantsExecution && !hasExecuteMethod) errors.push("capabilities.deterministicExecution is true but execute() is not a function");
    if (!wantsExecution && hasExecuteMethod) errors.push("execute() is defined but capabilities.deterministicExecution is not true");
  }

  if (typeof mod.appliesTo !== "function") errors.push("appliesTo(context) must be a function");
  if (mod.summarize !== undefined && typeof mod.summarize !== "function") errors.push("summarize(result), if present, must be a function");

  return { ok: errors.length === 0, errors };
}
