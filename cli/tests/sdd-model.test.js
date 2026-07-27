import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ARTIFACT_STATES,
  makeArtifact,
  readArtifactFile,
  parseRequirements,
  parseTasks,
  unsupportedCapability,
  notImplementedCapability,
  failedCapability,
  callCapability
} from "../src/core/domain/sdd-model.js";

test("makeArtifact: builds a valid artifact for every known state", () => {
  for (const state of ARTIFACT_STATES) {
    const artifact = makeArtifact("local", "proposal", "changes/0001-x/proposal.md", state);
    assert.equal(artifact.state, state);
    assert.equal(artifact.provider, "local");
    assert.equal(artifact.type, "proposal");
  }
});

test("makeArtifact: throws for an unknown state — this is a programming error, not a runtime case", () => {
  assert.throws(() => makeArtifact("local", "proposal", "x", "bogus_state"));
});

test("readArtifactFile: distinguishes missing, empty, present, and read_error", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-sdd-model-"));
  const missingPath = path.join(dir, "missing.md");
  const emptyPath = path.join(dir, "empty.md");
  const presentPath = path.join(dir, "present.md");
  const dirAsFilePath = path.join(dir, "actually-a-dir.md");
  fs.writeFileSync(emptyPath, "   \n\n", "utf8");
  fs.writeFileSync(presentPath, "# Real content\n", "utf8");
  fs.mkdirSync(dirAsFilePath);

  assert.equal(readArtifactFile(fs, missingPath).state, "missing");
  assert.equal(readArtifactFile(fs, emptyPath).state, "empty");
  const present = readArtifactFile(fs, presentPath);
  assert.equal(present.state, "present");
  assert.match(present.content, /Real content/);
  const errored = readArtifactFile(fs, dirAsFilePath);
  assert.equal(errored.state, "read_error");
  assert.match(errored.diagnostic, /could not read/);
});

test("parseRequirements: extracts **ID** — text lines, matching this repository's own spec.md convention", () => {
  const text = [
    "# Specification",
    "",
    "## Requirements",
    "",
    "- **R1** — First requirement.",
    "- **AUTH-R2** — Second requirement, with an em dash — inside the text.",
    "- Not a requirement line.",
    "Some prose that mentions **bold** but isn't a requirement."
  ].join("\n");
  const requirements = parseRequirements(text, "local", "spec.md");
  assert.equal(requirements.length, 2);
  assert.equal(requirements[0].id, "R1");
  assert.equal(requirements[0].text, "First requirement.");
  assert.equal(requirements[0].source.provider, "local");
  assert.equal(requirements[0].source.path, "spec.md");
  assert.equal(requirements[0].source.line, 5);
  assert.equal(requirements[1].id, "AUTH-R2");
});

test("parseRequirements: a file with no matching lines returns an empty array, not an error", () => {
  assert.deepEqual(parseRequirements("# Just a heading\n\nSome prose.\n", "local", "spec.md"), []);
});

// Regression test for an independent-review finding: real, pre-existing
// content in changes/0041-delete-review-package/spec.md uses the exact
// "- **WORD** — text" shape for classification-tag definitions, not
// requirements. An id with no digit must never be extracted as one.
test("parseRequirements: bold classification-tag definitions (no digit in the id) are never mistaken for requirements", () => {
  const text = [
    "- **LIVE** — an active file points here. Must be re-pointed before removal.",
    "- **CODE** — `cli/src` or `cli/tests` depends on it. Removal is a code change.",
    "- **HISTORICAL** — a closed Change records it. Never rewritten.",
    "- **SELF** — the study documents that describe the item."
  ].join("\n");
  assert.deepEqual(parseRequirements(text, "local", "spec.md"), []);
});

test("parseRequirements: real ids with digits (R1, AUTH-R2, WF-R14, SDD-R21) are still extracted", () => {
  const text = [
    "- **R1** — Plain numbered id.",
    "- **AUTH-R2** — Prefixed id.",
    "- **WF-R14** — Workflow requirement id.",
    "- **SDD-R21** — SDD requirement id."
  ].join("\n");
  const requirements = parseRequirements(text, "local", "spec.md");
  assert.deepEqual(requirements.map((r) => r.id), ["R1", "AUTH-R2", "WF-R14", "SDD-R21"]);
});

test("parseTasks: extracts checkbox lines, distinguishing completed from incomplete, with and without an id token", () => {
  const text = [
    "# Tasks",
    "",
    "- [x] T-01 Implement the thing.",
    "- [ ] Do something without an id.",
    "- [X] Uppercase X also counts as completed.",
    "Not a task line."
  ].join("\n");
  const tasks = parseTasks(text, "openspec", "tasks.md");
  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].id, "T-01");
  assert.equal(tasks[0].completed, true);
  assert.equal(tasks[0].text, "Implement the thing.");
  assert.deepEqual(tasks[0].requirements, []);
  assert.equal(tasks[1].id, null);
  assert.equal(tasks[1].completed, false);
  assert.equal(tasks[2].completed, true);
});

test("callCapability: an unsupported capability (false in CAPABILITIES) is never mistaken for success", () => {
  const provider = { PROVIDER_ID: "local", CAPABILITIES: { create: false } };
  const result = callCapability(provider, "create", () => ({ ok: true }));
  assert.equal(result.ok, false);
  assert.equal(result.status, "unsupported");
});

test("callCapability: a capability declared true but with no implementation function reports not_implemented, not success", () => {
  const provider = { PROVIDER_ID: "local", CAPABILITIES: { archive: true } };
  const result = callCapability(provider, "archive", undefined);
  assert.equal(result.ok, false);
  assert.equal(result.status, "not_implemented");
});

test("callCapability: a supported capability with a real function calls through and returns its result", () => {
  const provider = { PROVIDER_ID: "local", CAPABILITIES: { validate: true } };
  const result = callCapability(provider, "validate", () => ({ ok: true, status: "ready" }));
  assert.deepEqual(result, { ok: true, status: "ready" });
});

test("failedCapability/unsupportedCapability/notImplementedCapability produce distinct, never-ok shapes", () => {
  assert.equal(unsupportedCapability("x", "y").status, "unsupported");
  assert.equal(notImplementedCapability("x", "y").status, "not_implemented");
  assert.equal(failedCapability("x", "y", "boom").status, "failed");
  for (const r of [unsupportedCapability("x", "y"), notImplementedCapability("x", "y"), failedCapability("x", "y", "boom")]) {
    assert.equal(r.ok, false);
  }
});
