// Guardrails AIEF can add to a project's Claude Code configuration
// (Change 0162): permissions.deny rules that keep credentials out of an
// assistant's reach, and the optional approval-guard hook (ADR-041). The same
// hook script also serves Gemini CLI as a BeforeTool hook (ADR-042, Change
// 0166); Gemini has no project-level deny list, so it gets only the hook.
// Read-only here; core/services/guardrails-installer.js writes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPreviousHashes, classifyShipped } from "./shipped-file.js";

const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "templates", "guardrails");

export const HOOK_PATH = ".claude/hooks/aief-approval-guard.mjs";
export const HOOK_COMMAND = "node";
export const HOOK_ARGS = ["${CLAUDE_PROJECT_DIR}/.claude/hooks/aief-approval-guard.mjs"];
export const HOOK_MATCHER = "Edit|Write|MultiEdit";

export const GUARDRAIL_ASSISTANTS = ["claude", "gemini"];
export const GEMINI_SETTINGS_PATH = ".gemini/settings.json";
export const GEMINI_HOOK_PATH = ".gemini/hooks/aief-approval-guard.mjs";
export const GEMINI_HOOK_MATCHER = "write_file|replace";
export const GEMINI_HOOK_COMMAND = 'node "$GEMINI_PROJECT_DIR/.gemini/hooks/aief-approval-guard.mjs"';

export function denyRules() {
  return JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, "claude-deny.json"), "utf8")).deny;
}

export function hookTemplate() {
  return fs.readFileSync(path.join(TEMPLATE_DIR, "aief-approval-guard.mjs"), "utf8");
}

export function settingsPath(local) {
  return local ? ".claude/settings.local.json" : ".claude/settings.json";
}

// readSettings(file) -> { value } (an object; {} when the file is absent) | { error }
export function readSettings(file) {
  if (!fs.existsSync(file)) return { value: {} };
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    if (value === null || typeof value !== "object" || Array.isArray(value)) return { error: "is not a JSON object" };
    return { value };
  } catch (err) {
    return { error: `is not valid JSON (${err.message})` };
  }
}

// `event`: "PreToolUse" for Claude Code, "BeforeTool" for Gemini CLI.
export function isHookRegistered(settings, event = "PreToolUse") {
  return (settings.hooks?.[event] || []).some((entry) => (entry.hooks || []).some((h) =>
    String(h.command || "").includes("aief-approval-guard") || (h.args || []).some((a) => String(a).includes("aief-approval-guard"))));
}

// inspectHook(projectDir, hookPath) -> "missing" | "current" | "shipped-older" | "modified"
export function inspectHook(projectDir, hookPath = HOOK_PATH) {
  const file = path.join(projectDir, hookPath);
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  return classifyShipped(content, hookTemplate(), readPreviousHashes(path.join(TEMPLATE_DIR, "previous-versions.json")));
}
