import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildSkillContext } from "../src/core/services/skill-context.js";
import { explain } from "../src/core/services/workflow-service.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-skctx-"));
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

test("buildSkillContext: a legacy Change (no manifest) has null workflow and null sdd, plus project", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildSkillContext(dir, dir);
  assert.equal(context.workflow, null);
  assert.equal(context.sdd, null);
  assert.ok(context.change);
  assert.ok(context.project);
  assert.ok(Array.isArray(context.project.signals));
});

test("buildSkillContext: adds exactly `project` beyond explain()'s own fields", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const context = buildSkillContext(dir, dir);
  const inspection = explain(dir, dir);
  assert.deepEqual(context.change, inspection.change);
  assert.deepEqual(context.workflow, inspection.workflow);
  assert.deepEqual(context.sdd, inspection.sdd);
  assert.deepEqual(context.action, inspection.action);
  assert.deepEqual(Object.keys(context).sort(), ["action", "change", "project", "sdd", "workflow"]);
});

test("buildSkillContext: a Change with a track resolves a workflow", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "standard" }) });
  const context = buildSkillContext(dir, dir);
  assert.equal(context.workflow.kind, "resolved");
  assert.equal(context.workflow.state.stage, "review");
});

test("buildSkillContext: a Change with sdd resolves an SDD provider", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const context = buildSkillContext(dir, dir);
  assert.equal(context.sdd.providerId, "local");
  assert.equal(context.sdd.readiness.status, "ready");
});

test("buildSkillContext: an invalid manifest is preserved, not silently treated as legacy", () => {
  const dir = makeChangeDir(COMPLETE);
  fs.writeFileSync(path.join(dir, "manifest.json"), "{ not json", "utf8");
  const context = buildSkillContext(dir, dir);
  assert.ok(Array.isArray(context.change.manifestError));
  assert.ok(context.change.manifestError.length > 0);
});

test("buildSkillContext: an unavailable explicit SDD provider never falls back", () => {
  const original = process.env.PATH;
  process.env.PATH = path.dirname(process.execPath); // no openspec CLI reachable
  try {
    const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "openspec" } }) });
    const context = buildSkillContext(dir, dir);
    assert.match(context.sdd.error, /configured provider "openspec" is unavailable/);
  } finally {
    process.env.PATH = original;
  }
});

test("buildSkillContext: a rejected SDD path-traversal change_id is preserved as an invalid readiness, not silently dropped", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "openspec", change_id: "../../../etc" } }) });
  fs.mkdirSync(path.join(dir, "openspec", "changes"), { recursive: true });
  const context = buildSkillContext(dir, dir);
  assert.equal(context.sdd.readiness.status, "invalid");
  assert.match(context.sdd.readiness.blockers.join("; "), /not a valid change identifier/);
});

test("buildSkillContext: blockers and warnings pass through unedited", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "governed" }) });
  const context = buildSkillContext(dir, dir);
  assert.ok(context.workflow.state.blockers.length > 0);
  assert.equal(context.workflow.state.blockers[0].id, "approval");
});

test("buildSkillContext: is idempotent — same Change, same inputs, same context, every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite", sdd: { provider: "local" } }) });
  const a = buildSkillContext(dir, dir);
  const b = buildSkillContext(dir, dir);
  assert.deepEqual(a, b);
});

test("buildSkillContext: performs zero writes (byte-comparison before/after)", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "standard", sdd: { provider: "local" } }) });
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  buildSkillContext(dir, dir);
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

test("buildSkillContext: the returned context is frozen — a caller cannot mutate it", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const context = buildSkillContext(dir, dir);
  assert.throws(() => { context.change = { hijacked: true }; }, TypeError);
  assert.throws(() => { context.workflow.state.stage = "hijacked"; }, TypeError);
});
