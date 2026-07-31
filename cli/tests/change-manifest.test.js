import test from "node:test";
import assert from "node:assert/strict";

import { parseManifest, validateManifest, MANIFEST_SCHEMA_VERSION } from "../src/core/domain/change-manifest.js";

const VALID_MANIFEST = {
  schema: MANIFEST_SCHEMA_VERSION,
  id: "0043",
  slug: "core3-change-foundation",
  title: "AIEF Core 3.0 — Change Foundation",
  status: "open"
};

test("parseManifest: valid JSON object parses ok", () => {
  const result = parseManifest(JSON.stringify(VALID_MANIFEST));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, VALID_MANIFEST);
});

test("parseManifest: malformed JSON is reported, not thrown", () => {
  const result = parseManifest("{ not json");
  assert.equal(result.ok, false);
  assert.match(result.error, /not valid JSON/);
});

test("parseManifest: a JSON array or scalar is rejected as not an object", () => {
  assert.equal(parseManifest("[]").ok, false);
  assert.equal(parseManifest("42").ok, false);
  assert.equal(parseManifest("null").ok, false);
});

test("validateManifest: a fully valid manifest has no errors", () => {
  const { valid, errors } = validateManifest(VALID_MANIFEST);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateManifest: wrong schema value is reported by field name", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, schema: "aief.change/v2" });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "schema"));
});

for (const field of ["id", "slug", "title"]) {
  test(`validateManifest: missing "${field}" is reported by field name`, () => {
    const { [field]: _omit, ...withoutField } = VALID_MANIFEST;
    const { valid, errors } = validateManifest(withoutField);
    assert.equal(valid, false);
    assert.ok(errors.some((e) => e.field === field), `expected an error for field "${field}"`);
  });
}

test("validateManifest: an invalid status enum value is reported with the offending value", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, status: "in_progress" });
  assert.equal(valid, false);
  const statusError = errors.find((e) => e.field === "status");
  assert.ok(statusError);
  assert.match(statusError.message, /"in_progress"/);
});

test("validateManifest: multiple violations are all reported, not just the first", () => {
  const { valid, errors } = validateManifest({ schema: "wrong", status: "nope" });
  assert.equal(valid, false);
  const fields = errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ["id", "schema", "slug", "status", "title"]);
});

// Entrega 3 (Change 0045, spec.md SDD-R26/R27/R28): sdd is optional.
test("validateManifest: absence of sdd is never an error", () => {
  const { valid, errors } = validateManifest(VALID_MANIFEST);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateManifest: a valid sdd section (provider + change_id) passes", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, sdd: { provider: "openspec", change_id: "add-login" } });
  assert.equal(valid, true);
});

test("validateManifest: sdd.provider must be a known provider id", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, sdd: { provider: "totally-unknown" } });
  assert.equal(valid, false);
  const error = errors.find((e) => e.field === "sdd.provider");
  assert.ok(error);
  assert.match(error.message, /"totally-unknown"/);
});

test("validateManifest: sdd.change_id must be a non-empty string when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, sdd: { change_id: 42 } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "sdd.change_id"));
});

test("validateManifest: sdd.change_id without sdd.provider is structurally valid — resolution (not structure) reports it unusable", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, sdd: { change_id: "add-login" } });
  assert.equal(valid, true);
});

test("validateManifest: sdd must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, sdd: "openspec" });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "sdd"));
});

// --- Change 0056/ADR-026: harness structural validation ---

test("validateManifest: no harness field is valid (the default for every existing Change)", () => {
  const { valid, errors } = validateManifest(VALID_MANIFEST);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateManifest: a minimal valid harness (log only) passes", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, harness: { log: true } });
  assert.equal(valid, true);
});

test("validateManifest: a full valid harness (log + hooks.<event>.disabled) passes", () => {
  const { valid } = validateManifest({
    ...VALID_MANIFEST,
    harness: { log: true, hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] }, "verify.completed": { disabled: [] } } }
  });
  assert.equal(valid, true);
});

test("validateManifest: harness must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, harness: "yes" });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "harness"));
});

test("validateManifest: harness.log must be a boolean when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, harness: { log: "true" } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "harness.log"));
});

test("validateManifest: an unknown event key in harness.hooks is rejected, naming the known events", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, harness: { hooks: { "some.unknown.event": {} } } });
  assert.equal(valid, false);
  const error = errors.find((e) => e.field === "harness.hooks.some.unknown.event");
  assert.ok(error);
  assert.match(error.message, /prompt\.prepared/);
  assert.match(error.message, /verify\.completed/);
});

test("validateManifest: harness.hooks.<event>.disabled must be an array of non-empty strings", () => {
  const notArray = validateManifest({ ...VALID_MANIFEST, harness: { hooks: { "prompt.prepared": { disabled: "prompt-skill-suggestion" } } } });
  assert.equal(notArray.valid, false);
  assert.ok(notArray.errors.some((e) => e.field === "harness.hooks.prompt.prepared.disabled"));

  const badEntry = validateManifest({ ...VALID_MANIFEST, harness: { hooks: { "prompt.prepared": { disabled: ["", 42] } } } });
  assert.equal(badEntry.valid, false);
  assert.ok(badEntry.errors.some((e) => e.field === "harness.hooks.prompt.prepared.disabled"));
});

test("validateManifest: harness.hooks.<event> must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, harness: { hooks: { "prompt.prepared": ["not", "an", "object"] } } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "harness.hooks.prompt.prepared"));
});

test("validateManifest: harness.hooks must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, harness: { hooks: "nope" } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "harness.hooks"));
});

test("validateManifest: an unknown Hook id inside a known event's disabled list is structurally valid (existence is a runtime concern, not structural)", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, harness: { hooks: { "prompt.prepared": { disabled: ["totally-made-up-hook"] } } } });
  assert.equal(valid, true);
});

// --- Change 0057/ADR-027: loop structural validation ---

test("validateManifest: no loop field is valid (the default for every existing Change)", () => {
  const { valid, errors } = validateManifest(VALID_MANIFEST);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateManifest: loop.verify present with no maxRetries is structurally valid (default applied at runtime)", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, loop: { verify: {} } });
  assert.equal(valid, true);
});

test("validateManifest: a valid loop.verify.maxRetries passes", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, loop: { verify: { maxRetries: 5 } } });
  assert.equal(valid, true);
});

test("validateManifest: loop must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, loop: "yes" });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "loop"));
});

test("validateManifest: loop.verify must be an object when present", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, loop: { verify: "yes" } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "loop.verify"));
});

test("validateManifest: loop.verify.maxRetries must be a positive integer", () => {
  for (const bad of [0, -1, 1.5, "three", null, []]) {
    const { valid, errors } = validateManifest({ ...VALID_MANIFEST, loop: { verify: { maxRetries: bad } } });
    assert.equal(valid, false, `maxRetries ${JSON.stringify(bad)} must be rejected`);
    assert.ok(errors.some((e) => e.field === "loop.verify.maxRetries"));
  }
});

// --- Change 0058/ADR-028: dependsOn structural validation ---

test("validateManifest: no dependsOn field is valid (the default for every existing Change)", () => {
  const { valid, errors } = validateManifest(VALID_MANIFEST);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateManifest: a valid dependsOn array passes", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, dependsOn: ["0001-thing", "0002-other"] });
  assert.equal(valid, true);
});

test("validateManifest: an empty dependsOn array is valid", () => {
  const { valid } = validateManifest({ ...VALID_MANIFEST, dependsOn: [] });
  assert.equal(valid, true);
});

test("validateManifest: dependsOn must be an array", () => {
  const { valid, errors } = validateManifest({ ...VALID_MANIFEST, dependsOn: "0001-thing" });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "dependsOn"));
});

test("validateManifest: dependsOn entries must be non-empty strings", () => {
  for (const bad of [[""], [42], [null], [{ id: "x" }]]) {
    const { valid, errors } = validateManifest({ ...VALID_MANIFEST, dependsOn: bad });
    assert.equal(valid, false, `dependsOn ${JSON.stringify(bad)} must be rejected`);
    assert.ok(errors.some((e) => e.field === "dependsOn"));
  }
});

test("validateManifest: referential validity of dependsOn is not checked here (structural only)", () => {
  // "does 0099-ghost exist" and "is there a cycle" are cross-Change facts
  // only change-graph.js can determine — a single manifest naming a
  // nonexistent Change is still structurally valid.
  const { valid } = validateManifest({ ...VALID_MANIFEST, dependsOn: ["0099-totally-made-up"] });
  assert.equal(valid, true);
});
