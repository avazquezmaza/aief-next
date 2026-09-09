// Evidence provenance (Change 0129, following an external audit's
// recommendation). Answers "where did this captured evidence actually
// come from" mechanically, alongside — never instead of — evidence.md's
// own human-readable prose (docs/architecture.md's repository-as-source-
// of-truth: no daemon, no database, no second store). A SHA-256 of the
// exact bytes AIEF read, the git commit HEAD pointed to at capture time
// (or null — a Change may be verified outside a git repo, or before the
// first commit; never fabricated), when it was captured, which AIEF
// surface produced it, and what kind of verification it represents.
//
// Reuses git-branch.js's exact "read-only git call, spawnSync via
// process-utils.js's shared run(), null on any failure" pattern — no new
// git-invocation code, no new dependency (node:crypto is a Node builtin).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { run } from "../../process-utils.js";

function cliVersion() {
  try {
    const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

// gitCommitAt(cwd) -> full HEAD commit SHA, or null when not inside a git
// work tree or before the first commit. Never throws.
export function gitCommitAt(cwd = process.cwd()) {
  const result = run("git", ["rev-parse", "HEAD"], { cwd });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function sha256Of(content) {
  return crypto.createHash("sha256").update(String(content), "utf8").digest("hex");
}

// buildProvenance(sourcePath, sourceContent, producer, verificationType, cwd)
//   -> { source, sourceDigest, gitCommit, capturedAt, producer, verificationType }
// `sourceContent` is hashed exactly as read — the caller must pass the same
// string it parsed, not a re-read (avoids a TOCTOU gap between "what AIEF
// hashed" and "what AIEF actually parsed").
export function buildProvenance(sourcePath, sourceContent, producer, verificationType, cwd = process.cwd()) {
  return {
    source: sourcePath,
    sourceDigest: `sha256:${sha256Of(sourceContent)}`,
    gitCommit: gitCommitAt(cwd),
    capturedAt: new Date().toISOString(),
    producer: `${producer} (aief ${cliVersion()})`,
    verificationType
  };
}

// renderProvenance(record) -> Markdown bullet list, fixed key order, fixed
// labels — a script (or a human) can extract any field with one fixed
// regex per label, the same "fixed regular expressions, never a heuristic
// parser" discipline junit-report.js/sdd-model.js already established.
export function renderProvenance(record) {
  return [
    "**Provenance:**",
    `- Source: \`${record.source}\``,
    `- SHA-256: \`${record.sourceDigest}\``,
    `- Git commit: ${record.gitCommit ? `\`${record.gitCommit}\`` : "unknown (not inside a git work tree, or no commits yet)"}`,
    `- Captured at: ${record.capturedAt}`,
    `- Producer: ${record.producer}`,
    `- Verification type: ${record.verificationType}`
  ].join("\n");
}
