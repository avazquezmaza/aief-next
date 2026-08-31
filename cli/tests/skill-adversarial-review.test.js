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

test("appliesTo: blocked while a tracked Change is still at the \"work\" stage — nothing implemented yet", () => {
  const context = {
    change: { basename: "0001-thing", closed: false },
    workflow: { kind: "resolved", state: { stage: "work" } }
  };
  const result = appliesTo(context);
  assert.equal(result.applicable, false);
  assert.equal(result.status, "blocked");
  assert.match(result.reason, /"work" stage/);
});

for (const stage of ["verify", "security_review", "review", "close"]) {
  test(`appliesTo: applicable once a tracked Change reaches the "${stage}" stage`, () => {
    const context = {
      change: { basename: "0001-thing", closed: false },
      workflow: { kind: "resolved", state: { stage } }
    };
    assert.deepEqual(appliesTo(context), { applicable: true });
  });
}

test("appliesTo: applicable to an open legacy Change with no Workflow track — widest safe default, no invented stage", () => {
  const context = { change: { basename: "0001-thing", closed: false }, workflow: null };
  assert.deepEqual(appliesTo(context), { applicable: true });
});

// --- buildInstructions() ---

test("buildInstructions: names the Change and covers the review's own steps and severities", () => {
  const context = { change: { basename: "0001-thing", closed: false }, workflow: null, sdd: null };
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

test("buildInstructions: cites the SDD provider's own requirement/task counts when present, instead of re-deriving them", () => {
  const context = {
    change: { basename: "0001-thing", closed: false },
    workflow: null,
    sdd: { providerId: "local", requirements: [{ id: "R1", title: "x" }], tasks: [{ id: "T1", text: "y" }] }
  };
  const text = buildInstructions(context);
  assert.match(text, /local/);
  assert.match(text, /1 requirement\(s\) and 1 task\(s\)/);
});

test("buildInstructions: an sdd section with an error is not cited as a source", () => {
  const context = { change: { basename: "0001-thing", closed: false }, workflow: null, sdd: { error: "provider unavailable" } };
  const text = buildInstructions(context);
  assert.doesNotMatch(text, /requirement\(s\)/);
});

// --- summarize() ---

test("summarize: ready vs. any other status", () => {
  assert.equal(summarize({ status: "ready" }), "Adversarial review instructions ready.");
  assert.equal(summarize({ status: "blocked" }), "adversarial-review: blocked");
});
