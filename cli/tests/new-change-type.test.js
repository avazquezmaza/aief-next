// Change 0164: `aief new-change --type` writes the requested type in
// change.md, normalized through the closed `## Type` list, and refuses an
// unknown type (or enrichment) before any branch or file exists.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeProject, aief } from "./helpers/cli-runner.js";

function git(dir, args) {
  return spawnSync("git", args, { cwd: dir, encoding: "utf8" });
}

function makeGitProject() {
  const dir = makeProject();
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, ".gitkeep"), "");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

function changeType(dir, basename) {
  return fs.readFileSync(path.join(dir, "changes", basename, "change.md"), "utf8").match(/^## Type\n\n(.+)$/m)[1];
}

for (const [given, written] of [["fix", "Fix"], ["feature", "Feature"], ["documentation", "Documentation"], ["general", "General"], ["FIX", "Fix"], ["bugfix", "Fix"], ["Funcionalidad", "Feature"]]) {
  test(`new-change --type ${given} writes Type: ${written}`, () => {
    const dir = makeProject();
    const { status, out } = aief(dir, ["new-change", "typed thing", "--type", given]);
    assert.equal(status, 0, out);
    assert.equal(changeType(dir, "0001-typed-thing"), written);
  });
}

test("new-change without --type still writes Type: General", () => {
  const dir = makeProject();
  assert.equal(aief(dir, ["new-change", "plain thing"]).status, 0);
  assert.equal(changeType(dir, "0001-plain-thing"), "General");
});

test("new-change --type definicion is normalized to the Definition scaffold and branch", () => {
  const dir = makeGitProject();
  const { status, out } = aief(dir, ["new-change", "choose stack", "--type", "Definición"]);
  assert.equal(status, 0, out);
  assert.equal(changeType(dir, "0001-choose-stack"), "Definition");
  assert.match(fs.readFileSync(path.join(dir, "changes/0001-choose-stack/change.md"), "utf8"), /## Decision \(human\)/);
  assert.equal(git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim(), "definition/0001-choose-stack");
});

test("new-change --type fix names the branch and the Type the same way", () => {
  const dir = makeGitProject();
  assert.equal(aief(dir, ["new-change", "broken link", "--type", "FIX"]).status, 0);
  assert.equal(git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim(), "fix/0001-broken-link");
  assert.equal(changeType(dir, "0001-broken-link"), "Fix");
});

for (const [given, message] of [["bogus", /--type: unknown type "bogus"\. Valid types: general, analysis, definition, fix, feature, documentation\./], ["", /--type: unknown type ""/], ["enrichment", /aief enrich --file <source>/]]) {
  test(`new-change --type ${JSON.stringify(given)} fails before creating a branch or files`, () => {
    const dir = makeGitProject();
    const { status, out } = aief(dir, ["new-change", "anything", "--type", given]);
    assert.equal(status, 1, out);
    assert.match(out, message);
    assert.equal(git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim(), "main");
    assert.equal(git(dir, ["branch", "--list"]).stdout.trim(), "* main");
    assert.equal(fs.existsSync(path.join(dir, "changes")) && fs.readdirSync(path.join(dir, "changes")).length > 0, false);
  });
}
