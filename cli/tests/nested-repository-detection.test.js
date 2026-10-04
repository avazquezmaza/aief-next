import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectProject } from "../src/detect.js";

// Change 0155 (B3 from Analysis 0154): a subdirectory with its own `.git`
// is another repository, and its files must not describe this project.

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-nested-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

const ids = (dir) => detectProject(dir).signals.map((s) => s.id);

test("a nested repository with a .git directory is not walked", () => {
  const dir = makeProject({ "README.md": "# x\n", "clone/sub/Dockerfile": "FROM node:20\n" });
  fs.mkdirSync(path.join(dir, "clone", ".git"));
  assert.ok(!ids(dir).includes("docker"), ids(dir).join(","));
});

test("a nested repository with a .git file (submodule or worktree) is not walked", () => {
  const dir = makeProject({ "README.md": "# x\n", "mod/.git": "gitdir: ../.git/modules/mod\n", "mod/sub/Dockerfile": "FROM node:20\n" });
  assert.ok(!ids(dir).includes("docker"), ids(dir).join(","));
});

test("the root is walked even though it has its own .git", () => {
  const dir = makeProject({ "README.md": "# x\n", "src/main/docker/Dockerfile.jvm": "FROM ubi9\n" });
  fs.mkdirSync(path.join(dir, ".git"));
  assert.ok(ids(dir).includes("docker"), ids(dir).join(","));
});

test("a plain subdirectory without .git is still walked", () => {
  const dir = makeProject({ "README.md": "# x\n", "deploy/sub/Dockerfile": "FROM node:20\n" });
  assert.ok(ids(dir).includes("docker"), ids(dir).join(","));
});
