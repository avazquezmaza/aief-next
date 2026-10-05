// Command handler: doctor (modularization, eighth and final "core" slice).
// Imports statusOverview from ./status.js — the one real cross-group
// dependency confirmed in this whole modularization effort.
import { run, commandExists } from "../process-utils.js";
import { detectProject, recommendSkills } from "../detect.js";
import { listDescriptors } from "../hooks/index.js";
import { assistantIds } from "../core/domain/assistant-resolver.js";
import { skillAssistantIds, inspectSkill, isOlderVersion } from "../core/domain/assistant-skill.js";
import { statusOverview } from "./status.js";
import { exists, section, parseArgs, printNext } from "./shared.js";

function printGraphEngineStatus() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  console.log(hasGeminiKey
    ? "[i] GEMINI_API_KEY set; Graphify tool availability and external-processing authorization are not verified"
    : "[i] GEMINI_API_KEY absent; local static analysis is available (no engine executed)");
}
function printSkills(project) {
  console.log("Recommended Skills:");
  for (const skill of recommendSkills(project)) {
    console.log(`- ${skill.id}: ${skill.description}`);
    for (const reason of skill.because || []) console.log(`    because: ${reason}`);
  }
}
// Called from doctor() only under --verbose (Change 0056): the static,
// built-in Hook Registry, so it stays discoverable without changing
// doctor's default output.
function printHookRegistry() {
  const descriptors = listDescriptors();
  console.log("\nHooks:");
  console.log(`${descriptors.length} Hook(s) registered (built-in, not user-authored — see docs/workflow.md#hooks):`);
  for (const d of descriptors) {
    console.log(`- ${d.id}: fires on ${d.events.join(", ")} — ${d.description}`);
  }
}
// ADR-039: the aief-change skill per assistant. Silent when none is
// installed. An unmodified older AIEF copy is refreshed by `aief skill
// install`; an edited one is never touched, so doctor says when it is behind.
function printSkillInstalls() {
  const lines = [];
  for (const id of skillAssistantIds()) {
    const s = inspectSkill(process.cwd(), id);
    if (s.state === "current") lines.push(`✓ ${s.path} (v${s.currentVersion})`);
    else if (s.state === "shipped-older") lines.push(`! ${s.path} is an older AIEF version — run: aief skill install ${id}`);
    else if (s.state === "modified" && isOlderVersion(s.installedVersion, s.currentVersion)) lines.push(`! ${s.path} was edited and is older than AIEF's (v${s.installedVersion || "?"} < v${s.currentVersion}) — to update, move it aside, run aief skill install ${id}, and re-apply your edits`);
    else if (s.state === "modified") lines.push(`✓ ${s.path} (edited, v${s.installedVersion})`);
  }
  if (!lines.length) return;
  console.log("\naief-change skill:");
  for (const line of lines) console.log(line);
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
// when absent. Levels: required (AIEF needs it), recommended (warns when
// absent; no group uses it since ADR-038), optional (nice to have).
// Optional/recommended absences never fail.
const DOCTOR_GROUPS = [
  { title: "Core (required)", level: "required", tools: [
    { name: "node", version: () => process.version },
    { name: "npm" },
    { name: "git" }
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
export function doctor(args = []) { const parsed = parseArgs("doctor", args); if (!parsed) return; const verbose = Boolean(parsed.verbose); section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); doctorEnvironment(); printGraphEngineStatus(); const project = detectProject(); statusOverview(project, false); printSignals(project); console.log(""); printSkills(project); printSkillInstalls(); if (verbose) printHookRegistry(); printNext(!exists("AGENTS.md") || !exists("changes") ? "aief bootstrap" : "aief analyze"); }
