import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { inspect, nextAction, deriveNextAction, canTransition, explain } from "../src/core/services/workflow-service.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-wfsvc-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifestFor(overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id: "0001", slug: "thing", title: "Thing", status: "open", ...overrides });
}

// --- inspect() ---

test("inspect: a legacy Change (no manifest) has null workflow and null sdd", () => {
  const dir = makeChangeDir(COMPLETE);
  const { change, workflow, sdd } = inspect(dir, dir);
  assert.equal(change.source, "legacy");
  assert.equal(workflow, null);
  assert.equal(sdd, null);
});

test("inspect: a manifest with no track/sdd has null workflow and null sdd", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor() });
  const { workflow, sdd } = inspect(dir, dir);
  assert.equal(workflow, null);
  assert.equal(sdd, null);
});

test("inspect: a manifest with a track resolves a workflow", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const { workflow } = inspect(dir, dir);
  assert.equal(workflow.kind, "resolved");
  assert.equal(workflow.state.stage, "close");
});

test("inspect: a manifest with sdd resolves an SDD provider", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const { sdd } = inspect(dir, dir);
  assert.equal(sdd.providerId, "local");
  assert.equal(sdd.readiness.status, "ready");
});

// --- deriveNextAction() / nextAction() — six outcomes ---

test("deriveNextAction: invalid manifest -> status 'invalid', id 'manifest'", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": "{ not json" });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "invalid");
  assert.equal(action.id, "manifest");
  assert.equal(action.blocking, true);
});

test("deriveNextAction: a legacy Change with missing files -> 'blocked'", () => {
  const { "spec.md": _omit, ...incomplete } = COMPLETE;
  const dir = makeChangeDir(incomplete);
  const action = nextAction(dir, dir);
  assert.equal(action.status, "blocked");
  assert.equal(action.id, "close");
  assert.match(action.reason, /spec\.md/);
});

test("deriveNextAction: a legacy Change fully ready -> 'available'", () => {
  const dir = makeChangeDir(COMPLETE);
  const action = nextAction(dir, dir);
  assert.equal(action.status, "available");
  assert.match(action.command, /aief close --yes/);
});

test("deriveNextAction: a Lite Change with readiness failing -> 'blocked' via the workflow branch", () => {
  const { "evidence.md": _omit, ...incomplete } = COMPLETE;
  const dir = makeChangeDir({ ...incomplete, "manifest.json": manifestFor({ track: "lite" }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "blocked");
  assert.equal(action.id, "verify");
});

test("deriveNextAction: a Standard Change with readiness passing -> 'pending' (review has no evaluator)", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "standard" }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "pending");
  assert.equal(action.id, "review");
  assert.match(action.reason, /no automated evaluator yet/i);
});

test("deriveNextAction: a Lite Change fully ready -> 'available', command suggests close", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "available");
  assert.equal(action.id, "close");
  assert.match(action.command, new RegExp(`aief close --yes --change ${path.basename(dir)}`));
});

test("deriveNextAction: a closed Change -> 'complete', id 'closed', never presented as available", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ status: "closed", track: "lite" }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "complete");
  assert.equal(action.id, "closed");
  assert.equal(action.command, null);
});

test("deriveNextAction: an unrecognized track -> 'invalid', id 'workflow'", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "custom" }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "invalid");
  assert.equal(action.id, "workflow");
});

test("deriveNextAction: an unknown sdd.provider fails manifest structural validation first — 'invalid', id 'manifest'", () => {
  // sdd.provider is validated by change-manifest.js's schema (SDD_PROVIDER_VALUES) before
  // resolveSddProvider() is ever reached — the manifest itself is structurally invalid.
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "totally-unknown" } }) });
  const action = nextAction(dir, dir);
  assert.equal(action.status, "invalid");
  assert.equal(action.id, "manifest");
});

test("deriveNextAction: a structurally valid but runtime-unavailable sdd.provider -> 'invalid', id 'sdd'", () => {
  const original = process.env.PATH;
  process.env.PATH = path.dirname(process.execPath); // no openspec CLI reachable
  try {
    const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "openspec" } }) });
    const action = nextAction(dir, dir); // dir has no openspec/ structure either
    assert.equal(action.status, "invalid");
    assert.equal(action.id, "sdd");
    assert.match(action.reason, /configured provider "openspec" is unavailable/);
  } finally {
    process.env.PATH = original;
  }
});

test("deriveNextAction: an 'unsupported' SDD readiness status maps to action status 'unsupported' (synthetic — no real provider produces this yet)", () => {
  const synthetic = {
    change: { manifestError: null, closed: false, manifest: null, track: "", dir: "/x", basename: "0001-thing" },
    workflow: null,
    sdd: { providerId: "local", readiness: { status: "unsupported", blockers: ["create is not supported"] } }
  };
  const action = deriveNextAction(synthetic);
  assert.equal(action.status, "unsupported");
  assert.equal(action.id, "sdd");
  assert.match(action.reason, /create is not supported/);
});

// --- Never fabricated "available" ---

test("deriveNextAction: never 'available' while a blocking gate is unsatisfied — Governed's approval gate", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "governed" }) });
  const action = nextAction(dir, dir);
  assert.notEqual(action.status, "available");
  assert.equal(action.id, "approval");
});

// --- canTransition() ---

test("canTransition: a legal transition (its gate is satisfied) is accepted", () => {
  // Standard, fully ready except review (which has no evaluator — pending):
  // resolveState() reports current stage "review" (blocked there), but the
  // EARLIER edge "work" -> "verify" is legal, because verify's own gate
  // (readiness) has passed. This is the realistic shape of a "was this step
  // legal" question — asking about the CURRENT blocked stage's own outgoing
  // edge can never be true (see the module comment on canTransition()).
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "standard" }) });
  const result = canTransition(dir, dir, "work", "verify");
  assert.equal(result.legal, true);
});

test("canTransition: an illegal transition (blocked) is rejected, not silently allowed", () => {
  const { "evidence.md": _omit, ...incomplete } = COMPLETE;
  const dir = makeChangeDir({ ...incomplete, "manifest.json": manifestFor({ track: "lite" }) });
  const result = canTransition(dir, dir, "verify", "close");
  assert.equal(result.legal, false);
});

test("canTransition: a Change with no workflow (legacy) reports not legal, with a clear reason, never a crash", () => {
  const dir = makeChangeDir(COMPLETE);
  const result = canTransition(dir, dir, "verify", "close");
  assert.equal(result.legal, false);
  assert.match(result.reason, /no resolvable workflow/);
});

// --- explain() ---

test("explain: combines inspect() and the derived action in one call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const result = explain(dir, dir);
  assert.ok(result.change);
  assert.ok(result.workflow);
  assert.ok(result.action);
  assert.equal(result.action.status, "available");
});

// --- Determinism and zero writes ---

test("nextAction: is deterministic — same Change, same result, every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "standard" }) });
  const first = nextAction(dir, dir);
  const second = nextAction(dir, dir);
  assert.deepEqual(first, second);
});

test("inspect/nextAction/canTransition/explain: zero writes — byte-comparison before/after every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite", sdd: { provider: "local" } }) });
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  inspect(dir, dir);
  nextAction(dir, dir);
  canTransition(dir, dir, "verify", "close");
  explain(dir, dir);
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});
