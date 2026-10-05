// `aief guardrails install` (Change 0162). Adds AIEF's deny rules to a
// project's Claude Code settings and, on request, the approval-guard hook.
// Only ever adds: an existing rule, hook entry or any other setting is kept
// as is, and an unreadable settings file stops the install before writing.
import fs from "node:fs";
import path from "node:path";
import {
  denyRules, hookTemplate, settingsPath, readSettings, isHookRegistered, inspectHook,
  HOOK_PATH, HOOK_COMMAND, HOOK_ARGS, HOOK_MATCHER
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

// installGuardrails(projectDir, { local, approvalHook })
//   -> { error } | { settingsFile, rulesAdded, hookRegistered, hookFile }
export function installGuardrails(projectDir, { local = false, approvalHook = false } = {}) {
  const settingsFile = settingsPath(local);
  const full = path.join(projectDir, settingsFile);
  const read = readSettings(full);
  if (read.error) return { error: `${settingsFile} ${read.error} — fix it first; nothing was written` };

  let { settings, added } = mergeDeny(read.value, denyRules());
  let hookRegistered = null;
  let hookFile = null;
  if (approvalHook) {
    const state = inspectHook(projectDir);
    if (state === "missing" || state === "shipped-older") {
      fs.mkdirSync(path.dirname(path.join(projectDir, HOOK_PATH)), { recursive: true });
      fs.writeFileSync(path.join(projectDir, HOOK_PATH), hookTemplate(), "utf8");
    }
    hookFile = { path: HOOK_PATH, status: { missing: "created", "shipped-older": "updated", current: "up-to-date", modified: "modified" }[state] };
    const registration = registerHook(settings);
    settings = registration.settings;
    hookRegistered = registration.added;
  }
  if (added.length || hookRegistered) {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  }
  return { settingsFile, rulesAdded: added, hookRegistered, hookFile };
}
