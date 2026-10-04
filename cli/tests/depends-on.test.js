import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { parseDependsOn } from "../src/core/domain/change.js";
import { makeProject, aief, declareDependsOn } from "./helpers/cli-runner.js";

// Change 0157 (ADR-038): dependencies live in change.md's `## Depends on`,
// `new-change --depends-on` writes it, `close` warns on an open dependency,
// and a leftover manifest.json is named as no longer read.

function closeable(dir, changeId) {
  const changeDir = path.join(dir, "changes", changeId);
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Work\n", "utf8");
  return changeDir;
}

test("parseDependsOn: one id per bullet, with or without slug, backticks or a trailing note", () => {
  const md = "# Change\n\n## Depends on\n\n- 0002-base-api\n* `0003`\n+ 0004-auth — needs the token model\n- not an id\n\n## Success Criteria\n\n- 0009-not-a-dependency\n";
  assert.deepEqual(parseDependsOn(md), ["0002-base-api", "0003", "0004-auth"]);
  assert.deepEqual(parseDependsOn("# Change\n\n## Objective\n\nx\n"), []);
});

test("new-change --depends-on writes the section with full basenames, resolving a bare id", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "base api", "--no-branch"]);
  aief(dir, ["new-change", "auth", "--no-branch"]);
  const { status } = aief(dir, ["new-change", "login", "--no-branch", "--depends-on", "0001,0002-auth"]);
  assert.equal(status, 0);
  const changeMd = fs.readFileSync(path.join(dir, "changes", "0003-login", "change.md"), "utf8");
  assert.match(changeMd, /## Depends on\n\n- 0001-base-api\n- 0002-auth\n\n## Success Criteria/);
});

test("new-change --depends-on rejects an unknown Change before writing anything", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { status, out } = aief(dir, ["new-change", "login", "--no-branch", "--depends-on", "0099"]);
  assert.equal(status, 1);
  assert.match(out, /--depends-on: no Change found matching "0099"/);
  assert.equal(fs.existsSync(path.join(dir, "changes", "0001-login")), false);
});

test("status --graph resolves a bare numeric dependency to its Change", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "base api", "--no-branch"]);
  aief(dir, ["new-change", "login", "--no-branch"]);
  declareDependsOn(path.join(dir, "changes", "0002-login"), ["0001"]);
  const { out } = aief(dir, ["status", "--graph"]);
  assert.match(out, /- 0002-login -> 0001-base-api/);
  assert.match(out, /Issues: none/);
});

test("status --change shows the declared dependencies", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "base api", "--no-branch"]);
  aief(dir, ["new-change", "login", "--no-branch", "--depends-on", "0001"]);
  assert.match(aief(dir, ["status", "--change", "0002-login"]).out, /Depends on: 0001-base-api/);
});

test("close warns about an open dependency and still closes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "base api", "--no-branch"]);
  aief(dir, ["new-change", "login", "--no-branch", "--depends-on", "0001"]);
  const changeDir = closeable(dir, "0002-login");
  const { status, out } = aief(dir, ["close", "--yes", "--change", "0002-login"]);
  assert.equal(status, 0);
  assert.match(out, /! depends on 0001-base-api, which is still open/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /Closed \(/);
});

test("close says nothing about dependencies once they are closed", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "base api", "--no-branch"]);
  aief(dir, ["new-change", "login", "--no-branch", "--depends-on", "0001"]);
  closeable(dir, "0001-base-api");
  assert.equal(aief(dir, ["close", "--yes", "--change", "0001-base-api"]).status, 0);
  closeable(dir, "0002-login");
  const { status, out } = aief(dir, ["close", "--yes", "--change", "0002-login"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /depends on/);
});

test("verify names a leftover manifest.json as no longer read, without failing", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing", "--no-branch"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-thing", "manifest.json"), JSON.stringify({ schema: "aief.change/v1", track: "governed", status: "closed" }), "utf8");
  const whole = aief(dir, ["verify"]);
  assert.equal(whole.status, 0);
  assert.match(whole.out, /! 0001-thing: manifest\.json is no longer read \(AIEF 4\.0, ADR-038\)/);
  const one = aief(dir, ["verify", "--change", "0001-thing"]);
  assert.match(one.out, /manifest\.json is no longer read/);
  assert.match(aief(dir, ["status"]).out, /Open Changes: 1/, "the manifest's status no longer overrides change.md");
});
