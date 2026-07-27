// Verification Rule contract — evidence vocabulary, descriptor shape,
// capability vocabulary, per-rule and aggregate status vocabularies, and
// structural validation (AIEF Core 3.0, Entrega 7, Change 0049, ADR-021).
//
// This module owns the *shape*, not the registry (cli/src/verification-rules/
// index.js) and not orchestration (core/services/verification-service.js) —
// same three-layer split ADR-016/017/019/020 already used.
//
// No class — every Verification Rule is a plain module export, mirroring
// requirement-providers/*.js, sdd-providers/*.js, skills/*.js, hooks/*.js.
// `id`/`version` reuse Skills'/Hooks' own ID_PATTERN/VERSION_PATTERN (ADR-019)
// rather than reinventing them a third time.
import { ID_PATTERN, VERSION_PATTERN } from "./skill.js";

export { ID_PATTERN, VERSION_PATTERN };

// SK-R12/design.md §7: "requirement" (evaluated once per requirement) is the
// only scope this Entrega ships; "change" (evaluated once per Change) is a
// defined, unused vocabulary slot for a future rule that doesn't need a
// specific requirement.
export const SCOPE_VALUES = Object.freeze(["requirement", "change"]);

// The full capability vocabulary. Absent === false (VR-R13) — a rule's
// declared capabilities are never inferred from which methods exist.
export const KNOWN_CAPABILITIES = Object.freeze([
  "readContext",
  "readArtifacts",
  "readEvidence",
  "executeCommands",
  "writeFiles",
  "network",
  "assistantRequired"
]);

// Model C (ADR-021): these four cannot be declared `true` by any rule this
// Entrega — registration itself fails, identical mechanism to Skills'/
// Hooks' own FORBIDDEN_CAPABILITIES. `assistantRequired` is included here
// (VR-R15) — Requirement Verification is AI-free by design, not merely by
// convention.
export const FORBIDDEN_CAPABILITIES = Object.freeze(["writeFiles", "executeCommands", "network", "assistantRequired"]);

// Six named evidence types (design.md §2). Only the first two are
// SUPPORTED — deterministically resolvable from data this repository
// already, verifiably, produces. `test`/`manual_attestation` are DEFINED
// but can never alone produce a `passed` rule result. `command_result`/
// `external_reference` are REJECTED — using either as declared evidence
// yields `unsupported`, never a fabricated result.
export const EVIDENCE_TYPES = Object.freeze(["artifact_state", "file_assertion", "test", "manual_attestation", "command_result", "external_reference"]);
export const SUPPORTED_EVIDENCE_TYPES = Object.freeze(["artifact_state", "file_assertion"]);
export const INSUFFICIENT_ALONE_EVIDENCE_TYPES = Object.freeze(["test", "manual_attestation"]);
export const REJECTED_EVIDENCE_TYPES = Object.freeze(["command_result", "external_reference"]);

// Seven distinguishable per-rule outcomes (VR-R27) — `failed` is a genuine
// new concept relative to Skills'/Hooks' own vocabularies: the first real
// pass/fail *verdict* this system renders about anything, not merely an
// observational status. `error` (engine fault) stays structurally distinct
// from `invalid` (bad input) and `failed` (a correctly-evaluated,
// insufficient/contradictory verdict) — three different kinds of
// "not passed," never merged (VR-R28).
export const STATUS_VALUES = Object.freeze(["passed", "failed", "not_applicable", "blocked", "unsupported", "invalid", "error"]);

// VR-R29: the only three statuses a rule's own appliesTo() may select for
// its non-applicable outcome — applied PROACTIVELY here, the same fix
// Entrega 5's review found reactively for Skills (SK-R20-equivalent) and
// Entrega 6 applied proactively for Hooks (HK-R31).
export const APPLICABILITY_STATUSES = Object.freeze(["not_applicable", "blocked", "unsupported"]);

// Five aggregate statuses (VR-R34), checked in this exact precedence order
// by the Verification Service — never a boolean reduction.
export const AGGREGATE_STATUS_VALUES = Object.freeze(["ERROR", "INVALID", "FAIL", "INCOMPLETE", "PASS"]);
export const AGGREGATE_PRECEDENCE = Object.freeze(["ERROR", "INVALID", "FAIL", "INCOMPLETE", "PASS"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// validateDescriptor(mod) -> { ok, errors[] }. Structural validation only —
// no filesystem access, no side effect, safe to call at module-load time
// (the registry does exactly that, for every registered rule, before any
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

  if (!SCOPE_VALUES.includes(mod.scope)) {
    errors.push(`scope must be one of ${SCOPE_VALUES.join(", ")} (got ${JSON.stringify(mod.scope)})`);
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
        errors.push(`capabilities.${forbidden} cannot be true this Entrega — Model C (effects/assistance) is deferred, ADR-021`);
      }
    }
  }

  if (Array.isArray(mod.evidenceTypes)) {
    for (const t of mod.evidenceTypes) {
      if (!EVIDENCE_TYPES.includes(t)) errors.push(`evidenceTypes declares an unknown evidence type: ${JSON.stringify(t)}`);
      else if (REJECTED_EVIDENCE_TYPES.includes(t)) errors.push(`evidenceTypes declares a rejected evidence type: ${JSON.stringify(t)} (command_result/external_reference require execution/network, ADR-021)`);
    }
  } else if (mod.evidenceTypes !== undefined) {
    errors.push("evidenceTypes, if present, must be an array");
  }

  if (typeof mod.appliesTo !== "function") errors.push("appliesTo(context, requirement) must be a function");
  if (typeof mod.evaluate !== "function") errors.push("evaluate(context, requirement, evidence) must be a function");

  return { ok: errors.length === 0, errors };
}
