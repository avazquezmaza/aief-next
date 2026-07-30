import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { discoverAiSpecs, resolveResources } from "../src/core/domain/ai-specs.js";

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-ai-specs-"));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

test("discoverAiSpecs: no ai-specs/ directory is a strict no-op", () => {
  const cwd = tempCwd();
  const result = discoverAiSpecs(cwd);
  assert.equal(result.present, false);
  assert.equal(result.root, path.join(cwd, "ai-specs"));
  assert.deepEqual(result.skills, []);
  assert.deepEqual(result.standards, []);
});

test("discoverAiSpecs: skills and standards are both discovered when present", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "code-review.md"), "# Code Review\n\nDo it carefully.\n");
  writeFile(path.join(cwd, "ai-specs", "standards", "security.md"), "# Security\n\nNever log secrets.\n");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.present, true);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].id, "code-review");
  assert.equal(result.skills[0].state, "present");
  assert.match(result.skills[0].content, /Do it carefully/);
  assert.equal(result.standards.length, 1);
  assert.equal(result.standards[0].id, "security");
  assert.match(result.standards[0].content, /Never log secrets/);
});

test("discoverAiSpecs: an incomplete ai-specs/ (only skills/, no standards/) is not an error", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "only-one.md"), "content");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.present, true);
  assert.equal(result.skills.length, 1);
  assert.deepEqual(result.standards, []);
});

test("discoverAiSpecs: an incomplete ai-specs/ (only standards/, no skills/) is not an error", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "only-one.md"), "content");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.present, true);
  assert.deepEqual(result.skills, []);
  assert.equal(result.standards.length, 1);
});

test("discoverAiSpecs: a resource directory that is actually a file is a read_error, never thrown", () => {
  const cwd = tempCwd();
  fs.mkdirSync(path.join(cwd, "ai-specs"), { recursive: true });
  // "skills" exists but is a file, not a directory — fs.readdirSync(dir) must throw ENOTDIR.
  fs.writeFileSync(path.join(cwd, "ai-specs", "skills"), "not a directory", "utf8");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].id, null);
  assert.equal(result.skills[0].state, "read_error");
  assert.match(result.skills[0].diagnostic, /could not read/);
});

test("discoverAiSpecs: two filenames colliding on id report present + duplicate", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "foo.md"), "first");
  writeFile(path.join(cwd, "ai-specs", "skills", "foo.MD"), "second");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.skills.length, 2);
  const states = result.skills.map((r) => r.state).sort();
  assert.deepEqual(states, ["duplicate", "present"]);
  assert.equal(result.skills.every((r) => r.id === "foo"), true);
});

test("discoverAiSpecs: an empty .md file is reported as state 'empty'", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "blank.md"), "   \n\n  ");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.standards[0].state, "empty");
  assert.equal(result.standards[0].content, null);
});

test("discoverAiSpecs: is deterministic across repeated calls", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "a.md"), "content a");
  const first = discoverAiSpecs(cwd);
  const second = discoverAiSpecs(cwd);
  assert.deepEqual(first, second);
});

test("resolveResources: a project resource overrides a matching built-in id (never merged)", () => {
  const builtins = [{ id: "code-review", description: "AIEF built-in review guidance" }];
  const project = [{ id: "code-review", path: "/proj/ai-specs/skills/code-review.md", state: "present", content: "project guidance", diagnostic: null }];
  const { resources, warnings } = resolveResources(builtins, project);
  assert.equal(resources.length, 1);
  assert.equal(resources[0].source, "project");
  assert.equal(resources[0].value.content, "project guidance");
  assert.equal("description" in resources[0].value, false, "built-in fields must never leak into the resolved project entry");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /code-review/);
  assert.match(warnings[0], /overrides/);
});

test("resolveResources: a project-only id is added with no warning", () => {
  const builtins = [{ id: "existing" }];
  const project = [{ id: "brand-new", path: "/proj/ai-specs/skills/brand-new.md", state: "present", content: "x", diagnostic: null }];
  const { resources, warnings } = resolveResources(builtins, project);
  assert.equal(resources.length, 2);
  const added = resources.find((r) => r.id === "brand-new");
  assert.equal(added.source, "project");
  assert.equal(warnings.length, 0);
});

test("resolveResources: a read_error project resource never overrides its built-in counterpart", () => {
  const builtins = [{ id: "code-review", description: "kept" }];
  const project = [{ id: "code-review", path: "/proj/x.md", state: "read_error", content: null, diagnostic: "boom" }];
  const { resources, warnings } = resolveResources(builtins, project);
  assert.equal(resources.length, 1);
  assert.equal(resources[0].source, "builtin");
  assert.equal(resources[0].value.description, "kept");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ignored project ai-spec "code-review"/);
});

test("resolveResources: a duplicate project resource never overrides and is never added", () => {
  const builtins = [];
  const project = [{ id: "foo", path: "/proj/foo.MD", state: "duplicate", content: null, diagnostic: "dup" }];
  const { resources, warnings } = resolveResources(builtins, project);
  assert.equal(resources.length, 0);
  assert.equal(warnings.length, 1);
});

test("resolveResources: an empty project resource never overrides and is never added", () => {
  const builtins = [{ id: "security", description: "kept" }];
  const project = [{ id: "security", path: "/proj/security.md", state: "empty", content: null, diagnostic: "empty" }];
  const { resources, warnings } = resolveResources(builtins, project);
  assert.equal(resources.length, 1);
  assert.equal(resources[0].source, "builtin");
  assert.equal(warnings.length, 1);
});

test("resolveResources: a directory-level read_error (id: null) is surfaced as a warning, not silently dropped", () => {
  const project = [{ id: null, path: "/proj/ai-specs/skills", state: "read_error", content: null, diagnostic: "could not read /proj/ai-specs/skills: ENOTDIR" }];
  const { resources, warnings } = resolveResources([], project);
  assert.equal(resources.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ai-specs resource directory unavailable/);
});

test("resolveResources: the degenerate case (no builtins, no project resources) is empty, not an error", () => {
  const { resources, warnings } = resolveResources([], []);
  assert.deepEqual(resources, []);
  assert.deepEqual(warnings, []);
});

test("resolveResources: is deterministic across repeated calls with the same inputs", () => {
  const builtins = [{ id: "a" }, { id: "b" }];
  const project = [{ id: "b", path: "/p/b.md", state: "present", content: "x", diagnostic: null }];
  const first = resolveResources(builtins, project);
  const second = resolveResources(builtins, project);
  assert.deepEqual(first, second);
});

test("non-interactive: discovery and resolution never touch stdin/TTY and complete synchronously", () => {
  // No stdin fixture is provided anywhere in this file, and both functions
  // are plain synchronous calls (no callback, no Promise, no readline) — if
  // either function ever blocked on input this test file itself would hang
  // rather than pass, which is the property under test.
  const cwd = tempCwd();
  const before = Date.now();
  discoverAiSpecs(cwd);
  resolveResources([], []);
  assert.ok(Date.now() - before < 1000);
});
