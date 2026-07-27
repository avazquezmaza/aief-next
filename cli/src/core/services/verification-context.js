// Verification Context (AIEF Core 3.0, Entrega 7, Change 0049, ADR-021).
//
// Deliberately NON-FETCHING for change/workflow/sdd — the same discipline
// hook-context.js's buildHookContext() already established (Entrega 6):
// verify() already calls workflow-service.js's explain() once per invocation
// (for the Post-Verify Hook, since Entrega 6); a Verification Context that
// called explain() again itself would be a SECOND, diverging computation of
// the same facts within the same invocation — exactly the "two callers
// assumed to agree" risk this project has repeatedly guarded against
// (Change 0043's B1, restated for Hooks as HK-R20, restated here as
// VR-R21/R24/R45). The caller supplies {change, workflow, sdd}; this module
// only adds `project`, `requirements`/`tasks` (from `sdd`, unedited), and
// exactly one new, safe file read: verification.md, a fixed filename under
// the already-resolved, already-trusted Change directory (no user-controlled
// path component — VR-R22).
import fs from "node:fs";
import path from "node:path";
import { detectProject } from "../../detect.js";

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) deepFreeze(value[key], seen);
  return value;
}

// readVerificationDoc(changeDir) -> string | null. Missing verification.md
// is null, never an error — most real Changes in this repository predate
// this session's own verification.md convention.
function readVerificationDoc(changeDir) {
  const file = path.join(changeDir, "verification.md");
  if (!fs.existsSync(file)) return null;
  try {
    const content = fs.readFileSync(file, "utf8");
    return content.trim() ? content : null;
  } catch {
    return null;
  }
}

// buildVerificationContext({change, workflow, sdd}, changeDir, cwd, operation)
// -> frozen {project, change, workflow, sdd, requirements, tasks,
//  verificationDoc, operation, projectRoot}. `change`/`workflow`/`sdd` are
// exactly what the caller already computed (via workflow-service.js's own
// explain(), called once by the caller, never by this function) — passed
// through unedited. `requirements`/`tasks` are the SDD Provider's own
// already-parsed arrays (`sdd.requirements`/`.tasks`, Entrega 3, unedited).
// `projectRoot` is `cwd` itself, carried explicitly so evidence resolution
// can safely resolve/contain paths without every caller re-deriving "what
// is the project root" its own way.
export function buildVerificationContext({ change, workflow, sdd }, changeDir, cwd, operation) {
  const requirements = sdd?.requirements || [];
  const tasks = sdd?.tasks || [];
  const verificationDoc = readVerificationDoc(changeDir);
  return deepFreeze({
    project: detectProject(cwd),
    change,
    workflow,
    sdd,
    requirements,
    tasks,
    verificationDoc,
    operation,
    projectRoot: cwd
  });
}
