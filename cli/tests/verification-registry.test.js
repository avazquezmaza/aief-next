import { test } from "node:test";
import assert from "node:assert/strict";
import { hasRule, getRule, ruleIds, rulesForScope, describeRule, listDescriptors, createRegistry } from "../src/verification-rules/index.js";

function fixture(overrides = {}) {
  return {
    id: "fixture-rule",
    version: "1.0.0",
    title: "Fixture Rule",
    description: "A fixture Verification Rule for registry tests.",
    scope: "requirement",
    capabilities: { readContext: true },
    evidenceTypes: [],
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ status: "passed", summary: "ok" }),
    ...overrides
  };
}

test("the real registry contains exactly the two Entrega 7 rules, in a fixed order", () => {
  assert.deepEqual(ruleIds(), ["requirement-has-traceability", "evidence-reference-integrity"]);
});

test("hasRule/getRule: known ids resolve, unknown ids do not", () => {
  assert.equal(hasRule("requirement-has-traceability"), true);
  assert.equal(hasRule("does-not-exist"), false);
  assert.notEqual(getRule("requirement-has-traceability"), null);
  assert.equal(getRule("does-not-exist"), null);
});

test("getRule: unknown id returns null, never undefined", () => {
  const result = getRule("nope");
  assert.equal(result, null);
  assert.notEqual(result, undefined);
});

test("rulesForScope: both real rules are scope 'requirement'; 'change' scope is empty (defined, unused)", () => {
  assert.deepEqual(rulesForScope("requirement"), ["requirement-has-traceability", "evidence-reference-integrity"]);
  assert.deepEqual(rulesForScope("change"), []);
});

test("describeRule/listDescriptors expose only descriptor metadata, not the implementation methods", () => {
  const descriptors = listDescriptors();
  assert.equal(descriptors.length, 2);
  for (const d of descriptors) {
    assert.deepEqual(Object.keys(d).sort(), ["capabilities", "description", "evidenceTypes", "id", "scope", "title", "version"]);
  }
});

test("createRegistry: a valid module list registers cleanly", () => {
  const registry = createRegistry([fixture()]);
  assert.ok(registry["fixture-rule"]);
});

test("createRegistry: duplicate ids across two different modules are rejected", () => {
  assert.throws(
    () => createRegistry([fixture(), fixture({ description: "a second module claiming the same id" })]),
    /Duplicate Verification Rule id "fixture-rule"/
  );
});

test("createRegistry: an invalid descriptor is rejected with a specific message", () => {
  assert.throws(() => createRegistry([fixture({ id: "" })]), /Invalid Verification Rule descriptor/);
});

test("createRegistry: a descriptor claiming a forbidden capability is rejected", () => {
  assert.throws(
    () => createRegistry([fixture({ capabilities: { readContext: true, writeFiles: true } })]),
    /Model C/
  );
});

test("createRegistry: registration order is the input array's own order", () => {
  const a = fixture({ id: "a-rule" });
  const b = fixture({ id: "b-rule" });
  const registry = createRegistry([b, a]);
  assert.deepEqual(Object.keys(registry), ["b-rule", "a-rule"]);
});

test("the registry cannot be mutated by a caller at runtime", () => {
  const before = ruleIds();
  const descriptor = getRule("requirement-has-traceability");
  try { descriptor.id = "hijacked"; } catch { /* frozen module namespace object either way */ }
  assert.deepEqual(ruleIds(), before);
  assert.equal(getRule("requirement-has-traceability").id, "requirement-has-traceability");
});
