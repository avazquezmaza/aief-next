// `aief guardrails install` (Change 0162). Adds AIEF's deny rules to a
// project's Claude Code settings and, on request, the approval-guard hook;
// with assistant "gemini" (Change 0166, ADR-042), only the hook, registered
// as a Gemini CLI BeforeTool hook.
// Only ever adds: an existing rule, hook entry or any other setting is kept
// as is, and an unreadable settings file stops the install before writing.
import fs from "node:fs";
import path from "node:path";
import {
  denyRules, hookTemplate, settingsPath, readSettings, isHookRegistered, inspectHook,
  HOOK_PATH, HOOK_COMMAND, HOOK_ARGS, HOOK_MATCHER,
  GEMINI_SETTINGS_PATH, GEMINI_HOOK_PATH, GEMINI_HOOK_MATCHER, GEMINI_HOOK_COMMAND
} from "../domain/guardrails.js";

// Pure: returns a new settings object with every missing rule appended.
export function mergeDeny(settings, rules) {
  const existing = settings.permissions?.deny || [];
  const added = rules.filter((rule) => !existing.includes(rule));
  return { settings: { ...settings, permissions: { ...(settings.permissions || {}), deny: [...existing, ...added] } }, added };
}

// Pure: returns a new settings object with the hook registered, unless an
// aief-approval-guard entry is already there.
export function registerHook(settings) {
  if (isHookRegistered(settings)) return { settings, added: false };
  const hooks = settings.hooks || {};
  const entry = { matcher: HOOK_MATCHER, hooks: [{ type: "command", command: HOOK_COMMAND, args: HOOK_ARGS }] };
  return { settings: { ...settings, hooks: { ...hooks, PreToolUse: [...(hooks.PreToolUse || []), entry] } }, added: true };
}

// Pure: the same for Gemini CLI's hooks.BeforeTool.
export function registerGeminiHook(settings) {
  if (isHookRegistered(settings, "BeforeTool")) return { settings, added: false };
  const hooks = settings.hooks || {};
  const entry = { matcher: GEMINI_HOOK_MATCHER, hooks: [{ name: "aief-approval-guard", type: "command", command: GEMINI_HOOK_COMMAND }] };
  return { settings: { ...settings, hooks: { ...hooks, BeforeTool: [...(hooks.BeforeTool || []), entry] } }, added: true };
}

// Writes the hook script unless an edited copy is there; returns { path, status }.
function writeHookFile(projectDir, hookPath) {
  const state = inspectHook(projectDir, hookPath);
  if (state === "missing" || state === "shipped-older") {
    fs.mkdirSync(path.dirname(path.join(projectDir, hookPath)), { recursive: true });
    fs.writeFileSync(path.join(projectDir, hookPath), hookTemplate(), "utf8");
  }
  return { path: hookPath, status: { missing: "created", "shipped-older": "updated", current: "up-to-date", modified: "modified" }[state] };
}

function writeSettings(full, settings) {
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

// installGeminiGuard(projectDir) -> { error } | { settingsFile, rulesAdded: null, hookRegistered, hookFile }
function installGeminiGuard(projectDir) {
  const full = path.join(projectDir, GEMINI_SETTINGS_PATH);
  const read = readSettings(full);
  if (read.error) return { error: `${GEMINI_SETTINGS_PATH} ${read.error} — fix it first; nothing was written` };
  const hookFile = writeHookFile(projectDir, GEMINI_HOOK_PATH);
  const registration = registerGeminiHook(read.value);
  if (registration.added) writeSettings(full, registration.settings);
  return { settingsFile: GEMINI_SETTINGS_PATH, rulesAdded: null, hookRegistered: registration.added, hookFile };
}

// installGuardrails(projectDir, { local, approvalHook, assistant })
//   -> { error } | { settingsFile, rulesAdded, hookRegistered, hookFile }
export function installGuardrails(projectDir, { local = false, approvalHook = false, assistant = "claude" } = {}) {
  if (assistant === "gemini") return installGeminiGuard(projectDir);
  const settingsFile = settingsPath(local);
  const full = path.join(projectDir, settingsFile);
  const read = readSettings(full);
  if (read.error) return { error: `${settingsFile} ${read.error} — fix it first; nothing was written` };

  let { settings, added } = mergeDeny(read.value, denyRules());
  let hookRegistered = null;
  let hookFile = null;
  if (approvalHook) {
    hookFile = writeHookFile(projectDir, HOOK_PATH);
    const registration = registerHook(settings);
    settings = registration.settings;
    hookRegistered = registration.added;
  }
  if (added.length || hookRegistered) writeSettings(full, settings);
  return { settingsFile, rulesAdded: added, hookRegistered, hookFile };
}
