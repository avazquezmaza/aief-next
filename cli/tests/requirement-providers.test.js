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

test("retrieveRequirement throws for an unregistered provider (cli.js must check hasAdapter first)", () => {
  assert.throws(() => retrieveRequirement("notion", "X-1", {}), /No requirement provider adapter registered/);
});
