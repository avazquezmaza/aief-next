import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeProject, aief } from "./helpers/cli-runner.js";
import { ASSISTANT_FILES } from "../src/core/domain/assistant-resolver.js";
import { SKILL_TARGETS } from "../src/core/domain/assistant-skill.js";

// Every registered assistant (Change 0163: Cursor and Kiro joined Claude, Codex and Gemini).
const assistants = ASSISTANT_FILES;

function fixture(t) {
  const dir = makeProject({ "README.md": "A small library.", "AGENTS.md": "Follow the selected specification." });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const file of Object.values(assistants)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), "Follow AGENTS.md.\n");
  }
  for (const name of ["first", "second"]) assert.equal(aief(dir, ["new-change", name]).status, 0);
  return dir;
}

// The procedure is the one part of a prompt that legitimately differs: a pointer to an installed
// skill, or the procedure itself (ADR-039 D5).
const PROCEDURE = /\n(?:Follow the aief-change skill \([^)]+\) for the Change procedure\.|Change procedure \(aief-change\):\n\n[\s\S]*?)\n(?=\nWhere results belong:)/;

test("parity covers every registered assistant", () => {
  assert.deepEqual(Object.keys(assistants).sort(), ["claude", "codex", "cursor", "gemini", "kiro"]);
});

for (const [assistant, nativeFile] of Object.entries(assistants)) {
  test(`${assistant}: explicit Change selection and native instructions are isolated from other assistants`, (t) => {
    const dir = fixture(t);
    const result = aief(dir, ["prompt", assistant, "--change", "0001"], { AIEF_ASSISTANT: "invalid" });
    assert.equal(result.status, 0, result.out);
    assert.ok(result.out.includes("changes/0001-first/spec.md"));
    assert.ok(result.out.includes(`- ${nativeFile}`));
    assert.ok(!result.out.includes("changes/0002-second"));
    for (const other of Object.values(assistants).filter((file) => file !== nativeFile)) {
      assert.ok(!result.out.includes(`- ${other}`));
    }
    fs.unlinkSync(path.join(dir, nativeFile));
    const fallback = aief(dir, ["prompt", assistant, "--change", "0001"]);
    assert.equal(fallback.status, 0, fallback.out);
    assert.match(fallback.out, /Use AGENTS.md/);
    for (const other of Object.values(assistants)) assert.ok(!fallback.out.includes(`- ${other}`));
  });

  test(`${assistant}: ambiguous Change selection fails and writes nothing`, (t) => {
    const dir = fixture(t);
    const before = fs.readFileSync(path.join(dir, "changes/0001-first/tasks.md"), "utf8");
    const result = aief(dir, ["prompt", assistant]);
    assert.notEqual(result.status, 0);
    assert.match(result.out, /--change/);
    assert.equal(fs.readFileSync(path.join(dir, "changes/0001-first/tasks.md"), "utf8"), before);
  });

  test(`${assistant}: prompting cannot clear human or independent review gates`, (t) => {
    const dir = fixture(t);
    const change = path.join(dir, "changes/0001-first");
    const tasks = "# Tasks\n\n- [x] Implement the requested scope.\n- [ ] (human) Approve outcome.\n- [ ] (review) Review independently.\n";
    fs.writeFileSync(path.join(change, "tasks.md"), tasks);
    fs.writeFileSync(path.join(change, "spec.md"), "# Specification\n\n## Goal\n\nKeep the result stable.\n");
    fs.writeFileSync(path.join(change, "evidence.md"), "# Evidence\n\nImplementation was verified locally. Human and review gates remain open.\n");
    assert.equal(aief(dir, ["prompt", assistant, "--change", "0001"]).status, 0);
    const closed = aief(dir, ["close", "--yes", "--change", "0001"], { AIEF_ASSISTANT: assistant });
    assert.notEqual(closed.status, 0, closed.out);
    assert.match(closed.out, /unchecked task/i);
    assert.equal(fs.readFileSync(path.join(change, "tasks.md"), "utf8"), tasks);
    assert.doesNotMatch(fs.readFileSync(path.join(change, "change.md"), "utf8"), /Closed \(/);
  });

  test(`${assistant}: the prompt points to its installed skill, or carries the procedure when it has none`, (t) => {
    const dir = fixture(t);
    const install = aief(dir, ["skill", "install", assistant]);
    assert.equal(install.status, 0, install.out);
    const { out } = aief(dir, ["prompt", assistant, "--change", "0001"]);
    if (SKILL_TARGETS[assistant]) {
      assert.ok(fs.existsSync(path.join(dir, SKILL_TARGETS[assistant])));
      assert.ok(out.includes(`Follow the aief-change skill (${SKILL_TARGETS[assistant]}) for the Change procedure.`), out);
      assert.doesNotMatch(out, /Change procedure \(aief-change\):/);
    } else {
      assert.match(install.out, new RegExp(`${assistant} has no skill mechanism`));
      assert.match(out, /Change procedure \(aief-change\):\n\n# Working an AIEF Change/);
    }
  });
}

test("prompt bodies are identical across assistants apart from their instruction file and procedure", (t) => {
  const dir = fixture(t);
  const prompts = Object.entries(assistants).map(([assistant, file]) => {
    const result = aief(dir, ["prompt", assistant, "--change", "0001"]);
    assert.equal(result.status, 0, result.out);
    assert.match(result.out, PROCEDURE);
    return result.out.replace(`- ${file}`, "- ASSISTANT.md").replace(PROCEDURE, "\nPROCEDURE\n");
  });
  for (const body of prompts.slice(1)) assert.equal(body, prompts[0]);
});
