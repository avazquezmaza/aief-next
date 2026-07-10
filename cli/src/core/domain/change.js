// The Change domain model. A Change is fully derived from its four files
// (change.md, spec.md, tasks.md, evidence.md) — no hidden state, matching
// ADR-009. loadChange() is a minimal loader, not a repository: it reads one
// Change directory and returns a plain object with its raw file contents plus
// the small set of derived flags every verification rule actually needs
// (missing/empty files, closed, type, evidence-placeholder, open task count).
// It does not abstract the filesystem in general — cli.js still owns
// cwd()/exists()/getChangeDirs()/nextChangeId() for everything else.
import fs from "node:fs";
import path from "node:path";

export const CHANGE_FILES = ["change.md", "spec.md", "tasks.md", "evidence.md"];

// A Change is closed when its own change.md carries a "## Status / Closed"
// section (written by `aief close --yes`). Anchored to line start so prose
// that merely mentions "## Status" does not count.
export function isClosedContent(changeMd) {
  return /^##\s*status\s*(\r?\n)+\s*closed/im.test(changeMd);
}

// Single source of truth for a Change's declared `## Type` (Analysis,
// Enrichment, General, ...) — CRLF-tolerant.
export function changeTypeFromContent(changeMd) {
  const match = changeMd.match(/^##\s*type\s*(?:\r?\n)+\s*([^\r\n]+)/im);
  return match ? match[1].trim().toLowerCase() : "";
}

// evidence.md is still the unedited template when it has three or more
// "Pending." placeholder lines.
export function isEvidencePlaceholderContent(evidenceMd) {
  return (evidenceMd.match(/^Pending\.\s*$/gm) || []).length >= 3;
}

export function countOpenTasks(tasksMd) {
  return (tasksMd.match(/^\s*- \[ \]/gm) || []).length;
}

// The single shared implementation of Change selection (Flux Portal dogfooding
// finding: per-command substring matching silently picked the wrong Change).
// Deterministic tiers — first tier with matches wins:
//   1. exact basename ("0002-add-login")
//   2. exact numeric ID ("0002" or "2")
//   3. substring of the basename ("add-login")
// Returns every match in the winning tier; the caller decides how to treat
// zero (not found) or many (ambiguous — never "last one wins").
export function matchChanges(selector, dirs) {
  const value = String(selector || "").trim();
  if (!value) return [];
  const pairs = dirs.map((dir) => [dir, path.basename(dir)]);
  const exact = pairs.filter(([, base]) => base === value);
  if (exact.length) return exact.map(([dir]) => dir);
  if (/^\d+$/.test(value)) {
    const byId = pairs.filter(([, base]) => {
      const m = base.match(/^(\d+)-/);
      return m && Number(m[1]) === Number(value);
    });
    if (byId.length) return byId.map(([dir]) => dir);
  }
  return pairs.filter(([, base]) => base.includes(value)).map(([dir]) => dir);
}

// Loads a Change from its directory: raw file contents plus every flag
// verification needs, computed once so verifyProject() and
// checkChangeReadiness() (used by `verify` and `close` respectively) read
// the same derived values instead of recomputing them differently.
export function loadChange(changeDir) {
  const files = {};
  const missing = [];
  const empty = [];
  for (const file of CHANGE_FILES) {
    const full = path.join(changeDir, file);
    const fileExists = fs.existsSync(full);
    const content = fileExists ? fs.readFileSync(full, "utf8") : "";
    files[file] = content;
    if (!fileExists) missing.push(file);
    else if (!content.trim()) empty.push(file);
  }
  return {
    dir: changeDir,
    basename: path.basename(changeDir),
    files,
    missing,
    empty,
    closed: isClosedContent(files["change.md"]),
    type: changeTypeFromContent(files["change.md"]),
    evidencePlaceholder: isEvidencePlaceholderContent(files["evidence.md"]),
    openTasksCount: countOpenTasks(files["tasks.md"])
  };
}
