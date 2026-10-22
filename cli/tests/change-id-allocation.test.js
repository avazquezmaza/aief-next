// Change 0169: `nextChangeId()` also counts Change IDs taken in other
// worktrees and by AIEF branches (`<type>/<NNNN>-<slug>`), so two parallel
// Changes do not get the same number. Read-only git; outside git, unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeProject, aief } from "./helpers/cli-runner.js";
import { gitKnownChangeIds } from "../src/core/services/git-branch.js";

function git(dir, args) {
  const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

function makeGitProject(files = {}) {
  const dir = makeProject({ "README.md": "# x", ...files });
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

function createdId(out) {
  return out.match(/Created Change: changes\/(\d+)-/)[1];
}

test("outside git, the next ID comes from changes/ only, as before", () => {
  const dir = makeProject({ "changes/0004-a/change.md": "# a\n" });
  assert.equal(createdId(aief(dir, ["new-change", "next"]).out), "0005");
});

test("a git repo with no other worktree or AIEF branch allocates as before", () => {
  const dir = makeGitProject({ "changes/0002-a/change.md": "# a\n" });
  assert.deepEqual(gitKnownChangeIds(dir), []);
  assert.equal(createdId(aief(dir, ["new-change", "next"]).out), "0003");
});

test("a Change scaffolded in another worktree is not reused", () => {
  const dir = makeGitProject({ "changes/0001-a/change.md": "# a\n" });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), "aief-wt-"));
  fs.rmSync(other, { recursive: true });
  git(dir, ["worktree", "add", "-q", "-b", "scratch", other]);
  const result = aief(other, ["new-change", "in other worktree", "--no-branch"]);
  assert.equal(createdId(result.out), "0002");
  assert.ok(gitKnownChangeIds(dir).includes(2));
  assert.equal(createdId(aief(dir, ["new-change", "here", "--no-branch"]).out), "0003");
});

test("a local AIEF branch for a higher ID, not yet merged, is not reused", () => {
  const dir = makeGitProject({ "changes/0001-a/change.md": "# a\n" });
  git(dir, ["branch", "feature/0007-elsewhere"]);
  assert.equal(createdId(aief(dir, ["new-change", "next", "--no-branch"]).out), "0008");
});

test("an already-fetched remote-tracking AIEF branch counts; nothing is fetched", () => {
  const dir = makeGitProject({ "changes/0001-a/change.md": "# a\n" });
  git(dir, ["update-ref", "refs/remotes/origin/fix/0011-teammate", "HEAD"]);
  assert.deepEqual(gitKnownChangeIds(dir), [11]);
  assert.equal(createdId(aief(dir, ["new-change", "next", "--no-branch"]).out), "0012");
});

test("branches AIEF does not create are ignored, even with large numbers", () => {
  const dir = makeGitProject({ "changes/0001-a/change.md": "# a\n" });
  for (const name of ["release/2026-10", "feat/0090-manual", "bogus/0050-x", "0040-no-type"]) git(dir, ["branch", name]);
  assert.deepEqual(gitKnownChangeIds(dir), []);
  assert.equal(createdId(aief(dir, ["new-change", "next", "--no-branch"]).out), "0002");
});

test("an AIEF project in a subdirectory reads the same subdirectory of other worktrees", () => {
  const dir = makeGitProject({ "app/changes/0001-a/change.md": "# a\n", "changes/0030-unrelated/change.md": "# x\n" });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), "aief-wt-"));
  fs.rmSync(other, { recursive: true });
  git(dir, ["worktree", "add", "-q", "--detach", other]);
  fs.mkdirSync(path.join(other, "app/changes/0004-there"), { recursive: true });
  assert.deepEqual(gitKnownChangeIds(path.join(dir, "app")).sort(), [1, 4], "not 30: root changes/ is another project");
});
