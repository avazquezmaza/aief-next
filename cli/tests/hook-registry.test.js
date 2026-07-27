import { test } from "node:test";
import assert from "node:assert/strict";
import { hasHook, getHook, hookIds, hooksForEvent, describeHook, listDescriptors, createRegistry } from "../src/hooks/index.js";

function fixture(overrides = {}) {
  return {
    id: "fixture-hook",
    version: "1.0.0",
    title: "Fixture Hook",
    description: "A fixture Hook for registry tests.",
    events: ["prompt.prepared"],
    capabilities: { observe: true, emitInstruction: true },
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ summary: "ok" }),
    ...overrides
  };
}

test("the real registry contains exactly the two Entrega 6 Hooks, in a fixed order", () => {
  assert.deepEqual(hookIds(), ["prompt-skill-suggestion", "post-verify-next-action"]);
});

test("hasHook/getHook: known ids resolve, unknown ids do not", () => {
  assert.equal(hasHook("prompt-skill-suggestion"), true);
  assert.equal(hasHook("does-not-exist"), false);
  assert.notEqual(getHook("prompt-skill-suggestion"), null);
  assert.equal(getHook("does-not-exist"), null);
});

test("getHook: unknown id returns null, never undefined", () => {
  const result = getHook("nope");
  assert.equal(result, null);
  assert.notEqual(result, undefined);
});

test("hooksForEvent: filters correctly for both real events", () => {
  assert.deepEqual(hooksForEvent("prompt.prepared"), ["prompt-skill-suggestion"]);
  assert.deepEqual(hooksForEvent("verify.completed"), ["post-verify-next-action"]);
  assert.deepEqual(hooksForEvent("close.requested"), []);
});

test("describeHook/listDescriptors expose only descriptor metadata, not the implementation methods", () => {
  const descriptors = listDescriptors();
  assert.equal(descriptors.length, 2);
  for (const d of descriptors) {
    assert.deepEqual(Object.keys(d).sort(), ["capabilities", "description", "events", "id", "title", "version"]);
  }
});

test("createRegistry: a valid module list registers cleanly", () => {
  const registry = createRegistry([fixture()]);
  assert.ok(registry["fixture-hook"]);
});

test("createRegistry: duplicate ids across two different modules are rejected", () => {
  assert.throws(
    () => createRegistry([fixture(), fixture({ description: "a second module claiming the same id" })]),
    /Duplicate Hook id "fixture-hook"/
  );
});

test("createRegistry: an invalid descriptor is rejected with a specific message", () => {
  assert.throws(() => createRegistry([fixture({ id: "" })]), /Invalid Hook descriptor/);
});

test("createRegistry: a descriptor claiming a forbidden capability is rejected", () => {
  assert.throws(
    () => createRegistry([fixture({ capabilities: { observe: true, writeFiles: true } })]),
    /Model C/
  );
});

test("createRegistry: an allowedSkills entry that is not a registered Skill is rejected", () => {
  assert.throws(
    () => createRegistry([fixture({ capabilities: { observe: true, invokeSkill: true }, allowedSkills: ["does-not-exist-skill"] })]),
    /not a registered Skill/
  );
});

test("createRegistry: a real allowedSkills entry (change-context) registers cleanly", () => {
  const registry = createRegistry([fixture({ capabilities: { observe: true, invokeSkill: true }, allowedSkills: ["change-context"] })]);
  assert.ok(registry["fixture-hook"]);
});

test("createRegistry: registration order is the input array's own order", () => {
  const a = fixture({ id: "a-hook" });
  const b = fixture({ id: "b-hook" });
  const registry = createRegistry([b, a]);
  assert.deepEqual(Object.keys(registry), ["b-hook", "a-hook"]);
});

test("the registry cannot be mutated by a caller at runtime", () => {
  const before = hookIds();
  const descriptor = getHook("prompt-skill-suggestion");
  try { descriptor.id = "hijacked"; } catch { /* frozen module namespace object either way */ }
  assert.deepEqual(hookIds(), before);
  assert.equal(getHook("prompt-skill-suggestion").id, "prompt-skill-suggestion");
});
