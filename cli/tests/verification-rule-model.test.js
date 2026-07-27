import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateDescriptor, SCOPE_VALUES, KNOWN_CAPABILITIES, FORBIDDEN_CAPABILITIES,
  EVIDENCE_TYPES, SUPPORTED_EVIDENCE_TYPES, INSUFFICIENT_ALONE_EVIDENCE_TYPES, REJECTED_EVIDENCE_TYPES,
  STATUS_VALUES, APPLICABILITY_STATUSES, AGGREGATE_STATUS_VALUES
} from "../src/core/domain/verification-rule.js";

function validRule(overrides = {}) {
  return {
    id: "sample-rule",
    version: "1.0.0",
    title: "Sample Rule",
    description: "A minimal valid Verification Rule fixture.",
    scope: "requirement",
    capabilities: { readContext: true, readEvidence: true },
    evidenceTypes: ["artifact_state"],
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ status: "passed", summary: "ok" }),
    ...overrides
  };
}

test("validateDescriptor: a minimal valid rule passes", () => {
  const { ok, errors } = validateDescriptor(validRule());
  assert.equal(ok, true, errors.join("; "));
});

test("validateDescriptor: empty/invalid id is rejected", () => {
  assert.equal(validateDescriptor(validRule({ id: "" })).ok, false);
  assert.equal(validateDescriptor(validRule({ id: "../traversal" })).ok, false);
  assert.equal(validateDescriptor(validRule({ id: "a/b" })).ok, false);
  assert.equal(validateDescriptor(validRule({ id: "UPPER" })).ok, false);
});

test("validateDescriptor: invalid version is rejected", () => {
  for (const bad of ["", "1.0", "v1.0.0", "latest"]) {
    assert.equal(validateDescriptor(validRule({ version: bad })).ok, false, `expected ${bad} rejected`);
  }
});

test("validateDescriptor: missing title/description is rejected", () => {
  assert.equal(validateDescriptor(validRule({ title: "" })).ok, false);
  assert.equal(validateDescriptor(validRule({ description: "  " })).ok, false);
});

test("validateDescriptor: scope must be a known value", () => {
  assert.equal(validateDescriptor(validRule({ scope: "unknown-scope" })).ok, false);
  assert.equal(validateDescriptor(validRule({ scope: "change" })).ok, true);
});

test("validateDescriptor: capabilities must be an object", () => {
  assert.equal(validateDescriptor(validRule({ capabilities: null })).ok, false);
  assert.equal(validateDescriptor(validRule({ capabilities: [] })).ok, false);
});

test("validateDescriptor: an unknown capability key is rejected, not ignored", () => {
  const { ok, errors } = validateDescriptor(validRule({ capabilities: { readContext: true, somethingNovel: true } }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unknown key")));
});

test("validateDescriptor: writeFiles/executeCommands/network/assistantRequired cannot be true", () => {
  for (const forbidden of FORBIDDEN_CAPABILITIES) {
    const { ok, errors } = validateDescriptor(validRule({ capabilities: { readContext: true, [forbidden]: true } }));
    assert.equal(ok, false, `expected capabilities.${forbidden}: true rejected`);
    assert.ok(errors.some((e) => e.includes(forbidden) && e.includes("Model C")));
  }
});

test("validateDescriptor: an unknown evidence type is rejected", () => {
  const { ok, errors } = validateDescriptor(validRule({ evidenceTypes: ["not-a-real-type"] }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unknown evidence type")));
});

test("validateDescriptor: a rejected evidence type (command_result/external_reference) cannot be declared", () => {
  for (const rejected of REJECTED_EVIDENCE_TYPES) {
    const { ok, errors } = validateDescriptor(validRule({ evidenceTypes: [rejected] }));
    assert.equal(ok, false, `expected evidenceTypes: [${rejected}] rejected`);
    assert.ok(errors.some((e) => e.includes("rejected evidence type")));
  }
});

test("validateDescriptor: test/manual_attestation CAN be declared (defined, just never sufficient alone)", () => {
  for (const insufficient of INSUFFICIENT_ALONE_EVIDENCE_TYPES) {
    const { ok, errors } = validateDescriptor(validRule({ evidenceTypes: [insufficient] }));
    assert.equal(ok, true, errors.join("; "));
  }
});

test("validateDescriptor: appliesTo/evaluate must be functions", () => {
  const missingApplies = validRule(); delete missingApplies.appliesTo;
  assert.equal(validateDescriptor(missingApplies).ok, false);
  const missingEvaluate = validRule(); delete missingEvaluate.evaluate;
  assert.equal(validateDescriptor(missingEvaluate).ok, false);
});

test("validateDescriptor: multiple problems are all reported, not just the first", () => {
  const { ok, errors } = validateDescriptor({ id: "", version: "bad" });
  assert.equal(ok, false);
  assert.ok(errors.length >= 3);
});

test("constants: exactly the documented vocabulary, nothing accidentally added", () => {
  assert.deepEqual(SCOPE_VALUES, ["requirement", "change"]);
  assert.deepEqual(KNOWN_CAPABILITIES, ["readContext", "readArtifacts", "readEvidence", "executeCommands", "writeFiles", "network", "assistantRequired"]);
  assert.deepEqual(FORBIDDEN_CAPABILITIES, ["writeFiles", "executeCommands", "network", "assistantRequired"]);
  assert.deepEqual(EVIDENCE_TYPES, ["artifact_state", "file_assertion", "test", "manual_attestation", "command_result", "external_reference"]);
  assert.deepEqual(SUPPORTED_EVIDENCE_TYPES, ["artifact_state", "file_assertion"]);
  assert.deepEqual(INSUFFICIENT_ALONE_EVIDENCE_TYPES, ["test", "manual_attestation"]);
  assert.deepEqual(REJECTED_EVIDENCE_TYPES, ["command_result", "external_reference"]);
  assert.deepEqual(STATUS_VALUES, ["passed", "failed", "not_applicable", "blocked", "unsupported", "invalid", "error"]);
  assert.deepEqual(APPLICABILITY_STATUSES, ["not_applicable", "blocked", "unsupported"]);
  assert.deepEqual(AGGREGATE_STATUS_VALUES, ["ERROR", "INVALID", "FAIL", "INCOMPLETE", "PASS"]);
});

test("constants: are frozen — no code can mutate the shared vocabulary at runtime", () => {
  for (const c of [SCOPE_VALUES, KNOWN_CAPABILITIES, FORBIDDEN_CAPABILITIES, EVIDENCE_TYPES, SUPPORTED_EVIDENCE_TYPES, INSUFFICIENT_ALONE_EVIDENCE_TYPES, REJECTED_EVIDENCE_TYPES, STATUS_VALUES, APPLICABILITY_STATUSES, AGGREGATE_STATUS_VALUES]) {
    assert.equal(Object.isFrozen(c), true);
  }
});
