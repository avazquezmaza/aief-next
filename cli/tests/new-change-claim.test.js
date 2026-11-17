// Change 0173 — two audit findings (B1, B3):
// B1: `new-change` ignored writeFile()'s false return, so a concurrent run with
//     the same name printed "Created Change" for a directory another run wrote.
// B3: `enrich` matched an existing Change with `endsWith("-" + slug)`, so
//     0001-notes-on-manual-test-001 blocked `enrich manual TEST-001`.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeProject, aief } from "./helpers/cli-runner.js";
import { claimChangeDir } from "../src/commands/shared.js";

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aief.js");

test("0173 B1: claimChangeDir wins once and loses on an existing directory", () => {
  const dir = path.join(makeProject(), "changes", "0001-x");
  assert.equal(claimChangeDir(dir), true);
  assert.equal(claimChangeDir(dir), false);
});

function runConcurrently(cwd, args, n) {
  return Promise.all(Array.from({ length: n }, () => new Promise((resolve) => {
    let out = "";
    const child = spawn(process.execPath, [CLI, ...args], { cwd });
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { out += d; });
    child.on("close", (status) => resolve({ status, out }));
  })));
}

test("0173 B1: concurrent new-change runs never announce a Change they did not create", async () => {
  const dir = makeProject();
  const results = await runConcurrently(dir, ["new-change", "race test", "--no-branch"], 4);
  const created = results.filter((r) => /Created Change:/.test(r.out));
  const dirs = fs.readdirSync(path.join(dir, "changes")).filter((name) => /^\d+-race-test$/.test(name));
  assert.equal(created.length, dirs.length, "one \"Created\" per directory actually created");
  for (const name of dirs) assert.equal(fs.readdirSync(path.join(dir, "changes", name)).length, 4, `${name} is complete`);
  for (const r of results.filter((r) => !/Created Change:/.test(r.out))) {
    assert.equal(r.status, 1);
    assert.match(r.out, /already exists — another aief new-change may be running at the same time\. Nothing was written/);
  }
});

test("0173 B3: enrich creates its own Change next to one whose name merely ends with the same slug", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "notes on manual test 001", "--no-branch"]);
  const r = aief(dir, ["enrich", "manual", "TEST-001", "--no-branch"]);
  assert.doesNotMatch(r.out, /already exists/);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0002-manual-test-001", "change.md")));
});

test("0173 B3: enrich still detects its own Change on a second run", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001", "--no-branch"]);
  assert.match(aief(dir, ["enrich", "manual", "TEST-001", "--no-branch"]).out, /A Change for manual:TEST-001 already exists: changes\/0001-manual-test-001/);
});
