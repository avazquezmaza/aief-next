import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDescriptor, KNOWN_CAPABILITIES, FORBIDDEN_CAPABILITIES, STATUS_VALUES, ID_PATTERN, VERSION_PATTERN } from "../src/core/domain/skill.js";

function validSkill(overrides = {}) {
  return {
    id: "sample-skill",
    version: "1.0.0",
    title: "Sample Skill",
    description: "A minimal valid Skill fixture.",
    capabilities: { instructions: true },
    appliesTo: () => ({ applicable: true }),
    buildInstructions: () => "instructions",
    ...overrides
  };
}

test("validateDescriptor: a minimal valid Skill passes", () => {
  const { ok, errors } = validateDescriptor(validSkill());
  assert.equal(ok, true);
  assert.deepEqual(errors, []);
});

test("validateDescriptor: empty id is rejected", () => {
  const { ok, errors } = validateDescriptor(validSkill({ id: "" }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("id must be")));
});

test("validateDescriptor: id with a path separator or other disallowed character is rejected", () => {
  for (const badId of ["../etc", "a/b", "a\\b", "a.b", "-leading", "trailing-", "UPPER", "has space"]) {
    const { ok } = validateDescriptor(validSkill({ id: badId }));
    assert.equal(ok, false, `expected "${badId}" to be rejected`);
  }
});

test("validateDescriptor: id with traversal sequence is rejected", () => {
  const { ok, errors } = validateDescriptor(validSkill({ id: "../../etc/passwd" }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("id must be")));
});

test("validateDescriptor: duplicate/invalid version formats are rejected", () => {
  for (const badVersion of ["", "1.0", "v1.0.0", "1.0.0-beta", "latest", 1]) {
    const { ok } = validateDescriptor(validSkill({ version: badVersion }));
    assert.equal(ok, false, `expected version ${JSON.stringify(badVersion)} to be rejected`);
  }
});

test("validateDescriptor: missing title/description is rejected", () => {
  assert.equal(validateDescriptor(validSkill({ title: "" })).ok, false);
  assert.equal(validateDescriptor(validSkill({ description: "   " })).ok, false);
});

test("validateDescriptor: capabilities must be an object", () => {
  assert.equal(validateDescriptor(validSkill({ capabilities: null })).ok, false);
  assert.equal(validateDescriptor(validSkill({ capabilities: [] })).ok, false);
  assert.equal(validateDescriptor(validSkill({ capabilities: "instructions" })).ok, false);
});

test("validateDescriptor: an unknown capability key is rejected, not ignored", () => {
  const { ok, errors } = validateDescriptor(validSkill({ capabilities: { instructions: true, buildInstructions: true, somethingNovel: true } }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unknown key")));
});

test("validateDescriptor: writeFiles/executeCommands/network cannot be true", () => {
  for (const forbidden of FORBIDDEN_CAPABILITIES) {
    const { ok, errors } = validateDescriptor(validSkill({ capabilities: { instructions: true, [forbidden]: true } }));
    assert.equal(ok, false, `expected capabilities.${forbidden}: true to be rejected`);
    assert.ok(errors.some((e) => e.includes(forbidden) && e.includes("Model C")));
  }
});

test("validateDescriptor: capabilities.instructions true without buildInstructions() is rejected", () => {
  const mod = validSkill({ capabilities: { instructions: true } });
  delete mod.buildInstructions;
  const { ok, errors } = validateDescriptor(mod);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("buildInstructions")));
});

test("validateDescriptor: buildInstructions() present without capabilities.instructions is rejected (inconsistent metadata)", () => {
  const { ok, errors } = validateDescriptor(validSkill({ capabilities: { instructions: false }, buildInstructions: () => "x" }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("buildInstructions() is defined")));
});

test("validateDescriptor: capabilities.deterministicExecution true without execute() is rejected", () => {
  const { ok, errors } = validateDescriptor(validSkill({ capabilities: { instructions: true, deterministicExecution: true } }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("execute()")));
});

test("validateDescriptor: execute() present without capabilities.deterministicExecution is rejected (inconsistent metadata)", () => {
  const { ok, errors } = validateDescriptor(validSkill({ execute: () => ({}) }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("execute() is defined")));
});

test("validateDescriptor: a valid deterministic-execution Skill (instructions + execute) passes", () => {
  const mod = validSkill({
    capabilities: { instructions: true, deterministicExecution: true },
    execute: () => ({ findings: [] })
  });
  const { ok, errors } = validateDescriptor(mod);
  assert.equal(ok, true, errors.join("; "));
});

test("validateDescriptor: appliesTo must be a function", () => {
  const mod = validSkill();
  delete mod.appliesTo;
  assert.equal(validateDescriptor(mod).ok, false);
  assert.equal(validateDescriptor(validSkill({ appliesTo: "not a function" })).ok, false);
});

test("validateDescriptor: summarize, if present, must be a function", () => {
  assert.equal(validateDescriptor(validSkill({ summarize: "not a function" })).ok, false);
  assert.equal(validateDescriptor(validSkill({ summarize: () => "ok" })).ok, true);
});

test("validateDescriptor: multiple problems are all reported, not just the first", () => {
  const { ok, errors } = validateDescriptor({ id: "", version: "bad" });
  assert.equal(ok, false);
  assert.ok(errors.length >= 3);
});

test("constants: exactly the documented vocabulary, nothing accidentally added", () => {
  assert.deepEqual(KNOWN_CAPABILITIES, ["instructions", "deterministicExecution", "writeFiles", "executeCommands", "network", "assistantRequired"]);
  assert.deepEqual(FORBIDDEN_CAPABILITIES, ["writeFiles", "executeCommands", "network"]);
  assert.deepEqual(STATUS_VALUES, ["ready", "completed", "not_applicable", "blocked", "unsupported", "invalid", "failed"]);
});

test("constants: are frozen — no code can mutate the shared capability/status vocabulary at runtime", () => {
  assert.equal(Object.isFrozen(KNOWN_CAPABILITIES), true);
  assert.equal(Object.isFrozen(FORBIDDEN_CAPABILITIES), true);
  assert.equal(Object.isFrozen(STATUS_VALUES), true);
});

test("ID_PATTERN / VERSION_PATTERN: sanity checks used by validateDescriptor", () => {
  assert.equal(ID_PATTERN.test("change-context"), true);
  assert.equal(ID_PATTERN.test("a"), true);
  assert.equal(ID_PATTERN.test("a1-b2"), true);
  assert.equal(ID_PATTERN.test(""), false);
  assert.equal(ID_PATTERN.test("Has-Upper"), false);
  assert.equal(ID_PATTERN.test("has_underscore"), false);
  assert.equal(ID_PATTERN.test("../traversal"), false);
  assert.equal(ID_PATTERN.test("a/b"), false);
  assert.equal(VERSION_PATTERN.test("1.0.0"), true);
  assert.equal(VERSION_PATTERN.test("10.20.30"), true);
  assert.equal(VERSION_PATTERN.test("1.0"), false);
  assert.equal(VERSION_PATTERN.test("v1.0.0"), false);
});
