import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

test("new-change assigns sequential ids", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "First Thing"]);
  aief(dir, ["new-change", "second-thing"]);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-first-thing", "0002-second-thing"]);
});

test("bootstrap does not collide with existing change ids", () => {
  const dir = makeProject({ "changes/0001-existing/change.md": "# Change" });
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /0002-adopt-aief/);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-existing", "0002-adopt-aief"]);
});

test("bootstrap is idempotent", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["bootstrap"]);
  assert.match(out, /Adoption Change already exists/);
  const adoptDirs = fs.readdirSync(path.join(dir, "changes")).filter((n) => n.includes("adopt-aief"));
  assert.equal(adoptDirs.length, 1);
});

test("bootstrap <name> on an existing directory reports it exists, with a next step (Change 0099)", () => {
  const dir = makeProject();
  fs.mkdirSync(path.join(dir, "my-app"));
  const { status, out } = aief(dir, ["bootstrap", "my-app"]);
  assert.equal(status, 1);
  assert.match(out, /Project already exists/);
  assert.match(out, /choose a different name|cd into it/i);
});

test("bootstrap does not touch application files", () => {
  const dir = makeProject({ "src/app.js": "console.log('app');" });
  aief(dir, ["bootstrap"]);
  assert.equal(fs.readFileSync(path.join(dir, "src", "app.js"), "utf8"), "console.log('app');");
});

test("bootstrap (no --interactive) is byte-identical to before Change 0068", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Create your first Change now\?/);
  assert.match(out, /Next steps:/);
});

test("bootstrap --interactive: no answer given (immediate EOF) falls back to the static Next steps text, after asking (Change 0068)", () => {
  const dir = makeProject();
  const { status, out } = aiefWithInput(dir, ["bootstrap", "--interactive"], "");
  assert.equal(status, 0);
  assert.match(out, /Create your first Change now\?/);
  assert.match(out, /Next steps:/);
});

test("bootstrap --interactive: 's' (skip) falls back to the static Next steps text (Change 0068)", () => {
  const dir = makeProject();
  const { status, out } = aiefWithInput(dir, ["bootstrap", "--interactive"], "s\n");
  assert.equal(status, 0);
  assert.match(out, /Next steps:/);
  assert.match(out, /Create your first AIEF change: aief new-change <name>/);
});

test("bootstrap --interactive: 'a' runs analyze() directly, no separate command needed (Change 0068)", () => {
  const dir = makeProject();
  const { status, out } = aiefWithInput(dir, ["bootstrap", "--interactive"], "a\n");
  assert.equal(status, 0);
  assert.match(out, /AIEF Analyze/);
  assert.doesNotMatch(out, /Next steps:/);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.ok(changes.some((c) => c.includes("analyze-current-architecture")));
});

test("bootstrap --interactive: 'n' + a name runs new-change() directly, even with both answers piped in one write (Change 0068)", () => {
  const dir = makeProject();
  // Both lines arrive in a single write — the line reader must not lose the
  // second answer to the first read() call (the bug this Change's own
  // line-buffered reader fixes over a naive single-read-per-question prompt).
  const { status, out } = aiefWithInput(dir, ["bootstrap", "--interactive"], "n\nmy first feature\n");
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Next steps:/);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.ok(changes.some((c) => c.includes("my-first-feature")));
});

test("bootstrap --interactive: 'n' with no name given falls back to the static Next steps text (Change 0068)", () => {
  const dir = makeProject();
  const { status, out } = aiefWithInput(dir, ["bootstrap", "--interactive"], "n\n\n");
  assert.equal(status, 0);
  assert.match(out, /No name given — skipping\./);
  assert.match(out, /Next steps:/);
});

test("bootstrap <name> --interactive: new-project skeleton is unaffected, no prompt, no hang (Change 0068)", () => {
  const dir = makeProject();
  const { status, out } = aiefWithInput(dir, ["bootstrap", "new-proj", "--interactive"], "");
  assert.equal(status, 0);
  assert.match(out, /Created AIEF project/);
  assert.doesNotMatch(out, /Create your first Change now\?/);
});

test("bootstrap creates starter standards and never overwrites existing ones", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { react: "18.0.0" } }),
    "knowledge/standards/base-standards.md": "MY CUSTOM RULES"
  });
  const { out } = aief(dir, ["bootstrap"]);
  assert.match(out, /Created knowledge\/standards\/frontend-standards\.md/);
  assert.equal(fs.readFileSync(path.join(dir, "knowledge", "standards", "base-standards.md"), "utf8"), "MY CUSTOM RULES");
  const files = fs.readdirSync(path.join(dir, "knowledge", "standards"));
  assert.ok(files.includes("frontend-standards.md"), "frontend standards expected for a React project");
  assert.ok(!files.includes("backend-standards.md"), "no backend standards for a frontend-only project");
});

test("bootstrap on an unknown stack creates only the base standards", () => {
  const dir = makeProject({ "README.md": "A plain library." });
  aief(dir, ["bootstrap"]);
  const files = fs.readdirSync(path.join(dir, "knowledge", "standards")).sort();
  assert.deepEqual(files, ["base-standards.md", "documentation-standards.md", "security-standards.md", "testing-standards.md"]);
});

// --- Change 0082: maturity-aware standards ("Applies now" / "Applies once implementation starts") ---

test("base/testing/security standards are maturity-aware: both sections present, Definition-stage content before Implementation-stage content", () => {
  const dir = makeProject({ "README.md": "A plain library." });
  aief(dir, ["bootstrap"]);
  for (const file of ["base-standards.md", "testing-standards.md", "security-standards.md"]) {
    const content = fs.readFileSync(path.join(dir, "knowledge", "standards", file), "utf8");
    assert.match(content, /## Applies now/, `${file} must have an "Applies now" section`);
    assert.match(content, /## Applies once implementation starts/, `${file} must have an "Applies once implementation starts" section`);
    assert.ok(
      content.indexOf("## Applies now") < content.indexOf("## Applies once implementation starts"),
      `${file}: "Applies now" must come before "Applies once implementation starts"`
    );
  }
});

test("documentation/frontend/backend standards are unaffected by the maturity-aware restructuring", () => {
  const dir = makeProject({ "package.json": JSON.stringify({ dependencies: { react: "18.0.0" } }) });
  aief(dir, ["bootstrap"]);
  const doc = fs.readFileSync(path.join(dir, "knowledge", "standards", "documentation-standards.md"), "utf8");
  assert.doesNotMatch(doc, /## Applies now/);
  const frontend = fs.readFileSync(path.join(dir, "knowledge", "standards", "frontend-standards.md"), "utf8");
  assert.doesNotMatch(frontend, /## Applies now/);
});

test("an already-adopted project's own standards are never rewritten by the maturity-aware templates", () => {
  const dir = makeProject({
    "README.md": "x",
    "knowledge/standards/base-standards.md": "MY HISTORICAL RULES, no maturity sections here",
    "knowledge/standards/security-standards.md": "MY HISTORICAL SECURITY RULES"
  });
  aief(dir, ["bootstrap"]);
  assert.equal(fs.readFileSync(path.join(dir, "knowledge", "standards", "base-standards.md"), "utf8"), "MY HISTORICAL RULES, no maturity sections here");
  assert.equal(fs.readFileSync(path.join(dir, "knowledge", "standards", "security-standards.md"), "utf8"), "MY HISTORICAL SECURITY RULES");
});

test("bootstrap documents its own adoption Change automatically (no placeholder evidence)", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS." });
  const { out } = aief(dir, ["bootstrap"]);
  assert.match(out, /evidence generated automatically/);
  const ev = fs.readFileSync(path.join(dir, "changes", "0001-adopt-aief", "evidence.md"), "utf8");
  assert.match(ev, /Generated by AIEF during adoption/);
  assert.doesNotMatch(ev, /^Pending\.$/m);
  assert.match(ev, /No functional code changed/);
  assert.match(ev, /knowledge\/standards\/base-standards\.md/);
  assert.match(ev, /multitenant/);
  const verify = aief(dir, ["verify"]);
  assert.doesNotMatch(verify.out, /0001-adopt-aief — in progress/);
  assert.match(verify.out, /✓ changes\/0001-adopt-aief/);
});

test("bootstrap documents recommended Skills in knowledge/skills.md", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS." });
  const { out } = aief(dir, ["bootstrap"]);
  assert.match(out, /Skills documented: knowledge\/skills\.md/);
  const doc = fs.readFileSync(path.join(dir, "knowledge", "skills.md"), "utf8");
  assert.match(doc, /Generated by AIEF during adoption/);
  assert.match(doc, /not commands and are never executed/);
  assert.match(doc, /Multitenant SaaS Architect/);
  assert.match(doc, /\*\*Why recommended:\*\* .*tenant/);
  assert.match(doc, /knowledge\/standards\/security-standards\.md/);
  assert.match(doc, /\*\*Evidence expectations:\*\*/);
});

test("bootstrap never overwrites an existing knowledge/skills.md", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS.", "knowledge/skills.md": "MY PROJECT NOTES" });
  const { out } = aief(dir, ["bootstrap"]);
  assert.match(out, /Skills documentation already exists: knowledge\/skills\.md/);
  assert.equal(fs.readFileSync(path.join(dir, "knowledge", "skills.md"), "utf8"), "MY PROJECT NOTES");
});

test("prompt references knowledge/skills.md and keeps Skills as context, not commands", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS." });
  aief(dir, ["bootstrap"]);
  aief(dir, ["analyze"]);
  // adopt + analyze leaves two open Changes, so the target is named explicitly.
  const { out } = aief(dir, ["prompt", "--profile", "architect", "--change", "0002-analyze-current-architecture"]);
  assert.match(out, /- knowledge\/skills\.md/);
  assert.match(out, /included as context, not executed/);
  const changeMd = fs.readFileSync(path.join(dir, "changes", "0002-analyze-current-architecture", "change.md"), "utf8");
  assert.match(changeMd, /Full Skill knowledge: knowledge\/skills\.md/);
});

test("verify guides the next step after PASS and after FAIL", () => {
  const dir = makeProject({ "README.md": "x" });
  aief(dir, ["bootstrap"]);
  const pass = aief(dir, ["verify"]);
  assert.match(pass.out, /Next:/);
  assert.match(pass.out, /aief close --yes \(active Change 0001-adopt-aief looks ready\)/);
  fs.rmSync(path.join(dir, "changes", "0001-adopt-aief", "spec.md"));
  const fail = aief(dir, ["verify"]);
  assert.equal(fail.status, 1);
  assert.match(fail.out, /fix the issues above/);
});

test("doctor reports OpenSpec as optional; status has no mandatory warnings for optional artifacts", () => {
  const dir = makeProject({ "README.md": "x" });
  aief(dir, ["bootstrap"]);
  const d = aief(dir, ["doctor"], { PATH: path.dirname(process.execPath) });
  assert.match(d.out, /openspec: not detected \(optional\)/);
  assert.doesNotMatch(d.out, /! Navigator/);
  assert.doesNotMatch(d.out, /! Profiles/);
  assert.doesNotMatch(d.out, /! OpenSpec adapter/);
  assert.doesNotMatch(d.out, /! Specboot adapter/);
  assert.match(d.out, /· Navigator: not present \(optional\)/);
});

test("analyze seeds the Change with real detections, marked as inference", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS." });
  aief(dir, ["bootstrap"]);
  aief(dir, ["analyze"]);
  const changeMd = fs.readFileSync(path.join(dir, "changes", "0002-analyze-current-architecture", "change.md"), "utf8");
  assert.match(changeMd, /## Detected Context/);
  assert.match(changeMd, /confirm or discard/);
  assert.match(changeMd, /multitenant \(weak\)/);
  assert.match(changeMd, /inferred from multitenant-saas-architect/);
  assert.match(changeMd, /knowledge\/standards\/security-standards\.md/);
});

test("prompt includes standards and Skill context honestly", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS." });
  aief(dir, ["bootstrap"]);
  aief(dir, ["analyze"]);
  const { out } = aief(dir, ["prompt", "--profile", "architect", "--change", "0002-analyze-current-architecture"]);
  assert.match(out, /Project standards to follow/);
  assert.match(out, /knowledge\/standards\/base-standards\.md/);
  assert.match(out, /included as context, not executed/);
  assert.match(out, /Multitenant SaaS Architect/);
  assert.match(out, /Watch out for: queries missing the tenant filter/);
});

// --- Change 0055/ADR-025: ai-specs/standards/ wired into aief prompt (consumption) and aief doctor --verbose (report) ---

test("prompt: with no ai-specs/standards/, the standards block is byte-identical to before this Change", () => {
  const dir = makeProject({ "README.md": "plain project" });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /Project standards to follow:\n\n- knowledge\/standards\/base-standards\.md/);
  assert.doesNotMatch(out, /ai-specs/);
  assert.doesNotMatch(out, /\[project\]/);
  assert.doesNotMatch(out, /\[project override\]/);
});

test("prompt: a project-only ai-specs standard appears with its real path, tagged [project]", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/api-design.md": "# API Design Guidelines\n\nUse REST.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- ai-specs\/standards\/api-design\.md \[project\]/);
  assert.match(out, /- knowledge\/standards\/base-standards\.md/, "built-in lines are unaffected by an unrelated project-only standard");
});

test("prompt: a project standard overriding a built-in id replaces the built-in's line with its own real path", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/security-standards.md": "# Our Security Policy\n\nOwn rules.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- ai-specs\/standards\/security-standards\.md \[project override\]/);
  assert.doesNotMatch(out, /- knowledge\/standards\/security-standards\.md/, "the built-in's own line for the overridden id must not also appear");
  assert.match(out, /- knowledge\/standards\/base-standards\.md/, "an unrelated built-in is unaffected");
});

test("prompt: an invalid ai-specs standard (duplicate id) resolves at most once, never crashes", () => {
  // "dup.md" is a legitimate, valid resource (state "present"); "dup.MD" is
  // the invalid one (state "duplicate", excluded). Exactly one "dup" line
  // must appear — never two, never a crash.
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/dup.md": "one",
    "ai-specs/standards/dup.MD": "two"
  });
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.equal(status, 0);
  const matches = out.match(/ai-specs\/standards\/dup\.md/g) || [];
  assert.equal(matches.length, 1);
});

test("doctor: with no ai-specs/standards/, there is no Standards: section at all", () => {
  const dir = makeProject({ "README.md": "plain project" });
  aief(dir, ["bootstrap"]);
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /\nStandards:/);
  assert.doesNotMatch(verbose.out, /\nStandards:/);
});

test("doctor --verbose: a project ai-specs standard produces a Standards: report with source/path/overrides", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/security-standards.md": "# Our Security Policy\n\nOwn rules.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["doctor", "--verbose"]);
  assert.match(out, /\nStandards:/);
  assert.match(out, /- security-standards \[project override\]: Our Security Policy/);
  assert.match(out, /source: project/);
  assert.match(out, /path: ai-specs\/standards\/security-standards\.md/);
  assert.match(out, /overrides: built-in standard "security-standards"/);
});

test("doctor: an invalid ai-specs standard produces exactly one default hint line, full diagnostic only in --verbose", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/dup.md": "one",
    "ai-specs/standards/dup.MD": "two"
  });
  aief(dir, ["bootstrap"]);
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.match(plain.out, /⚠ 1 ai-specs standard resource\(s\) ignored — see aief doctor --verbose/);
  assert.doesNotMatch(plain.out, /duplicate id "dup"/);
  assert.match(verbose.out, /ai-specs warnings \(standards\):/);
  assert.match(verbose.out, /duplicate id "dup"/);
  assert.doesNotMatch(verbose.out, /at TestContext|at Object\.<anonymous>|node:internal/);
});

test("doctor/prompt: combining a built-in, an override and a project-only standard resolves deterministically in both commands", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/security-standards.md": "# Ours\n\nOverride.\n",
    "ai-specs/standards/api-design.md": "# API Design\n\nNew.\n"
  });
  aief(dir, ["bootstrap"]);
  const doctorOut = aief(dir, ["doctor", "--verbose"]).out;
  const promptOut = aief(dir, ["prompt", "--change", "0001-adopt-aief"]).out;
  const standardsStart = doctorOut.indexOf("\nStandards:");
  const standardsEnd = doctorOut.indexOf("\nHarness:", standardsStart);
  const standardsSection = doctorOut.slice(standardsStart, standardsEnd === -1 ? undefined : standardsEnd);
  const doctorOrder = [...standardsSection.matchAll(/^- ([a-z-]+)(?: \[project(?: override)?\])?:/gm)].map((m) => m[1]);
  assert.deepEqual(doctorOrder, ["base-standards", "documentation-standards", "security-standards", "testing-standards", "api-design"]);
  const promptIdx = (needle) => promptOut.indexOf(needle);
  assert.ok(promptIdx("knowledge/standards/base-standards.md") < promptIdx("ai-specs/standards/security-standards.md"));
  assert.ok(promptIdx("ai-specs/standards/security-standards.md") < promptIdx("knowledge/standards/testing-standards.md"));
  assert.ok(promptIdx("knowledge/standards/testing-standards.md") < promptIdx("ai-specs/standards/api-design.md"));
});

test("bootstrap/analyze/Skill recommendations are unaffected by ai-specs/standards/ (Change 0055 touches only prompt + doctor)", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/standards/api-design.md": "# API Design\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /api-design/);
  const analyzeResult = aief(dir, ["analyze"]);
  assert.equal(analyzeResult.status, 0);
  const changeMd = fs.readFileSync(path.join(dir, "changes", "0002-analyze-current-architecture", "change.md"), "utf8");
  assert.doesNotMatch(changeMd, /api-design/);
});

test("prompt is honest when a recommended Skill has no operational content", () => {
  const dir = makeProject({ "README.md": "A plain library." });
  aief(dir, ["new-change", "thing"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /no operational content yet/);
});

test("verify passes right after adopt creates standards", () => {
  const dir = makeProject({ "README.md": "x" });
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.match(out, /Result: PASS/);
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

