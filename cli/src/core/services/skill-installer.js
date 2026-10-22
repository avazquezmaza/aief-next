// Installs the `aief-change` skill (ADR-039, Change 0159). Never writes a
// file someone edited: only a missing file, or one byte-identical to a
// version AIEF shipped, is (re)written.
import fs from "node:fs";
import path from "node:path";
import { SKILL_TARGETS, distinctSkillAssistantIds, skillTemplate, inspectSkill } from "../domain/assistant-skill.js";

// Which assistants an install covers: the configured one when it supports
// skills, none when it does not (Cursor), and when nothing is configured one
// per distinct path — Codex and Gemini share `.agents/skills/` (Change 0163).
export function skillTargetsFor(configuredAssistant) {
  if (!configuredAssistant) return distinctSkillAssistantIds();
  return SKILL_TARGETS[configuredAssistant] ? [configuredAssistant] : [];
}

// installSkill(projectDir, assistant) -> { assistant, path, status }
// status: "created" | "updated" | "up-to-date" | "modified"
export function installSkill(projectDir, assistant) {
  const inspection = inspectSkill(projectDir, assistant);
  const base = { assistant, path: inspection.path };
  if (inspection.state === "current") return { ...base, status: "up-to-date" };
  if (inspection.state === "modified") return { ...base, status: "modified" };
  const file = path.join(projectDir, inspection.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, skillTemplate(), "utf8");
  return { ...base, status: inspection.state === "missing" ? "created" : "updated" };
}

export function describeInstall(result) {
  const messages = {
    created: `✓ Installed ${result.path}`,
    updated: `✓ Updated ${result.path} (it was an unmodified older AIEF version)`,
    "up-to-date": `✓ ${result.path} is up to date`,
    modified: `! ${result.path} was edited — left as is (aief doctor reports it if outdated)`
  };
  return messages[result.status];
}
