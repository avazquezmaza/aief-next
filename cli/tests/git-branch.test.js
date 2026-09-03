// Change 0114: `aief new-change` (and, by sharing createChange(), `analyze`
// and `propose`) switches off a protected branch automatically — the "one
// branch per Change" convention used to live only as prose some assistants
// never read (Gemini kept creating Changes directly on `main`). These tests
// cover the actual git side effect, not just the file scaffolding the rest
// of the new-change/analyze/propose suites already check.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeProject, aief } from "./helpers/cli-runner.js";

function git(dir, args) {
  return spawnSync("git", args, { cwd: dir, encoding: "utf8" });
}

// makeProject() returns a bare tmpdir (Change 0114 relies on that: it's why
// the whole existing suite never accidentally creates real branches — no
// .git means ensureChangeBranch() is a no-op). This wraps it with an actual
// repo, on a protected branch, mirroring how a real AIEF project is set up.
function makeGitProject(files = {}, { branch = "main" } = {}) {
  const dir = makeProject(files);
  git(dir, ["init", "-q", "-b", branch]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, ".gitkeep"), "");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

function currentBranch(dir) {
  return git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
}

test("new-change on main creates and switches to a dedicated branch", () => {
  const dir = makeGitProject();
  const { status, out } = aief(dir, ["new-change", "Add login", "--type", "general"]);
  assert.equal(status, 0);
  assert.match(out, /Created and switched to branch general\/0001-add-login/);
  assert.equal(currentBranch(dir), "general/0001-add-login");
});

test("new-change on dev also switches (protected, not just main)", () => {
  const dir = makeGitProject({}, { branch: "dev" });
  aief(dir, ["new-change", "Add login"]);
  assert.equal(currentBranch(dir), "general/0001-add-login");
});

test("new-change already on a feature branch leaves it untouched", () => {
  const dir = makeGitProject();
  git(dir, ["checkout", "-q", "-b", "already/here"]);
  const { out } = aief(dir, ["new-change", "Add login"]);
  assert.doesNotMatch(out, /Created and switched to branch/);
  assert.equal(currentBranch(dir), "already/here");
});

test("new-change --no-branch opts out even on main", () => {
  const dir = makeGitProject();
  const { out } = aief(dir, ["new-change", "Add login", "--no-branch"]);
  assert.doesNotMatch(out, /Created and switched to branch/);
  assert.equal(currentBranch(dir), "main");
});

test("new-change outside a git repo is a no-op, not a crash", () => {
  const dir = makeProject(); // no `git init` at all
  const { status } = aief(dir, ["new-change", "Add login"]);
  assert.equal(status, 0);
  assert.equal(fs.existsSync(path.join(dir, "changes", "0001-add-login")), true);
});

test("new-change on main aborts (no scaffolding written) when the checkout itself fails", () => {
  const dir = makeGitProject();
  // Pre-create the exact branch name new-change would try to check out —
  // `git checkout -b` then fails ("branch already exists"), which used to
  // be silently swallowed: createChange() ignored ensureChangeBranch()'s
  // failure and wrote the Change to `main` anyway.
  git(dir, ["branch", "general/0001-add-login"]);
  const { status, out } = aief(dir, ["new-change", "Add login"]);
  assert.notEqual(status, 0);
  assert.match(out, /Could not create branch general\/0001-add-login/);
  assert.equal(currentBranch(dir), "main");
  assert.equal(fs.existsSync(path.join(dir, "changes", "0001-add-login")), false);
});

test("analyze also switches branch — createChange() is shared, not new-change-only", () => {
  const dir = makeGitProject();
  aief(dir, ["analyze", "Legacy app"]);
  assert.match(currentBranch(dir), /^analysis\/0001-legacy-app$/);
});
