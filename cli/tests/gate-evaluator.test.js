import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadChangeUnified } from "../src/core/domain/change-loader.js";
import { loadWorkflowDefinition, WORKFLOW_SCHEMA_VERSION } from "../src/core/domain/workflow-definition.js";
import { evaluateGates, KNOWN_GATE_IDS } from "../src/core/services/gate-evaluator.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-gate-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE_LEGACY_FILES = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nGeneral\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifestFor(track, overrides = {}) {
  return JSON.stringify({
    schema: "aief.change/v1",
    id: "0001",
    slug: "thing",
    title: "Thing",
    status: "open",
    track,
    ...overrides
  });
}

test("evaluateGates: readiness passes for a structurally complete Change (lite track)", () => {
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("lite") });
  const change = loadChangeUnified(dir);
  const def = loadWorkflowDefinition("lite").value;
  const results = evaluateGates(change, def);
  const readiness = results.find((g) => g.id === "readiness");
  assert.equal(readiness.status, "passed");
  assert.equal(readiness.blocking, true);
});

test("evaluateGates: readiness fails for an incomplete Change, reusing checkChangeReadiness()'s own reasons", () => {
  const { "spec.md": _omit, ...withoutSpec } = COMPLETE_LEGACY_FILES;
  const dir = makeChangeDir({ ...withoutSpec, "manifest.json": manifestFor("lite") });
  const change = loadChangeUnified(dir);
  const def = loadWorkflowDefinition("lite").value;
  const results = evaluateGates(change, def);
  const readiness = results.find((g) => g.id === "readiness");
  assert.equal(readiness.status, "failed");
  assert.match(readiness.reason, /spec\.md/);
});

test("evaluateGates: review/approval/security_review are always pending, never passed, and always name why (standard/governed)", () => {
  const dirStandard = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("standard") });
  const changeStandard = loadChangeUnified(dirStandard);
  const defStandard = loadWorkflowDefinition("standard").value;
  const reviewGate = evaluateGates(changeStandard, defStandard).find((g) => g.id === "review");
  assert.equal(reviewGate.status, "pending");
  assert.equal(reviewGate.blocking, true);
  assert.match(reviewGate.reason, /No automated evaluator yet/);

  const dirGoverned = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("governed") });
  const changeGoverned = loadChangeUnified(dirGoverned);
  const defGoverned = loadWorkflowDefinition("governed").value;
  const governedResults = evaluateGates(changeGoverned, defGoverned);
  for (const id of ["approval", "security_review", "review"]) {
    const gate = governedResults.find((g) => g.id === id);
    assert.equal(gate.status, "pending", `${id} must be pending`);
    assert.notEqual(gate.status, "passed", `${id} must never be passed`);
  }
});

test("evaluateGates: status_consistency is 'not_applicable' when change.md declares no status of its own", () => {
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("lite") });
  const change = loadChangeUnified(dir);
  const def = loadWorkflowDefinition("lite").value;
  const gate = evaluateGates(change, def).find((g) => g.id === "status_consistency");
  assert.equal(gate.status, "not_applicable");
  assert.equal(gate.blocking, false);
});

test("evaluateGates: status_consistency warns (not blocks) when change.md's ## Status disagrees with manifest.status", () => {
  const changeMdWithStatus = `${COMPLETE_LEGACY_FILES["change.md"]}\n## Status\n\nOPEN\n`;
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "change.md": changeMdWithStatus, "manifest.json": manifestFor("lite", { status: "closed" }) });
  const change = loadChangeUnified(dir);
  const def = loadWorkflowDefinition("lite").value;
  const gate = evaluateGates(change, def).find((g) => g.id === "status_consistency");
  assert.equal(gate.status, "warning");
  assert.equal(gate.blocking, false);
  // The manifest still governs — unaffected by the warning (Change 0043 R1).
  assert.equal(change.closed, true);
});

test("evaluateGates: identity passes when manifest id/slug agree with the directory name", () => {
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("lite", { slug: "thing-agree-test" }) });
  const renamedDir = path.join(path.dirname(dir), "0001-thing-agree-test");
  fs.renameSync(dir, renamedDir);
  const change = loadChangeUnified(renamedDir);
  const def = loadWorkflowDefinition("lite").value;
  const gate = evaluateGates(change, def).find((g) => g.id === "identity");
  assert.equal(gate.status, "passed");
  fs.rmSync(renamedDir, { recursive: true, force: true });
});

test("evaluateGates: identity warns (M1) — never errors, never blocks — when manifest slug disagrees with the directory name", () => {
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("lite", { slug: "totally-different-slug" }) });
  const renamedDir = path.join(path.dirname(dir), "0001-totally-different-slug-mismatch");
  fs.renameSync(dir, renamedDir);
  const change = loadChangeUnified(renamedDir);
  const def = loadWorkflowDefinition("lite").value;
  const gate = evaluateGates(change, def).find((g) => g.id === "identity");
  assert.equal(gate.status, "warning");
  assert.equal(gate.blocking, false);
  assert.match(gate.reason, /slug/);
  fs.rmSync(renamedDir, { recursive: true, force: true });
});

test("evaluateGates: an unknown gate id referenced by a (malformed) definition is an internal error, not a Change problem", () => {
  const dir = makeChangeDir({ ...COMPLETE_LEGACY_FILES, "manifest.json": manifestFor("lite") });
  const change = loadChangeUnified(dir);
  const bogusDefinition = {
    schema: WORKFLOW_SCHEMA_VERSION,
    track: "lite",
    stages: [{ id: "verify", gateIds: ["totally_unknown_gate"] }],
    transitions: []
  };
  const results = evaluateGates(change, bogusDefinition);
  const bogus = results.find((g) => g.id === "totally_unknown_gate");
  assert.equal(bogus.status, "failed");
  // blocking: true — an unevaluable gate must not let a stage silently pass
  // as if it were satisfied (independent review finding, fixed before close:
  // the original implementation set blocking: false here, which let
  // resolveState() walk past a broken workflow definition).
  assert.equal(bogus.blocking, true);
  assert.match(bogus.reason, /internal error/);
  assert.ok(KNOWN_GATE_IDS.has("readiness") && !KNOWN_GATE_IDS.has("totally_unknown_gate"));
});

// Entrega 3 (Change 0045, SDD-R32/R33): "specification" is a known gate id,
// prepared but never wired to a real track.
test("evaluateGates: 'specification' is a known gate id, but no real (lite/standard/governed) definition declares it", () => {
  assert.ok(KNOWN_GATE_IDS.has("specification"));
  for (const track of ["lite", "standard", "governed"]) {
    const def = loadWorkflowDefinition(track).value;
    const declaredGateIds = new Set(def.stages.flatMap((s) => s.gateIds || []));
    assert.ok(!declaredGateIds.has("specification"), `${track}.json must not declare "specification" yet`);
  }
});

test("evaluateGates: the three shipped workflow definition files are byte-unchanged by this Entrega", () => {
  const workflowsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "src", "workflows");
  for (const track of ["lite", "standard", "governed"]) {
    const raw = fs.readFileSync(path.join(workflowsDir, `${track}.json`), "utf8");
    const parsed = JSON.parse(raw);
    assert.ok(!JSON.stringify(parsed).includes("specification"), `${track}.json must not mention "specification"`);
  }
});

test("evaluateGates: the specification gate never resolves 'passed' merely because a provider was detected — only a real validate() 'ready' result does", () => {
  // Deliberately incomplete: evidence.md missing -> local.validate() must
  // report "not_ready", even though the local provider itself is always
  // "available" (detection alone must never imply "passed").
  const { "evidence.md": _omit, ...incomplete } = COMPLETE_LEGACY_FILES;
  const dir = makeChangeDir({ ...incomplete, "manifest.json": manifestFor("lite") });
  const change = loadChangeUnified(dir);
  const definitionWithSpecGate = {
    schema: WORKFLOW_SCHEMA_VERSION,
    track: "lite",
    stages: [{ id: "verify", gateIds: ["specification"] }],
    transitions: []
  };
  const results = evaluateGates(change, definitionWithSpecGate, dir);
  const specGate = results.find((g) => g.id === "specification");
  assert.ok(specGate);
  assert.notEqual(specGate.status, "passed", "must not pass just because a provider (local, always available) was resolved");
  assert.equal(specGate.status, "failed");
});

test("evaluateGates: the specification gate passes only when the resolved provider's validate() itself reports ready", () => {
  const dir = makeChangeDir({
    "change.md": COMPLETE_LEGACY_FILES["change.md"],
    "spec.md": "# Specification\n\n## Requirements\n\n- **R1** — Do the thing.\n",
    "tasks.md": "# Tasks\n\n- [x] Done.\n",
    "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n",
    "manifest.json": manifestFor("lite")
  });
  const change = loadChangeUnified(dir);
  const definitionWithSpecGate = {
    schema: WORKFLOW_SCHEMA_VERSION,
    track: "lite",
    stages: [{ id: "verify", gateIds: ["specification"] }],
    transitions: []
  };
  const results = evaluateGates(change, definitionWithSpecGate, dir);
  const specGate = results.find((g) => g.id === "specification");
  assert.equal(specGate.status, "passed");
  assert.equal(specGate.blocking, true);
});
