import { test } from "node:test";
import assert from "node:assert/strict";
import { hasSkill, getSkill, skillIds, describeSkill, listDescriptors, createRegistry } from "../src/skills/index.js";

function fixture(overrides = {}) {
  return {
    id: "fixture-skill",
    version: "1.0.0",
    title: "Fixture Skill",
    description: "A fixture Skill for registry tests.",
    capabilities: { instructions: true },
    appliesTo: () => ({ applicable: true }),
    buildInstructions: () => "instructions",
    ...overrides
  };
}

test("the real registry contains exactly the two Entrega 5 Skills, in a fixed order", () => {
  assert.deepEqual(skillIds(), ["change-context", "requirements-analysis-instructions"]);
});

test("hasSkill/getSkill: known ids resolve, unknown ids do not", () => {
  assert.equal(hasSkill("change-context"), true);
  assert.equal(hasSkill("does-not-exist"), false);
  assert.notEqual(getSkill("change-context"), null);
  assert.equal(getSkill("does-not-exist"), null);
});

test("getSkill: unknown id returns null, never undefined", () => {
  const result = getSkill("nope");
  assert.equal(result, null);
  assert.notEqual(result, undefined);
});

test("skillIds/getSkill are deterministic across repeated calls", () => {
  assert.deepEqual(skillIds(), skillIds());
  assert.equal(getSkill("change-context"), getSkill("change-context"));
});

test("describeSkill/listDescriptors expose only descriptor metadata, not the implementation methods", () => {
  const descriptors = listDescriptors();
  assert.equal(descriptors.length, 2);
  for (const d of descriptors) {
    assert.deepEqual(Object.keys(d).sort(), ["capabilities", "description", "id", "title", "version"]);
  }
});

test("every registered Skill's capabilities object is frozen, defense-in-depth against runtime tampering", () => {
  for (const id of skillIds()) {
    assert.equal(Object.isFrozen(getSkill(id).capabilities), true, `${id}'s capabilities object should be frozen`);
  }
});

test("createRegistry: a valid module list registers cleanly", () => {
  const registry = createRegistry([fixture()]);
  assert.ok(registry["fixture-skill"]);
});

test("createRegistry: duplicate ids across two different modules are rejected", () => {
  assert.throws(
    () => createRegistry([fixture(), fixture({ description: "a second module claiming the same id" })]),
    /Duplicate Skill id "fixture-skill"/
  );
});

test("createRegistry: an invalid descriptor is rejected with a specific message", () => {
  assert.throws(() => createRegistry([fixture({ id: "" })]), /Invalid Skill descriptor/);
});

test("createRegistry: a descriptor claiming a forbidden capability is rejected", () => {
  assert.throws(
    () => createRegistry([fixture({ capabilities: { instructions: true, writeFiles: true } })]),
    /Model C/
  );
});

test("createRegistry: registration order is the input array's own order", () => {
  const a = fixture({ id: "a-skill" });
  const b = fixture({ id: "b-skill" });
  const registry = createRegistry([b, a]);
  assert.deepEqual(Object.keys(registry), ["b-skill", "a-skill"]);
});

test("the registry cannot be mutated by a caller at runtime", () => {
  const before = skillIds();
  const descriptor = getSkill("change-context");
  // Attempting to tamper with what getSkill() returned must not affect the
  // registry itself for the next caller (no shared, caller-mutable state).
  try { descriptor.id = "hijacked"; } catch { /* frozen or not, doesn't matter for this assertion */ }
  assert.deepEqual(skillIds(), before);
  assert.equal(getSkill("change-context").id, "change-context");
});
