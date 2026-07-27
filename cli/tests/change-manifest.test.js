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
