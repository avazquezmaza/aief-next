// Gate evaluator (AIEF Core 3.0, Entrega 2 — Workflow Engine, Change 0044).
//
// Answers "is this one condition satisfied" for a Change, as a structured
// GateResult: { id, status, blocking, reason, evidence }. Reuses existing
// rules rather than reimplementing them (design.md §5 of Change 0044):
// the "readiness" gate is a thin wrapper over checkChangeReadiness(), the
// exact function `close` already calls. Gates with no evaluator built yet
// (review/approval/security_review) are constants that can never resolve to
// "passed" (WF-R8) — there is no code path here that computes that verdict
// for them, because no function computing it exists yet.
import { loadChange, readChangeFiles, parseChangeStatus } from "../domain/change.js";
import { checkChangeReadiness } from "./change-verifier.js";
import { resolveSddProvider } from "../domain/sdd-provider-resolver.js";

// Every gate id this module knows how to evaluate. A workflow definition
// stage referencing anything outside this set is an AIEF-internal
// definition bug (design.md §10's "AIEF's own bug" row), reported as such,
// not as a problem with the Change or its manifest.
//
// "specification" (Entrega 3, Change 0045) is added here as architectural
// preparation only — design.md §10 of that Change is explicit that this is
// designed, not wired: no shipped workflow definition
// (cli/src/workflows/{lite,standard,governed}.json) references it, so
// evaluateGates() below never reaches specificationGate() for any real
// Change today. It exists so a later, distinct, explicitly-approved Change
// can enable it by editing a workflow definition alone, without touching
// this file again.
export const KNOWN_GATE_IDS = new Set(["readiness", "review", "approval", "security_review", "status_consistency", "identity", "specification"]);

function readinessGate(changeDir) {
  const legacyChange = loadChange(changeDir);
  const problems = checkChangeReadiness(legacyChange);
  return {
    id: "readiness",
    status: problems.length ? "failed" : "passed",
    blocking: true,
    reason: problems.length ? problems.join("; ") : "structural readiness checks passed",
    evidence: []
  };
}

// A gate with no automated evaluator yet. Always "pending", always
// "blocking: true" (it cannot be silently bypassed), and always names why —
// never fabricated as "passed" for lack of an evaluator, evidence, or
// integration (WF-R8, explicitly required by the commissioning instruction).
function notYetBuiltGate(id, note) {
  return {
    id,
    status: "pending",
    blocking: true,
    reason: `No automated evaluator yet${note ? ` (${note})` : ""}. A human must confirm this manually.`,
    evidence: []
  };
}

// WF-R19: change.md's own ## Status disagreeing with manifest.status is
// surfaced, never silently resolved — the manifest still governs (Change
// 0043 R1, unchanged); this gate only adds visibility of the disagreement.
function statusConsistencyGate(change) {
  const { files } = readChangeFiles(change.dir);
  const legacyStatus = parseChangeStatus(files["change.md"]);
  if (!legacyStatus.declarations.length) {
    return { id: "status_consistency", status: "not_applicable", blocking: false, reason: "change.md declares no status of its own", evidence: [] };
  }
  const agrees = legacyStatus.state === change.manifest.status;
  return {
    id: "status_consistency",
    status: agrees ? "passed" : "warning",
    blocking: false,
    reason: agrees
      ? "manifest.status agrees with change.md's own ## Status"
      : `manifest.status ("${change.manifest.status}") disagrees with change.md's ## Status ("${legacyStatus.state}") — the manifest still governs`,
    evidence: []
  };
}

// M1 / WF-R21–R22: directory basename stays the sole canonical identity.
// A manifest's id/slug disagreeing with it is a warning, never an error,
// never auto-corrected.
function identityGate(change) {
  const match = change.basename.match(/^(\d+)-(.+)$/);
  if (!match) {
    return { id: "identity", status: "not_applicable", blocking: false, reason: "directory name is not in <id>-<slug> form", evidence: [] };
  }
  const [, dirId, dirSlug] = match;
  const mismatches = [];
  if (change.manifest.id && String(Number(change.manifest.id)) !== String(Number(dirId)) && change.manifest.id !== dirId) {
    mismatches.push(`id: manifest declares ${JSON.stringify(change.manifest.id)}, directory implies ${JSON.stringify(dirId)}`);
  }
  if (change.manifest.slug && change.manifest.slug !== dirSlug) {
    mismatches.push(`slug: manifest declares ${JSON.stringify(change.manifest.slug)}, directory implies ${JSON.stringify(dirSlug)}`);
  }
  return mismatches.length
    ? { id: "identity", status: "warning", blocking: false, reason: mismatches.join("; "), evidence: [] }
    : { id: "identity", status: "passed", blocking: false, reason: "manifest id/slug agree with the directory name", evidence: [] };
}

// SDD-R22 (Change 0045): provider readiness and gate readiness are two
// distinct, sequential contracts. This function only wraps
// SddProvider.validate()'s own result — "ready" -> "passed", never a
// second, independent judgment. Provider *detection* alone (a provider
// exists, a folder was found) never appears here at all: only
// validate()'s explicit status does, so "a provider exists" can never be
// mistaken for "the gate passed" (Change 0044 review finding R1's exact
// lesson, applied here before this gate is ever wired to a real track).
function specificationGate(change, cwd) {
  const resolution = resolveSddProvider(change, cwd);
  if (resolution.error) {
    return { id: "specification", status: "invalid", blocking: true, reason: resolution.error, evidence: [] };
  }
  const result = resolution.provider.validate(change, cwd);
  const status = result.status === "ready" ? "passed"
    : result.status === "not_ready" ? "failed"
    : result.status; // "invalid" | "unsupported" pass through unchanged
  return {
    id: "specification",
    status,
    blocking: true,
    reason: result.blockers.join("; ") || `SDD provider status: ${result.status}`,
    evidence: []
  };
}

// evaluateGates(change, workflowDefinition, cwd = process.cwd()) -> GateResult[]
// `change` is a loadChangeUnified() result with a valid, track-recognized
// manifest (callers filter for this — see transition-engine.js's caller in
// cli.js). status_consistency/identity are cross-cutting and always
// evaluated for such a Change, independent of whether any stage declares
// them (WF-R19/WF-R22 apply whenever a manifest exists, not only when a
// stage gates on them). `cwd` is used only by the (currently unreachable)
// specification gate — every other gate already carries its own path via
// `change.dir`.
export function evaluateGates(change, workflowDefinition, cwd = process.cwd()) {
  const applicableIds = new Set(workflowDefinition.stages.flatMap((s) => s.gateIds || []));
  const results = [];

  if (applicableIds.has("readiness")) results.push(readinessGate(change.dir));
  if (applicableIds.has("review")) results.push(notYetBuiltGate("review", "planned for Entrega 7"));
  if (applicableIds.has("approval")) results.push(notYetBuiltGate("approval", "Governed track hardening, not yet built"));
  if (applicableIds.has("security_review")) results.push(notYetBuiltGate("security_review", "Governed track hardening, not yet built"));
  if (applicableIds.has("specification")) results.push(specificationGate(change, cwd));

  results.push(statusConsistencyGate(change));
  results.push(identityGate(change));

  for (const id of applicableIds) {
    if (!KNOWN_GATE_IDS.has(id)) {
      // blocking: true — deliberately. A stage referencing a gate id nobody
      // can evaluate is a broken definition, not a "warning": letting the
      // transition engine walk past it (as any non-blocking gate does)
      // would let a Change reach "close" past a stage AIEF itself could
      // never actually check. Found during this Change's own independent
      // review (checklist item 3: "gates que puedan aprobarse por
      // defecto") — the original blocking:false let a broken workflow
      // definition silently resolve as if the stage were satisfied.
      results.push({
        id,
        status: "failed",
        blocking: true,
        reason: `internal error: workflow definition references unknown gate ${JSON.stringify(id)} — this is an AIEF bug, not a problem with this Change`,
        evidence: []
      });
    }
  }

  return results;
}
