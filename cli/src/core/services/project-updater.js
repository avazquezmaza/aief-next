// `aief update` (Change 0160): refreshes every file AIEF ships into a
// project — AGENTS.md and any installed aief-change skill — when, and only
// when, it is an unmodified older AIEF version. Never creates a file that
// is missing (bootstrap and `aief skill install` do that) and never touches
// an edited one.
import fs from "node:fs";
import path from "node:path";
import { inspectAgents, agentsTemplate } from "../domain/agents-file.js";
import { skillAssistantIds, inspectSkill, skillTemplate } from "../domain/assistant-skill.js";

const STATUS = { current: "up-to-date", "shipped-older": "updated", modified: "modified", missing: "missing" };

function refresh(projectDir, inspection, template) {
  if (inspection.state === "shipped-older") fs.writeFileSync(path.join(projectDir, inspection.path), template, "utf8");
  return { path: inspection.path, status: STATUS[inspection.state] };
}

// updateProject(projectDir) -> [{ path, status }]; skills that are not
// installed are left out.
export function updateProject(projectDir) {
  const results = [refresh(projectDir, inspectAgents(projectDir), agentsTemplate())];
  for (const id of skillAssistantIds()) {
    const inspection = inspectSkill(projectDir, id);
    if (inspection.state !== "missing") results.push(refresh(projectDir, inspection, skillTemplate()));
  }
  return results;
}

export function describeUpdate(result) {
  return {
    updated: `✓ Updated ${result.path} (it was an unmodified older AIEF version)`,
    "up-to-date": `✓ ${result.path} is up to date`,
    modified: `! ${result.path} was edited — left as is`,
    missing: `○ ${result.path} is missing — run aief bootstrap to create it`
  }[result.status];
}
