import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as openspec from "../src/sdd-providers/openspec.js";

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-sdd-openspec-"));
}

function withRestrictedPath(fn) {
  const original = process.env.PATH;
  process.env.PATH = path.dirname(process.execPath);
  try {
    return fn();
  } finally {
    process.env.PATH = original;
  }
}

function makeOpenSpecChange(cwd, changeId, files = {}) {
  const changeDir = path.join(cwd, "openspec", "changes", changeId);
  fs.mkdirSync(changeDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(changeDir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return changeDir;
}

function changeWithSddRef(changeId) {
  return { manifest: { sdd: { provider: "openspec", change_id: changeId } } };
}

test("openspec: detect() separates CLI presence from project-structure presence", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    const noneDetected = openspec.detect(cwd);
    assert.equal(noneDetected.available, false);
    assert.equal(noneDetected.cliPresent, false);
    assert.equal(noneDetected.structurePresent, false);

    fs.mkdirSync(path.join(cwd, "openspec"));
    const structureOnly = openspec.detect(cwd);
    assert.equal(structureOnly.available, true);
    assert.equal(structureOnly.structurePresent, true);
    // cliPresent is null, not computed, on the structure-present path — the
    // binary check is skipped entirely once the filesystem already answers
    // "available" (independent review finding: detect() used to spawn a
    // process unconditionally, even when the directory check alone sufficed).
    assert.equal(structureOnly.cliPresent, null);
  });
});

test("openspec: resolveChange() fails cleanly when no sdd.change_id is declared", () => {
  const cwd = tempCwd();
  const result = openspec.resolveChange({ manifest: {} }, cwd);
  assert.equal(result.resolved, false);
  assert.match(result.reason, /no sdd\.change_id/);
});

test("openspec: resolveChange() reports a referenced Change that does not exist, without guessing", () => {
  const cwd = tempCwd();
  const result = openspec.resolveChange(changeWithSddRef("does-not-exist"), cwd);
  assert.equal(result.resolved, false);
  assert.match(result.reason, /does not exist/);
});

// Independent review finding (security): a manifest.json can come from an
// untrusted contributor's PR, not only a trusted maintainer. sdd.change_id
// must never be joined into a filesystem path without a containment check —
// otherwise it can read arbitrary files outside the project and report
// their content as if it were this Change's SDD proposal.
test("openspec: resolveChange() rejects a change_id that would escape openspec/changes/ via path traversal", () => {
  const cwd = tempCwd();
  const secretDir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-secret-"));
  fs.writeFileSync(path.join(secretDir, "proposal.md"), "SECRET CONTENT\n", "utf8");
  const relativeEscape = path.relative(path.join(cwd, "openspec", "changes"), secretDir);

  const viaRelative = openspec.resolveChange(changeWithSddRef(relativeEscape), cwd);
  assert.equal(viaRelative.resolved, false);
  assert.match(viaRelative.reason, /not a valid change identifier/);

  const viaAbsolute = openspec.resolveChange(changeWithSddRef(secretDir), cwd);
  assert.equal(viaAbsolute.resolved, false);

  const artifacts = openspec.getArtifacts(changeWithSddRef(relativeEscape), cwd);
  assert.ok(artifacts.error, "must report an error, never resolve artifacts outside openspec/changes/");
});

test("openspec: resolveChange() accepts a change_id that merely contains dots or dashes without traversing", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "v1.2-add-login", {});
  const result = openspec.resolveChange(changeWithSddRef("v1.2-add-login"), cwd);
  assert.equal(result.resolved, true);
});

test("openspec: getArtifacts() resolves proposal/tasks/design/specifications against the real documented shape", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "add-login", {
    "proposal.md": "# Proposal\n\nWhy this matters.\n",
    "tasks.md": "# Tasks\n\n- [x] T-01 Implement login.\n",
    "specs/auth/spec.md": "# Spec\n\n- **R1** — Users can log in.\n"
    // design.md intentionally absent — optional per OpenSpec's own convention
  });
  const change = changeWithSddRef("add-login");
  const result = openspec.getArtifacts(change, cwd);
  assert.equal(result.provider, "openspec");
  assert.equal(result.artifacts.proposal.state, "present");
  assert.equal(result.artifacts.tasks.state, "present");
  assert.equal(result.artifacts.design.state, "not_applicable");
  assert.equal(result.artifacts.specifications.length, 1);
  assert.equal(result.artifacts.specifications[0].state, "present");
  assert.equal(result.artifacts.specifications[0].metadata.capability, "auth");
});

test("openspec: multiple specifications under specs/*/spec.md are all resolved, in deterministic (sorted) order", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "multi-spec", {
    "proposal.md": "# Proposal\n",
    "tasks.md": "# Tasks\n",
    "specs/zebra/spec.md": "# Spec\n",
    "specs/auth/spec.md": "# Spec\n",
    "specs/middle/spec.md": "# Spec\n"
  });
  const result = openspec.getArtifacts(changeWithSddRef("multi-spec"), cwd);
  const capabilities = result.artifacts.specifications.map((s) => s.metadata.capability);
  assert.deepEqual(capabilities, ["auth", "middle", "zebra"]);
});

test("openspec: zero specifications is a legitimate, distinct state from an unreadable specs/ directory", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "no-specs-yet", { "proposal.md": "# Proposal\n", "tasks.md": "# Tasks\n" });
  const result = openspec.getArtifacts(changeWithSddRef("no-specs-yet"), cwd);
  assert.deepEqual(result.artifacts.specifications, []);
});

test("openspec: a missing proposal.md is reported as missing, not silently substituted", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "no-proposal", { "tasks.md": "# Tasks\n" });
  const result = openspec.getArtifacts(changeWithSddRef("no-proposal"), cwd);
  assert.equal(result.artifacts.proposal.state, "missing");
});

test("openspec: getArtifacts() reports an error (not a crash) for an unresolved Change reference", () => {
  const cwd = tempCwd();
  const result = openspec.getArtifacts(changeWithSddRef("nope"), cwd);
  assert.ok(result.error);
  assert.match(result.error, /does not exist/);
});

test("openspec: getRequirements()/getTasks() extract deterministically from resolved artifacts", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "add-login", {
    "proposal.md": "# Proposal\n",
    "tasks.md": "# Tasks\n\n- [x] T-01 Implement login.\n- [ ] T-02 Write tests.\n",
    "specs/auth/spec.md": "# Spec\n\n- **R1** — Users can log in.\n- **R2** — Sessions expire.\n"
  });
  const change = changeWithSddRef("add-login");
  const requirements = openspec.getRequirements(change, cwd);
  assert.equal(requirements.length, 2);
  assert.equal(requirements[0].id, "R1");
  const tasks = openspec.getTasks(change, cwd);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].completed, true);
  assert.equal(tasks[1].completed, false);
});

test("openspec: validate() is ready when proposal/tasks are present, not_ready when either is missing", () => {
  const cwd = tempCwd();
  makeOpenSpecChange(cwd, "ready-one", { "proposal.md": "# Proposal\n", "tasks.md": "# Tasks\n\nreal\n", "specs/auth/spec.md": "# Spec\n" });
  assert.equal(openspec.validate(changeWithSddRef("ready-one"), cwd).status, "ready");

  makeOpenSpecChange(cwd, "not-ready-one", { "tasks.md": "# Tasks\n" });
  const notReady = openspec.validate(changeWithSddRef("not-ready-one"), cwd);
  assert.equal(notReady.status, "not_ready");
  assert.ok(notReady.blockers.some((b) => b.includes("proposal")));
});

test("openspec: validate() is invalid when the Change reference itself doesn't resolve", () => {
  const cwd = tempCwd();
  const result = openspec.validate(changeWithSddRef("nope"), cwd);
  assert.equal(result.status, "invalid");
});

test("openspec: no operation writes any file — byte-comparison before/after every call", () => {
  const cwd = tempCwd();
  const changeDir = makeOpenSpecChange(cwd, "add-login", {
    "proposal.md": "# Proposal\n",
    "tasks.md": "# Tasks\n\n- [x] T-01 Do it.\n",
    "specs/auth/spec.md": "# Spec\n\n- **R1** — Text.\n"
  });
  const before = {};
  for (const f of ["proposal.md", "tasks.md", "specs/auth/spec.md"]) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  const change = changeWithSddRef("add-login");
  openspec.getArtifacts(change, cwd);
  openspec.getRequirements(change, cwd);
  openspec.getTasks(change, cwd);
  openspec.validate(change, cwd);
  for (const f of ["proposal.md", "tasks.md", "specs/auth/spec.md"]) {
    assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
  }
  assert.equal(fs.existsSync(path.join(cwd, "changes")), false, "no AIEF changes/ directory should be created by an OpenSpec read");
});
