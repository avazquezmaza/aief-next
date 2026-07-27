import test from "node:test";
import assert from "node:assert/strict";

import { loadWorkflowDefinition } from "../src/core/domain/workflow-definition.js";
import { resolveState, isTransitionLegal } from "../src/core/services/transition-engine.js";

const gate = (id, status, blocking = true) => ({ id, status, blocking, reason: `${id}: ${status}`, evidence: [] });

test("resolveState: Lite resolves its expected next action — verify stage when readiness fails, close when it passes", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false };

  const failing = resolveState(change, lite, [gate("readiness", "failed")]);
  assert.equal(failing.stage, "verify");
  assert.equal(failing.blockers.length, 1);
  assert.match(failing.nextAction, /^verify/);

  const passing = resolveState(change, lite, [gate("readiness", "passed")]);
  assert.equal(passing.stage, "close");
  assert.equal(passing.blockers.length, 0);
  assert.equal(passing.nextAction, "close");
});

test("resolveState: Standard requires review before close — readiness passing alone never resolves to close", () => {
  const standard = loadWorkflowDefinition("standard").value;
  const change = { closed: false };

  const results = resolveState(change, standard, [gate("readiness", "passed"), gate("review", "pending")]);
  assert.equal(results.stage, "review");
  assert.notEqual(results.nextAction, "close");
  assert.match(results.nextAction, /no automated evaluator yet/i);
});

test("resolveState: Governed represents approval and security_review as pending capabilities, never fabricated as passed", () => {
  const governed = loadWorkflowDefinition("governed").value;
  const change = { closed: false };

  // Even with every other gate passing, an unimplemented gate still blocks —
  // the engine cannot compute "close" while approval remains pending.
  const results = resolveState(change, governed, [
    gate("approval", "pending"),
    gate("readiness", "passed"),
    gate("security_review", "pending"),
    gate("review", "pending")
  ]);
  assert.equal(results.stage, "approval");
  assert.notEqual(results.nextAction, "close");
});

test("resolveState: a failed blocking gate prevents reaching close", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false };
  const results = resolveState(change, lite, [gate("readiness", "failed")]);
  assert.notEqual(results.stage, "close");
  assert.ok(results.blockers.some((b) => b.id === "readiness"));
});

test("resolveState: a warning-status gate never blocks a transition", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false };
  const results = resolveState(change, lite, [
    gate("readiness", "passed"),
    gate("status_consistency", "warning", false),
    gate("identity", "warning", false)
  ]);
  assert.equal(results.stage, "close");
  assert.equal(results.blockers.length, 0);
  assert.equal(results.warnings.length, 2);
});

test("resolveState: a closed Change short-circuits to a terminal state with no next action", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: true };
  const results = resolveState(change, lite, [gate("readiness", "failed")]);
  assert.equal(results.stage, "closed");
  assert.equal(results.nextAction, null);
  assert.equal(results.blockers.length, 0);
});

test("resolveState: is deterministic — the same inputs produce deep-equal output every time", () => {
  const standard = loadWorkflowDefinition("standard").value;
  const change = { closed: false };
  const gateResults = [gate("readiness", "passed"), gate("review", "pending")];
  const first = resolveState(change, standard, gateResults);
  const second = resolveState(change, standard, gateResults);
  assert.deepEqual(first, second);
});

test("isTransitionLegal: a valid transition (declared edge, blocking gates satisfied) is accepted", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const result = isTransitionLegal(lite, [gate("readiness", "passed")], "verify", "close");
  assert.equal(result.legal, true);
});

test("isTransitionLegal: an invalid transition (undeclared edge) is rejected", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const result = isTransitionLegal(lite, [], "work", "close");
  assert.equal(result.legal, false);
  assert.match(result.reason, /no declared transition/);
});

test("isTransitionLegal: a declared edge blocked by a failing gate is rejected, not silently allowed", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const result = isTransitionLegal(lite, [gate("readiness", "failed")], "verify", "close");
  assert.equal(result.legal, false);
  assert.ok(result.blockers.some((b) => b.id === "readiness"));
});

test("isTransitionLegal: a declared edge with only warning-status gates is accepted", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const result = isTransitionLegal(lite, [gate("readiness", "passed"), gate("status_consistency", "warning", false)], "verify", "close");
  assert.equal(result.legal, true);
});

// Independent-review regression: a stage referencing a gate id nobody can
// evaluate (an AIEF-internal definition bug — gate-evaluator.js's
// "unknown gate" case) must not let resolveState() treat that stage as
// satisfied. This is the transition-engine side of a fix originally made in
// gate-evaluator.js (blocking: false -> true for that case) — tested here
// too, at the boundary where the two modules actually meet.
test("resolveState: a stage gated on an unevaluable (internal-error) gate never resolves past it", () => {
  const definitionWithBrokenGate = {
    schema: "aief.workflow/v1",
    track: "lite",
    stages: [{ id: "verify", gateIds: ["totally_unknown_gate"] }, { id: "close" }],
    transitions: [{ from: "verify", to: "close" }]
  };
  const brokenGateResult = gate("totally_unknown_gate", "failed", true);
  const change = { closed: false };
  const results = resolveState(change, definitionWithBrokenGate, [brokenGateResult]);
  assert.equal(results.stage, "verify");
  assert.notEqual(results.stage, "close");
  assert.ok(results.blockers.some((b) => b.id === "totally_unknown_gate"));
});

// WF-R13: manifest.next_action is a hint, never authority. A disagreement
// with the derived value is a warning; the derived value still governs.
test("resolveState: a disagreeing manifest.next_action produces a warning but never overrides the derived value", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false, manifest: { next_action: "close" } };
  const results = resolveState(change, lite, [gate("readiness", "failed")]);
  assert.equal(results.stage, "verify");
  assert.notEqual(results.nextAction, "close");
  assert.ok(results.warnings.some((w) => w.id === "next_action_hint"));
});

test("resolveState: an agreeing manifest.next_action produces no extra warning", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false, manifest: { next_action: "close" } };
  const results = resolveState(change, lite, [gate("readiness", "passed")]);
  assert.equal(results.nextAction, "close");
  assert.ok(!results.warnings.some((w) => w.id === "next_action_hint"));
});

test("resolveState: a Change with no manifest.next_action (the common case today) produces no hint warning", () => {
  const lite = loadWorkflowDefinition("lite").value;
  const change = { closed: false, manifest: { id: "0001" } };
  const results = resolveState(change, lite, [gate("readiness", "failed")]);
  assert.ok(!results.warnings.some((w) => w.id === "next_action_hint"));
});
