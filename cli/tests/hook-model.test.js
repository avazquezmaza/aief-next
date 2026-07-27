import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateDescriptor, KNOWN_CAPABILITIES, FORBIDDEN_CAPABILITIES, STATUS_VALUES,
  APPLICABILITY_STATUSES, EVENT_CATALOG, EVENT_IDS, isKnownEvent, phaseOf
} from "../src/core/domain/hook.js";

function validHook(overrides = {}) {
  return {
    id: "sample-hook",
    version: "1.0.0",
    title: "Sample Hook",
    description: "A minimal valid Hook fixture.",
    events: ["prompt.prepared"],
    capabilities: { observe: true, emitInstruction: true },
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ summary: "ok" }),
    ...overrides
  };
}

test("event catalog: exactly the two approved events, both phase post", () => {
  assert.deepEqual(EVENT_IDS, ["prompt.prepared", "verify.completed"]);
  assert.equal(phaseOf("prompt.prepared"), "post");
  assert.equal(phaseOf("verify.completed"), "post");
  assert.equal(isKnownEvent("close.requested"), false);
  assert.equal(isKnownEvent("change.created"), false);
  assert.equal(isKnownEvent("verify.requested"), false);
});

test("event catalog is frozen", () => {
  assert.equal(Object.isFrozen(EVENT_CATALOG), true);
  assert.equal(Object.isFrozen(EVENT_CATALOG["prompt.prepared"]), true);
  assert.equal(Object.isFrozen(EVENT_IDS), true);
});

test("validateDescriptor: a minimal valid Hook passes", () => {
  const { ok, errors } = validateDescriptor(validHook());
  assert.equal(ok, true, errors.join("; "));
});

test("validateDescriptor: an event outside the closed catalog is rejected", () => {
  const { ok, errors } = validateDescriptor(validHook({ events: ["close.requested"] }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("outside the closed catalog")));
});

test("validateDescriptor: empty events array is rejected", () => {
  assert.equal(validateDescriptor(validHook({ events: [] })).ok, false);
  assert.equal(validateDescriptor(validHook({ events: undefined })).ok, false);
});

test("validateDescriptor: empty/invalid id is rejected", () => {
  assert.equal(validateDescriptor(validHook({ id: "" })).ok, false);
  assert.equal(validateDescriptor(validHook({ id: "../traversal" })).ok, false);
  assert.equal(validateDescriptor(validHook({ id: "a/b" })).ok, false);
  assert.equal(validateDescriptor(validHook({ id: "UPPER" })).ok, false);
});

test("validateDescriptor: invalid version is rejected", () => {
  for (const bad of ["", "1.0", "v1.0.0", "latest"]) {
    assert.equal(validateDescriptor(validHook({ version: bad })).ok, false, `expected ${bad} rejected`);
  }
});

test("validateDescriptor: missing title/description is rejected", () => {
  assert.equal(validateDescriptor(validHook({ title: "" })).ok, false);
  assert.equal(validateDescriptor(validHook({ description: "  " })).ok, false);
});

test("validateDescriptor: capabilities must be an object", () => {
  assert.equal(validateDescriptor(validHook({ capabilities: null })).ok, false);
  assert.equal(validateDescriptor(validHook({ capabilities: [] })).ok, false);
});

test("validateDescriptor: an unknown capability key is rejected, not ignored", () => {
  const { ok, errors } = validateDescriptor(validHook({ capabilities: { observe: true, somethingNovel: true } }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unknown key")));
});

test("validateDescriptor: writeFiles/executeCommands/network cannot be true", () => {
  for (const forbidden of FORBIDDEN_CAPABILITIES) {
    const { ok, errors } = validateDescriptor(validHook({ capabilities: { observe: true, [forbidden]: true } }));
    assert.equal(ok, false, `expected capabilities.${forbidden}: true rejected`);
    assert.ok(errors.some((e) => e.includes(forbidden) && e.includes("Model C")));
  }
});

test("validateDescriptor: invokeSkill true requires a non-empty allowedSkills array", () => {
  assert.equal(validateDescriptor(validHook({ capabilities: { invokeSkill: true } })).ok, false);
  assert.equal(validateDescriptor(validHook({ capabilities: { invokeSkill: true }, allowedSkills: [] })).ok, false);
  const { ok, errors } = validateDescriptor(validHook({ capabilities: { invokeSkill: true }, allowedSkills: ["change-context"] }));
  assert.equal(ok, true, errors.join("; "));
});

test("validateDescriptor: allowedSkills without invokeSkill is rejected (inconsistent metadata)", () => {
  const { ok, errors } = validateDescriptor(validHook({ allowedSkills: ["change-context"] }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("allowedSkills is defined")));
});

test("validateDescriptor: an invalid Skill id inside allowedSkills is rejected", () => {
  const { ok, errors } = validateDescriptor(validHook({ capabilities: { invokeSkill: true }, allowedSkills: ["../traversal"] }));
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("invalid Skill id")));
});

test("validateDescriptor: appliesTo/evaluate must be functions", () => {
  const missingApplies = validHook(); delete missingApplies.appliesTo;
  assert.equal(validateDescriptor(missingApplies).ok, false);
  const missingEvaluate = validHook(); delete missingEvaluate.evaluate;
  assert.equal(validateDescriptor(missingEvaluate).ok, false);
});

test("validateDescriptor: multiple problems are all reported, not just the first", () => {
  const { ok, errors } = validateDescriptor({ id: "", version: "bad" });
  assert.equal(ok, false);
  assert.ok(errors.length >= 3);
});

test("constants: exactly the documented vocabulary, nothing accidentally added", () => {
  assert.deepEqual(KNOWN_CAPABILITIES, ["observe", "block", "invokeSkill", "emitWarning", "emitInstruction", "writeFiles", "executeCommands", "network"]);
  assert.deepEqual(FORBIDDEN_CAPABILITIES, ["writeFiles", "executeCommands", "network"]);
  assert.deepEqual(STATUS_VALUES, ["matched", "not_applicable", "blocked", "unsupported", "invalid", "failed"]);
  assert.deepEqual(APPLICABILITY_STATUSES, ["not_applicable", "blocked", "unsupported"]);
});

test("constants: are frozen", () => {
  assert.equal(Object.isFrozen(KNOWN_CAPABILITIES), true);
  assert.equal(Object.isFrozen(FORBIDDEN_CAPABILITIES), true);
  assert.equal(Object.isFrozen(STATUS_VALUES), true);
  assert.equal(Object.isFrozen(APPLICABILITY_STATUSES), true);
});
