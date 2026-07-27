// Hook Context Builder (AIEF Core 3.0, Entrega 6, Change 0048, ADR-020).
//
// Deliberately NON-FETCHING — the opposite of skill-context.js's own
// buildSkillContext(), which calls workflow-service.js's explain() itself.
// Both `prompt.prepared` and `verify.completed` fire from inside a command
// that already computed `change`/`workflow`/`sdd` (and, for `prompt`,
// possibly a Skill result) for its own rendering; a Hook Context Builder
// that fetched independently would recreate Change 0043's B1 "two callers
// assumed to agree" risk one layer up (HK-R20). This module only normalizes
// and freezes what the caller already computed — it has no `changeDir`/
// `cwd` parameter and cannot fetch anything, structurally.
import { isKnownEvent, phaseOf } from "../domain/hook.js";

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) deepFreeze(value[key], seen);
  return value;
}

// buildEvent(id, operationLabel) -> {id, phase, timestamp, operation}.
// `operation` here is a short label naming which CLI operation fired the
// event (e.g. "prompt", "verify") — distinct from context.operation below,
// which carries that operation's actual {input, result}. `timestamp` is
// informational metadata only — never used to order or decide results
// (HK-R2/R54), so tests may freely omit or fix it.
export function buildEvent(id, operationLabel, timestamp = new Date().toISOString()) {
  if (!isKnownEvent(id)) throw new Error(`Unknown event "${id}" — not part of the closed catalog.`);
  return Object.freeze({ id, phase: phaseOf(id), timestamp, operation: operationLabel });
}

// buildHookContext(event, {project, change, workflow, sdd, skill, operation})
// -> frozen {event, project, change, workflow, sdd, skill, operation}.
// Every field beyond `event` is exactly what the caller passed in — no
// re-derivation, no additional file read, no provider call (HK-R20/R22).
// `skill` defaults to null (no Skill was already run by the calling
// operation); `operation` is the calling operation's own already-computed
// {input, result} (e.g. verify.completed's operation.result is the report
// object; prompt.prepared's operation.result is null, nothing has rendered
// yet).
export function buildHookContext(event, { project, change, workflow, sdd, skill = null, operation }) {
  return deepFreeze({ event, project, change, workflow, sdd, skill, operation });
}
