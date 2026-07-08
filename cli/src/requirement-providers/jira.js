// Placeholder adapter: reads a local Jira issue export (REST-shaped JSON).
// No network call, no live Jira connection, no credentials — see
// docs/requirement-sources.md for the export format and the future
// network/MCP integration path. Same contract as every other provider
// adapter: retrieve(sourceId, options) -> { requirement, retrieved,
// openQuestions, riskNotes, consoleNotes } — see manual.js for the shape.
import fs from "node:fs";
import path from "node:path";
import { emptyRequirement, normalizeJira } from "../requirement.js";

export function retrieve(sourceId, options = {}) {
  const filePath = typeof options.file === "string"
    ? path.resolve(process.cwd(), options.file)
    : path.resolve(process.cwd(), "requirements", "jira", `${sourceId}.json`);

  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { requirement: normalizeJira(raw, sourceId), retrieved: true, openQuestions: [], riskNotes: [], consoleNotes: [] };
  }

  const relative = path.relative(process.cwd(), filePath);
  return {
    requirement: emptyRequirement("jira", sourceId),
    retrieved: false,
    openQuestions: [`- No local Jira export found at \`${relative}\`. Provide one (see docs/requirement-sources.md) or answer: is this requirement still only a placeholder?`],
    riskNotes: [`- No local Jira export found at \`${relative}\`; this Change is a placeholder until real data is provided.`],
    consoleNotes: [`No local Jira export found at ${relative} — creating a placeholder Change. See docs/requirement-sources.md for the export format and future MCP/API integration path.`]
  };
}
