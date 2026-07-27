// User Workflow application service (AIEF Core 3.0, Entrega 4, Change 0046,
// ADR-018). Plain functions, no class — same reasoning ADR-017 already
// established for SddProvider: zero classes exist anywhere in cli/src/.
//
// This is the ONE place "what's next" is computed. Before this module,
// status() computed it two different, disagreeing ways in the same function
// (see design.md §1) — every caller now asks this module instead, so there
// is exactly one algorithm to get right, not two that are merely supposed
// to agree.
//
// Every function here is read-only: none writes a file, changes `track`,
// approves a gate, or executes a transition. `canTransition()` only answers
// whether a transition WOULD be legal; nothing in this module performs one.
import { loadChangeUnified } from "../domain/change-loader.js";
import { loadChange } from "../domain/change.js";
import { loadWorkflowDefinition, KNOWN_TRACKS } from "../domain/workflow-definition.js";
import { evaluateGates } from "./gate-evaluator.js";
import { resolveState, isTransitionLegal } from "./transition-engine.js";
import { checkChangeReadiness } from "./change-verifier.js";
import { resolveSddProvider } from "../domain/sdd-provider-resolver.js";

function resolveWorkflow(change, cwd) {
  if (!change.manifest || !change.track) return null;
  if (!KNOWN_TRACKS.includes(change.track)) {
    return { kind: "unknown_track", error: `unknown track ${JSON.stringify(change.track)} — expected one of ${KNOWN_TRACKS.join(", ")}` };
  }
  const definition = loadWorkflowDefinition(change.track);
  if (!definition.ok) return { kind: "internal_error", error: definition.error };
  const gateResults = evaluateGates(change, definition.value, cwd);
  const state = resolveState(change, definition.value, gateResults);
  return { kind: "resolved", definition: definition.value, gateResults, state };
}

function resolveSdd(change, cwd) {
  if (!change.manifest?.sdd) return null;
  const resolution = resolveSddProvider(change, cwd);
  if (resolution.error) return { error: resolution.error };
  const changeResolution = resolution.provider.resolveChange(change, cwd);
  const readiness = resolution.provider.validate(change, cwd);
  // Tasks/requirements included here — via the provider's own existing
  // getTasks()/getRequirements() (Entrega 3, unchanged) — so a caller like
  // `prompt`'s "work" extension never needs to call resolveSddProvider() or
  // touch a provider module directly (UX-R23: the CLI layer knows only this
  // normalized shape, never OpenSpec paths or the local format).
  const tasks = changeResolution.resolved || resolution.provider.PROVIDER_ID === "local" ? resolution.provider.getTasks(change, cwd) : [];
  const requirements = changeResolution.resolved || resolution.provider.PROVIDER_ID === "local" ? resolution.provider.getRequirements(change, cwd) : [];
  return { providerId: resolution.provider.PROVIDER_ID, changeResolution, readiness, tasks, requirements };
}

// inspect(changeDir, cwd) -> { change, workflow, sdd }
// `workflow` is null when the Change has no track (legacy, or a manifest
// without one — Entrega-1/2-era); `sdd` is null when the manifest has no
// `sdd` section. Neither is ever fabricated for a Change that didn't ask
// for it (WF-R17/R18, SDD-R34's discipline, restated here).
export function inspect(changeDir, cwd) {
  const change = loadChangeUnified(changeDir);
  return { change, workflow: resolveWorkflow(change, cwd), sdd: resolveSdd(change, cwd) };
}

function actionResult({ id, status, reason, blocking, command, evidence }) {
  return { id, status, reason, blocking, command, requiresConfirmation: false, evidence };
}

// deriveNextAction(inspection) -> Normalized Action (design.md §5)
// A pure function of inspect()'s output — kept separate from nextAction()
// itself so every branch is unit-testable against a hand-built inspection,
// including outcomes (like an SDD "unsupported" capability) that no real
// provider in this Entrega happens to produce yet, but the contract must
// still represent honestly.
export function deriveNextAction(inspection) {
  const { change, workflow, sdd } = inspection;
  const basename = change.basename;

  if (change.manifestError) {
    return actionResult({
      id: "manifest",
      status: "invalid",
      reason: change.manifestError.map((e) => `${e.field}: ${e.message}`).join("; "),
      blocking: true,
      command: null,
      evidence: change.manifestError
    });
  }
  // Covers every path to "closed" — legacy `## Status: Closed`,
  // `manifest.status: "closed"`, or (once a track exists) resolveState()'s
  // own terminal stage — checked once, here, so the branch below for a
  // resolved workflow never needs to re-check it (it would be unreachable).
  if (change.closed) {
    return actionResult({ id: "closed", status: "complete", reason: "Change is closed.", blocking: false, command: null, evidence: [] });
  }
  if (sdd?.error) {
    return actionResult({ id: "sdd", status: "invalid", reason: sdd.error, blocking: true, command: null, evidence: [] });
  }
  // Found via live reproduction while verifying Change 0045's path-traversal
  // fix still holds through this Entrega's new surface: `sdd.readiness`
  // reaching `"invalid"` (e.g. a rejected sdd.change_id traversal, or any
  // other artifact-resolution error) was not checked here at all — for a
  // Change with no `track`, deriveNextAction() fell straight through to the
  // legacy readiness branch below, silently discarding a real SDD error the
  // provider layer had already correctly detected. Fixed before this was
  // ever exercised by a real command.
  if (sdd?.readiness?.status === "invalid") {
    return actionResult({
      id: "sdd",
      status: "invalid",
      reason: sdd.readiness.blockers?.join("; ") || "SDD provider reported an invalid result",
      blocking: true,
      command: null,
      evidence: sdd.readiness.blockers || []
    });
  }
  if (sdd?.readiness?.status === "unsupported") {
    return actionResult({
      id: "sdd",
      status: "unsupported",
      reason: sdd.readiness.blockers?.join("; ") || "SDD provider capability unsupported",
      blocking: true,
      command: null,
      evidence: sdd.readiness.blockers || []
    });
  }
  if (!change.manifest || !change.track) {
    // No track: the only honest answer is legacy structural readiness —
    // the same rule `close` already gates on, never a fabricated Workflow
    // Engine opinion for a Change that never opted into one (UX-R9).
    const legacy = loadChange(change.dir);
    const problems = checkChangeReadiness(legacy);
    return problems.length
      ? actionResult({ id: "close", status: "blocked", reason: problems.join("; "), blocking: true, command: `aief prompt --change ${basename}`, evidence: problems })
      : actionResult({ id: "close", status: "available", reason: "Structural readiness checks passed.", blocking: false, command: `aief close --yes --change ${basename}`, evidence: [] });
  }
  if (!workflow || workflow.kind !== "resolved") {
    return actionResult({ id: "workflow", status: "invalid", reason: workflow?.error || "workflow could not be resolved", blocking: true, command: null, evidence: [] });
  }
  const { state } = workflow;
  if (state.stage === "close") {
    return actionResult({ id: "close", status: "available", reason: "All gates passed.", blocking: false, command: `aief close --yes --change ${basename}`, evidence: state.warnings });
  }
  const pendingOnly = state.blockers.length > 0 && state.blockers.every((g) => g.status === "pending");
  return actionResult({
    id: state.stage,
    status: pendingOnly ? "pending" : "blocked",
    reason: state.nextAction,
    blocking: true,
    command: `aief status --change ${basename} --next`,
    evidence: state.blockers
  });
}

// nextAction(changeDir, cwd) -> Normalized Action. Thin IO wrapper around
// inspect() + deriveNextAction() — the only reason this exists separately
// from deriveNextAction() is so callers that already have an inspection
// (e.g. explain(), or a future caller inspecting several Changes at once)
// never re-read the filesystem to get the same answer twice.
export function nextAction(changeDir, cwd) {
  return deriveNextAction(inspect(changeDir, cwd));
}

// canTransition(changeDir, cwd, targetStage) -> { legal, reason?, blockers? }
// Read-only: answers "would this be legal," performs nothing. Gives
// isTransitionLegal() (Change 0044) its first production call site — it
// was, until this Entrega, only ever exercised by its own unit tests.
//
// Takes an explicit `fromStage`, not `workflow.state.stage` implicitly.
// Design correction made while writing this module's own tests: resolveState()
// only ever reports a stage as "current" when that stage's own gates are
// NOT yet satisfied (it walks straight past any stage whose gates pass) —
// so a caller that defaulted `fromStage` to `state.stage` could never
// observe `legal: true` for a real Change: by the time you're "at" a stage,
// leaving it is definitionally still blocked. Requiring the caller to name
// both stages makes canTransition() a general, reusable "what if" question
// (e.g. "was leaving verify legal, now that readiness has passed" while
// currently blocked at a later stage) instead of a question that can only
// ever answer `false`.
export function canTransition(changeDir, cwd, fromStage, toStage) {
  const { workflow } = inspect(changeDir, cwd);
  if (!workflow || workflow.kind !== "resolved") {
    return { legal: false, reason: "no resolvable workflow for this Change" };
  }
  return isTransitionLegal(workflow.definition, workflow.gateResults, fromStage, toStage);
}

// explain(changeDir, cwd) -> { change, workflow, sdd, action }
// The full picture in one call — inspect()'s data plus the derived action —
// for a renderer that wants everything without composing the pieces itself.
export function explain(changeDir, cwd) {
  const inspection = inspect(changeDir, cwd);
  return { ...inspection, action: deriveNextAction(inspection) };
}
