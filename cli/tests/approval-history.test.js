// Change 0172 (D1): `verify --strict` notices an approval that is resolved but
// was never committed unchecked — the check that covers assistants with no
// approval-guard hook (Continue). A notice, never an error.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeProject, aief } from "./helpers/cli-runner.js";
import { approvalsNeverUnchecked } from "../src/core/services/approval-history.js";

function git(dir, args) {
  return spawnSync("git", args, { cwd: dir, encoding: "utf8" });
}

const CHANGE = "changes/0001-thing";
const BASE = {
  [`${CHANGE}/change.md`]: "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nFix\n\n## Status\n\nOpen\n",
  [`${CHANGE}/evidence.md`]: "# Evidence\n\n## Summary\n\nReal work.\n"
};

function repo(files) {
  const dir = makeProject({ ...BASE, ...files });
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

function read(dir) {
  const changeDir = path.join(dir, CHANGE);
  const files = {};
  for (const name of ["tasks.md", "spec.md"]) {
    const file = path.join(changeDir, name);
    if (fs.existsSync(file)) files[name] = fs.readFileSync(file, "utf8");
  }
  return { changeDir, files };
}

test("0172 D1: an approval committed unchecked and checked later is not reported", () => {
  const dir = repo({ [`${CHANGE}/tasks.md`]: "# Tasks\n\n- [ ] (human) Owner approves\n" });
  fs.writeFileSync(path.join(dir, CHANGE, "tasks.md"), "# Tasks\n\n- [x] (human) Owner approves\n");
  const { changeDir, files } = read(dir);
  assert.deepEqual(approvalsNeverUnchecked(changeDir, files), []);
});

test("0172 D1: an approval committed already checked is reported, in tasks.md and spec.md", () => {
  const dir = repo({
    [`${CHANGE}/tasks.md`]: "# Tasks\n\n- [x] Work\n- [x] (human) Owner reviews the diff\n",
    [`${CHANGE}/spec.md`]: "# Spec\n\n## Acceptance Criteria\n\n- [x] (review) Peer review\n"
  });
  const { changeDir, files } = read(dir);
  assert.deepEqual(approvalsNeverUnchecked(changeDir, files), [
    { file: "tasks.md", item: "(human) Owner reviews the diff" },
    { file: "spec.md", item: "(review) Peer review" }
  ]);
});

test("0172 D1: an uncommitted edit adding a checked approval is reported; ordinary tasks are ignored", () => {
  const dir = repo({ [`${CHANGE}/tasks.md`]: "# Tasks\n\n- [ ] Work\n" });
  fs.writeFileSync(path.join(dir, CHANGE, "tasks.md"), "# Tasks\n\n- [x] Work\n- [x] (human) Owner approves\n");
  const { changeDir, files } = read(dir);
  assert.deepEqual(approvalsNeverUnchecked(changeDir, files), [{ file: "tasks.md", item: "(human) Owner approves" }]);
});

test("0172 D1: outside a git repository nothing is reported", () => {
  const dir = makeProject({ ...BASE, [`${CHANGE}/tasks.md`]: "# Tasks\n\n- [x] (human) Owner approves\n" });
  const { changeDir, files } = read(dir);
  assert.deepEqual(approvalsNeverUnchecked(changeDir, files), []);
});

test("0172 D1: verify --strict prints a non-blocking notice for an open Change only", () => {
  const dir = repo({
    [`${CHANGE}/tasks.md`]: "# Tasks\n\n- [x] Work\n- [x] (human) Owner reviews the diff\n",
    [`${CHANGE}/spec.md`]: "# Spec\n\n## Requirements\n\n- R1\n\n## Acceptance Criteria\n\n- [x] Done\n"
  });
  const strict = aief(dir, ["verify", "--strict"]);
  assert.match(strict.out, /! changes\/0001-thing: \[strict\] tasks\.md: \(human\) Owner reviews the diff is resolved but was never committed unchecked/);
  assert.doesNotMatch(strict.out, /✗ .*never committed unchecked/, "a notice, never an error");
  assert.doesNotMatch(aief(dir, ["verify"]).out, /never committed unchecked/, "only under --strict");

  fs.writeFileSync(path.join(dir, CHANGE, "change.md"), BASE[`${CHANGE}/change.md`].replace("Open", "Closed (2026-11-17)"));
  assert.doesNotMatch(aief(dir, ["verify", "--strict"]).out, /never committed unchecked/, "closed Changes are not re-judged");
});
