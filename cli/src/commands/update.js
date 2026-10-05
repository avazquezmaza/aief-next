// Command handler: update (Change 0160). Refreshes AGENTS.md and installed
// aief-change skills that are unmodified older AIEF versions.
import { updateProject, describeUpdate } from "../core/services/project-updater.js";
import { skillAssistantIds, inspectSkill } from "../core/domain/assistant-skill.js";
import { section, parseArgs, printNext } from "./shared.js";

export function update(args = []) {
  const parsed = parseArgs("update", args);
  if (!parsed) return;
  section("AIEF Update");
  console.log("Purpose: refresh AGENTS.md and installed aief-change skills that AIEF shipped and nobody edited. Never overwrites an edited file.\n");
  const results = updateProject(process.cwd());
  for (const result of results) console.log(describeUpdate(result));
  // AGENTS.md delegates the Change procedure to the aief-change skill
  // (ADR-039): say which skill-capable assistants do not have it yet.
  const notInstalled = skillAssistantIds().filter((id) => inspectSkill(process.cwd(), id).state === "missing");
  if (notInstalled.length) console.log(`\n○ aief-change skill not installed for: ${notInstalled.join(", ")} — run aief skill install <assistant> for the ones you use (others get the procedure from aief prompt)`);
  if (results.some((r) => r.status === "updated")) console.log("\nReview the changes with git diff before committing.");
  printNext("git diff", "aief doctor");
}
