// Command handler: status (modularization, seventh slice). Self-contained
// in itself; statusOverview() is exported because doctor.js (next slice)
// needs it — the one real cross-group dependency confirmed in this whole
// modularization effort (doctor() calls statusOverview()).
import fs from "node:fs";
import path from "node:path";
import { loadChangeUnified } from "../core/domain/change-loader.js";
import { detectManifestStatusDrift } from "../core/domain/manifest-status-drift.js";
import { detectProject } from "../detect.js";
import { nextAction, explain as explainWorkflow } from "../core/services/workflow-service.js";
import { resolveHarnessConfig, describeHarnessRegistry } from "../core/services/harness-service.js";
import { selectNextChange } from "../core/services/next-change-service.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "../core/domain/definition-enrichment.js";
import {
  section, exists, getChangeDirs, openChangeDirs, invalidManifestChanges, workflowChanges,
  sddChanges, buildProjectGraph, cwd, printNext, resolveExplicitChange, resolveImplicitChange,
  parseArgs, resolveWorkflowFor, manifestStatusDriftChanges
} from "./shared.js";

export function statusOverview(project = detectProject(), showNext = true) {
  section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n");
  const required = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Changes", exists("changes")]];
  for (const [n, ok] of required) console.log(`${ok ? "✓" : "!"} ${n}`);
  const optional = [["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")], ["OpenSpec adapter", exists("adapters/openspec")], ["Specboot adapter", exists("adapters/specboot")]];
  for (const [n, ok] of optional) console.log(ok ? `✓ ${n}` : `· ${n}: not present (optional)`);
  const changes = getChangeDirs();
  console.log(`\nChanges: ${changes.length}`);
  for (const d of changes.slice(-5)) console.log(`- ${path.relative(process.cwd(), d)}`);
  // Open Changes are listed explicitly; with more than one, none is presented
  // as "active" — selection must be explicit (--change).
  const open = openChangeDirs();
  if (open.length) {
    console.log(`\nOpen Changes: ${open.length}`);
    for (const d of open) console.log(`- ${path.basename(d)}`);
    if (open.length > 1) console.log("\nMultiple Changes in progress — commands that act on a Change need an explicit --change <id>. Run `aief status --next` for a recommendation.");
  }
  // Additive only (WF-R15): this section is absent whenever no Change has an
  // invalid manifest.json, which is every Change in this repository today.
  const invalidManifests = invalidManifestChanges();
  if (invalidManifests.length) {
    console.log(`\nChanges with an invalid manifest.json: ${invalidManifests.length}`);
    for (const { dir, change } of invalidManifests) {
      console.log(`- ${path.basename(dir)}:`);
      for (const err of change.manifestError) console.log(`    ${err.field}: ${err.message}`);
    }
  }
  // Additive only (Change 0095): absent whenever no manifest-backed Change's
  // manifest.status disagrees with its own change.md ## Status declaration,
  // which is every Change in this repository today (none carries a
  // manifest.json yet). Detection only — nothing here decides which value is
  // right, and nothing writes to either file (docs/concepts.md's "Current
  // limitation" stands unchanged).
  const driftingManifests = manifestStatusDriftChanges();
  if (driftingManifests.length) {
    console.log(`\nChanges where manifest.status disagrees with change.md: ${driftingManifests.length}`);
    for (const { dir, drift } of driftingManifests) {
      console.log(`- ${path.basename(dir)}: manifest says "${drift.manifestStatus}", change.md says "${drift.changeMdStatus}" — not reconciled automatically, see docs/concepts.md`);
    }
  }
  // Additive only (WF-R15): absent whenever no Change declares a recognized
  // track, which is every Change in this repository today. Distinguishes
  // stage/track/next action/blockers/warnings/pending gates explicitly
  // (commissioning instruction, Etapa E) — never shows a transition as
  // available while a blocking gate remains unsatisfied.
  const workflows = workflowChanges();
  const resolvable = workflows.filter((w) => w.workflow.kind === "resolved");
  const unresolvable = workflows.filter((w) => w.workflow.kind !== "resolved");
  if (resolvable.length) {
    console.log(`\nWorkflow status: ${resolvable.length}`);
    for (const { dir, change, workflow } of resolvable) {
      const { state, gateResults } = workflow;
      console.log(`- ${path.basename(dir)} (track: ${change.track}):`);
      console.log(`    Stage: ${state.stage}`);
      console.log(`    Next: ${state.nextAction === null ? "none (closed)" : state.nextAction}`);
      if (state.blockers.length) {
        console.log("    Blockers:");
        for (const g of state.blockers) console.log(`      - ${g.id}: ${g.status} — ${g.reason}`);
      }
      if (state.warnings.length) {
        console.log("    Warnings:");
        for (const g of state.warnings) console.log(`      - ${g.id}: ${g.status} — ${g.reason}`);
      }
      const pending = gateResults.filter((g) => g.status === "pending" && !state.blockers.includes(g));
      if (pending.length) {
        console.log("    Pending (not yet implemented):");
        for (const g of pending) console.log(`      - ${g.id}: ${g.reason}`);
      }
    }
  }
  if (unresolvable.length) {
    console.log(`\nChanges with an unrecognized or broken workflow track: ${unresolvable.length}`);
    for (const { dir, workflow } of unresolvable) console.log(`- ${path.basename(dir)}: ${workflow.error}`);
  }
  // Additive only (SDD-R34): absent whenever no Change declares manifest.sdd,
  // which is every Change in this repository today.
  const sdd = sddChanges();
  if (sdd.length) {
    console.log(`\nSDD provider status: ${sdd.length}`);
    for (const { dir, change, resolution } of sdd) {
      console.log(`- ${path.basename(dir)}:`);
      if (resolution.error) {
        console.log(`    SDD provider: ${resolution.error}`);
        continue;
      }
      console.log(`    SDD provider: ${resolution.provider.PROVIDER_ID}`);
      const changeResolution = resolution.provider.resolveChange(change, cwd());
      console.log(`    SDD change: ${changeResolution.resolved ? changeResolution.changeId : `unresolved (${changeResolution.reason})`}`);
      const readiness = resolution.provider.validate(change, cwd());
      console.log(`    SDD readiness: ${readiness.status}`);
      if (readiness.blockers.length) {
        console.log("    Blockers:");
        for (const b of readiness.blockers) console.log(`      - ${b}`);
      }
      if (readiness.warnings.length) {
        console.log("    Warnings:");
        for (const w of readiness.warnings) console.log(`      - ${w}`);
      }
    }
  }
  // Additive only (Change 0058/ADR-028): absent whenever no Change declares
  // manifest.dependsOn, which is every Change in this repository today —
  // same conditional discipline sddChanges()/workflowChanges() above use.
  // Only Changes that actually declare a dependency are listed here; the
  // full graph (every Change, with or without dependencies) is
  // `aief status --graph`.
  const graph = buildProjectGraph();
  const declaring = graph.edges.length ? [...new Set(graph.edges.map((e) => e.from))].sort() : [];
  if (declaring.length || graph.issues.length) {
    console.log(`\nDependency Graph: ${declaring.length} Change(s) declare dependencies`);
    for (const id of declaring) {
      const deps = graph.edges.filter((e) => e.from === id).map((e) => e.to);
      console.log(`- ${id} depends on: ${deps.join(", ")}`);
    }
    if (graph.issues.length) {
      console.log("  Issues:");
      for (const issue of graph.issues) console.log(`    - ${issue.type}: ${issue.detail}`);
    }
  }
  console.log(`\nDetected project type: ${project.signals.length ? project.signals.map((s) => s.id).join(", ") : "No strong signals detected."}`);
  if (!showNext) return;
  if (!exists("AGENTS.md") || !exists("changes")) { printNext("aief bootstrap"); return; }
  if (!changes.length) { printNext("aief analyze"); return; }
  if (open.length > 1) { printNext("aief status --next", "aief prompt --change <id>", "aief close --yes --change <id>"); return; }
  // ADR-018 §1 (Change 0046): for the one case where this suggestion and the
  // "Workflow status" block above could actually disagree — a single open,
  // track-carrying Change — both now come from the exact same
  // workflowService.nextAction() call. Every Change without a track (100%
  // of this repository today) falls through to the unchanged legacy line
  // below, so real output is untouched; this branch is additive-and-dormant
  // the same way Entregas 1–3 introduced their own machinery.
  if (open.length === 1) {
    const singleChange = loadChangeUnified(open[0]);
    if (singleChange.manifest && singleChange.track) {
      const action = nextAction(open[0], cwd());
      printNext(action.command || "aief status --next");
      return;
    }
  }
  printNext("aief prompt");
}
// Renders a single gate/blocker/warning line, shared by the --change deep
// view and the --next compact view so the two never format the same data
// two different ways.
function printGateLine(label, g) {
  console.log(`  ${label} ${g.id}: ${g.status} — ${g.reason}`);
}
// gatherOpenChangeFacts() (Change 0059/ADR-029) — the one place real
// Changes' {id, closed, manifestError, workflowBlockers} facts are computed
// for next-change-service.js. Reuses loadChangeUnified()/resolveWorkflowFor()
// exactly as workflowChanges() already does — no second Workflow resolution.
function gatherOpenChangeFacts() {
  return getChangeDirs().map((dir) => {
    const change = loadChangeUnified(dir);
    const id = path.basename(dir);
    let workflowBlockers = [];
    if (!change.manifestError && change.manifest && change.track) {
      const workflow = resolveWorkflowFor(change);
      workflowBlockers = workflow.kind === "resolved"
        ? workflow.state.blockers.map((g) => `${g.id}: ${g.status} — ${g.reason}`)
        : [workflow.error];
    }
    return { id, closed: change.closed, manifestError: Boolean(change.manifestError), workflowBlockers };
  });
}
// aief status --next (no --change), only when 2+ Changes are open (Change
// 0059/ADR-029) — deliberately replaces the prior "select one explicitly"
// error for this one case; see change.md "Deliberate, documented behavior
// change". Read-only: never writes a file, never calls verify/close/prompt.
function statusNextSmart() {
  section("AIEF Status"); console.log("Purpose: recommend the next eligible Change. Writes nothing.\n");
  const graph = buildProjectGraph();
  const result = selectNextChange(gatherOpenChangeFacts(), graph);
  if (result.recommended) {
    const winner = result.evaluations.find((e) => e.id === result.recommended);
    console.log(`Next Change: ${result.recommended}\n`);
    console.log("Ready because:");
    for (const reason of winner.reasons) console.log(`- ${reason}`);
    const otherEligible = result.evaluations.filter((e) => e.eligible && e.id !== result.recommended).map((e) => e.id);
    if (otherEligible.length) {
      console.log(`\nTie-break: ${result.tieBreakRule}`);
      console.log(`Other eligible Change(s): ${otherEligible.join(", ")}`);
    }
    printNext(`aief prompt --change ${result.recommended}`);
    return;
  }
  console.log("No eligible Change found among the open Changes:\n");
  for (const e of result.evaluations) console.log(`- ${e.id}: ${e.reasons.join("; ")}`);
  printNext("aief status (list open Changes)", "aief status --graph");
}
// aief status --change <id>   (deep, read-only inspection of one Change)
// aief status --change <id> --next   (compact Normalized Action view)
// aief status --next   (same compact view, implicit single-open-Change selection;
//   2+ open Changes goes to statusNextSmart() instead — Change 0059/ADR-029)
//
// Entrega 4 (Change 0046, ADR-018 §4, Path B): no new command — this is the
// entire CLI-facing surface Path B introduces, as flags on the existing
// `status` command. Every branch here is read-only (UX-R5/R17): nothing
// below writes a file, and workflowService.* is the only thing consulted
// for workflow/SDD facts (UX-R21/R23) — no gate/track conditional lives in
// this function itself, only rendering of what workflowService already decided.
function statusSingleChange(parsed) {
  if (parsed.next === true && typeof parsed.change !== "string" && openChangeDirs().length > 1) {
    statusNextSmart();
    return;
  }
  section("AIEF Status"); console.log("Purpose: inspect one Change. Writes nothing.\n");
  const changeDir = typeof parsed.change === "string"
    ? resolveExplicitChange(parsed.change)
    : resolveImplicitChange("aief status --next");
  if (!changeDir) { printNext("aief status (list open Changes)"); return; }
  const name = path.relative(process.cwd(), changeDir);
  const change = loadChangeUnified(changeDir);
  console.log(`Change: ${name}`);

  if (change.manifestError) {
    console.log("Manifest: invalid — never falls back to legacy inference (spec.md UX-R24).");
    for (const err of change.manifestError) console.log(`  ${err.field}: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Status: ${change.closed ? "closed" : "open"}`);
  const drift = detectManifestStatusDrift(change);
  if (drift.drift) {
    console.log(`  Warning: manifest.status ("${drift.manifestStatus}") disagrees with change.md's own ## Status ("${drift.changeMdStatus}") — not reconciled automatically, see docs/concepts.md`);
  }

  if (parsed.next) {
    // Compact Normalized Action view — the single computation both this
    // and statusOverview()'s bottom line consult (ADR-018 §1).
    const action = nextAction(changeDir, cwd());
    console.log(`\nNext action:`);
    console.log(`  id: ${action.id}`);
    console.log(`  status: ${action.status}`);
    console.log(`  reason: ${action.reason}`);
    console.log(`  blocking: ${action.blocking}`);
    if (action.evidence?.length) {
      console.log("  evidence:");
      for (const e of action.evidence) console.log(typeof e === "string" ? `    - ${e}` : `    - ${e.id}: ${e.status} — ${e.reason}`);
    }
    console.log(`\nNext:`);
    console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
    if (action.status === "invalid") process.exitCode = 1;
    return;
  }

  // Deep inspection view — track/stage/gates, SDD provider/readiness, then
  // the same derived action's suggested command at the end.
  const { workflow, sdd, action } = explainWorkflow(changeDir, cwd());
  if (workflow && workflow.kind === "resolved") {
    console.log(`\nTrack: ${change.track}`);
    console.log(`Stage: ${workflow.state.stage}`);
    if (workflow.state.blockers.length) {
      console.log("Blockers:");
      for (const g of workflow.state.blockers) printGateLine("-", g);
    }
    if (workflow.state.warnings.length) {
      console.log("Warnings:");
      for (const g of workflow.state.warnings) printGateLine("-", g);
    }
  } else if (workflow) {
    console.log(`\nWorkflow: invalid — ${workflow.error}`);
  } else {
    console.log("\nWorkflow: no track declared (legacy readiness only).");
  }
  if (sdd && !sdd.error) {
    console.log(`\nSDD provider: ${sdd.providerId}`);
    console.log(`SDD change: ${sdd.changeResolution.resolved ? sdd.changeResolution.changeId : `unresolved (${sdd.changeResolution.reason})`}`);
    console.log(`SDD readiness: ${sdd.readiness.status}`);
    if (sdd.readiness.blockers?.length) { console.log("  Blockers:"); for (const b of sdd.readiness.blockers) console.log(`    - ${b}`); }
    if (sdd.readiness.warnings?.length) { console.log("  Warnings:"); for (const w of sdd.readiness.warnings) console.log(`    - ${w}`); }
  } else if (sdd?.error) {
    console.log(`\nSDD provider: ${sdd.error}`);
  }
  printHarnessStatus(changeDir, change);
  printDefinitionReadiness(change);
  console.log(`\nNext:`);
  console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
  if (action.status === "invalid") process.exitCode = 1;
}
// Called from statusSingleChange() (Change 0056/ADR-026) — present only when
// this Change's own manifest declares `harness` (R6): every existing Change
// (none of which does) sees no diff at all here, unlike the Skill/Standard
// sections in doctor which always show something. Reports configuration —
// which Hooks would run, which are disabled, any unknown ids — never a
// fabricated execution-count summary (status never fires a Hook; see
// spec.md "Non-goals" for why that line from the commissioning brief's own
// illustrative example is deliberately not implemented here).
function printHarnessStatus(changeDir, change) {
  if (!change.manifest || typeof change.manifest !== "object" || !change.manifest.harness) return;
  const config = resolveHarnessConfig(change.manifest);
  console.log(`\nHarness: configured (log ${config.log ? "on" : "off"})`);
  for (const eventId of Object.keys(config.disabledByEvent)) {
    const registeredForEvent = describeHarnessRegistry().filter((d) => d.events.includes(eventId)).map((d) => d.id);
    const disabled = new Set(config.disabledByEvent[eventId] || []);
    const activeIds = registeredForEvent.filter((id) => !disabled.has(id));
    console.log(`  ${eventId}: ${activeIds.length} active${disabled.size ? `, ${disabled.size} disabled (${[...disabled].join(", ")})` : ""}`);
  }
  if (config.unknownHookIds.length) {
    console.log("  Unknown Hook id(s) in manifest.harness (never disabled anything real):");
    for (const u of config.unknownHookIds) console.log(`    - "${u.id}" (${u.event})`);
  }
  if (config.log && fs.existsSync(path.join(changeDir, "hooks.md"))) console.log(`  Execution log: ${path.relative(process.cwd(), path.join(changeDir, "hooks.md"))}`);
}
// aief status --change <id> on a Definition Change (Change 0081): a
// deterministic, transparent breakdown of its own change.md — never a fake
// percentage-complete score (§9 of the commissioning brief), only literal
// section counts and explicitly author-marked items. Present only for
// `## Type: Definition` Changes, the same "additive, absent otherwise"
// discipline printHarnessStatus already uses above.
function printDefinitionReadiness(change) {
  if (change.type !== "definition") return;
  const changeMd = change.files ? change.files["change.md"] : "";
  const { known, missing, deferred, ambiguous, decisionRequired, humanApprovalRequired } = analyzeDefinitionSections(changeMd || "");
  console.log(`\nDefinition readiness: ${known.length}/${DEFINITION_SECTIONS.length} sections filled in`);
  if (missing.length) console.log(`  Missing: ${missing.join(", ")}`);
  if (decisionRequired.length) console.log(`  Decision required: ${decisionRequired.length} item(s) — ${decisionRequired.join("; ")}`);
  if (ambiguous.length) console.log(`  Ambiguous: ${ambiguous.length} item(s) — ${ambiguous.join("; ")}`);
  if (humanApprovalRequired.length) console.log(`  Human approval required: ${humanApprovalRequired.length} item(s) — ${humanApprovalRequired.join("; ")}`);
  if (deferred.length) console.log(`  Deferred until implementation: ${deferred.length} item(s) — ${deferred.join("; ")}`);
}
// aief status --graph (Change 0058/ADR-028) — the full dependency graph:
// every Change is a node, whether or not it declares dependencies (the
// overview's own "Dependency Graph:" section only lists Changes that do).
// Read-only, additive, new flag — no existing status output changes.
function statusGraph() {
  section("AIEF Status"); console.log("Purpose: show the full Change dependency graph. Writes nothing.\n");
  const graph = buildProjectGraph();
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);
  for (const e of graph.edges) console.log(`- ${e.from} -> ${e.to}`);
  console.log("");
  if (graph.order) {
    console.log("Topological order (dependencies first):");
    console.log(`  ${graph.order.join(", ") || "(none)"}`);
  } else {
    console.log(`Topological order: unavailable — dependency cycle among: ${graph.cycles.join(", ")}`);
  }
  console.log(graph.issues.length ? "\nIssues:" : "\nIssues: none");
  for (const issue of graph.issues) console.log(`- ${issue.type}: ${issue.detail}`);
}
export function status(args = []) {
  const parsed = parseArgs("status", args);
  if (!parsed) return;
  if (parsed.graph === true) {
    statusGraph();
    return;
  }
  if (typeof parsed.change === "string" || parsed.next === true) {
    statusSingleChange(parsed);
    return;
  }
  statusOverview();
}
