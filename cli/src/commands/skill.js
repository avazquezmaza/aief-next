// Command handler: skill (ADR-039, Change 0159). `aief skill install
// [assistant]` installs or refreshes the aief-change skill, the same way
// `aief bootstrap` does. Never overwrites a file someone edited.
import { hasAssistant, readProjectAssistantConfig } from "../core/domain/assistant-resolver.js";
import { skillAssistantIds } from "../core/domain/assistant-skill.js";
import { skillTargetsFor, installSkill, describeInstall } from "../core/services/skill-installer.js";
import { section, parseArgs, printNext } from "./shared.js";

// The assistant an install is for: the explicit one, else
// knowledge/assistant.json, else none (= every skill-capable assistant).
// Returns { assistant } or { error }.
export function configuredAssistant(explicit, projectDir = process.cwd()) {
  if (explicit !== undefined) {
    return hasAssistant(explicit) ? { assistant: explicit } : { error: `unknown assistant "${explicit}"` };
  }
  const config = readProjectAssistantConfig(projectDir);
  if (config && config.error) return { error: config.error };
  return { assistant: config ? config.assistantId : null };
}

// Installs for the resolved targets and prints one line each; returns the
// results so bootstrap can list created files as adoption artifacts.
export function installSkills(assistant, projectDir = process.cwd()) {
  const targets = skillTargetsFor(assistant);
  if (!targets.length) {
    console.log(`○ ${assistant} has no skill mechanism — aief prompt carries the Change procedure instead`);
    return [];
  }
  return targets.map((id) => {
    const result = installSkill(projectDir, id);
    console.log(describeInstall(result));
    return result;
  });
}

export function skill(args) {
  const [subcommand, ...rest] = args;
  if (subcommand !== "install") {
    console.error(`Usage: aief skill install [${skillAssistantIds().join("|")}]`);
    process.exitCode = 1;
    return;
  }
  const parsed = parseArgs("skill", rest);
  if (!parsed) return;
  section("AIEF Skill");
  console.log("Purpose: install or refresh the aief-change skill. Never overwrites an edited copy.\n");
  const resolved = configuredAssistant(parsed._[0]);
  if (resolved.error) { console.error(resolved.error); process.exitCode = 1; return; }
  installSkills(resolved.assistant);
  printNext("aief doctor");
}
