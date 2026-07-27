import test from "node:test";
import assert from "node:assert/strict";

import {
  parseWorkflowDefinition,
  validateWorkflowDefinition,
  loadWorkflowDefinition,
  WORKFLOW_SCHEMA_VERSION,
  KNOWN_TRACKS
} from "../src/core/domain/workflow-definition.js";

const VALID_DEFINITION = {
  schema: WORKFLOW_SCHEMA_VERSION,
  track: "lite",
  stages: [{ id: "work" }, { id: "verify", gateIds: ["readiness"] }, { id: "close" }],
  transitions: [{ from: "work", to: "verify" }, { from: "verify", to: "close" }]
};

test("loadWorkflowDefinition: all three real, shipped definitions load and validate correctly", () => {
  for (const track of KNOWN_TRACKS) {
    const result = loadWorkflowDefinition(track);
    assert.equal(result.ok, true, `${track}: ${result.error}`);
    assert.equal(result.value.track, track);
    assert.ok(result.value.stages.length > 0);
    assert.ok(result.value.transitions.length > 0);
  }
});

test("loadWorkflowDefinition: an unknown track is rejected, not guessed", () => {
  const result = loadWorkflowDefinition("custom");
  assert.equal(result.ok, false);
  assert.match(result.error, /unknown track/);
});

test("parseWorkflowDefinition: malformed JSON is reported, not thrown", () => {
  const result = parseWorkflowDefinition("{ not json");
  assert.equal(result.ok, false);
  assert.match(result.error, /not valid JSON/);
});

test("validateWorkflowDefinition: a fully valid definition has no errors", () => {
  const { valid, errors } = validateWorkflowDefinition(VALID_DEFINITION, "lite");
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("validateWorkflowDefinition: missing schema/track/stages/transitions are each reported", () => {
  const { valid, errors } = validateWorkflowDefinition({}, "lite");
  assert.equal(valid, false);
  const fields = errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ["schema", "stages", "track", "transitions"]);
});

test("validateWorkflowDefinition: an unrecognized track value is rejected", () => {
  const { valid, errors } = validateWorkflowDefinition({ ...VALID_DEFINITION, track: "custom" }, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "track"));
});

test("validateWorkflowDefinition: filename/content track mismatch is rejected", () => {
  const { valid, errors } = validateWorkflowDefinition({ ...VALID_DEFINITION, track: "standard" }, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "track" && /filename and content must agree/.test(e.message)));
});

test("validateWorkflowDefinition: a transition referencing an undeclared stage is rejected", () => {
  const withBadTransition = {
    ...VALID_DEFINITION,
    transitions: [...VALID_DEFINITION.transitions, { from: "verify", to: "nonexistent_stage" }]
  };
  const { valid, errors } = validateWorkflowDefinition(withBadTransition, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "transitions[2].to" && /undeclared stage/.test(e.message)));
});

test("validateWorkflowDefinition: a malformed gate id (non-string in gateIds) is rejected", () => {
  const withBadGate = {
    ...VALID_DEFINITION,
    stages: [{ id: "work" }, { id: "verify", gateIds: ["readiness", 42] }, { id: "close" }]
  };
  const { valid, errors } = validateWorkflowDefinition(withBadGate, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "stages[1].gateIds"));
});

test("validateWorkflowDefinition: a duplicate stage id is rejected", () => {
  const withDuplicate = {
    ...VALID_DEFINITION,
    stages: [{ id: "work" }, { id: "work" }, { id: "close" }]
  };
  const { valid, errors } = validateWorkflowDefinition(withDuplicate, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "stages[1].id" && /duplicate/.test(e.message)));
});

test("validateWorkflowDefinition: a stage with a missing/wrong-typed id is rejected", () => {
  const withBadStage = { ...VALID_DEFINITION, stages: [{ id: "work" }, { id: 42 }, { id: "close" }] };
  const { valid, errors } = validateWorkflowDefinition(withBadStage, "lite");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.field === "stages[1].id"));
});
