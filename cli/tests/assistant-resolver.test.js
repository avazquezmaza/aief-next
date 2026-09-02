import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ASSISTANT_FILES, hasAssistant, assistantIds, assistantConfigPath, resolveAssistant, readProjectAssistantConfig } from "../src/core/domain/assistant-resolver.js";

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-assistant-resolver-"));
}
function writeAssistantFile(cwd, id) {
  // Change 0112: kiro's native file lives under .kiro/skills/aief-change/ —
  // mkdir recursive so a nested-path assistant file works the same as a
  // flat one, no special-casing per assistant.
  const filePath = path.join(cwd, ASSISTANT_FILES[id]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "# instructions\n", "utf8");
}
function writeConfig(cwd, content) {
  fs.mkdirSync(path.join(cwd, "knowledge"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "knowledge", "assistant.json"), content, "utf8");
}

test("registry: ASSISTANT_FILES is the single source of truth for known assistants", () => {
  assert.deepEqual(assistantIds().sort(), ["claude", "codex", "cursor", "gemini", "kiro"]);
  assert.equal(hasAssistant("claude"), true);
  assert.equal(hasAssistant("kiro"), true);
  assert.equal(hasAssistant("bogus"), false);
  assert.equal(ASSISTANT_FILES.gemini, "GEMINI.md");
  // Change 0112: Kiro has no root instruction file like the other four —
  // its native artifact is a workspace Skill package.
  assert.equal(ASSISTANT_FILES.kiro, ".kiro/skills/aief-change/SKILL.md");
});

test("resolveAssistant: no signal at all resolves to 'none' — the valid generic-prompt case, not an error", () => {
  const cwd = tempCwd();
  const result = resolveAssistant({ cwd });
  assert.equal(result.assistantId, null);
  assert.equal(result.source, "none");
  assert.equal(result.error, undefined);
});

test("resolveAssistant: explicit argument always wins, even with other signals present", () => {
  const cwd = tempCwd();
  writeAssistantFile(cwd, "gemini");
  writeConfig(cwd, JSON.stringify({ defaultAssistant: "codex" }));
  const result = resolveAssistant({ explicit: "claude", env: "cursor", cwd });
  assert.equal(result.assistantId, "claude");
  assert.equal(result.source, "explicit");
});

test("resolveAssistant: an unknown explicit assistant is an error, never a silent fallback", () => {
  const result = resolveAssistant({ explicit: "clippy", cwd: tempCwd() });
  assert.ok(result.error);
  assert.match(result.error, /unknown assistant/);
  assert.equal(result.assistantId, undefined);
});

test("resolveAssistant: AIEF_ASSISTANT wins over knowledge/assistant.json and passive detection", () => {
  const cwd = tempCwd();
  writeAssistantFile(cwd, "claude");
  writeConfig(cwd, JSON.stringify({ defaultAssistant: "codex" }));
  const result = resolveAssistant({ env: "gemini", cwd });
  assert.equal(result.assistantId, "gemini");
  assert.equal(result.source, "env");
});

test("resolveAssistant: an unknown AIEF_ASSISTANT value is an error, never silently ignored", () => {
  const result = resolveAssistant({ env: "clippy", cwd: tempCwd() });
  assert.ok(result.error);
  assert.match(result.error, /AIEF_ASSISTANT/);
});

test("resolveAssistant: knowledge/assistant.json wins over passive detection", () => {
  const cwd = tempCwd();
  writeAssistantFile(cwd, "claude");
  writeConfig(cwd, JSON.stringify({ defaultAssistant: "gemini" }));
  const result = resolveAssistant({ cwd });
  assert.equal(result.assistantId, "gemini");
  assert.equal(result.source, "project-config");
});

test("resolveAssistant: an unknown assistant in knowledge/assistant.json is an explicit error", () => {
  const cwd = tempCwd();
  writeConfig(cwd, JSON.stringify({ defaultAssistant: "bogus" }));
  const result = resolveAssistant({ cwd });
  assert.ok(result.error);
  assert.match(result.error, /unknown assistant/);
});

test("resolveAssistant: malformed knowledge/assistant.json is reported, never thrown", () => {
  const cwd = tempCwd();
  writeConfig(cwd, "{not json");
  const result = resolveAssistant({ cwd });
  assert.ok(result.error);
  assert.match(result.error, /not valid JSON/);
});

for (const id of ["claude", "gemini", "codex", "cursor", "kiro"]) {
  test(`resolveAssistant: passive detection finds a single ${id.toUpperCase()} file symmetrically`, () => {
    const cwd = tempCwd();
    writeAssistantFile(cwd, id);
    const result = resolveAssistant({ cwd });
    assert.equal(result.assistantId, id);
    assert.equal(result.source, "detected");
  });
}

test("resolveAssistant: two native files with no other signal are reported ambiguous, never guessed", () => {
  const cwd = tempCwd();
  writeAssistantFile(cwd, "claude");
  writeAssistantFile(cwd, "gemini");
  const result = resolveAssistant({ cwd });
  assert.equal(result.source, "ambiguous");
  assert.deepEqual(result.ambiguous.sort(), ["claude", "gemini"]);
  assert.equal(result.assistantId, undefined);
});

test("resolveAssistant: is deterministic — same input, same result, every call", () => {
  const cwd = tempCwd();
  writeAssistantFile(cwd, "codex");
  const first = resolveAssistant({ cwd });
  const second = resolveAssistant({ cwd });
  assert.equal(first.assistantId, second.assistantId);
  assert.equal(first.source, second.source);
});

test("readProjectAssistantConfig: null when absent, distinct from an empty/invalid file", () => {
  const cwd = tempCwd();
  assert.equal(readProjectAssistantConfig(cwd), null);
  writeConfig(cwd, JSON.stringify({ defaultAssistant: "claude" }));
  assert.deepEqual(readProjectAssistantConfig(cwd), { assistantId: "claude" });
});

test("assistantConfigPath: points at knowledge/assistant.json under the given cwd", () => {
  const cwd = tempCwd();
  assert.equal(assistantConfigPath(cwd), path.join(cwd, "knowledge", "assistant.json"));
});
