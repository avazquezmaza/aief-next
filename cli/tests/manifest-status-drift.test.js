// Change 0095 — manifest.status / change.md ## Status disagreement, detected
// and reported, never reconciled or written (ADR-009/ADR-016).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadChangeUnified } from "../src/core/domain/change-loader.js";
import { detectManifestStatusDrift } from "../src/core/domain/manifest-status-drift.js";
import { MANIFEST_SCHEMA_VERSION } from "../src/core/domain/change-manifest.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-drift-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const BASE_CHANGE_MD = "# Change\n\n## ID\n\n`0099-thing`\n\n## Type\n\nGeneral\n\n## Objective\n\nDo the thing.\n";
const OTHER_FILES = {
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifest(status) {
  return JSON.stringify({
    schema: MANIFEST_SCHEMA_VERSION,
    id: "0099",
    slug: "thing",
    title: "A manifest-backed Change",
    status
  });
}

test("detectManifestStatusDrift: no manifest.json at all -> no drift (legacy branch)", () => {
  const dir = makeChangeDir({ "change.md": BASE_CHANGE_MD, ...OTHER_FILES });
  const change = loadChangeUnified(dir);
  assert.equal(change.source, "legacy");
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: false, manifestStatus: null, changeMdStatus: null });
});

test("detectManifestStatusDrift: manifest present, change.md declares no status of its own -> no drift", () => {
  const dir = makeChangeDir({ "change.md": BASE_CHANGE_MD, ...OTHER_FILES, "manifest.json": manifest("open") });
  const change = loadChangeUnified(dir);
  assert.equal(change.source, "manifest");
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: false, manifestStatus: "open", changeMdStatus: null });
});

test("detectManifestStatusDrift: manifest present, change.md status agrees -> no drift", () => {
  const changeMd = `${BASE_CHANGE_MD}\n## Status\n\nCLOSED\n`;
  const dir = makeChangeDir({ "change.md": changeMd, ...OTHER_FILES, "manifest.json": manifest("closed") });
  const change = loadChangeUnified(dir);
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: false, manifestStatus: "closed", changeMdStatus: "closed" });
});

// The real scenario this Change exists for: `aief close --yes` writes only
// change.md (Change 0043/0044's established behavior) — a manifest-backed
// Change closed this way now has a change.md saying CLOSED while its
// manifest.status, never touched, still says "open".
test("detectManifestStatusDrift: change.md closed after the manifest was created open -> drift, both values reported", () => {
  const changeMd = `${BASE_CHANGE_MD}\n## Status\n\nCLOSED\n`;
  const dir = makeChangeDir({ "change.md": changeMd, ...OTHER_FILES, "manifest.json": manifest("open") });
  const change = loadChangeUnified(dir);
  assert.equal(change.closed, false, "manifest.status alone still decides .closed — unaffected by this Change");
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: true, manifestStatus: "open", changeMdStatus: "closed" });
});

test("detectManifestStatusDrift: change.md declares an unparseable status -> reported as drift, not silently ignored", () => {
  const changeMd = `${BASE_CHANGE_MD}\n## Status\n\nCOMPLETE\n`;
  const dir = makeChangeDir({ "change.md": changeMd, ...OTHER_FILES, "manifest.json": manifest("open") });
  const change = loadChangeUnified(dir);
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: true, manifestStatus: "open", changeMdStatus: "unknown" });
});

test("detectManifestStatusDrift: an invalid manifest is never a drift candidate", () => {
  const changeMd = `${BASE_CHANGE_MD}\n## Status\n\nCLOSED\n`;
  const dir = makeChangeDir({ "change.md": changeMd, ...OTHER_FILES, "manifest.json": "{ not json" });
  const change = loadChangeUnified(dir);
  assert.ok(change.manifestError);
  const drift = detectManifestStatusDrift(change);
  assert.deepEqual(drift, { drift: false, manifestStatus: null, changeMdStatus: null });
});

test("detectManifestStatusDrift: zero-drift regression across every real Change in this repository", () => {
  const changesDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".."), "changes");
  const dirs = fs.readdirSync(changesDir)
    .map((name) => path.join(changesDir, name))
    .filter((p) => fs.statSync(p).isDirectory());
  assert.ok(dirs.length > 0, "expected at least one real Change to regress against");
  for (const dir of dirs) {
    const change = loadChangeUnified(dir);
    const drift = detectManifestStatusDrift(change);
    assert.equal(drift.drift, false, `${dir} unexpectedly reports drift`);
  }
});
