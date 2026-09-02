// Command handler: doctor (modularization, eighth and final "core" slice).
// Imports statusOverview from ./status.js — the one real cross-group
// dependency confirmed in this whole modularization effort.
import fs from "node:fs";
import path from "node:path";
import { run, commandExists } from "../process-utils.js";
import { detectProject, recommendSkills } from "../detect.js";
import { resolveSkillRecommendations, resolveStandardRecommendations, resolveAgentRecommendations } from "../core/domain/ai-specs.js";
import { describeHarnessRegistry } from "../core/services/harness-service.js";
import { resolveLoopConfig, countPreviousAttempts } from "../core/services/loop-service.js";
import { loadChangeUnified } from "../core/domain/change-loader.js";
import { assistantIds } from "../core/domain/assistant-resolver.js";
import { statusOverview } from "./status.js";
import { exists, read, section, parseArgs, printNext, openChangeDirs, builtinStandardsList } from "./shared.js";

function printGraphEngineStatus() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  console.log(hasGeminiKey
    ? "[✓] Graphify Semantic Engine available (GEMINI_API_KEY set)"
    : "[✓] AST Engine active (no GEMINI_API_KEY — static, offline, $0)");
}
// analyze/prompt all call recommendSkills() directly and are unaffected by
// options.verbose or by a project's ai-specs/skills/*.md.
function printSkills(project, options = {}) {
  const { verbose = false } = options;
  const { items, warnings, invalidCount } = resolveSkillRecommendations(recommendSkills(project), process.cwd());
  console.log("Recommended Skills:");
  for (const skill of items) {
    const tag = skill.source === "project" ? (skill.overridesBuiltin ? " [project override]" : " [project]") : "";
    console.log(`- ${skill.id}${tag}: ${skill.description}`);
    for (const reason of skill.because) console.log(`    because: ${reason}`);
    if (verbose) {
      console.log(`    source: ${skill.source}`);
      if (skill.path) console.log(`    path: ${path.relative(process.cwd(), skill.path)}`);
      if (skill.overridesBuiltin) console.log(`    overrides: built-in skill "${skill.id}"`);
    }
  }
  if (verbose) {
    if (warnings.length) {
      console.log("\nai-specs warnings:");
      for (const warning of warnings) console.log(`- ${warning}`);
    }
  } else if (invalidCount) {
    console.log(`\n⚠ ${invalidCount} ai-specs resource(s) ignored — see aief doctor --verbose`);
  }
}
// Called from doctor() (Change 0055/ADR-025) — fully conditional on
// aiSpecsStandardsPresent, unlike printSkills(): unlike Skills (Change
// 0054), `aief doctor` never showed anything about standards before this
// Change, so a project with no ai-specs/standards/ must see no new section
// at all, not merely an empty one, to stay byte-identical.
function printStandardsReport(options = {}) {
  const { verbose = false } = options;
  const { items, warnings, invalidCount, aiSpecsStandardsPresent } = resolveStandardRecommendations(builtinStandardsList(), process.cwd());
  if (!aiSpecsStandardsPresent) return;
  console.log("\nStandards:");
  for (const standard of items) {
    const tag = standard.source === "project" ? (standard.overridesBuiltin ? " [project override]" : " [project]") : "";
    console.log(`- ${standard.id}${tag}: ${standard.description}`);
    for (const reason of standard.because) console.log(`    because: ${reason}`);
    if (verbose) {
      console.log(`    source: ${standard.source}`);
      if (standard.path) console.log(`    path: ${path.relative(process.cwd(), standard.path)}`);
      if (standard.overridesBuiltin) console.log(`    overrides: built-in standard "${standard.id}"`);
    }
  }
  if (verbose) {
    if (warnings.length) {
      console.log("\nai-specs warnings (standards):");
      for (const warning of warnings) console.log(`- ${warning}`);
    }
  } else if (invalidCount) {
    console.log(`\n⚠ ${invalidCount} ai-specs standard resource(s) ignored — see aief doctor --verbose`);
  }
}
// Calco de printStandardsReport() para ai-specs/agents/ — mismo criterio de
// ausencia byte-idéntica (`aiSpecsAgentsPresent`), pero sin builtins: AIEF
// no copia profiles/ a proyectos adoptados, así que no hay catálogo propio
// contra el cual resolver — todo lo listado aquí es siempre
// `source: "project"`, nunca hay `overridesBuiltin` que mostrar.
function printAgentsReport(options = {}) {
  const { verbose = false } = options;
  const { items, warnings, invalidCount, aiSpecsAgentsPresent } = resolveAgentRecommendations(process.cwd());
  if (!aiSpecsAgentsPresent) return;
  console.log("\nAgents:");
  for (const agent of items) {
    console.log(`- ${agent.id} [project]: ${agent.description}`);
    for (const reason of agent.because) console.log(`    because: ${reason}`);
    if (verbose) {
      console.log(`    source: ${agent.source}`);
      if (agent.path) console.log(`    path: ${path.relative(process.cwd(), agent.path)}`);
    }
  }
  if (verbose) {
    if (warnings.length) {
      console.log("\nai-specs warnings (agents):");
      for (const warning of warnings) console.log(`- ${warning}`);
    }
  } else if (invalidCount) {
    console.log(`\n⚠ ${invalidCount} ai-specs agent resource(s) ignored — see aief doctor --verbose`);
  }
}
// Called from doctor() only under --verbose (Change 0056/ADR-026) — the
// static, project-wide Hook Registry (hook.js/hooks/index.js, unmodified).
// Unlike printSkills()/printStandardsReport(), there is no non-verbose
// content at all here: `aief doctor`'s default output has never shown
// anything about Hooks, so adding an unconditional section would change
// every project's default output (the same compatibility bar Change 0055
// applied to Standards) — gating the whole section behind --verbose (which
// has no backward-compatibility promise, Change 0054/0055 precedent) keeps
// the default byte-identical while still making the registry discoverable.
function printHarnessRegistry() {
  const descriptors = describeHarnessRegistry();
  console.log("\nHarness:");
  console.log(`${descriptors.length} Hook(s) registered (built-in, not user-authored — see docs/workflow.md#hooks-runtime):`);
  for (const d of descriptors) {
    console.log(`- ${d.id}: fires on ${d.events.join(", ")} — ${d.description}`);
  }
}
// Called from doctor() only under --verbose (Change 0057/ADR-027) —
// read-only scan of open Changes for `loop.verify` configuration. Never
// writes loop.md (only `aief verify --change <id>` does). Absent entirely
// when no open Change configures Loop, so `doctor --verbose` for a project
// that doesn't use Loop is unaffected by this Change (same conditional
// discipline as Change 0056's Harness-in-doctor and Change 0055's
// Standards-in-doctor).
function printLoopRegistry() {
  const entries = [];
  for (const dir of openChangeDirs()) {
    const change = loadChangeUnified(dir);
    const config = resolveLoopConfig(change.manifest);
    if (!config.configured) continue;
    const logPath = path.join(dir, "loop.md");
    const attempt = countPreviousAttempts(fs.existsSync(logPath) ? read(logPath) : "");
    entries.push({ id: change.basename, attempt, maxRetries: config.maxRetries });
  }
  if (!entries.length) return;
  console.log("\nLoop:");
  for (const e of entries) {
    console.log(`- ${e.id}: ${e.attempt} attempt(s) so far, limit ${e.maxRetries} — see aief verify --change ${e.id}`);
  }
}
function printSignals(project) {
  console.log("\nDetected project signals:");
  if (!project.signals.length) { console.log("(none)"); return; }
  for (const signal of project.signals) {
    console.log(`✓ ${signal.id} (${signal.signal}): ${signal.reasons.join("; ")}`);
  }
}
function toolVersion(command, args = ["--version"]) {
  const result = run(command, args);
  if (result.status !== 0) return "";
  // Some tools (java -version) report on stderr with exit code 0.
  const line = `${result.stdout || ""}${result.stderr || ""}`.trim().split("\n")[0];
  const match = line.match(/\d+(\.\d+)+/);
  return match ? match[0] : line;
}
// Environment checks are data: name, how to detect, how to version, and a hint
// when absent. Levels: required (AIEF needs it), recommended (the SDD workflow
// benefits), optional (nice to have). Optional/recommended absences never fail.
const DOCTOR_GROUPS = [
  { title: "Core (required)", level: "required", tools: [
    { name: "node", version: () => process.version },
    { name: "npm" },
    { name: "git" }
  ] },
  { title: "SDD (recommended)", level: "recommended", tools: [
    { name: "openspec", detect: () => commandExists("openspec") || commandExists("opsx"), hint: "install: npm install -g @fission-ai/openspec@latest" },
    { name: "specboot", detect: () => commandExists("specboot") || exists("specboot") || exists(".specboot"), noVersion: true, hint: "see adapters/specboot/README.md" }
  ] },
  { title: "Build tools (optional)", level: "optional", tools: [
    { name: "java", versionArgs: ["-version"] },
    { name: "maven", command: "mvn", noVersion: true },
    { name: "gradle", noVersion: true },
    { name: "docker", noVersion: true }
  ] },
  // Change 0112: derived from assistant-resolver.js's own registry — the
  // single source of truth for known assistants — instead of a second,
  // separately maintained list that a new assistant (Kiro included) would
  // otherwise need this file touched for.
  { title: "Assistants (optional)", level: "optional", tools: assistantIds().map((name) => ({ name, noVersion: true })) }
];
function doctorEnvironment() {
  const missingRequired = [];
  let warnings = 0;
  for (const group of DOCTOR_GROUPS) {
    console.log(`${group.title}:`);
    for (const tool of group.tools) {
      const command = tool.command || tool.name;
      const found = tool.detect ? tool.detect() : commandExists(command);
      if (found) {
        const version = tool.version ? tool.version() : (tool.noVersion ? "" : toolVersion(command, tool.versionArgs));
        console.log(`✓ ${tool.name}${version ? ` ${version}` : ""}`);
      } else if (group.level === "required") { console.log(`✗ ${tool.name}: not found (required)`); missingRequired.push(tool.name); }
      else if (group.level === "recommended") { console.log(`⚠ ${tool.name}: not detected (optional)${tool.hint ? ` — ${tool.hint}` : ""}`); warnings += 1; }
      else console.log(`○ ${tool.name}: not detected (optional)`);
    }
    console.log("");
  }
  console.log("Summary:");
  if (missingRequired.length) { console.log(`Missing required tools: ${missingRequired.join(", ")}. Install them before using AIEF.`); process.exitCode = 1; }
  else if (warnings) console.log("Environment is usable with warnings.");
  else console.log("Environment is ready.");
  return missingRequired;
}
export function doctor(args = []) { const parsed = parseArgs("doctor", args); if (!parsed) return; const verbose = Boolean(parsed.verbose); section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); doctorEnvironment(); printGraphEngineStatus(); const project = detectProject(); statusOverview(project, false); printSignals(project); console.log(""); printSkills(project, { verbose }); printStandardsReport({ verbose }); printAgentsReport({ verbose }); if (verbose) { printHarnessRegistry(); printLoopRegistry(); } printNext(!exists("AGENTS.md") || !exists("changes") ? "aief bootstrap" : "aief analyze"); }
