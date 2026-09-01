import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { discoverAiSpecs, resolveResources, deriveSkillDescription, resolveSkillRecommendations, resolveStandardRecommendations, resolveAgentRecommendations } from "../src/core/domain/ai-specs.js";

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
  assert.deepEqual(result.agents, []);
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

// Folder-per-skill discovery (<id>/SKILL.md) — the convention real
// LIDR/specboot projects use (github.com/LIDR-academy/lidr-specboot's
// ai-specs/skills/<name>/SKILL.md), added alongside AIEF's original flat
// "<id>.md" convention (Change 0053). Neither replaces the other.

test("discoverAiSpecs: a folder skill (<id>/SKILL.md) is discovered", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "adversarial-review", "SKILL.md"), "# Adversarial Review\n\nReview independently.\n");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].id, "adversarial-review");
  assert.equal(result.skills[0].state, "present");
  assert.match(result.skills[0].content, /Review independently/);
});

test("discoverAiSpecs: flat <id>.md and folder <id>/SKILL.md skills coexist", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "code-review.md"), "flat");
  writeFile(path.join(cwd, "ai-specs", "skills", "adversarial-review", "SKILL.md"), "folder");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.skills.length, 2);
  const ids = result.skills.map((r) => r.id).sort();
  assert.deepEqual(ids, ["adversarial-review", "code-review"]);
  assert.equal(result.skills.every((r) => r.state === "present"), true);
});

test("discoverAiSpecs: a flat <id>.md always wins a same-id collision over <id>/SKILL.md", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "foo.md"), "flat wins");
  writeFile(path.join(cwd, "ai-specs", "skills", "foo", "SKILL.md"), "folder loses");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.skills.length, 2);
  const present = result.skills.find((r) => r.state === "present");
  const duplicate = result.skills.find((r) => r.state === "duplicate");
  assert.equal(present.id, "foo");
  assert.match(present.content, /flat wins/);
  assert.equal(duplicate.id, "foo");
  assert.match(duplicate.path, /SKILL\.md$/);
});

test("discoverAiSpecs: a subdirectory without SKILL.md is silently ignored, not an error", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "not-a-skill", "README.md"), "unrelated");
  const result = discoverAiSpecs(cwd);
  assert.deepEqual(result.skills, []);
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

// --- Change 0054/ADR-024: deriveSkillDescription / resolveSkillRecommendations ---

test("deriveSkillDescription: strips a leading Markdown heading marker", () => {
  assert.equal(deriveSkillDescription("# Team Code Review\n\nBody text."), "Team Code Review");
});

test("deriveSkillDescription: falls back to the first non-empty line when there is no heading", () => {
  assert.equal(deriveSkillDescription("\n\nJust a plain first line\nmore text"), "Just a plain first line");
});

test("deriveSkillDescription: never throws and never returns empty, even for blank/absent content", () => {
  // Generic fallback text since Change 0055/ADR-025 generalized this
  // function for both Skills and Standards — never reachable for a real
  // `state: "present"` resource either way.
  assert.equal(deriveSkillDescription(""), "Project-defined resource");
  assert.equal(deriveSkillDescription("   \n  \n"), "Project-defined resource");
  assert.equal(deriveSkillDescription(undefined), "Project-defined resource");
});

test("resolveSkillRecommendations: no ai-specs/skills/ is a strict pass-through of builtins", () => {
  const cwd = tempCwd();
  const builtins = [{ id: "a", description: "A", because: ["reason a"] }, { id: "b", description: "B", because: ["reason b"] }];
  const { items, warnings, invalidCount, aiSpecsPresent } = resolveSkillRecommendations(builtins, cwd);
  assert.equal(aiSpecsPresent, false);
  assert.equal(invalidCount, 0);
  assert.deepEqual(warnings, []);
  assert.deepEqual(items, [
    { id: "a", description: "A", because: ["reason a"], source: "builtin", path: null, overridesBuiltin: false },
    { id: "b", description: "B", because: ["reason b"], source: "builtin", path: null, overridesBuiltin: false }
  ]);
});

test("resolveSkillRecommendations: a project-only skill is added, tagged as project, not an override", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "pair-programming.md"), "# Pair Programming\n\nRotate often.");
  const builtins = [{ id: "existing", description: "E", because: ["r"] }];
  const { items } = resolveSkillRecommendations(builtins, cwd);
  const added = items.find((i) => i.id === "pair-programming");
  assert.equal(added.source, "project");
  assert.equal(added.overridesBuiltin, false);
  assert.equal(added.description, "Pair Programming");
  assert.deepEqual(added.because, ["ai-specs/skills/pair-programming.md present in project"]);
  assert.equal(added.path, path.join(cwd, "ai-specs", "skills", "pair-programming.md"));
});

// Change 0107: a folder skill's `because` must name the real discovered
// "<id>/SKILL.md" path, not a fabricated flat "<id>.md" one that doesn't
// exist on disk — it used to claim the latter while `path` (right below it)
// already reported the former, a contradiction visible in `doctor --verbose`.
test("resolveSkillRecommendations: a folder skill's because names the real <id>/SKILL.md path, not a fabricated <id>.md", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "adversarial-review", "SKILL.md"), "# Adversarial Review\n\nReview independently.");
  const { items } = resolveSkillRecommendations([], cwd);
  const added = items.find((i) => i.id === "adversarial-review");
  assert.equal(added.source, "project");
  assert.deepEqual(added.because, ["ai-specs/skills/adversarial-review/SKILL.md present in project"]);
  assert.equal(added.path, path.join(cwd, "ai-specs", "skills", "adversarial-review", "SKILL.md"));
});

test("resolveSkillRecommendations: a project skill overrides a matching built-in id", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "code-review.md"), "# Team Code Review\n\nOur own checklist.");
  const builtins = [{ id: "code-review", description: "AIEF built-in review guidance", because: ["signal x"] }];
  const { items, warnings } = resolveSkillRecommendations(builtins, cwd);
  assert.equal(items.length, 1);
  assert.equal(items[0].source, "project");
  assert.equal(items[0].overridesBuiltin, true);
  assert.equal(items[0].description, "Team Code Review");
  assert.equal("because" in items[0] && items[0].because[0].includes("signal x"), false, "built-in fields must never leak into an overriding project entry");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /overrides AIEF's built-in/);
});

test("resolveSkillRecommendations: combines built-ins, an override, and a project-only skill, in deterministic order", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "code-review.md"), "# Team Code Review\n\nOurs.");
  writeFile(path.join(cwd, "ai-specs", "skills", "pair-programming.md"), "# Pair Programming\n\nOurs too.");
  const builtins = [
    { id: "code-review", description: "Built-in review", because: ["r1"] },
    { id: "unrelated-builtin", description: "Untouched", because: ["r2"] }
  ];
  const { items } = resolveSkillRecommendations(builtins, cwd);
  assert.deepEqual(items.map((i) => i.id), ["code-review", "unrelated-builtin", "pair-programming"]);
  assert.equal(items[0].source, "project");
  assert.equal(items[1].source, "builtin");
  assert.equal(items[2].source, "project");
});

test("resolveSkillRecommendations: invalid project resources are excluded, counted, and never crash", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "blank.md"), "   ");
  writeFile(path.join(cwd, "ai-specs", "skills", "dup.md"), "content one");
  fs.writeFileSync(path.join(cwd, "ai-specs", "skills", "dup.MD"), "content two", "utf8");
  const builtins = [{ id: "kept", description: "Kept built-in", because: ["r"] }];
  const { items, invalidCount, warnings } = resolveSkillRecommendations(builtins, cwd);
  assert.equal(items.some((i) => i.id === "blank"), false);
  assert.equal(items.filter((i) => i.id === "dup").length, 1, "exactly one of the colliding dup files becomes a recommendation");
  assert.equal(items.find((i) => i.id === "kept").source, "builtin", "built-in is kept — an invalid project resource never overrides it");
  assert.equal(invalidCount, 2, "one empty file + one duplicate file are both invalid");
  assert.ok(warnings.length >= 2);
});

test("resolveSkillRecommendations: is deterministic across repeated calls", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "skills", "a.md"), "# A\n\ncontent");
  const builtins = [{ id: "b", description: "B", because: ["r"] }];
  const first = resolveSkillRecommendations(builtins, cwd);
  const second = resolveSkillRecommendations(builtins, cwd);
  assert.deepEqual(first, second);
});

// --- Change 0055/ADR-025: resolveStandardRecommendations ---

test("resolveStandardRecommendations: no ai-specs/standards/ is a strict pass-through of builtins", () => {
  const cwd = tempCwd();
  const builtins = [
    { id: "base-standards", description: "Base Standards", path: "/knowledge/standards/base-standards.md" },
    { id: "testing-standards", description: "Testing Standards", path: "/knowledge/standards/testing-standards.md" }
  ];
  const { items, warnings, invalidCount, aiSpecsStandardsPresent } = resolveStandardRecommendations(builtins, cwd);
  assert.equal(aiSpecsStandardsPresent, false);
  assert.equal(invalidCount, 0);
  assert.deepEqual(warnings, []);
  assert.deepEqual(items, [
    { id: "base-standards", description: "Base Standards", because: [], source: "builtin", path: "/knowledge/standards/base-standards.md", overridesBuiltin: false },
    { id: "testing-standards", description: "Testing Standards", because: [], source: "builtin", path: "/knowledge/standards/testing-standards.md", overridesBuiltin: false }
  ]);
});

test("resolveStandardRecommendations: a project-only standard is added, tagged as project, not an override", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "api-design.md"), "# API Design Guidelines\n\nUse REST.\n");
  const builtins = [{ id: "base-standards", description: "Base Standards", path: "/k/base-standards.md" }];
  const { items } = resolveStandardRecommendations(builtins, cwd);
  const added = items.find((i) => i.id === "api-design");
  assert.equal(added.source, "project");
  assert.equal(added.overridesBuiltin, false);
  assert.equal(added.description, "API Design Guidelines");
  assert.deepEqual(added.because, ["ai-specs/standards/api-design.md present in project"]);
  assert.equal(added.path, path.join(cwd, "ai-specs", "standards", "api-design.md"));
});

test("resolveStandardRecommendations: a project standard overrides a matching built-in id, with its own real path", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "security-standards.md"), "# Our Security Policy\n\nOwn rules.\n");
  const builtins = [{ id: "security-standards", description: "Security Standards", path: "/k/security-standards.md" }];
  const { items, warnings } = resolveStandardRecommendations(builtins, cwd);
  assert.equal(items.length, 1);
  assert.equal(items[0].source, "project");
  assert.equal(items[0].overridesBuiltin, true);
  assert.equal(items[0].description, "Our Security Policy");
  assert.equal(items[0].path, path.join(cwd, "ai-specs", "standards", "security-standards.md"), "the project's own path must win, not the built-in's knowledge/standards/ path");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /overrides AIEF's built-in/);
});

test("resolveStandardRecommendations: combines built-ins, an override, and a project-only standard, in deterministic order", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "security-standards.md"), "# Ours\n\nOverride.\n");
  writeFile(path.join(cwd, "ai-specs", "standards", "api-design.md"), "# API Design\n\nNew.\n");
  const builtins = [
    { id: "base-standards", description: "Base Standards", path: "/k/base-standards.md" },
    { id: "security-standards", description: "Security Standards", path: "/k/security-standards.md" }
  ];
  const { items } = resolveStandardRecommendations(builtins, cwd);
  assert.deepEqual(items.map((i) => i.id), ["base-standards", "security-standards", "api-design"]);
  assert.equal(items[0].source, "builtin");
  assert.equal(items[1].source, "project");
  assert.equal(items[2].source, "project");
});

test("resolveStandardRecommendations: invalid resources are excluded, counted, never crash", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "blank.md"), "   ");
  writeFile(path.join(cwd, "ai-specs", "standards", "dup.md"), "one");
  fs.writeFileSync(path.join(cwd, "ai-specs", "standards", "dup.MD"), "two", "utf8");
  const builtins = [{ id: "kept", description: "Kept", path: "/k/kept.md" }];
  const { items, invalidCount } = resolveStandardRecommendations(builtins, cwd);
  assert.equal(items.some((i) => i.id === "blank"), false);
  assert.equal(items.filter((i) => i.id === "dup").length, 1);
  assert.equal(items.find((i) => i.id === "kept").source, "builtin");
  assert.equal(invalidCount, 2);
});

test("resolveStandardRecommendations: aiSpecsStandardsPresent reflects any discovery, valid or not", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "blank.md"), "   ");
  const { aiSpecsStandardsPresent, invalidCount, items } = resolveStandardRecommendations([], cwd);
  assert.equal(aiSpecsStandardsPresent, true, "an invalid-only ai-specs/standards/ still counts as present for doctor's conditional section");
  assert.equal(invalidCount, 1);
  assert.deepEqual(items, []);
});

test("resolveStandardRecommendations: is deterministic across repeated calls", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "standards", "a.md"), "# A\n\ncontent");
  const builtins = [{ id: "b", description: "B", path: "/k/b.md" }];
  const first = resolveStandardRecommendations(builtins, cwd);
  const second = resolveStandardRecommendations(builtins, cwd);
  assert.deepEqual(first, second);
});

// --- resolveAgentRecommendations() — discovery-only, no builtin catalog.
// AIEF never copies profiles/ into an adopted project (only
// profiles/README.md), so unlike Skills/Standards there is no per-project
// built-in list to resolve against; every discovered agent is always
// source: "project", overridesBuiltin always false.

test("discoverAiSpecs: agents/ is discovered like skills/standards, flat <id>.md (real specboot layout)", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "agents", "backend-developer.md"), "# Backend Developer\n\nOwns the API layer.\n");
  writeFile(path.join(cwd, "ai-specs", "agents", "frontend-developer.md"), "# Frontend Developer\n\nOwns the UI layer.\n");
  writeFile(path.join(cwd, "ai-specs", "agents", "product-strategy-analyst.md"), "# Product Strategy Analyst\n\nOwns discovery.\n");
  const result = discoverAiSpecs(cwd);
  assert.equal(result.agents.length, 3);
  const ids = result.agents.map((a) => a.id).sort();
  assert.deepEqual(ids, ["backend-developer", "frontend-developer", "product-strategy-analyst"]);
  assert.equal(result.agents.every((a) => a.state === "present"), true);
});

test("resolveAgentRecommendations: every discovered agent is source \"project\", never overridesBuiltin", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "agents", "backend-developer.md"), "# Backend Developer\n\nOwns the API layer.\n");
  const { items, aiSpecsAgentsPresent } = resolveAgentRecommendations(cwd);
  assert.equal(aiSpecsAgentsPresent, true);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, "backend-developer");
  assert.equal(items[0].source, "project");
  assert.equal(items[0].overridesBuiltin, false);
});

test("resolveAgentRecommendations: aiSpecsAgentsPresent is false with no ai-specs/agents/ directory", () => {
  const cwd = tempCwd();
  const { items, aiSpecsAgentsPresent } = resolveAgentRecommendations(cwd);
  assert.equal(aiSpecsAgentsPresent, false);
  assert.deepEqual(items, []);
});

test("resolveAgentRecommendations: aiSpecsAgentsPresent is true even when every entry is invalid", () => {
  const cwd = tempCwd();
  writeFile(path.join(cwd, "ai-specs", "agents", "blank.md"), "   ");
  const { items, invalidCount, aiSpecsAgentsPresent } = resolveAgentRecommendations(cwd);
  assert.equal(aiSpecsAgentsPresent, true);
  assert.equal(invalidCount, 1);
  assert.deepEqual(items, []);
});
