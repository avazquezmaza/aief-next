import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildEvent, buildHookContext } from "../src/core/services/hook-context.js";

test("buildEvent: rejects an event id outside the closed catalog", () => {
  assert.throws(() => buildEvent("close.requested", "close"), /Unknown event "close.requested"/);
  assert.throws(() => buildEvent("change.created", "new-change"), /Unknown event/);
});

test("buildEvent: produces {id, phase, timestamp, operation} for both real events", () => {
  const promptEvent = buildEvent("prompt.prepared", "prompt", "2026-01-01T00:00:00.000Z");
  assert.deepEqual(promptEvent, { id: "prompt.prepared", phase: "post", timestamp: "2026-01-01T00:00:00.000Z", operation: "prompt" });
  const verifyEvent = buildEvent("verify.completed", "verify", "2026-01-01T00:00:00.000Z");
  assert.equal(verifyEvent.phase, "post");
});

test("buildEvent: timestamp is informational only — omitting it still produces a valid, usable event", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  assert.equal(typeof event.timestamp, "string");
});

test("buildEvent result is frozen", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  assert.throws(() => { event.phase = "pre"; }, TypeError);
});

test("buildHookContext: passes through exactly what the caller supplied, no re-derivation", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  const change = { basename: "0001-thing", closed: false };
  const workflow = { kind: "resolved", state: { stage: "verify" } };
  const sdd = null;
  const project = { signals: [] };
  const context = buildHookContext(event, { project, change, workflow, sdd, operation: { input: {}, result: null } });
  assert.deepEqual(context.change, change);
  assert.deepEqual(context.workflow, workflow);
  assert.equal(context.sdd, null);
  assert.deepEqual(context.project, project);
  assert.equal(context.skill, null);
  assert.deepEqual(Object.keys(context).sort(), ["change", "event", "operation", "project", "sdd", "skill", "workflow"]);
});

test("buildHookContext: preserves manifest errors and provider errors unedited", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  const change = { basename: "0001-thing", manifestError: [{ field: "track", message: "unknown value" }] };
  const sdd = { error: "configured provider \"openspec\" is unavailable" };
  const context = buildHookContext(event, { project: {}, change, workflow: null, sdd, operation: { input: {}, result: null } });
  assert.deepEqual(context.change.manifestError, [{ field: "track", message: "unknown value" }]);
  assert.equal(context.sdd.error, "configured provider \"openspec\" is unavailable");
});

test("buildHookContext: skill defaults to null when the calling operation ran no Skill", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  const context = buildHookContext(event, { project: {}, change: {}, workflow: null, sdd: null, operation: { input: {}, result: null } });
  assert.equal(context.skill, null);
});

test("buildHookContext: an already-computed Skill result passes through unedited", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  const skillResult = { skill: "change-context", status: "ready", instructions: "..." };
  const context = buildHookContext(event, { project: {}, change: {}, workflow: null, sdd: null, skill: skillResult, operation: { input: {}, result: null } });
  assert.deepEqual(context.skill, skillResult);
});

test("buildHookContext: the operation's own result (e.g. a verify report) passes through unedited", () => {
  const event = buildEvent("verify.completed", "verify");
  const report = { passed: true, lines: [] };
  const context = buildHookContext(event, { project: {}, change: {}, workflow: null, sdd: null, operation: { input: { changeId: "0001-thing" }, result: report } });
  assert.deepEqual(context.operation.result, report);
  assert.equal(context.operation.input.changeId, "0001-thing");
});

test("buildHookContext: result is frozen — a caller cannot mutate it", () => {
  const event = buildEvent("prompt.prepared", "prompt");
  const context = buildHookContext(event, { project: {}, change: { basename: "x" }, workflow: null, sdd: null, operation: { input: {}, result: null } });
  assert.throws(() => { context.change = { hijacked: true }; }, TypeError);
  assert.throws(() => { context.change.basename = "hijacked"; }, TypeError);
});

test("buildHookContext: is idempotent — same inputs, same context, every call", () => {
  const event = buildEvent("prompt.prepared", "prompt", "2026-01-01T00:00:00.000Z");
  const inputs = { project: {}, change: { basename: "x" }, workflow: null, sdd: null, operation: { input: {}, result: null } };
  assert.deepEqual(buildHookContext(event, inputs), buildHookContext(event, inputs));
});

test("hook-context.js performs zero file reads or provider calls — structurally, not just observed", () => {
  const source = fs.readFileSync(fileURLToPath(new URL("../src/core/services/hook-context.js", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /^import .*workflow-service\.js/m);
  assert.doesNotMatch(source, /^import .*sdd-provider-resolver\.js/m);
  assert.doesNotMatch(source, /^import .*skill-context\.js/m);
  assert.doesNotMatch(source, /\bfs\.(readFile|existsSync|readdirSync)/);
  // Structural proof this Builder cannot fetch: no changeDir/cwd parameter exists on buildHookContext.
  assert.equal(buildHookContext.length, 2);
});
