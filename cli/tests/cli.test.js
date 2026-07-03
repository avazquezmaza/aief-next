import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aief.js");
const POSIX = process.platform !== "win32";

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-cli-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

function aief(cwd, args, env = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}

test("new-change assigns sequential ids", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "First Thing"]);
  aief(dir, ["new-change", "second-thing"]);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-first-thing", "0002-second-thing"]);
});

test("adopt does not collide with existing change ids", () => {
  const dir = makeProject({ "changes/0001-existing/change.md": "# Change" });
  const { status, out } = aief(dir, ["adopt"]);
  assert.equal(status, 0);
  assert.match(out, /0002-adopt-aief/);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-existing", "0002-adopt-aief"]);
});

test("adopt is idempotent", () => {
  const dir = makeProject();
  aief(dir, ["adopt"]);
  const { out } = aief(dir, ["adopt"]);
  assert.match(out, /Adoption Change already exists/);
  const adoptDirs = fs.readdirSync(path.join(dir, "changes")).filter((n) => n.includes("adopt-aief"));
  assert.equal(adoptDirs.length, 1);
});

test("adopt does not touch application files", () => {
  const dir = makeProject({ "src/app.js": "console.log('app');" });
  aief(dir, ["adopt"]);
  assert.equal(fs.readFileSync(path.join(dir, "src", "app.js"), "utf8"), "console.log('app');");
});

test("doctor explains skill recommendations", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS platform." });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.match(out, /multitenant-saas-architect/);
  assert.match(out, /because: .*tenant/i);
});

test("doctor does not recommend governance for generic prose", () => {
  const dir = makeProject({ "README.md": "We value maintainability and plain code." });
  const { out } = aief(dir, ["doctor"]);
  assert.doesNotMatch(out, /ai-workflow-governance/);
  assert.doesNotMatch(out, /multitenant-saas-architect/);
});

test("analyze creates an Analysis Change with the standard evidence structure", () => {
  const dir = makeProject();
  const { status } = aief(dir, ["analyze"]);
  assert.equal(status, 0);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nAnalysis/);
  const evidence = fs.readFileSync(path.join(changeDir, "evidence.md"), "utf8");
  for (const sectionName of ["Summary", "Activities Performed", "Verification", "Findings", "Risks", "Recommendations", "Artifacts Produced", "Lessons Learned", "Next Change"]) {
    assert.match(evidence, new RegExp(`## ${sectionName}`), `evidence.md must contain ${sectionName}`);
  }
});

test("prompt recognizes an Analysis Change even with CRLF line endings", () => {
  const dir = makeProject();
  aief(dir, ["analyze"]);
  const changeFile = path.join(dir, "changes", "0001-analyze-current-architecture", "change.md");
  fs.writeFileSync(changeFile, fs.readFileSync(changeFile, "utf8").replace(/\n/g, "\r\n"), "utf8");
  const { out } = aief(dir, ["prompt", "--profile", "architect"]);
  assert.match(out, /Do not modify application source code/);
});

test("verify fails when a change file is missing and warns on placeholder evidence", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "thing"]);
  const pass = aief(dir, ["verify"]);
  assert.equal(pass.status, 0);
  assert.match(pass.out, /template placeholders/);
  fs.rmSync(path.join(dir, "changes", "0001-thing", "spec.md"));
  const fail = aief(dir, ["verify"]);
  assert.equal(fail.status, 1);
  assert.match(fail.out, /spec\.md missing/);
});

test("propose without OpenSpec falls back loudly to a local Change", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["propose", "Add login"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /OpenSpec is not installed/);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-add-login", "proposal.md")));
});

test("propose warns when OpenSpec lacks a propose command", { skip: !POSIX }, () => {
  const dir = makeProject();
  const fakeBin = path.join(dir, "fakebin");
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(path.join(fakeBin, "openspec"), "#!/bin/sh\ncase \"$1\" in\n--version) echo 1.2.3 ;;\n--help) echo 'usage: openspec [validate]' ;;\n*) exit 1 ;;\nesac\n", { mode: 0o755 });
  const { out } = aief(dir, ["propose", "Add login"], { PATH: `${fakeBin}:${process.env.PATH}` });
  assert.match(out, /does not expose a "propose" command/);
  assert.match(out, /Falling back to local Change generation/);
});

test("propose reports delegation failure and falls back", { skip: !POSIX }, () => {
  const dir = makeProject();
  const fakeBin = path.join(dir, "fakebin");
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(path.join(fakeBin, "openspec"), "#!/bin/sh\ncase \"$1\" in\n--version) echo 9.9.9 ;;\n--help) echo 'commands: propose validate' ;;\npropose) exit 7 ;;\n*) exit 1 ;;\nesac\n", { mode: 0o755 });
  const { out } = aief(dir, ["propose", "Add login"], { PATH: `${fakeBin}:${process.env.PATH}` });
  assert.match(out, /OpenSpec delegation failed \(exit code 7\)\. Falling back to local Change generation\./);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-add-login", "proposal.md")));
});

test("help covers every documented command with six fields", () => {
  const dir = makeProject();
  for (const command of ["doctor", "status", "adopt", "analyze", "new-change", "propose", "prompt", "verify", "close", "release", "init", "use-profile", "help"]) {
    const { status, out } = aief(dir, ["help", command]);
    assert.equal(status, 0, `help ${command} must exit 0`);
    for (const field of ["Purpose", "When to use it", "Reads", "Writes", "Example", "Next step"]) {
      assert.match(out, new RegExp(field), `help ${command} must include ${field}`);
    }
  }
});

test("release reports honestly when notes already exist", () => {
  const dir = makeProject();
  const first = aief(dir, ["release", "0.9.0"]);
  assert.match(first.out, /Created release notes/);
  const second = aief(dir, ["release", "0.9.0"]);
  assert.match(second.out, /already exist/);
});
