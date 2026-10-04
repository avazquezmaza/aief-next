// Command handler: status (modularization, seventh slice). Self-contained
// in itself; statusOverview() is exported because doctor.js (next slice)
// needs it — the one real cross-group dependency confirmed in this whole
// modularization effort (doctor() calls statusOverview()).
import path from "node:path";
import { loadChange } from "../core/domain/change.js";
import { detectDuplicateChangeIds } from "../core/domain/change-id-collisions.js";
import { detectProject } from "../detect.js";
import { nextAction, explain } from "../core/services/next-action.js";
import { selectNextChange } from "../core/services/next-change-service.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "../core/domain/definition-enrichment.js";
import {
  section, exists, getChangeDirs, openChangeDirs, buildProjectGraph, printNext,
  resolveExplicitChange, resolveImplicitChange, parseArgs
} from "./shared.js";

export function statusOverview(project = detectProject(), showNext = true) {
  section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n");
  const required = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Changes", exists("changes")]];
  for (const [n, ok] of required) console.log(`${ok ? "✓" : "!"} ${n}`);
  const optional = [["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")]];
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
  // Additive only (Change 0137, external-audit finding C0130-F2): absent
  // whenever no two Change directories share a leading numeric id (detection
  // only, non-blocking). `aief verify` already reports this project-wide;
  // surfacing it here too means a human sees it from `aief status` as well,
  // without having to run verify separately.
  const idCollisions = detectDuplicateChangeIds(changes.map((dir) => path.basename(dir)));
  if (idCollisions.length) {
    console.log(`\nChanges sharing a numeric ID: ${idCollisions.length}`);
    for (const { id, basenames } of idCollisions) {
      console.log(`- ${id}: ${basenames.join(", ")} — a bare "--change ${id}" reference is ambiguous; use the full basename.`);
    }
  }
  // Additive only (Change 0058; ADR-038 moved the source to `## Depends on`):
  // absent whenever no Change declares a dependency. Only Changes that
  // declare one are listed; the full graph is `aief status --graph`.
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
  printNext("aief prompt");
}
// gatherOpenChangeFacts() (Change 0059/ADR-029) — the one place real
// Changes' {id, closed} facts are computed for next-change-service.js.
function gatherOpenChangeFacts() {
  return getChangeDirs().map((dir) => ({ id: path.basename(dir), closed: loadChange(dir).closed }));
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
// `status` command. Every branch here is read-only: nothing below writes a
// file, and next-action.js decides the next step — this function only
// renders it.
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
  const change = loadChange(changeDir);
  console.log(`Change: ${name}`);
  console.log(`Status: ${change.closed ? "closed" : "open"}`);
  if (change.dependsOn.length) console.log(`Depends on: ${change.dependsOn.join(", ")}`);

  if (parsed.next) {
    // Compact Normalized Action view.
    const action = nextAction(changeDir);
    console.log(`\nNext action:`);
    console.log(`  id: ${action.id}`);
    console.log(`  status: ${action.status}`);
    console.log(`  reason: ${action.reason}`);
    console.log(`  blocking: ${action.blocking}`);
    if (action.evidence?.length) {
      console.log("  evidence:");
      for (const e of action.evidence) console.log(`    - ${e}`);
    }
    console.log(`\nNext:`);
    console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
    return;
  }

  // Deep inspection view: readiness problems, Definition readiness, then the
  // same derived action's suggested command at the end.
  const { action } = explain(changeDir);
  if (action.status === "blocked") {
    console.log("\nBlockers:");
    for (const e of action.evidence) console.log(`- ${e}`);
  }
  printDefinitionReadiness(change);
  console.log(`\nNext:`);
  console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
}
// aief status --change <id> on a Definition Change (Change 0081): a
// deterministic, transparent breakdown of its own change.md — never a fake
// percentage-complete score (§9 of the commissioning brief), only literal
// section counts and explicitly author-marked items. Present only for
// `## Type: Definition` Changes (additive, absent otherwise).
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
