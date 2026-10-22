#!/usr/bin/env node
// AIEF approval guard — a Claude Code PreToolUse / Gemini CLI BeforeTool hook
// (ADR-041, ADR-042; Changes 0162, 0166). Installed by `aief guardrails
// install --approval-hook` (Claude Code) or `--assistant gemini`. Edit freely:
// AIEF never overwrites an edited copy.
//
// `(human)` and `(review)` items in a Change's tasks.md or spec.md are
// approvals a person gives. This hook refuses an Edit/Write/MultiEdit that
// would check one ([x]), abandon one ([-]) or delete one that is still
// unchecked. It is a mitigation, not a guarantee: a shell command can still
// change the file. No dependencies; Node only.
//
// Edit tools: Claude Code Write / Edit / MultiEdit; Gemini CLI write_file
// (whole content) and replace (old_string/new_string, allow_multiple).
import fs from "node:fs";
import path from "node:path";

const APPROVAL = /^\s*[-*+]\s*\[([ xX-])\]\s*\((human|review)\)\s*(.+?)\s*$/i;

function approvals(text) {
  const map = new Map();
  for (const line of String(text || "").split(/\r?\n/)) {
    const m = line.match(APPROVAL);
    if (m) map.set(`(${m[2].toLowerCase()}) ${m[3]}`, m[1] === " " ? "unchecked" : "resolved");
  }
  return map;
}

function applyEdit(text, oldString, newString, replaceAll) {
  if (typeof oldString !== "string" || !text.includes(oldString)) return text;
  return replaceAll ? text.split(oldString).join(newString ?? "") : text.replace(oldString, () => newString ?? "");
}

const PROJECT_DIR = process.env.GEMINI_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR || process.cwd();

function main(raw) {
  let event;
  try { event = JSON.parse(raw); } catch { return 0; }
  const input = event.tool_input || {};
  if (typeof input.file_path !== "string") return 0;
  const file = path.resolve(PROJECT_DIR, input.file_path);
  const name = path.basename(file);
  if (name !== "tasks.md" && name !== "spec.md") return 0;
  if (!file.split(path.sep).includes("changes")) return 0;

  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  let after = before;
  if (event.tool_name === "Write" || event.tool_name === "write_file") after = String(input.content ?? "");
  else if (event.tool_name === "Edit") after = applyEdit(before, input.old_string, input.new_string, input.replace_all);
  else if (event.tool_name === "replace") after = applyEdit(before, input.old_string, input.new_string, input.allow_multiple);
  else if (event.tool_name === "MultiEdit") for (const e of input.edits || []) after = applyEdit(after, e.old_string, e.new_string, e.replace_all);
  else return 0;

  const was = approvals(before);
  const now = approvals(after);
  const blocked = [];
  for (const [item, state] of was) {
    if (state !== "unchecked") continue;
    if (!now.has(item)) blocked.push(`removed: ${item}`);
    else if (now.get(item) !== "unchecked") blocked.push(`checked: ${item}`);
  }
  if (!blocked.length) return 0;
  process.stderr.write(
    `AIEF approval guard: (human) and (review) items are approvals a person gives, not an assistant (AGENTS.md).\n` +
    `This edit to ${path.relative(PROJECT_DIR, file)} would change:\n` +
    blocked.map((b) => `  - ${b}`).join("\n") +
    `\nAsk the user to check it themselves, and make the rest of the edit without touching that line.\n`
  );
  return 2;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => { process.exitCode = main(raw); });
