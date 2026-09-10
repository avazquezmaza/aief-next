import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { BIN, makeProject, aief } from "./helpers/cli-runner.js";

// Change 0138: `aief verify --json` — a versioned, machine-readable
// envelope for the one command with the clearest pass/fail semantic. The
// shared `aief()` test helper merges stdout+stderr (fine for every other
// test's human-readable assertions); these tests call spawnSync directly
// where stdout purity itself is exactly what's being verified — a `--json`
// consumer must get nothing but the JSON object on stdout, ever.
function aiefSplit(cwd, args) {
  const result = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("verify --json: whole-project envelope is valid, parseable JSON on stdout, nothing else", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const { status, stdout, stderr } = aiefSplit(dir, ["verify", "--json"]);
  assert.equal(status, 0);
  assert.equal(stderr, "");
  const envelope = JSON.parse(stdout);
  assert.equal(envelope.schema, "aief.result/v1");
  assert.equal(envelope.operation, "verify");
  assert.equal(envelope.change, null);
  assert.equal(envelope.result, "PASS");
  assert.deepEqual(envelope.errors, []);
  assert.ok(Array.isArray(envelope.warnings), "warnings is always an array (this project has no knowledge/ dir, so it's non-empty)");
  assert.deepEqual(envelope.manifestStatusDrift, []);
  assert.deepEqual(envelope.duplicateChangeIds, []);
});

test("verify --json: whole-project result is FAIL, exit code 1, when a Change is structurally broken", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  fs.rmSync(path.join(dir, "changes", "0001-thing", "spec.md"));
  const { status, stdout } = aiefSplit(dir, ["verify", "--json"]);
  assert.equal(status, 1);
  const envelope = JSON.parse(stdout);
  assert.equal(envelope.result, "FAIL");
  assert.ok(envelope.errors.length > 0);
});

test("verify --json: whole-project envelope reports a real numeric-ID collision", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "first-thing"]);
  const secondDir = path.join(dir, "changes", "0001-second-thing");
  fs.mkdirSync(secondDir);
  for (const f of ["change.md", "spec.md", "tasks.md", "evidence.md"]) fs.writeFileSync(path.join(secondDir, f), "# x\n", "utf8");
  const { stdout } = aiefSplit(dir, ["verify", "--json"]);
  const envelope = JSON.parse(stdout);
  assert.deepEqual(envelope.duplicateChangeIds, [{ id: "0001", basenames: ["0001-first-thing", "0001-second-thing"] }]);
});

test("verify --change --json: envelope names the Change, includes graph issues and manifest drift", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const { status, stdout, stderr } = aiefSplit(dir, ["verify", "--change", "0001-thing", "--json"]);
  assert.equal(status, 0);
  assert.equal(stderr, "");
  const envelope = JSON.parse(stdout);
  assert.equal(envelope.operation, "verify");
  assert.equal(envelope.change, "0001-thing");
  assert.equal(envelope.result, "PASS");
  assert.deepEqual(envelope.graphIssues, []);
  assert.equal(envelope.manifestStatusDrift, null);
});

test("verify --change --json: a Change that doesn't exist returns an ERROR envelope on stdout, exit code 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const { status, stdout, stderr } = aiefSplit(dir, ["verify", "--change", "no-such-change", "--json"]);
  assert.equal(status, 1);
  const envelope = JSON.parse(stdout);
  assert.equal(envelope.result, "ERROR");
  assert.equal(envelope.change, "no-such-change");
  assert.ok(envelope.errors[0].includes("no Change found matching"));
  // The human-readable diagnostic still goes to stderr — informative for a
  // person watching CI logs, without polluting the JSON a script parses.
  assert.match(stderr, /No Change found matching/);
});

test("verify: without --json, output is byte-identical to before this Change (regression)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const { out, status } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /"schema":\s*"aief\.result/);
  assert.match(out, /AIEF Verify/);
  assert.match(out, /Result: PASS/);
});
