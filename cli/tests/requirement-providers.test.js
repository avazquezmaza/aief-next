import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { retrieveRequirement, hasAdapter, implementedProviders } from "../src/requirement-providers/index.js";

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-requirement-providers-"));
}

test("hasAdapter/implementedProviders reflect only the registered adapters", () => {
  assert.equal(hasAdapter("manual"), true);
  assert.equal(hasAdapter("jira"), true);
  assert.equal(hasAdapter("notion"), false);
  assert.deepEqual(implementedProviders().sort(), ["jira", "manual"]);
});

test("every adapter returns the same uniform shape", () => {
  const cwd = process.cwd();
  process.chdir(tmp());
  try {
    for (const provider of implementedProviders()) {
      const result = retrieveRequirement(provider, "SRC-1", {});
      assert.equal(typeof result.requirement, "object");
      assert.equal(typeof result.retrieved, "boolean");
      assert.ok(Array.isArray(result.openQuestions), `${provider}: openQuestions must be an array`);
      assert.ok(Array.isArray(result.riskNotes), `${provider}: riskNotes must be an array`);
      assert.ok(Array.isArray(result.consoleNotes), `${provider}: consoleNotes must be an array`);
      assert.equal(result.requirement.provider, provider);
      assert.equal(result.requirement.readOnly, true);
    }
  } finally {
    process.chdir(cwd);
  }
});

test("manual adapter always retrieves (no such thing as a missing manual requirement)", () => {
  const { requirement, retrieved, openQuestions } = retrieveRequirement("manual", "TEST-001", {});
  assert.equal(retrieved, true);
  assert.equal(requirement.title, "TEST-001");
  assert.deepEqual(openQuestions, []);
});

test("jira adapter without a local export is an honest placeholder, not a network call", () => {
  const dir = tmp();
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement("jira", "ISSUE-1", {});
    assert.equal(retrieved, false);
    assert.equal(requirement.provider, "jira");
    assert.ok(openQuestions.length >= 1);
    assert.match(openQuestions[0], /No local Jira export found/);
    assert.ok(riskNotes.length >= 1);
    assert.ok(consoleNotes.length >= 1);
  } finally {
    process.chdir(cwd);
  }
});

test("jira adapter normalizes a local export file with --file", () => {
  const dir = tmp();
  const exportPath = path.join(dir, "export.json");
  fs.writeFileSync(exportPath, JSON.stringify({ fields: { summary: "From file", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions } = retrieveRequirement("jira", "ISSUE-2", { file: "export.json" });
    assert.equal(retrieved, true);
    assert.equal(requirement.title, "From file");
    assert.equal(requirement.status, "Open");
    assert.deepEqual(openQuestions, []);
  } finally {
    process.chdir(cwd);
  }
});

// Change 0116: a malformed export used to crash with an uncaught SyntaxError
// instead of degrading to the same placeholder shape every other error path
// in jira.js's retrieve() already returns.
test("jira adapter: a --file with malformed JSON is a clean placeholder, not a crash", () => {
  const dir = tmp();
  const exportPath = path.join(dir, "broken.json");
  fs.writeFileSync(exportPath, "{ invalid", "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement("jira", "ISSUE-9", { file: "broken.json" });
    assert.equal(retrieved, false);
    assert.equal(requirement.provider, "jira");
    assert.ok(openQuestions.some((q) => /not valid JSON/.test(q)));
    assert.ok(riskNotes.length > 0);
    assert.ok(consoleNotes.length > 0);
  } finally {
    process.chdir(cwd);
  }
});

test("retrieveRequirement throws for an unregistered provider (cli.js must check hasAdapter first)", () => {
  assert.throws(() => retrieveRequirement("notion", "X-1", {}), /No requirement provider adapter registered/);
});

// --- F2: --file path containment (Change 0074) ---------------------------

test("jira adapter: --file escaping the project root via '../' is rejected before any read", () => {
  const dir = tmp();
  const outside = path.join(path.dirname(dir), `aief-jira-secret-${process.pid}.json`);
  fs.writeFileSync(outside, JSON.stringify({ fields: { summary: "EXFILTRATED", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const relativeEscape = `../${path.basename(outside)}`;
    const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement("jira", "ISSUE-3", { file: relativeEscape });
    assert.equal(retrieved, false);
    assert.notEqual(requirement.title, "EXFILTRATED", "outside content must never be read");
    assert.match(openQuestions.join("\n"), /outside the project root/);
    assert.match(riskNotes.join("\n"), /outside the project root/);
    assert.match(consoleNotes.join("\n"), /outside the project root/);
  } finally {
    fs.rmSync(outside, { force: true });
    process.chdir(cwd);
  }
});

test("jira adapter: --file as an absolute path outside the project root is rejected before any read", () => {
  const dir = tmp();
  const outside = path.join(os.tmpdir(), `aief-jira-secret-abs-${process.pid}.json`);
  fs.writeFileSync(outside, JSON.stringify({ fields: { summary: "EXFILTRATED", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions } = retrieveRequirement("jira", "ISSUE-4", { file: outside });
    assert.equal(retrieved, false);
    assert.notEqual(requirement.title, "EXFILTRATED");
    assert.match(openQuestions.join("\n"), /outside the project root/);
  } finally {
    fs.rmSync(outside, { force: true });
    process.chdir(cwd);
  }
});

test("jira adapter: --file as a symlink physically inside the project root but pointing outside it is rejected (real-path containment)", () => {
  const dir = tmp();
  const outside = path.join(os.tmpdir(), `aief-jira-secret-symlink-${process.pid}.json`);
  fs.writeFileSync(outside, JSON.stringify({ fields: { summary: "EXFILTRATED", status: { name: "Open" } } }), "utf8");
  const linkPath = path.join(dir, "escape-link.json");
  fs.symlinkSync(outside, linkPath);
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions } = retrieveRequirement("jira", "ISSUE-5", { file: "escape-link.json" });
    assert.equal(retrieved, false);
    assert.notEqual(requirement.title, "EXFILTRATED");
    assert.match(openQuestions.join("\n"), /outside the project root/);
  } finally {
    fs.rmSync(linkPath, { force: true });
    fs.rmSync(outside, { force: true });
    process.chdir(cwd);
  }
});

test("jira adapter: a --file value using '../' that still resolves back inside the project root is accepted, not falsely rejected", () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, "requirements", "jira"), { recursive: true });
  const exportPath = path.join(dir, "requirements", "jira", "boundary.json");
  fs.writeFileSync(exportPath, JSON.stringify({ fields: { summary: "Boundary case", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const boundaryPath = "requirements/jira/../jira/boundary.json";
    const { requirement, retrieved } = retrieveRequirement("jira", "ISSUE-6", { file: boundaryPath });
    assert.equal(retrieved, true);
    assert.equal(requirement.title, "Boundary case");
  } finally {
    process.chdir(cwd);
  }
});

test("jira adapter: --file pointing inside the project root to a nonexistent file keeps today's exact 'not found' behavior (not the containment path)", () => {
  const dir = tmp();
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved, openQuestions } = retrieveRequirement("jira", "ISSUE-7", { file: "requirements/jira/missing.json" });
    assert.equal(retrieved, false);
    assert.equal(requirement.provider, "jira");
    assert.match(openQuestions.join("\n"), /No local Jira export found/);
    assert.doesNotMatch(openQuestions.join("\n"), /outside the project root/);
  } finally {
    process.chdir(cwd);
  }
});

// --- Change 0105: sourceId itself (no --file) escaping the project root ---
// sourceId is unsanitized CLI input (cli/src/commands/enrich.js passes argv
// straight through) — it is interpolated into the default
// "requirements/jira/<sourceId>.json" path exactly like --file is
// interpolated into an explicit one, so it needs the same containment check.

test("jira adapter: a sourceId escaping the project root via '../' (no --file) is rejected before any read", () => {
  const dir = tmp();
  const outside = path.join(path.dirname(dir), `aief-jira-secret-sourceid-${process.pid}`);
  fs.writeFileSync(`${outside}.json`, JSON.stringify({ fields: { summary: "EXFILTRATED", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    // Default path is requirements/jira/<sourceId>.json — sourceId needs to
    // climb out of both of those segments, then out of the project root
    // itself, to reach `outside` (dir's own sibling).
    const relativeEscape = `../../../${path.basename(outside)}`;
    const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement("jira", relativeEscape, {});
    assert.equal(retrieved, false);
    assert.notEqual(requirement.title, "EXFILTRATED", "outside content must never be read");
    assert.match(openQuestions.join("\n"), /outside the project root/);
    assert.match(riskNotes.join("\n"), /outside the project root/);
    assert.match(consoleNotes.join("\n"), /outside the project root/);
  } finally {
    fs.rmSync(`${outside}.json`, { force: true });
    process.chdir(cwd);
  }
});

test("jira adapter: a sourceId that stays within requirements/jira/ (no --file) is unaffected by the containment check", () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, "requirements", "jira"), { recursive: true });
  const exportPath = path.join(dir, "requirements", "jira", "ISSUE-8.json");
  fs.writeFileSync(exportPath, JSON.stringify({ fields: { summary: "Normal case", status: { name: "Open" } } }), "utf8");
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const { requirement, retrieved } = retrieveRequirement("jira", "ISSUE-8", {});
    assert.equal(retrieved, true);
    assert.equal(requirement.title, "Normal case");
  } finally {
    process.chdir(cwd);
  }
});
