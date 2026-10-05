// Files AIEF writes into a project and may later refresh (AGENTS.md, the
// aief-change skill — ADR-039, Change 0160). One rule for all of them: a
// file is AIEF's own while it is byte-identical to the current template or
// to a version AIEF shipped before; anything else was edited by someone and
// is never overwritten.
import crypto from "node:crypto";
import fs from "node:fs";

export function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function readPreviousHashes(jsonPath) {
  return new Set(JSON.parse(fs.readFileSync(jsonPath, "utf8")).sha256);
}

// classifyShipped(content, template, previousHashes)
//   -> "missing" | "current" | "shipped-older" | "modified"
export function classifyShipped(content, template, previousHashes) {
  if (content === null || content === undefined) return "missing";
  if (content === template) return "current";
  return previousHashes.has(sha256(content)) ? "shipped-older" : "modified";
}
