// The `aief-change` skill AIEF ships to assistants that support skills
// (ADR-039, Change 0159). Read-only: where each assistant expects it, what
// the current template says, and whether an installed copy is current, an
// unmodified older AIEF version, or edited by someone. Writing lives in
// core/services/skill-installer.js.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256, readPreviousHashes, classifyShipped } from "./shipped-file.js";

const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "templates", "skills", "aief-change");

export const SKILL_TARGETS = Object.freeze({
  claude: ".claude/skills/aief-change/SKILL.md",
  kiro: ".kiro/skills/aief-change/SKILL.md",
  codex: ".agents/skills/aief-change/SKILL.md"
});

export function skillAssistantIds() {
  return Object.keys(SKILL_TARGETS);
}

export function skillTemplate() {
  return fs.readFileSync(path.join(TEMPLATE_DIR, "SKILL.md"), "utf8");
}

function previousHashes() {
  return readPreviousHashes(path.join(TEMPLATE_DIR, "previous-versions.json"));
}

// `metadata.version` from a SKILL.md frontmatter, or null.
export function skillVersion(content) {
  const frontmatter = String(content || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return null;
  const version = frontmatter[1].match(/^\s+version:\s*["']?([0-9][^\s"']*)/m);
  return version ? version[1] : null;
}

// The procedure without frontmatter — what `aief prompt` sends to an
// assistant that has no installed skill (ADR-039 D5).
export function skillProcedure() {
  return skillTemplate().replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "");
}

// True when content is byte-identical to the current template or to any
// version AIEF shipped before: AIEF's own artifact, not a user's file.
export function isShippedSkill(content) {
  const hash = sha256(content);
  return hash === sha256(skillTemplate()) || previousHashes().has(hash);
}

// inspectSkill(projectDir, assistant) -> { path, state, installedVersion, currentVersion }
// state: "missing" | "current" | "shipped-older" | "modified"
export function inspectSkill(projectDir, assistant) {
  const relative = SKILL_TARGETS[assistant];
  const file = path.join(projectDir, relative);
  const currentVersion = skillVersion(skillTemplate());
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const state = classifyShipped(content, skillTemplate(), previousHashes());
  return { path: relative, state, installedVersion: content === null ? null : skillVersion(content), currentVersion };
}

// Compares dotted numeric versions; a missing version counts as older.
export function isOlderVersion(installed, current) {
  if (!installed) return true;
  const a = installed.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) < (b[i] || 0);
  }
  return false;
}
