// The project's AGENTS.md as an AIEF-shipped file (Change 0160): whether it
// is the current template, an unmodified older AIEF version, or edited.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPreviousHashes, classifyShipped } from "./shipped-file.js";

const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "templates", "agents");

export function agentsTemplate() {
  return fs.readFileSync(path.join(TEMPLATE_DIR, "AGENTS.md"), "utf8");
}

// inspectAgents(projectDir) -> { path: "AGENTS.md", state }
export function inspectAgents(projectDir) {
  const file = path.join(projectDir, "AGENTS.md");
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  return { path: "AGENTS.md", state: classifyShipped(content, agentsTemplate(), readPreviousHashes(path.join(TEMPLATE_DIR, "previous-versions.json"))) };
}
