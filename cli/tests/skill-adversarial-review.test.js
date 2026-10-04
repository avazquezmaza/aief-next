import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { appliesTo, buildInstructions, capabilities, summarize } from "../src/skills/adversarial-review.js";

// --- descriptor / capability lock ---

test("adversarial-review: capabilities declare instructions-only, no write/exec/network, assistant-agnostic", () => {
  assert.deepEqual(capabilities, {
    instructions: true,
    deterministicExecution: false,
    writeFiles: false,
    executeCommands: false,
    network: false,
    assistantRequired: false
  });
});

test("adversarial-review: the module's own source contains no Claude/Gemini-specific reference", () => {
  const source = fs.readFileSync(new URL("../src/skills/adversarial-review.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /claude|gemini/i);
});

// --- appliesTo() ---

test("appliesTo: not applicable when no Change is resolved", () => {
  assert.deepEqual(appliesTo(null), { applicable: false, status: "not_applicable", reason: "no Change resolved" });
  assert.deepEqual(appliesTo({}), { applicable: false, status: "not_applicable", reason: "no Change resolved" });
});

test("appliesTo: not applicable once the Change is closed — this review is for before archiving", () => {
  const context = { change: { basename: "0001-thing", closed: true } };
  const result = appliesTo(context);
  assert.equal(result.applicable, false);
  assert.equal(result.status, "not_applicable");
  assert.match(result.reason, /already closed/);
});

test("appliesTo: applicable to any open Change", () => {
  const context = { change: { basename: "0001-thing", closed: false } };
  assert.deepEqual(appliesTo(context), { applicable: true });
});

// --- buildInstructions() ---

test("buildInstructions: names the Change and covers the review's own steps and severities", () => {
  const context = { change: { basename: "0001-thing", closed: false } };
  const text = buildInstructions(context);
  assert.match(text, /0001-thing/);
  assert.match(text, /spec\.md/);
  assert.match(text, /tasks\.md/);
  assert.match(text, /Blocker/);
  assert.match(text, /Major/);
  assert.match(text, /Minor/);
  assert.match(text, /PASS WITH GAPS/);
  assert.match(text, /FAIL/);
});

// --- summarize() ---

test("summarize: ready vs. any other status", () => {
  assert.equal(summarize({ status: "ready" }), "Adversarial review instructions ready.");
  assert.equal(summarize({ status: "blocked" }), "adversarial-review: blocked");
});
