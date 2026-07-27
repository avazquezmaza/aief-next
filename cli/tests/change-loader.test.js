import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadChange } from "../src/core/domain/change.js";
import { loadChangeUnified } from "../src/core/domain/change-loader.js";
import { MANIFEST_SCHEMA_VERSION } from "../src/core/domain/change-manifest.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-change-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const LEGACY_CHANGE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nGeneral\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

const VALID_MANIFEST = {
  schema: MANIFEST_SCHEMA_VERSION,
  id: "0099",
  slug: "manifest-change",
  title: "A manifest-backed Change",
  status: "open",
  track: "Standard"
};

test("loadChangeUnified: a Change with no manifest.json matches loadChange() exactly, plus source/manifest/track", () => {
  const dir = makeChangeDir(LEGACY_CHANGE);
  const legacy = loadChange(dir);
  const unified = loadChangeUnified(dir);
  const { source, manifest, manifestError, track, ...rest } = unified;
  assert.equal(source, "legacy");
  assert.equal(manifest, null);
  assert.equal(manifestError, null);
  // track: "" — added by Change 0044 for shape parity with the manifest
  // branch (design.md §7); a legacy Change has no manifest, hence no track.
  assert.equal(track, "");
  assert.deepEqual(rest, legacy);
});

test("loadChangeUnified: a Change with a valid manifest.json resolves from the manifest", () => {
  const dir = makeChangeDir({ ...LEGACY_CHANGE, "manifest.json": JSON.stringify(VALID_MANIFEST) });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.equal(unified.manifestError, null);
  assert.equal(unified.closed, false);
  assert.equal(unified.statusState, "open");
  // Entrega 2 (Change 0044, design.md §7): `track` is its own field, split
  // out of `.type` — Entrega 1 fed manifest.track into `.type`, which this
  // Change corrects (`.type` is the legacy `## Type` slot; a manifest has no
  // such heading). This assertion changed because the requirement changed
  // (WF-R in Change 0044's spec.md), not to make a failing test pass.
  assert.equal(unified.type, "");
  assert.equal(unified.track, "standard");
  assert.deepEqual(unified.manifest, VALID_MANIFEST);
});

test("loadChangeUnified: manifest status wins over a disagreeing change.md ## Status — no merge", () => {
  const closedManifest = { ...VALID_MANIFEST, status: "closed" };
  const dir = makeChangeDir({
    ...LEGACY_CHANGE,
    "change.md": `${LEGACY_CHANGE["change.md"]}\n## Status\n\nOPEN\n`,
    "manifest.json": JSON.stringify(closedManifest)
  });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.equal(unified.closed, true);
  assert.equal(unified.statusState, "closed");
});

test("loadChangeUnified: malformed manifest.json is reported, not thrown", () => {
  const dir = makeChangeDir({ ...LEGACY_CHANGE, "manifest.json": "{ not json" });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.equal(unified.statusState, "unknown");
  assert.ok(Array.isArray(unified.manifestError));
  assert.match(unified.manifestError[0].message, /not valid JSON/);
});

// Regression test for Change 0043's finding L3, fixed as part of Entrega 2's
// H2 hardening (Change 0044): a manifest.json that can't be read as a UTF-8
// file at all (here: it's actually a directory) used to throw uncaught past
// loadChangeUnified(). WF-R2 requires "never crash, never silently fall back
// to legacy" — this must degrade the same way a parse error already does.
test("loadChangeUnified: a manifest.json that is actually a directory is reported, not thrown (L3 regression)", () => {
  const dir = makeChangeDir(LEGACY_CHANGE);
  fs.mkdirSync(path.join(dir, "manifest.json"));
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.equal(unified.statusState, "unknown");
  assert.ok(Array.isArray(unified.manifestError));
  assert.match(unified.manifestError[0].message, /could not be read/);
});

test("loadChangeUnified: a manifest.json failing validation is reported, not thrown, and does not fall back to legacy inference", () => {
  const dir = makeChangeDir({ ...LEGACY_CHANGE, "manifest.json": JSON.stringify({ schema: MANIFEST_SCHEMA_VERSION }) });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.equal(unified.statusState, "unknown");
  assert.ok(unified.manifestError.some((e) => e.field === "id"));
  assert.ok(unified.manifestError.some((e) => e.field === "slug"));
  assert.ok(unified.manifestError.some((e) => e.field === "title"));
  assert.ok(unified.manifestError.some((e) => e.field === "status"));
});

test("loadChangeUnified: missing Change files are still reported under the legacy branch (missing/empty), same as loadChange()", () => {
  const { "spec.md": _omit, ...withoutSpec } = LEGACY_CHANGE;
  const dir = makeChangeDir(withoutSpec);
  const unified = loadChangeUnified(dir);
  assert.deepEqual(unified.missing, ["spec.md"]);
});

// Regression test for Change 0043's independent review, finding H1: the
// manifest branch used to hardcode missing/empty to [] regardless of the
// filesystem, so a Change with only a manifest.json (no change.md/spec.md/
// tasks.md/evidence.md at all) silently reported nothing missing. spec.md
// R7 requires those four files stay required even when a manifest is
// present — this test exercises that branch directly, which the test above
// (legacy-only fixture) does not.
test("loadChangeUnified: missing Change files are reported under the manifest branch too (H1 regression)", () => {
  const dir = makeChangeDir({ "manifest.json": JSON.stringify(VALID_MANIFEST) });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.deepEqual(unified.missing, ["change.md", "spec.md", "tasks.md", "evidence.md"]);
});

test("loadChangeUnified: missing Change files are reported even when the manifest itself is invalid (H1 regression)", () => {
  const dir = makeChangeDir({ "manifest.json": "{ not json" });
  const unified = loadChangeUnified(dir);
  assert.equal(unified.source, "manifest");
  assert.ok(unified.manifestError);
  assert.deepEqual(unified.missing, ["change.md", "spec.md", "tasks.md", "evidence.md"]);
});

// Zero-drift regression (spec.md R2 / design.md §8): every real Change under
// changes/ has no manifest.json today, so every one of them must resolve
// through loadChangeUnified() identically to loadChange() today, with only
// the two new fields (source, manifest) added.
test("loadChangeUnified: zero-drift regression across every real Change in this repository", () => {
  const changesDir = path.join(REPO_ROOT, "changes");
  const dirs = fs.readdirSync(changesDir)
    .map((name) => path.join(changesDir, name))
    .filter((p) => fs.statSync(p).isDirectory());
  assert.ok(dirs.length > 0, "expected at least one real Change to regress against");
  for (const dir of dirs) {
    assert.equal(fs.existsSync(path.join(dir, "manifest.json")), false, `${dir} unexpectedly has a manifest.json already`);
    const legacy = loadChange(dir);
    const unified = loadChangeUnified(dir);
    const { source, manifest, manifestError, track, ...rest } = unified;
    assert.equal(source, "legacy", dir);
    assert.equal(manifest, null, dir);
    assert.equal(track, "", dir);
    assert.deepEqual(rest, legacy, dir);
  }
});
