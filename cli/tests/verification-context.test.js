import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildVerificationContext } from "../src/core/services/verification-context.js";
import { explain } from "../src/core/services/workflow-service.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-vrctx-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n\n- **REQ-1** — Do the thing safely.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifestFor(overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id: "0001", slug: "thing", title: "Thing", status: "open", ...overrides });
}

// buildVerificationContext() is NON-FETCHING for change/workflow/sdd (same
// discipline as hook-context.js's buildHookContext(), Entrega 6) — the
// caller computes `explain(dir, dir)` itself, exactly once, and hands the
// result in. This helper mirrors how cli.js's verify() calls it.
function buildCtx(dir, operation) {
  const inspection = explain(dir, dir);
  return buildVerificationContext(inspection, dir, dir, operation);
}

test("buildVerificationContext: passes through exactly what the caller supplied — no re-derivation", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite", sdd: { provider: "local" } }) });
  const inspection = explain(dir, dir);
  const context = buildVerificationContext(inspection, dir, dir, { input: {}, result: null });
  assert.deepEqual(context.change, inspection.change);
  assert.deepEqual(context.workflow, inspection.workflow);
  assert.deepEqual(context.sdd, inspection.sdd);
});

test("buildVerificationContext: exact shape", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildCtx(dir, { input: {}, result: null });
  assert.deepEqual(
    Object.keys(context).sort(),
    ["project", "change", "workflow", "sdd", "requirements", "tasks", "verificationDoc", "operation", "projectRoot"].sort()
  );
});

test("buildVerificationContext: requirements/tasks are the SDD Provider's own already-parsed arrays, unedited", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const context = buildCtx(dir, { input: {}, result: null });
  assert.equal(context.requirements.length, 1);
  assert.equal(context.requirements[0].id, "REQ-1");
  assert.deepEqual(context.requirements, context.sdd.requirements);
  assert.deepEqual(context.tasks, context.sdd.tasks);
});

test("buildVerificationContext: no sdd section -> requirements/tasks are empty arrays, never an error", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildCtx(dir, { input: {}, result: null });
  assert.deepEqual(context.requirements, []);
  assert.deepEqual(context.tasks, []);
});

test("buildVerificationContext: reads verification.md when present", () => {
  const dir = makeChangeDir({ ...COMPLETE, "verification.md": "# Verification\n\n| # | Scenario | R | Result |\n|---|---|---|---|\n| 1 | x | REQ-1 | pass |\n" });
  const context = buildCtx(dir, { input: {}, result: null });
  assert.match(context.verificationDoc, /REQ-1/);
});

test("buildVerificationContext: missing verification.md is null, never an error", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildCtx(dir, { input: {}, result: null });
  assert.equal(context.verificationDoc, null);
});

test("buildVerificationContext: an empty verification.md is also null", () => {
  const dir = makeChangeDir({ ...COMPLETE, "verification.md": "   \n\n  " });
  const context = buildCtx(dir, { input: {}, result: null });
  assert.equal(context.verificationDoc, null);
});

test("buildVerificationContext: preserves manifest errors and provider errors unedited", () => {
  const dir = makeChangeDir(COMPLETE);
  fs.writeFileSync(path.join(dir, "manifest.json"), "{ not json", "utf8");
  const context = buildCtx(dir, { input: {}, result: null });
  assert.ok(Array.isArray(context.change.manifestError));
  assert.ok(context.change.manifestError.length > 0);
});

test("buildVerificationContext: the operation's own input/result pass through unedited", () => {
  const dir = makeChangeDir(COMPLETE);
  const report = { passed: true, lines: [] };
  const context = buildCtx(dir, { input: { changeId: "0001-thing" }, result: report });
  assert.deepEqual(context.operation.result, report);
  assert.equal(context.operation.input.changeId, "0001-thing");
});

test("buildVerificationContext: result is frozen — a caller cannot mutate it", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildCtx(dir, { input: {}, result: null });
  assert.throws(() => { context.change = { hijacked: true }; }, TypeError);
  assert.throws(() => { context.requirements.push({}); }, TypeError);
});

test("buildVerificationContext: is idempotent — same inputs, same context, every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite", sdd: { provider: "local" } }) });
  const inspection = explain(dir, dir);
  const a = buildVerificationContext(inspection, dir, dir, { input: {}, result: null });
  const b = buildVerificationContext(inspection, dir, dir, { input: {}, result: null });
  assert.deepEqual(a, b);
});

test("buildVerificationContext: performs zero writes", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite", sdd: { provider: "local" } }), "verification.md": "| 1 | x | REQ-1 | pass |\n" });
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  buildCtx(dir, { input: {}, result: null });
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

test("buildVerificationContext does NOT call explain() itself — structurally, not just observed (found via adversarial review: a prior version called explain() a second time, duplicating verify()'s own call)", () => {
  const source = fs.readFileSync(fileURLToPath(new URL("../src/core/services/verification-context.js", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /^import .*workflow-service\.js/m);
  // Structural proof of non-fetching: buildVerificationContext's first
  // parameter is the already-computed {change, workflow, sdd}, not a
  // changeDir/cwd pair it could use to fetch anything itself.
  assert.equal(buildVerificationContext.length, 4);
});

test("verification-context.js performs zero calls to evaluateGates/resolveState/resolveSddProvider directly — structurally, not just observed", () => {
  const source = fs.readFileSync(fileURLToPath(new URL("../src/core/services/verification-context.js", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /^import .*gate-evaluator\.js/m);
  assert.doesNotMatch(source, /^import .*transition-engine\.js/m);
  assert.doesNotMatch(source, /^import .*sdd-provider-resolver\.js/m);
});
