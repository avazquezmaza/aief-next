// Placeholder adapter: reads a local Jira issue export (REST-shaped JSON).
// No network call, no live Jira connection, no credentials — see
// docs/requirement-sources.md for the export format and the future
// network/MCP integration path. Same contract as every other provider
// adapter: retrieve(sourceId, options) -> { requirement, retrieved,
// openQuestions, riskNotes, consoleNotes } — see manual.js for the shape.
import fs from "node:fs";
import path from "node:path";
import { emptyRequirement, normalizeJira } from "../requirement.js";

// True when `child` is `parent` itself or genuinely nested inside it — never
// escaped via "../" segments or an absolute path swap. Mirrors
// cli/src/sdd-providers/openspec.js's own isPathWithin() exactly —
// duplicated, not imported, following this codebase's existing precedent
// (core/services/verification-evidence.js duplicates the same check for the
// same reason): each path-accepting feature owns its own small, reviewed
// containment check rather than depending on a shared cross-module helper.
function isPathWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

// Real-path containment: a symlink physically inside the project root can
// still point outside it, and fs.existsSync/readFileSync follow symlinks
// transparently — textual containment on the un-dereferenced path alone is
// not enough. Mirrors core/services/verification-evidence.js's own
// realPathIfWithin() reasoning (a security gap found and fixed there for
// SDD evidence resolution, applied here for --file's structurally
// identical risk — see change 0074's evidence.md).
function isReallyWithin(projectRoot, resolved) {
  if (!isPathWithin(projectRoot, resolved)) return false;
  let real;
  try {
    real = fs.realpathSync(resolved);
  } catch {
    // Does not exist (or a broken symlink) — not a containment failure;
    // the caller's own fs.existsSync check reports "no local export
    // found" exactly as it always has.
    return true;
  }
  return isPathWithin(fs.realpathSync(projectRoot), real);
}

export function retrieve(sourceId, options = {}) {
  const projectRoot = process.cwd();
  const usingExplicitFile = typeof options.file === "string";
  const filePath = usingExplicitFile
    ? path.resolve(projectRoot, options.file)
    : path.resolve(projectRoot, "requirements", "jira", `${sourceId}.json`);

  // Only an explicitly-supplied --file is containment-checked: the default
  // location is always built from a fixed "requirements/jira/" segment, so
  // it can never itself resolve outside the project root.
  if (usingExplicitFile && !isReallyWithin(projectRoot, filePath)) {
    return {
      requirement: emptyRequirement("jira", sourceId),
      retrieved: false,
      openQuestions: [`- \`--file ${options.file}\` resolves outside the project root — rejected before reading. Point --file at a project-local Jira export (see docs/workflow.md).`],
      riskNotes: [`- \`--file ${options.file}\` was rejected: it resolves (directly, or via a symlink) outside the project root, so no content was read.`],
      consoleNotes: [`--file "${options.file}" resolves outside the project root — rejected before reading. Point --file at a project-local Jira export.`]
    };
  }

  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { requirement: normalizeJira(raw, sourceId), retrieved: true, openQuestions: [], riskNotes: [], consoleNotes: [] };
  }

  const relative = path.relative(projectRoot, filePath);
  return {
    requirement: emptyRequirement("jira", sourceId),
    retrieved: false,
    openQuestions: [`- No local Jira export found at \`${relative}\`. Provide one (see docs/requirement-sources.md) or answer: is this requirement still only a placeholder?`],
    riskNotes: [`- No local Jira export found at \`${relative}\`; this Change is a placeholder until real data is provided.`],
    consoleNotes: [`No local Jira export found at ${relative} — creating a placeholder Change. See docs/requirement-sources.md for the export format and future MCP/API integration path.`]
  };
}
