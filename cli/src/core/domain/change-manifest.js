// Optional per-Change manifest.json (AIEF Core 3.0, Entrega 1 — Change Foundation).
// A Change with no manifest.json is entirely unaffected by this module: see
// change-loader.js for the precedence rule (manifest present -> authoritative,
// no merge with change.md; manifest absent -> legacy inference, unchanged).
//
// Format decision (design.md §5): JSON, not YAML. The repository has zero
// runtime dependencies today; skills-catalog.json is the existing precedent
// for structured non-Markdown data read with plain JSON.parse. YAML support
// can be layered on top later without changing this module's callers, if a
// real need for YAML's expressiveness (e.g. hand-authored comments) appears.
//
// Schema strategy (design.md §6): no standalone schemas/*.schema.json file
// yet — a hand-maintained schema file next to a hand-rolled validator that
// does not consume it would be two definitions of the same shape with no
// mechanism keeping them in sync. This module is the single source of truth
// for the Entrega 1 field set (spec.md R3).

export const MANIFEST_SCHEMA_VERSION = "aief.change/v1";
export const MANIFEST_STATUS_VALUES = new Set(["open", "closed"]);
// SDD provider ids known to the registry (cli/src/sdd-providers/index.js).
// Duplicated as a constant here (not imported) to keep change-manifest.js —
// a pure domain/validation module — free of a dependency on the provider
// layer; both lists are small and change together deliberately, not
// accidentally (Entrega 3, Change 0045, design.md §12).
export const SDD_PROVIDER_VALUES = new Set(["local", "openspec"]);
// Harness event ids known to the closed catalog (cli/src/core/domain/hook.js's
// EVENT_CATALOG). Duplicated as a constant here (not imported), same
// reasoning as SDD_PROVIDER_VALUES above — the catalog is documented there
// as closed-by-design, so this duplication is a small, deliberate,
// rarely-changing decision, not registry coupling (Change 0056, ADR-026).
export const HARNESS_EVENT_VALUES = new Set(["prompt.prepared", "verify.completed"]);

// parseManifest(raw) -> { ok: true, value } | { ok: false, error }
// Never throws: a malformed manifest.json is a reportable Change-level
// problem (spec.md R5), not a process crash.
export function parseManifest(raw) {
  try {
    const value = JSON.parse(raw);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "manifest.json must contain a JSON object." };
    }
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: `manifest.json is not valid JSON: ${err.message}` };
  }
}

// validateManifest(value) -> { valid: boolean, errors: [{ field, message }] }
// Checks exactly the Entrega 1 required field set (spec.md R3). Optional
// fields (track, sdd, context, evidence, next_action, gates, risks) are
// accepted and passed through unvalidated — later Entregas (workflow engine,
// SDD provider) own their own validation when they start interpreting them.
export function validateManifest(value) {
  const errors = [];
  const require = (field, message) => errors.push({ field, message });

  if (value.schema !== MANIFEST_SCHEMA_VERSION) {
    require("schema", `must be "${MANIFEST_SCHEMA_VERSION}", got ${JSON.stringify(value.schema)}`);
  }
  if (typeof value.id !== "string" || !value.id.trim()) {
    require("id", "is required and must be a non-empty string");
  }
  if (typeof value.slug !== "string" || !value.slug.trim()) {
    require("slug", "is required and must be a non-empty string");
  }
  if (typeof value.title !== "string" || !value.title.trim()) {
    require("title", "is required and must be a non-empty string");
  }
  if (!MANIFEST_STATUS_VALUES.has(value.status)) {
    require("status", `must be "open" or "closed", got ${JSON.stringify(value.status)}`);
  }

  // sdd is optional (Entrega 3, Change 0045, spec.md SDD-R26): its absence
  // never produces an error, and this block never runs for the vast
  // majority of manifests (Entregas 1/2 era) that don't declare it. When
  // present, only structural shape is checked here — provider availability/
  // Change resolution is a runtime concern (sdd-provider-resolver.js), not
  // a structural validation one.
  if (value.sdd !== undefined) {
    if (value.sdd === null || typeof value.sdd !== "object" || Array.isArray(value.sdd)) {
      require("sdd", "must be an object when present");
    } else {
      if (value.sdd.provider !== undefined && !SDD_PROVIDER_VALUES.has(value.sdd.provider)) {
        require("sdd.provider", `must be one of ${[...SDD_PROVIDER_VALUES].join(", ")}, got ${JSON.stringify(value.sdd.provider)}`);
      }
      if (value.sdd.change_id !== undefined && (typeof value.sdd.change_id !== "string" || !value.sdd.change_id.trim())) {
        require("sdd.change_id", "must be a non-empty string when present");
      }
    }
  }

  // harness is optional (Change 0056, ADR-026): its absence never produces
  // an error, and this block never runs for any Change that predates it.
  // Same discipline as sdd above — shape only, checked against a small,
  // deliberately duplicated HARNESS_EVENT_VALUES (never an import of the
  // Hook Registry); real Hook-id existence is a runtime concern
  // (harness-service.js), not a structural validation one.
  if (value.harness !== undefined) {
    if (value.harness === null || typeof value.harness !== "object" || Array.isArray(value.harness)) {
      require("harness", "must be an object when present");
    } else {
      if (value.harness.log !== undefined && typeof value.harness.log !== "boolean") {
        require("harness.log", "must be a boolean when present");
      }
      if (value.harness.hooks !== undefined) {
        if (value.harness.hooks === null || typeof value.harness.hooks !== "object" || Array.isArray(value.harness.hooks)) {
          require("harness.hooks", "must be an object when present");
        } else {
          for (const eventId of Object.keys(value.harness.hooks)) {
            if (!HARNESS_EVENT_VALUES.has(eventId)) {
              require(`harness.hooks.${eventId}`, `is not a known Harness event — known: ${[...HARNESS_EVENT_VALUES].join(", ")}`);
              continue;
            }
            const eventConfig = value.harness.hooks[eventId];
            if (eventConfig === null || typeof eventConfig !== "object" || Array.isArray(eventConfig)) {
              require(`harness.hooks.${eventId}`, "must be an object when present");
              continue;
            }
            if (eventConfig.disabled !== undefined) {
              const isValidList = Array.isArray(eventConfig.disabled) && eventConfig.disabled.every((id) => typeof id === "string" && id.trim());
              if (!isValidList) require(`harness.hooks.${eventId}.disabled`, "must be an array of non-empty strings when present");
            }
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
