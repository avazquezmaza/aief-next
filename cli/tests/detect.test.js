import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectProject, recommendSkills, containsKeyword } from "../src/detect.js";

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-detect-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

test("keyword matching uses word boundaries", () => {
  assert.equal(containsKeyword("we value maintainability", "ai"), false);
  assert.equal(containsKeyword("plain text", "ai"), false);
  assert.equal(containsKeyword("the lieutenant said", "tenant"), false);
  assert.equal(containsKeyword("tenant isolation matters", "tenant"), true);
  assert.equal(containsKeyword("Multi-tenant SaaS", "tenant"), true);
  assert.equal(containsKeyword("uses an LLM pipeline", "llm"), true);
});

test("generic prose does not trigger detectors", () => {
  const dir = makeProject({
    "README.md": "This project values maintainability and plain, readable code."
  });
  const project = detectProject(dir);
  assert.deepEqual(project.signals, []);
});

test("tenant keyword triggers multitenant with a reason", () => {
  const dir = makeProject({
    "README.md": "A multi-tenant SaaS with tenant isolation per Host header."
  });
  const project = detectProject(dir);
  const multitenant = project.signals.find((s) => s.id === "multitenant");
  assert.ok(multitenant, "multitenant signal expected");
  assert.equal(multitenant.signal, "weak");
  assert.match(multitenant.reasons[0], /README\.md/);
});

test("dependencies produce strong signals", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { next: "14.0.0", pg: "8.0.0" } })
  });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  assert.ok(ids.includes("nextjs"));
  assert.ok(ids.includes("postgres"));
  const nextjs = project.signals.find((s) => s.id === "nextjs");
  assert.equal(nextjs.signal, "strong");
  assert.match(nextjs.reasons[0], /dependency "next"/);
});

test("skills are recommended with reasons", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant platform with RBAC permissions."
  });
  const project = detectProject(dir);
  const skills = recommendSkills(project);
  const ids = skills.map((s) => s.id);
  assert.ok(ids.includes("multitenant-saas-architect"));
  assert.ok(ids.includes("security-rbac-reviewer"));
  for (const skill of skills) {
    assert.ok(skill.because.length > 0, `${skill.id} must explain why`);
  }
});

test("drizzle counts as postgres and cognito recommends the AWS skill (learned from Flux Portal validation)", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { "drizzle-orm": "0.36.4", "amazon-cognito-identity-js": "6.3.12" } })
  });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  assert.ok(ids.includes("postgres"));
  assert.ok(ids.includes("cognito"));
  assert.ok(recommendSkills(project).some((s) => s.id === "aws-saas-platform"));
});

test("no signals falls back to general reviewer", () => {
  const dir = makeProject({ "README.md": "A simple library." });
  const skills = recommendSkills(detectProject(dir));
  assert.equal(skills.length, 1);
  assert.equal(skills[0].id, "project-architecture-reviewer");
});
