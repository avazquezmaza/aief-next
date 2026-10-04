// Skill Context Builder (AIEF Core 3.0, Entrega 5, Change 0047, ADR-019;
// `definitionEnrichment` added by Change 0090).
//
// The ONLY place a Skill Context is assembled. Calls next-action.js's
// explain() exactly once.
// Adds two fields explain() does not already provide: `project`
// (detectProject()'s existing output — SK-R13), the same input
// recommendSkills() already consumes (ADR-010's Skill Catalog, untouched);
// and `definitionEnrichment` (Change 0090) — a Definition Change's own
// Known/Missing/marker classification, reusing the existing, already-tested
// analyzeDefinitionSections() (Change 0081) rather than a second parser.
//
// Read-only, idempotent (SK-R14): same Change, same inputs, same context,
// every call. The returned context is deep-frozen before being handed to any
// Skill, so no Skill — malicious or merely buggy — can mutate what a later
// Skill in the same invocation, or a later render step, reads (SK-R18 names
// the "share one context" requirement; freezing is what makes "share"
// actually safe to do).
import { explain } from "./next-action.js";
import { detectProject } from "../../detect.js";
import { analyzeDefinitionSections } from "../domain/definition-enrichment.js";

// resolveDefinitionEnrichment(change) -> analyzeDefinitionSections() result,
// or null. Zero new I/O (Change 0090, spec.md R2): `change.files["change.md"]`
// is already read by loadChange() as part of explain()'s own `change`.
// `null` for every non-Definition Change (never a fabricated empty result).
function resolveDefinitionEnrichment(change) {
  if (!change || change.type !== "definition") return null;
  const changeMd = change.files && typeof change.files["change.md"] === "string" ? change.files["change.md"] : "";
  return analyzeDefinitionSections(changeMd);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) deepFreeze(value[key], seen);
  return value;
}

// buildSkillContext(changeDir, cwd) -> frozen
// { project, change, action, definitionEnrichment }.
// `definitionEnrichment` is `null` unless `change.type === "definition"`
// (Change 0090) — see resolveDefinitionEnrichment() above.
export function buildSkillContext(changeDir, cwd) {
  const inspection = explain(changeDir);
  const project = detectProject(cwd);
  return deepFreeze({
    project,
    change: inspection.change,
    action: inspection.action,
    definitionEnrichment: resolveDefinitionEnrichment(inspection.change)
  });
}
