// Declarative workflow definitions (AIEF Core 3.0, Entrega 2 — Workflow
// Engine, Change 0044). One JSON file per track, read the same way
// cli/src/skills-catalog.json already is (plain JSON.parse, no library —
// Entrega 1's JSON-over-YAML precedent, design.md §5 of Change 0043).
//
// This module validates AIEF's own shipped files (cli/src/workflows/*.json),
// not user content — a validation failure here is an AIEF bug, never a
// message directed at whoever authored a manifest.json (design.md §10 of
// Change 0044: the two error categories are kept structurally distinct).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOWS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "workflows");

export const WORKFLOW_SCHEMA_VERSION = "aief.workflow/v1";
export const KNOWN_TRACKS = ["lite", "standard", "governed"];

// parseWorkflowDefinition(raw) -> { ok: true, value } | { ok: false, error }
export function parseWorkflowDefinition(raw) {
  try {
    const value = JSON.parse(raw);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "workflow definition must contain a JSON object." };
    }
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: `workflow definition is not valid JSON: ${err.message}` };
  }
}

// validateWorkflowDefinition(value) -> { valid, errors: [{ field, message }] }
// Rejects: unknown/missing schema, missing/mismatched track, missing or
// malformed stages, malformed gate ids, transitions referencing undeclared
// stages — every case the commissioning request names explicitly.
export function validateWorkflowDefinition(value, expectedTrack) {
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  if (value.schema !== WORKFLOW_SCHEMA_VERSION) {
    fail("schema", `must be "${WORKFLOW_SCHEMA_VERSION}", got ${JSON.stringify(value.schema)}`);
  }
  if (!KNOWN_TRACKS.includes(value.track)) {
    fail("track", `must be one of ${KNOWN_TRACKS.join(", ")}, got ${JSON.stringify(value.track)}`);
  } else if (expectedTrack && value.track !== expectedTrack) {
    fail("track", `file for track "${expectedTrack}" declares track "${value.track}" — filename and content must agree`);
  }

  const stageIds = new Set();
  if (!Array.isArray(value.stages) || value.stages.length === 0) {
    fail("stages", "is required and must be a non-empty array");
  } else {
    value.stages.forEach((stage, i) => {
      if (!stage || typeof stage !== "object" || typeof stage.id !== "string" || !stage.id.trim()) {
        fail(`stages[${i}].id`, "is required and must be a non-empty string");
        return;
      }
      if (stageIds.has(stage.id)) {
        fail(`stages[${i}].id`, `duplicate stage id "${stage.id}" — stage ids must be unique`);
      }
      stageIds.add(stage.id);
      if (stage.gateIds !== undefined) {
        if (!Array.isArray(stage.gateIds) || stage.gateIds.some((g) => typeof g !== "string" || !g.trim())) {
          fail(`stages[${i}].gateIds`, "must be an array of non-empty strings when present");
        }
      }
    });
  }

  if (!Array.isArray(value.transitions) || value.transitions.length === 0) {
    fail("transitions", "is required and must be a non-empty array");
  } else {
    value.transitions.forEach((t, i) => {
      if (!t || typeof t !== "object") {
        fail(`transitions[${i}]`, "must be an object with \"from\" and \"to\" stage ids");
        return;
      }
      if (typeof t.from !== "string" || !stageIds.has(t.from)) {
        fail(`transitions[${i}].from`, `references an undeclared stage: ${JSON.stringify(t.from)}`);
      }
      if (typeof t.to !== "string" || !stageIds.has(t.to)) {
        fail(`transitions[${i}].to`, `references an undeclared stage: ${JSON.stringify(t.to)}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// loadWorkflowDefinition(track) -> { ok: true, value } | { ok: false, error }
// `error` here is always an AIEF-internal-bug message (design.md §10's
// "AIEF's own bug" row) — a user never sees this unless a shipped workflow
// definition itself is broken, which "internal error" already signals.
export function loadWorkflowDefinition(track) {
  if (!KNOWN_TRACKS.includes(track)) {
    return { ok: false, error: `unknown track ${JSON.stringify(track)} — expected one of ${KNOWN_TRACKS.join(", ")}` };
  }
  const filePath = path.join(WORKFLOWS_DIR, `${track}.json`);
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return { ok: false, error: `internal error: could not read workflow definition ${filePath}: ${err.message}` };
  }
  const parsed = parseWorkflowDefinition(raw);
  if (!parsed.ok) {
    return { ok: false, error: `internal error: ${filePath}: ${parsed.error}` };
  }
  const { valid, errors } = validateWorkflowDefinition(parsed.value, track);
  if (!valid) {
    return { ok: false, error: `internal error: ${filePath} is structurally invalid: ${errors.map((e) => `${e.field}: ${e.message}`).join("; ")}` };
  }
  return { ok: true, value: parsed.value };
}
