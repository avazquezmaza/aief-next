import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadChangeUnified } from "../src/core/domain/change-loader.js";
import * as local from "../src/sdd-providers/local.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-sdd-local-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Requirements\n\n- **R1** — Do the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] T-01 Do the thing.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

test("local: detect() is always available; resolveChange() always resolves to the Change's own basename", () => {
  assert.equal(local.detect().available, true);
  const dir = makeChangeDir(COMPLETE);
  const change = loadChangeUnified(dir);
  const resolution = local.resolveChange(change);
  assert.equal(resolution.resolved, true);
  assert.equal(resolution.changeId, change.basename);
});

test("local: getArtifacts() matches loadChangeUnified()'s own missing/empty for a complete Change", () => {
  const dir = makeChangeDir(COMPLETE);
  const change = loadChangeUnified(dir);
  const result = local.getArtifacts(change);
  assert.equal(result.provider, "local");
  assert.equal(result.artifacts.changeDoc.state, "present");
  assert.equal(result.artifacts.tasks.state, "present");
  assert.equal(result.artifacts.evidence.state, "present");
  assert.equal(result.artifacts.specifications.length, 1);
  assert.equal(result.artifacts.specifications[0].state, "present");
});

test("local: getArtifacts() reports a missing required file as missing, not not_applicable", () => {
  const { "spec.md": _omit, ...withoutSpec } = COMPLETE;
  const dir = makeChangeDir(withoutSpec);
  const change = loadChangeUnified(dir);
  const result = local.getArtifacts(change);
  assert.equal(result.artifacts.specifications[0].state, "missing");
});

test("local: getArtifacts() reports an absent optional file (design.md) as not_applicable, not missing", () => {
  const dir = makeChangeDir(COMPLETE);
  const change = loadChangeUnified(dir);
  const result = local.getArtifacts(change);
  assert.equal(result.artifacts.design.state, "not_applicable");
});

test("local: getArtifacts() reports a present optional file (design.md) correctly", () => {
  const dir = makeChangeDir({ ...COMPLETE, "design.md": "# Design\n\nReal content.\n" });
  const change = loadChangeUnified(dir);
  const result = local.getArtifacts(change);
  assert.equal(result.artifacts.design.state, "present");
});

test("local: getArtifacts() distinguishes empty from missing for an optional file", () => {
  const dir = makeChangeDir({ ...COMPLETE, "notes.md": "   \n" });
  const change = loadChangeUnified(dir);
  const result = local.getArtifacts(change);
  assert.equal(result.artifacts.notes.state, "empty");
});

test("local: getRequirements()/getTasks() extract from spec.md/tasks.md deterministically", () => {
  const dir = makeChangeDir(COMPLETE);
  const change = loadChangeUnified(dir);
  const requirements = local.getRequirements(change);
  assert.equal(requirements.length, 1);
  assert.equal(requirements[0].id, "R1");
  const tasks = local.getTasks(change);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].completed, true);
  assert.deepEqual(tasks[0].requirements, []);
});

test("local: validate() reports ready for a complete Change, not_ready for an incomplete one", () => {
  const readyDir = makeChangeDir(COMPLETE);
  const readyChange = loadChangeUnified(readyDir);
  assert.equal(local.validate(readyChange).status, "ready");

  const { "evidence.md": _omit, ...incomplete } = COMPLETE;
  const notReadyDir = makeChangeDir(incomplete);
  const notReadyChange = loadChangeUnified(notReadyDir);
  const result = local.validate(notReadyChange);
  assert.equal(result.status, "not_ready");
  assert.ok(result.blockers.some((b) => b.includes("evidence.md")));
});

test("local: no operation writes any file — byte-comparison before/after every call", () => {
  const dir = makeChangeDir(COMPLETE);
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  const change = loadChangeUnified(dir);
  local.getArtifacts(change);
  local.getRequirements(change);
  local.getTasks(change);
  local.validate(change);
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

test("local: zero-drift — every real Change in this repository resolves getArtifacts() consistently with loadChangeUnified()", () => {
  const changesDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "changes");
  const dirs = fs.readdirSync(changesDir)
    .map((name) => path.join(changesDir, name))
    .filter((p) => fs.statSync(p).isDirectory());
  assert.ok(dirs.length > 0);
  for (const dir of dirs) {
    const change = loadChangeUnified(dir);
    const result = local.getArtifacts(change);
    const expectedTasksState = change.missing.includes("tasks.md") ? "missing" : change.empty.includes("tasks.md") ? "empty" : "present";
    assert.equal(result.artifacts.tasks.state, expectedTasksState, dir);
    const expectedEvidenceState = change.missing.includes("evidence.md") ? "missing" : change.empty.includes("evidence.md") ? "empty" : "present";
    assert.equal(result.artifacts.evidence.state, expectedEvidenceState, dir);
  }
});
