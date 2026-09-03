// Placeholder adapter: reads a local Jira issue export (REST-shaped JSON).
// No network call, no live Jira connection, no credentials — see
// docs/configuration.md, "Requirement Source providers", for the export
// path convention and the future network/MCP integration path. Same
// contract as every other provider
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

  // Containment is checked for BOTH the explicit --file case and the default
  // "requirements/jira/<sourceId>.json" template — sourceId is unsanitized
  // CLI input (cli/src/commands/enrich.js passes it straight through from
  // argv), so a sourceId containing "../" segments (e.g.
  // `aief enrich jira ../../../etc/passwd`) interpolates into the default
  // path exactly as dangerously as a malicious --file value would. The
  // earlier assumption that the default path "can never resolve outside the
  // project root" only held for a sourceId with no path metacharacters —
  // this was a real arbitrary-file-read gap, found and fixed here (Change
  // 0105), the same class of bug Change 0074 fixed for --file alone.
  if (!isReallyWithin(projectRoot, filePath)) {
    const label = usingExplicitFile ? `--file ${options.file}` : `source id ${JSON.stringify(sourceId)}`;
    return {
      requirement: emptyRequirement("jira", sourceId),
      retrieved: false,
      openQuestions: [`- \`${label}\` resolves outside the project root — rejected before reading. Point --file (or the source id) at a project-local Jira export (see docs/workflow.md).`],
      riskNotes: [`- \`${label}\` was rejected: it resolves (directly, or via a symlink) outside the project root, so no content was read.`],
      consoleNotes: [`${label} resolves outside the project root — rejected before reading. Point --file (or the source id) at a project-local Jira export.`]
    };
  }

  if (fs.existsSync(filePath)) {
    const relative = path.relative(projectRoot, filePath);
    // Change 0116: a malformed/truncated export used to crash with an
    // uncaught SyntaxError and a raw stack trace — every other error path
    // in this function already degrades to the same clean placeholder
    // shape (path-outside-project-root above, not-found below); a parse
    // failure gets the same treatment instead of propagating.
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      return {
        requirement: emptyRequirement("jira", sourceId),
        retrieved: false,
        openQuestions: [`- \`${relative}\` is not valid JSON (${err.message}). Fix or replace the export, or answer: is this requirement still only a placeholder?`],
        riskNotes: [`- \`${relative}\` could not be parsed as JSON; this Change is a placeholder until a valid export is provided.`],
        consoleNotes: [`${relative} is not valid JSON (${err.message}) — creating a placeholder Change. See docs/configuration.md, "Requirement Source providers".`]
      };
    }
    return { requirement: normalizeJira(raw, sourceId), retrieved: true, openQuestions: [], riskNotes: [], consoleNotes: [] };
  }

  const relative = path.relative(projectRoot, filePath);
  return {
    requirement: emptyRequirement("jira", sourceId),
    retrieved: false,
    openQuestions: [`- No local Jira export found at \`${relative}\`. Provide one (see docs/configuration.md, "Requirement Source providers") or answer: is this requirement still only a placeholder?`],
    riskNotes: [`- No local Jira export found at \`${relative}\`; this Change is a placeholder until real data is provided.`],
    consoleNotes: [`No local Jira export found at ${relative} — creating a placeholder Change. See docs/configuration.md, "Requirement Source providers", for the export path and future MCP/API integration path.`]
  };
}
