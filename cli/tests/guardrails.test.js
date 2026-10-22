import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { denyRules, hookTemplate, HOOK_PATH, GEMINI_HOOK_PATH, GEMINI_SETTINGS_PATH } from "../src/core/domain/guardrails.js";
import { mergeDeny, registerHook, registerGeminiHook } from "../src/core/services/guardrails-installer.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0162: `aief guardrails install` adds Claude Code deny rules for
// credentials and, with --approval-hook, the approval guard (ADR-041).

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "guardrails", "aief-approval-guard.mjs");
const settingsOf = (dir, file = ".claude/settings.json") => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

// --- pure merge ---

test("mergeDeny keeps existing rules in order, appends only missing ones", () => {
  const { settings, added } = mergeDeny({ permissions: { deny: ["Read(**/.env)", "Bash(rm -rf *)"], allow: ["Bash(npm test)"] } }, ["Read(**/.env)", "Read(**/*.pem)"]);
  assert.deepEqual(settings.permissions.deny, ["Read(**/.env)", "Bash(rm -rf *)", "Read(**/*.pem)"]);
  assert.deepEqual(settings.permissions.allow, ["Bash(npm test)"]);
  assert.deepEqual(added, ["Read(**/*.pem)"]);
});

test("registerHook adds one PreToolUse entry, keeps others, and is idempotent", () => {
  const other = { matcher: "Bash", hooks: [{ type: "command", command: "my-check" }] };
  const first = registerHook({ hooks: { PreToolUse: [other] } });
  assert.equal(first.added, true);
  assert.equal(first.settings.hooks.PreToolUse.length, 2);
  assert.deepEqual(first.settings.hooks.PreToolUse[0], other);
  const second = registerHook(first.settings);
  assert.equal(second.added, false);
  assert.equal(second.settings.hooks.PreToolUse.length, 2);
});

// --- command ---

test("guardrails install creates .claude/settings.json with every rule, and is idempotent", () => {
  const dir = makeProject();
  const first = aief(dir, ["guardrails", "install"]);
  assert.equal(first.status, 0);
  assert.deepEqual(settingsOf(dir).permissions.deny, denyRules());
  assert.match(aief(dir, ["guardrails", "install"]).out, /already has all \d+ deny rules/);
  assert.equal(fs.existsSync(path.join(dir, HOOK_PATH)), false, "no hook without --approval-hook");
});

test("guardrails install keeps every existing setting and rule", () => {
  const existing = { env: { FOO: "1" }, permissions: { allow: ["Bash(npm test)"], deny: ["Read(**/.env)", "Bash(rm -rf *)"] } };
  const dir = makeProject({ ".claude/settings.json": JSON.stringify(existing) });
  aief(dir, ["guardrails", "install"]);
  const after = settingsOf(dir);
  assert.deepEqual(after.env, { FOO: "1" });
  assert.deepEqual(after.permissions.allow, ["Bash(npm test)"]);
  assert.deepEqual(after.permissions.deny.slice(0, 2), ["Read(**/.env)", "Bash(rm -rf *)"]);
  assert.equal(after.permissions.deny.filter((r) => r === "Read(**/.env)").length, 1);
});

test("guardrails install refuses an invalid settings file and writes nothing", () => {
  const dir = makeProject({ ".claude/settings.json": "{ not json" });
  const { status, out } = aief(dir, ["guardrails", "install", "--approval-hook"]);
  assert.equal(status, 1);
  assert.match(out, /\.claude\/settings\.json is not valid JSON/);
  assert.equal(fs.readFileSync(path.join(dir, ".claude/settings.json"), "utf8"), "{ not json");
  assert.equal(fs.existsSync(path.join(dir, HOOK_PATH)), false);
});

test("guardrails install --local writes settings.local.json", () => {
  const dir = makeProject();
  aief(dir, ["guardrails", "install", "--local"]);
  assert.deepEqual(settingsOf(dir, ".claude/settings.local.json").permissions.deny, denyRules());
  assert.equal(fs.existsSync(path.join(dir, ".claude/settings.json")), false);
});

test("--approval-hook installs the script, registers it once, and never overwrites an edited copy", () => {
  const dir = makeProject();
  const { out } = aief(dir, ["guardrails", "install", "--approval-hook"]);
  assert.match(out, /Installed \.claude\/hooks\/aief-approval-guard\.mjs/);
  assert.equal(fs.readFileSync(path.join(dir, HOOK_PATH), "utf8"), hookTemplate());
  const entries = settingsOf(dir).hooks.PreToolUse;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].matcher, "Edit|Write|MultiEdit");
  assert.deepEqual(entries[0].hooks[0].args, ["${CLAUDE_PROJECT_DIR}/.claude/hooks/aief-approval-guard.mjs"]);

  fs.appendFileSync(path.join(dir, HOOK_PATH), "// team tweak\n");
  assert.match(aief(dir, ["guardrails", "install", "--approval-hook"]).out, /Edited, left as is/);
  assert.match(fs.readFileSync(path.join(dir, HOOK_PATH), "utf8"), /team tweak/);
  assert.equal(settingsOf(dir).hooks.PreToolUse.length, 1);
});

test("guardrails rejects an unknown subcommand", () => {
  assert.equal(aief(makeProject(), ["guardrails", "remove"]).status, 1);
});

test("doctor reports missing rules and the hook state when .claude/ exists", () => {
  const dir = makeProject({ ".claude/settings.json": JSON.stringify({ permissions: { deny: ["Read(**/.env)"] } }) });
  const before = aief(dir, ["doctor"]).out;
  assert.match(before, /Guardrails:\n! 1\/\d+ AIEF deny rules for credentials — run: aief guardrails install/);
  assert.match(before, /Approval guard hook not installed/);
  aief(dir, ["guardrails", "install", "--approval-hook"]);
  const after = aief(dir, ["doctor"]).out;
  assert.match(after, /✓ (\d+)\/\1 AIEF deny rules/);
  assert.match(after, /✓ Approval guard hook installed and registered/);
  assert.doesNotMatch(aief(makeProject(), ["doctor"]).out, /Guardrails:/, "silent without .claude/");
});

// --- the hook itself, run as Claude Code would ---

function runHook(dir, event) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  return { status: r.status, stderr: r.stderr };
}

function changeProject() {
  const dir = makeProject({
    "changes/0001-x/tasks.md": "# Tasks\n\n- [x] Work\n- [ ] (human) Owner approves\n- [ ] (review) Peer review\n",
    "changes/0001-x/spec.md": "# Spec\n\n## Acceptance Criteria\n\n- [ ] (human) Owner signs off\n",
    "src/app.js": "a\n"
  });
  return { dir, tasks: path.join(dir, "changes/0001-x/tasks.md"), spec: path.join(dir, "changes/0001-x/spec.md") };
}

test("hook blocks an Edit that checks a (human) item, naming it", () => {
  const { dir, tasks } = changeProject();
  const r = runHook(dir, { tool_name: "Edit", tool_input: { file_path: tasks, old_string: "- [ ] (human) Owner approves", new_string: "- [x] (human) Owner approves" } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /checked: \(human\) Owner approves/);
  assert.match(r.stderr, /changes\/0001-x\/tasks\.md/);
});

test("hook blocks marking a (review) item [-] and checking a spec.md approval", () => {
  const { dir, tasks, spec } = changeProject();
  assert.equal(runHook(dir, { tool_name: "Edit", tool_input: { file_path: tasks, old_string: "- [ ] (review) Peer review", new_string: "- [-] (review) Peer review" } }).status, 2);
  assert.equal(runHook(dir, { tool_name: "Edit", tool_input: { file_path: spec, old_string: "- [ ] (human)", new_string: "- [x] (human)" } }).status, 2);
});

test("hook blocks a Write or MultiEdit that removes or checks an approval", () => {
  const { dir, tasks } = changeProject();
  assert.equal(runHook(dir, { tool_name: "Write", tool_input: { file_path: tasks, content: "# Tasks\n\n- [x] Work\n" } }).status, 2);
  assert.equal(runHook(dir, { tool_name: "MultiEdit", tool_input: { file_path: tasks, edits: [{ old_string: "- [x] Work", new_string: "- [x] Work done" }, { old_string: "- [ ] (review)", new_string: "- [x] (review)" }] } }).status, 2);
});

test("hook allows ordinary edits, edits that keep approvals unchecked, and files outside changes/", () => {
  const { dir, tasks } = changeProject();
  assert.equal(runHook(dir, { tool_name: "Edit", tool_input: { file_path: tasks, old_string: "- [x] Work", new_string: "- [x] Work done\n- [ ] More work" } }).status, 0);
  assert.equal(runHook(dir, { tool_name: "Write", tool_input: { file_path: tasks, content: "# Tasks\n\n- [ ] (human) Owner approves\n- [ ] (review) Peer review\n- [ ] New task\n" } }).status, 0);
  assert.equal(runHook(dir, { tool_name: "Edit", tool_input: { file_path: path.join(dir, "src/app.js"), old_string: "a", new_string: "b" } }).status, 0);
  assert.equal(runHook(dir, { tool_name: "Bash", tool_input: { command: "ls" } }).status, 0);
  assert.equal(runHook(dir, "not an object").status, 0);
});

// --- Gemini CLI (Change 0166, ADR-042) ---

const OLD_HOOK = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "aief-approval-guard-0162.mjs"), "utf8");

function runGeminiHook(dir, event) {
  const env = { ...process.env, GEMINI_PROJECT_DIR: dir };
  delete env.CLAUDE_PROJECT_DIR;
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: "utf8", env, cwd: dir });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// Change 0167: Gemini blocks on exit 0 + {"decision":"deny"}; returns the parsed decision or null.
function geminiDenial(r) {
  assert.equal(r.status, 0, r.stderr);
  if (r.stdout === "") return null;
  const out = JSON.parse(r.stdout);
  assert.equal(out.decision, "deny");
  return out.reason;
}

test("registerGeminiHook adds one BeforeTool entry, keeps others, and is idempotent", () => {
  const other = { matcher: "run_shell_command", hooks: [{ type: "command", command: "my-check" }] };
  const first = registerGeminiHook({ hooks: { BeforeTool: [other] }, general: { vimMode: true } });
  assert.equal(first.added, true);
  assert.deepEqual(first.settings.hooks.BeforeTool[0], other);
  assert.deepEqual(first.settings.hooks.BeforeTool[1], { matcher: "write_file|replace", hooks: [{ name: "aief-approval-guard", type: "command", command: 'node "$GEMINI_PROJECT_DIR/.gemini/hooks/aief-approval-guard.mjs"' }] });
  assert.deepEqual(first.settings.general, { vimMode: true });
  assert.equal(registerGeminiHook(first.settings).added, false);
});

test("guardrails install --assistant gemini installs and registers the hook once, keeps settings, leaves .claude/ alone", () => {
  const dir = makeProject({ [GEMINI_SETTINGS_PATH]: JSON.stringify({ general: { vimMode: true } }) });
  const first = aief(dir, ["guardrails", "install", "--assistant", "gemini"]);
  assert.equal(first.status, 0, first.out);
  assert.match(first.out, /no project-level deny list/);
  assert.match(first.out, /✓ Installed \.gemini\/hooks\/aief-approval-guard\.mjs/);
  assert.match(first.out, /Registered the approval guard as a BeforeTool hook in \.gemini\/settings\.json/);
  assert.match(first.out, /trusted folder/);
  assert.equal(fs.readFileSync(path.join(dir, GEMINI_HOOK_PATH), "utf8"), hookTemplate());
  const settings = settingsOf(dir, GEMINI_SETTINGS_PATH);
  assert.deepEqual(settings.general, { vimMode: true });
  assert.equal(settings.hooks.BeforeTool.length, 1);
  assert.equal(fs.existsSync(path.join(dir, ".claude")), false);
  const second = aief(dir, ["guardrails", "install", "--assistant", "gemini", "--approval-hook"]);
  assert.match(second.out, /Up to date: \.gemini\/hooks/);
  assert.match(second.out, /already registered/);
  assert.equal(settingsOf(dir, GEMINI_SETTINGS_PATH).hooks.BeforeTool.length, 1);
});

test("guardrails install --assistant gemini refreshes the 0162 and 0166 hooks, never an edited one", () => {
  const v0166 = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "aief-approval-guard-0166.mjs"), "utf8");
  assert.notEqual(v0166, hookTemplate());
  const older = makeProject({ [GEMINI_HOOK_PATH]: v0166 });
  assert.match(aief(older, ["guardrails", "install", "--assistant", "gemini"]).out, /✓ Updated \.gemini\/hooks/);
  assert.equal(fs.readFileSync(path.join(older, GEMINI_HOOK_PATH), "utf8"), hookTemplate());
  const dir = makeProject({ [GEMINI_HOOK_PATH]: OLD_HOOK });
  assert.match(aief(dir, ["guardrails", "install", "--assistant", "gemini"]).out, /✓ Updated \.gemini\/hooks/);
  assert.equal(fs.readFileSync(path.join(dir, GEMINI_HOOK_PATH), "utf8"), hookTemplate());
  const edited = `${hookTemplate()}\n// team note\n`;
  fs.writeFileSync(path.join(dir, GEMINI_HOOK_PATH), edited);
  assert.match(aief(dir, ["guardrails", "install", "--assistant", "gemini"]).out, /Edited, left as is: \.gemini\/hooks/);
  assert.equal(fs.readFileSync(path.join(dir, GEMINI_HOOK_PATH), "utf8"), edited);
});

test("guardrails install --assistant gemini refuses an invalid settings file and writes nothing", () => {
  const dir = makeProject({ [GEMINI_SETTINGS_PATH]: "{ not json" });
  const { status, out } = aief(dir, ["guardrails", "install", "--assistant", "gemini"]);
  assert.equal(status, 1);
  assert.match(out, /\.gemini\/settings\.json is not valid JSON/);
  assert.equal(fs.existsSync(path.join(dir, GEMINI_HOOK_PATH)), false);
});

test("guardrails install refuses --local with Gemini, unsupported and unknown assistants, before writing", () => {
  for (const [args, message] of [
    [["--assistant", "gemini", "--local"], /--local applies to Claude Code only/],
    [["--assistant", "codex"], /no guardrails for codex yet .*ADR-042/],
    [["--assistant", "cursor"], /no guardrails for cursor yet/],
    [["--assistant", "nope"], /unknown assistant "nope"/]
  ]) {
    const dir = makeProject();
    const { status, out } = aief(dir, ["guardrails", "install", ...args]);
    assert.equal(status, 1, args.join(" "));
    assert.match(out, message);
    assert.equal(fs.existsSync(path.join(dir, ".gemini")) || fs.existsSync(path.join(dir, ".claude")), false);
  }
});

test("guardrails install without --assistant still means Claude Code", () => {
  const dir = makeProject();
  assert.equal(aief(dir, ["guardrails", "install", "--approval-hook"]).status, 0);
  assert.ok(fs.existsSync(path.join(dir, HOOK_PATH)));
  assert.equal(fs.existsSync(path.join(dir, ".gemini")), false);
});

test("doctor reports the Gemini hook state when .gemini/ exists", () => {
  const dir = makeProject({ [GEMINI_SETTINGS_PATH]: "{}" });
  assert.match(aief(dir, ["doctor"]).out, /Gemini CLI guardrails:\n○ Approval guard hook not installed \(optional: aief guardrails install --assistant gemini\)/);
  aief(dir, ["guardrails", "install", "--assistant", "gemini"]);
  assert.match(aief(dir, ["doctor"]).out, /✓ Approval guard hook installed and registered \(Gemini runs it only in a trusted folder\)/);
  fs.writeFileSync(path.join(dir, GEMINI_SETTINGS_PATH), "{}");
  assert.match(aief(dir, ["doctor"]).out, /! \.gemini\/hooks\/aief-approval-guard\.mjs exists but is not registered/);
  assert.doesNotMatch(aief(makeProject(), ["doctor"]).out, /Gemini CLI guardrails:/, "silent without .gemini/");
});

test("hook denies a Gemini write_file or replace that checks or removes an approval, as JSON on exit 0", () => {
  const { dir } = changeProject();
  const replace = runGeminiHook(dir, { tool_name: "replace", tool_input: { file_path: "changes/0001-x/tasks.md", instruction: "approve", old_string: "- [ ] (human) Owner approves", new_string: "- [x] (human) Owner approves" } });
  assert.match(geminiDenial(replace), /^AIEF approval guard: .*\nThis edit to changes\/0001-x\/tasks\.md would change:\n  - checked: \(human\) Owner approves\n/);
  assert.equal(replace.stderr, "");
  assert.match(geminiDenial(runGeminiHook(dir, { tool_name: "write_file", tool_input: { file_path: path.join(dir, "changes/0001-x/tasks.md"), content: "# Tasks\n\n- [x] Work\n" } })), /removed: \(human\) Owner approves/);
  assert.match(geminiDenial(runGeminiHook(dir, { tool_name: "replace", tool_input: { file_path: "changes/0001-x/spec.md", old_string: "- [ ]", new_string: "- [-]", allow_multiple: true } })), /checked: \(human\) Owner signs off/);
});

test("Claude Code events still block with exit 2 and nothing on stdout", () => {
  const { dir, tasks } = changeProject();
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: "Edit", tool_input: { file_path: tasks, old_string: "- [ ] (human)", new_string: "- [x] (human)" } }), encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
});

test("hook allows Gemini edits that keep approvals unchecked, other tools, and files outside changes/", () => {
  const { dir } = changeProject();
  assert.equal(geminiDenial(runGeminiHook(dir, { tool_name: "replace", tool_input: { file_path: "changes/0001-x/tasks.md", old_string: "- [x] Work", new_string: "- [x] Work done" } })), null);
  assert.equal(geminiDenial(runGeminiHook(dir, { tool_name: "write_file", tool_input: { file_path: "src/app.js", content: "b\n" } })), null);
  assert.equal(geminiDenial(runGeminiHook(dir, { tool_name: "run_shell_command", tool_input: { command: "ls" } })), null);
});
