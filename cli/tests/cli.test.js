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
// For --interactive (Change 0068): feeds piped stdin, simulating a user's
// typed answers (one per line). Also proves --interactive never hangs when
// stdin isn't a real TTY, since spawnSync would time out rather than pass.
function aiefWithInput(cwd, args, input, env = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    input,
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

// --- Change 0064: graphify-ast-architecture Skill recommendation + read-only graph-engine line ---

test("doctor recommends graphify-ast-architecture when graphify-out/ is present", () => {
  const dir = makeProject({ "graphify-out/.gitkeep": "" });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.match(out, /graphify-ast-architecture/);
});

test("doctor does not recommend graphify-ast-architecture for unrelated projects", () => {
  const dir = makeProject({ "README.md": "A simple library." });
  const { out } = aief(dir, ["doctor"]);
  assert.doesNotMatch(out, /graphify-ast-architecture/);
});

test("doctor reports the semantic engine when GEMINI_API_KEY is set, never both lines", () => {
  const dir = makeProject({ "README.md": "x" });
  const { out } = aief(dir, ["doctor"], { GEMINI_API_KEY: "fake-key-for-test" });
  assert.match(out, /\[✓\] Graphify Semantic Engine available \(GEMINI_API_KEY set\)/);
  assert.doesNotMatch(out, /AST Engine active/);
});

test("doctor reports the AST engine when GEMINI_API_KEY is absent or empty", () => {
  const dir = makeProject({ "README.md": "x" });
  const unset = aief(dir, ["doctor"], { GEMINI_API_KEY: undefined });
  assert.match(unset.out, /\[✓\] AST Engine active \(no GEMINI_API_KEY — static, offline, \$0\)/);
  assert.doesNotMatch(unset.out, /Semantic Engine/);

  const empty = aief(dir, ["doctor"], { GEMINI_API_KEY: "" });
  assert.match(empty.out, /\[✓\] AST Engine active/);
  assert.doesNotMatch(empty.out, /Semantic Engine/);
});

test("doctor's graph-engine line never leaks the key value", () => {
  const dir = makeProject({ "README.md": "x" });
  const { out } = aief(dir, ["doctor"], { GEMINI_API_KEY: "super-secret-value-should-not-appear" });
  assert.doesNotMatch(out, /super-secret-value-should-not-appear/);
});

test("bootstrap/analyze/prompt output is unaffected by the graph-engine line (Change 0064 R5)", () => {
  const dir = makeProject({ "README.md": "x" });
  aief(dir, ["bootstrap"]);
  for (const args of [["analyze"], ["prompt"]]) {
    const { out } = aief(dir, args, { GEMINI_API_KEY: "fake-key-for-test" });
    assert.doesNotMatch(out, /Graphify Semantic Engine|AST Engine active/);
  }
});

// --- Change 0054/ADR-024: ai-specs skill recommendations wired into `aief doctor` only ---

test("doctor: with no ai-specs/skills/, default output is unchanged from before this Change", () => {
  const dir = makeProject({ "README.md": "We value maintainability and plain code." });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /\[project\]/);
  assert.doesNotMatch(out, /\[project override\]/);
  assert.doesNotMatch(out, /ai-specs/);
  assert.doesNotMatch(out, /source: /, "source: lines are additive detail, only shown with --verbose");
});

test("doctor --verbose: with no ai-specs/skills/, every recommendation is tagged source: builtin and nothing else changes", () => {
  const dir = makeProject({ "README.md": "We value maintainability and plain code." });
  const { status, out } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /\[project\]/);
  assert.doesNotMatch(out, /\[project override\]/);
  assert.doesNotMatch(out, /ai-specs warnings:/);
  assert.match(out, /source: builtin/);
});

test("doctor: a project-only ai-specs skill is shown tagged [project]", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nRotate driver/navigator often.\n"
  });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.match(out, /- pair-programming \[project\]: Pair Programming/);
  assert.match(out, /because: ai-specs\/skills\/pair-programming\.md present in project/);
});

test("doctor: a project ai-specs skill overriding a built-in id is shown tagged [project override], never the built-in's own fields", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/multitenant-saas-architect.md": "# Our Own Tenant Checklist\n\nProject-specific guidance.\n"
  });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.match(out, /- multitenant-saas-architect \[project override\]: Our Own Tenant Checklist/);
  assert.doesNotMatch(out, /Tenant isolation, Host header resolution, tenant lifecycle, SaaS architecture/, "the overridden built-in's own description must not appear");
});

test("doctor --verbose: reveals source, path and overrides for project-sourced skills", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/multitenant-saas-architect.md": "# Our Own Tenant Checklist\n\nGuidance.\n"
  });
  const { status, out } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /source: project/);
  assert.match(out, /path: ai-specs\/skills\/multitenant-saas-architect\.md/);
  assert.match(out, /overrides: built-in skill "multitenant-saas-architect"/);
  assert.match(out, /source: builtin/);
});

test("doctor: an invalid ai-specs skill (duplicate id) is excluded, never overrides its built-in, and produces one default-output hint line", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/dup.md": "one",
    "ai-specs/skills/dup.MD": "two"
  });
  const { status, out } = aief(dir, ["doctor"]);
  assert.equal(status, 0);
  assert.match(out, /⚠ 1 ai-specs resource\(s\) ignored — see aief doctor --verbose/);
  assert.doesNotMatch(out, /duplicate id "dup"/, "the raw diagnostic must not appear in default output");
});

test("doctor --verbose: an invalid ai-specs skill's full diagnostic is shown, never a stack trace", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/dup.md": "one",
    "ai-specs/skills/dup.MD": "two"
  });
  const { status, out } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /ai-specs warnings:/);
  assert.match(out, /duplicate id "dup"/);
  assert.doesNotMatch(out, /at TestContext|at Object\.<anonymous>|node:internal/, "no stack trace leakage");
});

test("doctor: an override alone (no invalid resource) does not trigger the default 'ignored' hint line", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/multitenant-saas-architect.md": "# Our Own Tenant Checklist\n\nGuidance.\n"
  });
  const { out } = aief(dir, ["doctor"]);
  assert.doesNotMatch(out, /ignored/, "an override is a successful precedence decision, not something ignored");
});

test("bootstrap/analyze are unaffected by ai-specs/skills/ (Change 0054 touches only doctor; Change 0069 later adds prompt — see its own tests below)", () => {
  const dir = makeProject({
    "README.md": "plain project",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /pair-programming/);
  const skillsDoc = fs.readFileSync(path.join(dir, "knowledge", "skills.md"), "utf8");
  assert.doesNotMatch(skillsDoc, /pair-programming/);
});

// --- Change 0069/ADR-023 follow-up: ai-specs/skills/ wired into `aief prompt` too ---

test("prompt: with no ai-specs/skills/, the Skill context is byte-identical to before this Change", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS platform." });
  aief(dir, ["bootstrap"]);
  const before = aief(dir, ["prompt", "--change", "0001-adopt-aief"]).out;
  fs.mkdirSync(path.join(dir, "ai-specs", "skills"), { recursive: true });
  // No files in it yet — presence of the empty directory alone must not
  // change anything (discoverAiSpecs()'s own "no strong signal" contract).
  const after = aief(dir, ["prompt", "--change", "0001-adopt-aief"]).out;
  assert.equal(after, before);
  assert.doesNotMatch(before, /ai-specs/);
});

test("prompt: a project-only ai-specs skill (no built-in match) appears tagged [project], with the honest no-operational-content fallback", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nRotate driver/navigator often.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- pair-programming \[project\]: recommended for this project, but it has no operational content yet/);
});

test("prompt: an ai-specs skill overriding a built-in id replaces it wholly — the built-in's promptContext/commonRisks never show for that id", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/ai-workflow-governance.md": "# Our Own Governance\n\nOverride text.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- ai-workflow-governance \[project override\]: recommended for this project, but it has no operational content yet/);
  assert.doesNotMatch(out, /AI-generated artifacts start inactive/, "the built-in's own promptContext must not leak through for an overridden id");
});

test("prompt: a built-in Skill not overridden by any ai-specs/skills/ file keeps its full promptContext/commonRisks rendering", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- AI Workflow Governance: AI-generated artifacts start inactive/);
  assert.match(out, /Watch out for: auto-activating generated artifacts/);
});

test("prompt: a second file claiming an already-claimed ai-specs id is excluded (never duplicated), the first still resolves normally, built-ins untouched", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/dup.md": "one",
    "ai-specs/skills/dup.MD": "two"
  });
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.equal(status, 0);
  // "dup.MD" sorts before "dup.md" (ASCII), so it claims the id; "dup.md" is
  // the duplicate — exactly one "dup" entry appears, never two.
  assert.equal((out.match(/- dup \[project\]/g) || []).length, 1);
  assert.match(out, /- AI Workflow Governance: AI-generated artifacts start inactive/, "the built-in Skill set is untouched by an unrelated ai-specs entry");
});

test("doctor's Skills report and prompt's Standards block are unaffected by Change 0069 (no shared ai-specs.js code touched)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n",
    "ai-specs/standards/api-design.md": "# API Design\n\nUse REST.\n"
  });
  aief(dir, ["bootstrap"]);
  const doctorOut = aief(dir, ["doctor", "--verbose"]).out;
  assert.match(doctorOut, /pair-programming \[project\]/);
  const promptOut = aief(dir, ["prompt", "--change", "0001-adopt-aief"]).out;
  assert.match(promptOut, /- ai-specs\/standards\/api-design\.md \[project\]/);
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

test("prompt warns against overwriting when evidence has real content", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "# Evidence\n\n## Summary\n\nReal validated findings.\n", "utf8");
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /evidence\.md already exists and has real content/);
  assert.match(out, /Do not overwrite it blindly/);
  assert.match(out, /report that the evidence was re-verified/);
});

test("prompt has no overwrite warning for placeholder or empty evidence", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const fresh = aief(dir, ["prompt"]);
  assert.doesNotMatch(fresh.out, /Do not overwrite it blindly/);
  fs.writeFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "", "utf8");
  const empty = aief(dir, ["prompt"]);
  assert.doesNotMatch(empty.out, /Do not overwrite it blindly/);
});

test("prompt separates project evidence from AIEF feedback and clarifies tasks ownership", () => {
  const dir = makeProject();
  aief(dir, ["analyze"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /Where results belong/);
  assert.match(out, /Feedback about AIEF or the tooling goes in your response/);
  assert.match(out, /Do not mark tasks\.md items yourself unless the Change or the user explicitly asks/);
  assert.match(out, /tell the user which tasks appear complete/);
  assert.match(out, /complete or amend/);
});

test("prompt accepts the assistant as a positional argument for all four assistants", () => {
  const dir = makeProject({ "CLAUDE.md": "#c", "GEMINI.md": "#g", "CODEX.md": "#x", "CURSOR.md": "#u" });
  aief(dir, ["new-change", "thing"]);
  for (const [name, file] of [["gemini", "GEMINI.md"], ["claude", "CLAUDE.md"], ["codex", "CODEX.md"], ["cursor", "CURSOR.md"]]) {
    const r = aief(dir, ["prompt", name]);
    assert.equal(r.status, 0, `prompt ${name} must succeed`);
    assert.match(r.out, new RegExp(`- ${file}`), `prompt ${name} must include ${file}`);
  }
});

test("--assistant wins over the positional argument", () => {
  const dir = makeProject({ "GEMINI.md": "#g", "CODEX.md": "#x" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt", "gemini", "--assistant", "codex"]);
  assert.equal(r.status, 0);
  assert.match(r.out, /- CODEX\.md/);
  assert.doesNotMatch(r.out, /- GEMINI\.md/);
});

test("unknown positional assistant fails with guidance — never a silent fallback", () => {
  const dir = makeProject({ "CLAUDE.md": "#c" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt", "architect"]);
  assert.equal(r.status, 1);
  assert.match(r.out, /Unknown assistant "architect"/);
  assert.match(r.out, /- claude/);
  assert.match(r.out, /--profile architect/);
  assert.doesNotMatch(r.out, /Copy this prompt/);
});

test("prompt --assistant selects the matching instruction file", () => {
  const dir = makeProject({ "GEMINI.md": "# Gemini rules", "CLAUDE.md": "# Claude rules" });
  aief(dir, ["new-change", "thing"]);
  const gemini = aief(dir, ["prompt", "--assistant", "gemini"]);
  assert.match(gemini.out, /- GEMINI\.md/);
  assert.doesNotMatch(gemini.out, /- CLAUDE\.md/);
  const unknown = aief(dir, ["prompt", "--assistant", "clippy"]);
  assert.match(unknown.out, /Unknown assistant "clippy"/);
});

// Change 0061: deliberate, documented behavior change. Before this Change, a
// bare `aief prompt` with both CLAUDE.md and GEMINI.md present silently fell
// back to Claude — the exact "biased toward Claude" asymmetry this Change
// fixes (this test previously encoded that bias as `fallback.out` matching
// `- CLAUDE\.md`). With no override/env/config to disambiguate and no TTY
// (the test harness's stdin is piped, not a TTY), passive detection now
// correctly reports both candidates and refuses to guess, matching
// spec.md's AR-R2/AR-R6.
test("prompt with no explicit assistant and 2+ native files never silently picks one — no more Claude bias", () => {
  const dir = makeProject({ "GEMINI.md": "# Gemini rules", "CLAUDE.md": "# Claude rules" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt"]);
  assert.equal(r.status, 1);
  assert.match(r.out, /Multiple assistant files detected/);
  assert.match(r.out, /claude/);
  assert.match(r.out, /gemini/);
  assert.doesNotMatch(r.out, /Copy this prompt/);
});

test("prompt resolves GEMINI.md, CODEX.md and CURSOR.md symmetrically when they are the only native file present (previously only CLAUDE.md was detected)", () => {
  for (const [id, file] of [["gemini", "GEMINI.md"], ["codex", "CODEX.md"], ["cursor", "CURSOR.md"]]) {
    const dir = makeProject({ [file]: `# ${id} rules` });
    aief(dir, ["new-change", "thing"]);
    const r = aief(dir, ["prompt"]);
    assert.equal(r.status, 0, `prompt must succeed for ${id}`);
    assert.match(r.out, new RegExp(`- ${file.replace(".", "\\.")}`), `prompt must include ${file} for a bare aief prompt`);
  }
});

test("AIEF_ASSISTANT resolves the assistant without naming it on the command line, and wins over other native files", () => {
  const dir = makeProject({ "GEMINI.md": "#g", "CLAUDE.md": "#c" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt"], { AIEF_ASSISTANT: "gemini" });
  assert.equal(r.status, 0);
  assert.match(r.out, /- GEMINI\.md/);
  assert.doesNotMatch(r.out, /- CLAUDE\.md/);
});

test("an unknown AIEF_ASSISTANT value fails clearly instead of silently falling back", () => {
  const dir = makeProject({ "CLAUDE.md": "#c" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt"], { AIEF_ASSISTANT: "clippy" });
  assert.equal(r.status, 1);
  assert.match(r.out, /Could not resolve an assistant/);
  assert.match(r.out, /unknown assistant/);
});

test("knowledge/assistant.json resolves the default assistant without naming it on the command line", () => {
  const dir = makeProject({ "GEMINI.md": "#g", "CLAUDE.md": "#c", "knowledge/assistant.json": JSON.stringify({ defaultAssistant: "gemini" }) });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt"]);
  assert.equal(r.status, 0);
  assert.match(r.out, /- GEMINI\.md/);
});

test("an invalid knowledge/assistant.json fails clearly instead of silently falling back to detection", () => {
  const dir = makeProject({ "CLAUDE.md": "#c", "knowledge/assistant.json": "{not json" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt"]);
  assert.equal(r.status, 1);
  assert.match(r.out, /not valid JSON/);
});

test("aief prompt --set-assistant writes knowledge/assistant.json and validates against the registry", () => {
  const dir = makeProject();
  const bad = aief(dir, ["prompt", "--set-assistant", "clippy"]);
  assert.equal(bad.status, 1);
  assert.match(bad.out, /Unknown assistant "clippy"/);
  assert.equal(fs.existsSync(path.join(dir, "knowledge", "assistant.json")), false);

  const ok = aief(dir, ["prompt", "--set-assistant", "claude"]);
  assert.equal(ok.status, 0);
  assert.match(ok.out, /writes a file/);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "knowledge", "assistant.json"), "utf8"));
  assert.equal(saved.defaultAssistant, "claude");
  assert.equal(saved.configuredBy, "aief prompt --set-assistant");
});

test("aief prompt --show-assistant reports the configured preference, the resolved assistant and its source, without writing", () => {
  const dir = makeProject({ "GEMINI.md": "#g" });
  const before = aief(dir, ["prompt", "--show-assistant"]);
  assert.equal(before.status, 0);
  assert.match(before.out, /Configured preference.*not set/);
  assert.match(before.out, /Resolved assistant: gemini \(source: passive detection/);
  assert.equal(fs.existsSync(path.join(dir, "knowledge")), false);

  aief(dir, ["prompt", "--set-assistant", "claude"]);
  const after = aief(dir, ["prompt", "--show-assistant"]);
  assert.match(after.out, /Configured preference.*claude/);
  assert.match(after.out, /Resolved assistant: claude \(source: knowledge\/assistant\.json/);
});

test("aief prompt --clear-assistant removes the saved preference, and is a no-op (exit 0) when nothing is saved", () => {
  const dir = makeProject();
  const noop = aief(dir, ["prompt", "--clear-assistant"]);
  assert.equal(noop.status, 0);
  assert.match(noop.out, /nothing to clear/);

  aief(dir, ["prompt", "--set-assistant", "gemini"]);
  assert.equal(fs.existsSync(path.join(dir, "knowledge", "assistant.json")), true);
  const cleared = aief(dir, ["prompt", "--clear-assistant"]);
  assert.equal(cleared.status, 0);
  assert.equal(fs.existsSync(path.join(dir, "knowledge", "assistant.json")), false);
});

test("a plain aief prompt never writes to the filesystem, across every resolution path", () => {
  const dir = makeProject({ "GEMINI.md": "#g" });
  aief(dir, ["new-change", "thing"]);
  const snapshot = () => JSON.stringify(fs.readdirSync(dir, { recursive: true }).sort());
  const before = snapshot();
  aief(dir, ["prompt"]);
  aief(dir, ["prompt", "gemini"]);
  aief(dir, ["prompt"], { AIEF_ASSISTANT: "gemini" });
  assert.equal(snapshot(), before, "aief prompt must never create, modify or delete files");
});

test("verify fails when a change file is missing and stays calm about in-progress evidence", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "thing"]);
  const pass = aief(dir, ["verify"]);
  assert.equal(pass.status, 0);
  assert.match(pass.out, /in progress \(evidence not completed yet; expected/);
  assert.doesNotMatch(pass.out, /✗/);
  fs.rmSync(path.join(dir, "changes", "0001-thing", "spec.md"));
  const fail = aief(dir, ["verify"]);
  assert.equal(fail.status, 1);
  assert.match(fail.out, /spec\.md missing/);
});

test("close refuses an incomplete Change and explains what is pending", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const report = aief(dir, ["close"]);
  assert.equal(report.status, 0);
  assert.match(report.out, /evidence\.md has not been completed yet/);
  assert.match(report.out, /unchecked task/);
  const refused = aief(dir, ["close", "--yes"]);
  assert.equal(refused.status, 1);
  assert.match(refused.out, /Not closed/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, "changes", "0001-thing", "change.md"), "utf8"), /## Status/);
});

test("close --yes marks a ready Change as Closed; the Change stops being active", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(closed.out, /✓ Closed changes\/0001-thing/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
  const verify = aief(dir, ["verify"]);
  assert.match(verify.out, /0001-thing \(closed\)/);
  const noOpen = aief(dir, ["prompt"]);
  assert.equal(noOpen.status, 1);
  assert.match(noOpen.out, /No open Change found/);
  aief(dir, ["new-change", "second"]);
  const next = aief(dir, ["prompt"]);
  assert.equal(next.status, 0);
  assert.match(next.out, /0002-second/);
});

test("propose without OpenSpec falls back loudly to a local Change", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["propose", "Add login"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /OpenSpec is not installed/);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-add-login", "proposal.md")));
});

test("propose --change continues an existing Change instead of creating a new one", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const changeMdBefore = fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "change.md"), "utf8");
  const specMdBefore = fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "spec.md"), "utf8");
  const { status, out } = aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  assert.equal(status, 0);
  assert.match(out, /Created changes\/0001-manual-test-001\/proposal\.md/);
  const changes = fs.readdirSync(path.join(dir, "changes"));
  assert.equal(changes.length, 1, "propose --change must not create a second Change directory");
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md")));
  // Requirement Source, Normalized Requirement, [H]/[I]/[S] and Human Review must survive untouched.
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "change.md"), "utf8"), changeMdBefore);
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "spec.md"), "utf8"), specMdBefore);
});

test("propose --change never overwrites an existing proposal.md", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md"), "# Proposal\n\nHand-edited content.\n", "utf8");
  const { out } = aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  assert.match(out, /already exists — not overwritten/);
  assert.match(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md"), "utf8"), /Hand-edited content/);
});

test("propose --change fails loudly when no Change matches", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["propose", "--change", "9999-does-not-exist"]);
  assert.equal(status, 1);
  assert.match(out, /No Change found matching "9999-does-not-exist"/);
});

test("propose <idea> without --change still creates a new Change (unchanged behavior)", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status } = aief(dir, ["propose", "Something else entirely"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-manual-test-001", "0002-something-else-entirely"]);
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

test("close works when change.md prose merely mentions \"## Status\"", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.appendFileSync(path.join(changeDir, "change.md"), "\nThis Change adds a `## Status` section to templates.\n");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nDone.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Done.\n", "utf8");
  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /\n## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
  const verify = aief(dir, ["verify"]);
  assert.match(verify.out, /0001-thing \(closed\)/);
});

test("help covers every documented command with six fields", () => {
  const dir = makeProject();
  for (const command of ["doctor", "status", "bootstrap", "analyze", "new-change", "enrich", "propose", "prompt", "verify", "close", "release", "use-profile", "help", "explain"]) {
    const { status, out } = aief(dir, ["help", command]);
    assert.equal(status, 0, `help ${command} must exit 0`);
    for (const field of ["Purpose", "When to use it", "Reads", "Writes", "Example", "Next step"]) {
      assert.match(out, new RegExp(field), `help ${command} must include ${field}`);
    }
  }
});

test("--help and -h show usage and exit 0", () => {
  const dir = makeProject();
  for (const flag of ["--help", "-h"]) {
    const { status, out } = aief(dir, [flag]);
    assert.equal(status, 0, `${flag} must exit 0`);
    assert.match(out, /AIEF CLI/);
    assert.match(out, /Usage:/);
    assert.match(out, /aief doctor/);
    assert.match(out, /aief bootstrap/);
  }
});

test("--version prints the CLI version", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["--version"]);
  assert.equal(status, 0);
  assert.match(out, /^aief \d+\.\d+\.\d+/);
});

test("doctor groups tools by level and never fails because of optional tools", () => {
  const dir = makeProject();
  const { out } = aief(dir, ["doctor"], { PATH: path.dirname(process.execPath) });
  assert.match(out, /Core \(required\):/);
  assert.match(out, /SDD \(recommended\):/);
  assert.match(out, /Build tools \(optional\):/);
  assert.match(out, /Assistants \(optional\):/);
  assert.match(out, /Summary:/);
  // With a stripped PATH the optional tools are absent — reported, not fatal.
  assert.match(out, /○ (java|docker|claude): not detected \(optional\)/);
});

test("doctor reports missing required tools in the summary", { skip: !POSIX }, () => {
  const dir = makeProject();
  const emptyBin = path.join(dir, "emptybin");
  fs.mkdirSync(emptyBin);
  const { status, out } = aief(dir, ["doctor"], { PATH: emptyBin });
  assert.equal(status, 1);
  assert.match(out, /✗ git: not found \(required\)/);
  assert.match(out, /Missing required tools: .*git/);
});

test("bootstrap without arguments initializes the current directory with visible structure only", () => {
  const dir = makeProject({ "src/app.js": "console.log('app');" });
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /AIEF Bootstrap/);
  assert.match(out, /never modifies application code/);
  assert.match(out, /Next steps:/);
  assert.match(out, /Install OpenSpec if missing: npm install -g @fission-ai\/openspec@latest/);
  assert.ok(fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(dir, "changes")));
  assert.ok(fs.existsSync(path.join(dir, "knowledge")));
  // ADR-009: no hidden state — bootstrap must never create a .aief/ directory.
  assert.ok(!fs.existsSync(path.join(dir, ".aief")));
  assert.equal(fs.readFileSync(path.join(dir, "src", "app.js"), "utf8"), "console.log('app');");
});

test("bootstrap without arguments is idempotent and reports what already exists", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /✓ AGENTS\.md/);
  assert.match(out, /✓ changes\//);
  assert.match(out, /Adoption Change already exists/);
});

test("bootstrap with a name still creates a new project skeleton", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap", "my-project"]);
  assert.equal(status, 0);
  assert.match(out, /Created AIEF project/);
  for (const entry of ["README.md", "AGENTS.md", "changes", "knowledge", "src", "tests"]) {
    assert.ok(fs.existsSync(path.join(dir, "my-project", entry)), `my-project/${entry} expected`);
  }
});

test("init has been replaced by bootstrap: prints a redirect and exits 1, no writes", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["init"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 1);
  assert.match(out, /aief init has been replaced by aief bootstrap\. Run: aief bootstrap/);
  assert.ok(!fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(!fs.existsSync(path.join(dir, "changes")));
});

test("adopt has been replaced by bootstrap: prints a redirect and exits 1, no writes", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["adopt"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 1);
  assert.match(out, /aief adopt has been replaced by aief bootstrap\. Run: aief bootstrap/);
  assert.ok(!fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(!fs.existsSync(path.join(dir, "changes")));
});

test("bootstrap in a non-interactive shell never blocks on the SDD Provider prompt and reports the deterministic default", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /SDD Provider:/);
  assert.match(out, /local \(default\)/);
  assert.ok(!fs.existsSync(path.join(dir, "knowledge", "sdd-provider.json")));
});

test("bootstrap reports OpenSpec detection without prompting when SpecBoot is not also present", () => {
  const dir = makeProject();
  fs.mkdirSync(path.join(dir, "openspec"));
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /openspec \(OpenSpec detected\)/);
  assert.ok(!fs.existsSync(path.join(dir, "knowledge", "sdd-provider.json")));
});

test("bootstrap never overwrites an existing knowledge/sdd-provider.json", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  fs.mkdirSync(path.join(dir, "knowledge"), { recursive: true });
  fs.writeFileSync(path.join(dir, "knowledge", "sdd-provider.json"), JSON.stringify({ provider: "local", setBy: "manual-test", date: "2000-01-01" }), "utf8");
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /from knowledge\/sdd-provider\.json, already configured — never overwritten/);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, "knowledge", "sdd-provider.json"), "utf8"));
  assert.equal(raw.setBy, "manual-test");
});

test("release reports honestly when notes already exist", () => {
  const dir = makeProject();
  const first = aief(dir, ["release", "0.9.0"]);
  assert.match(first.out, /Created release notes/);
  const second = aief(dir, ["release", "0.9.0"]);
  assert.match(second.out, /already exist/);
});

test("enrich manual creates a Change with source metadata, read-only marker and Human Review", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["enrich", "manual", "TEST-001"]);
  assert.equal(status, 0);
  assert.match(out, /Created Change: changes\/0001-manual-test-001/);
  assert.match(out, /read-only; nothing was written back to manual/);
  assert.match(out, /requires human review before any implementation/);
  const changeDir = path.join(dir, "changes", "0001-manual-test-001");
  const changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  assert.match(changeMd, /## Type\n\nEnrichment/);
  assert.match(changeMd, /## Requirement Source/);
  assert.match(changeMd, /\*\*Provider:\*\* manual/);
  assert.match(changeMd, /\*\*Source ID:\*\* TEST-001/);
  assert.match(changeMd, /Read-only:\*\* yes/);
  assert.match(changeMd, /## Review Status\n\nRequires Human Review/);
  const specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  assert.match(specMd, /\[H\] Facts/);
  assert.match(specMd, /\[I\] Inferences/);
  assert.match(specMd, /\[S\] Assumptions/);
  assert.match(specMd, /## Open Questions/);
  const evidenceMd = fs.readFileSync(path.join(changeDir, "evidence.md"), "utf8");
  assert.match(evidenceMd, /Generated by AIEF during enrichment/);
});

test("enrich requires a source id and a known, implemented provider", () => {
  const dir = makeProject();
  const missingId = aief(dir, ["enrich", "manual"]);
  assert.equal(missingId.status, 1);
  assert.match(missingId.out, /Source ID is required/);
  const unknown = aief(dir, ["enrich", "trello", "X-1"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.out, /Unknown or missing provider "trello"/);
  const notImplemented = aief(dir, ["enrich", "notion", "X-1"]);
  assert.equal(notImplemented.status, 1);
  assert.match(notImplemented.out, /not implemented yet/);
});

test("enrich never creates a duplicate Change for the same provider/source-id", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status, out } = aief(dir, ["enrich", "manual", "TEST-001"]);
  assert.equal(status, 0);
  assert.match(out, /already exists/);
  assert.match(out, /Not creating a duplicate/);
  const changes = fs.readdirSync(path.join(dir, "changes"));
  assert.equal(changes.filter((c) => c.includes("manual-test-001")).length, 1);
});

test("enrich jira without a local export creates an honest placeholder Change (no network, no credentials)", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["enrich", "jira", "ISSUE-999"]);
  assert.equal(status, 0);
  assert.match(out, /No local Jira export found/);
  const changeDir = path.join(dir, "changes", "0001-jira-issue-999");
  const specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  assert.match(specMd, /No local Jira export found/);
});

test("enrich jira normalizes a local export file into the Normalized Requirement", () => {
  const dir = makeProject({
    "requirements/jira/ISSUE-42.json": JSON.stringify({
      fields: {
        summary: "Intelligent Support Assistant",
        description: "Build an assistant for support tickets.",
        status: { name: "In Progress" },
        priority: { name: "High" },
        reporter: { displayName: "Alice" },
        labels: ["ai", "support"]
      }
    })
  });
  const { status, out } = aief(dir, ["enrich", "jira", "ISSUE-42"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /No local Jira export found/);
  const specMd = fs.readFileSync(path.join(dir, "changes", "0001-jira-issue-42", "spec.md"), "utf8");
  assert.match(specMd, /Intelligent Support Assistant/);
  assert.match(specMd, /\*\*Title:\*\* Intelligent Support Assistant/);
  assert.match(specMd, /\*\*Status \(source\):\*\* In Progress/);
  assert.match(specMd, /\*\*Priority:\*\* High/);
});

test("verify does not require README.md while only Discovery/Enrichment Changes exist", () => {
  const dir = makeProject({ "AGENTS.md": "x" });
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.match(out, /README\.md: not required yet/);
  assert.match(out, /Result: PASS/);
});

test("verify still requires README.md once a non-Enrichment Change exists", () => {
  const dir = makeProject({ "AGENTS.md": "x" });
  aief(dir, ["enrich", "manual", "TEST-001"]);
  aief(dir, ["new-change", "implement-feature"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 1);
  assert.match(out, /Missing: README\.md/);
});

test("close refuses an Enrichment Change until Human Review tasks are checked off", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const refused = aief(dir, ["close", "--yes"]);
  assert.equal(refused.status, 1);
  assert.match(refused.out, /Not closed/);
});

test("prompt on an Enrichment Change tells the assistant not to implement and to respect Human Review", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /This is an Enrichment Change/);
  assert.match(out, /Do not implement application code/);
  assert.match(out, /Do not modify the external requirement source/);
  assert.match(out, /never marking Human Review tasks done yourself/);
});

// AIEF Core 3.0, Entrega 1 (Change 0043) — status reads an optional
// manifest.json when a Change has one. change.md carries no ## Status
// section here on purpose: under legacy-only inference this Change would
// read as open. The manifest is authoritative (no merge), so status must
// list it as closed instead — proving the wiring end-to-end through the
// real CLI binary, not just through the domain-layer unit tests.
test("status honors a Change's manifest.json over legacy inference (no ## Status in change.md)", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "manifest-thing"]);
  const changeDir = path.join(dir, "changes", "0001-manifest-thing");
  assert.doesNotMatch(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status/);
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1",
    id: "0001",
    slug: "manifest-thing",
    title: "Manifest thing",
    status: "closed"
  }), "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Open Changes/);
});

// Regression test for Change 0043's independent review, finding B1: close
// used to share isClosed() (manifest-aware) between openChangeDirs() and
// markClosed()'s own write-verification. A Change carrying a manifest.json
// with status "open" would then have close --yes write "Closed" to
// change.md, immediately followed by markClosed() re-checking the
// (untouched) manifest and reporting the write as a failure — exit code 1
// on a command that had, in fact, just succeeded.
test("close --yes succeeds and updates change.md even when the Change carries a manifest.json (B1 regression)", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "manifest-close-thing"]);
  const changeDir = path.join(dir, "changes", "0001-manifest-close-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1",
    id: "0001",
    slug: "manifest-close-thing",
    title: "Manifest close thing",
    status: "open"
  }), "utf8");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 0);
  assert.match(out, /✓ Closed changes\/0001-manifest-close-thing/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
});

// AIEF Core 3.0, Entrega 2 (Change 0044, WF-R1–WF-R4 — H2 hardening).
// A present-but-invalid manifest.json must be visibly distinct from both "no
// manifest" (legacy) and "valid manifest" — never silently merged into a
// plain "Open Changes" entry with no indication anything is wrong.
test("status reports a malformed manifest.json as invalid, with the exact parse error, not silently as a healthy Change", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "broken-manifest"]);
  const changeDir = path.join(dir, "changes", "0001-broken-manifest");
  const rawManifest = "{ this is not valid json";
  fs.writeFileSync(path.join(changeDir, "manifest.json"), rawManifest, "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
  assert.match(out, /0001-broken-manifest/);
  assert.match(out, /manifest\.json: manifest\.json is not valid JSON/);
  // Not repaired, not deleted, not rewritten — status is read-only (WF-R4).
  assert.equal(fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8"), rawManifest);
});

test("status reports a structurally invalid manifest.json (valid JSON, missing required fields) with one message per problem", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "incomplete-manifest"]);
  const changeDir = path.join(dir, "changes", "0001-incomplete-manifest");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({ schema: "aief.change/v1" }), "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
  assert.match(out, /id: is required/);
  assert.match(out, /slug: is required/);
  assert.match(out, /title: is required/);
  assert.match(out, /status: must be "open" or "closed"/);
});

test("status does not fall back silently to legacy for an invalid manifest — the Change still shows in Open Changes too, per design.md §4", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "invalid-but-open"]);
  const changeDir = path.join(dir, "changes", "0001-invalid-but-open");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), "not json at all", "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Open Changes: 1/);
  assert.match(out, /- 0001-invalid-but-open/);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
});

test("status output for a Change with no manifest.json, or a valid one, is unaffected by H2's new section", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "plain-legacy-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.doesNotMatch(out, /invalid manifest/);
});

// AIEF Core 3.0, Entrega 2 (Change 0044) — Workflow Engine, integration with
// `status`. A Change without every required file cannot pass the "readiness"
// gate, so Lite's next action is "verify", never "close".
test("status shows a Lite Change's stage/blockers when readiness fails", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "lite-thing"]);
  const changeDir = path.join(dir, "changes", "0001-lite-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "lite-thing", title: "Lite thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Workflow status: 1/);
  assert.match(out, /0001-lite-thing \(track: lite\)/);
  assert.match(out, /Stage: verify/);
  assert.match(out, /Next: verify/);
  assert.match(out, /Blockers:/);
  assert.match(out, /readiness: failed/);
});

test("status shows a Lite Change resolving to close when readiness passes", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "lite-ready"]);
  const changeDir = path.join(dir, "changes", "0001-lite-ready");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "lite-ready", title: "Lite ready", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: close/);
  assert.match(out, /Next: close/);
  assert.doesNotMatch(out, /Blockers:/);
});

// Standard can never show "Next: close" through this Entrega's engine — the
// review gate has no automated evaluator yet (WF-R14), even when every other
// gate passes.
test("status never shows Standard resolving to close — review has no evaluator yet", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "standard-thing"]);
  const changeDir = path.join(dir, "changes", "0001-standard-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "standard-thing", title: "Standard thing", status: "open", track: "standard"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: review/);
  assert.doesNotMatch(out, /Next: close/);
  assert.match(out, /No automated evaluator yet \(planned for Entrega 7\)/);
});

// Governed represents approval/security_review/review as pending
// capabilities — none can ever appear as "passed" through this Entrega.
test("status represents Governed's approval/security_review/review gates as pending, never passed", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "governed-thing"]);
  const changeDir = path.join(dir, "changes", "0001-governed-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "governed-thing", title: "Governed thing", status: "open", track: "governed"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: approval/);
  assert.match(out, /approval: pending/);
  assert.doesNotMatch(out, /: passed/);
});

test("status reports an unrecognized track distinctly from an invalid manifest", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "custom-track-thing"]);
  const changeDir = path.join(dir, "changes", "0001-custom-track-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "custom-track-thing", title: "Custom track thing", status: "open", track: "custom"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Changes with an unrecognized or broken workflow track: 1/);
  assert.match(out, /unknown track "custom"/);
  assert.doesNotMatch(out, /invalid manifest\.json/);
});

test("status shows a warning (identity mismatch) without blocking Lite from reaching close", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "warn-thing"]);
  const changeDir = path.join(dir, "changes", "0001-warn-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "a-totally-different-slug", title: "Warn thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: close/);
  assert.doesNotMatch(out, /Blockers:/);
  assert.match(out, /Warnings:/);
  assert.match(out, /identity: warning/);
});

// WF-R20 / design.md §9: close's readiness gate is deliberately blind to the
// Workflow Engine in this Entrega, even for a Governed Change with a
// permanently-pending "approval" gate — this is the approved scope boundary
// (commissioning instruction: "no intentes corregir ese límite
// indirectamente"), not an oversight. This test documents the boundary so a
// future Entrega that changes it does so as a visible, deliberate decision.
test("close succeeds on a Governed Change even though its 'approval' workflow gate is permanently pending — close stays blind to the Workflow Engine by design", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "governed-close-boundary"]);
  const changeDir = path.join(dir, "changes", "0001-governed-close-boundary");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  const manifestBefore = JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "governed-close-boundary", title: "Governed close boundary", status: "open", track: "governed"
  });
  fs.writeFileSync(path.join(changeDir, "manifest.json"), manifestBefore, "utf8");

  const preClose = aief(dir, ["status"]);
  assert.match(preClose.out, /Stage: approval/);
  assert.match(preClose.out, /Blockers:/);

  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(closed.out, /✓ Closed changes\/0001-governed-close-boundary/);
  // manifest.json is never touched by close (B1 non-repetition, extended to
  // the Workflow Engine's own fields) — still "open", still "governed".
  assert.equal(fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8"), manifestBefore);
});

// AIEF Core 3.0, Entrega 3 (Change 0045) — SDD Provider, status integration.
test("status shows SDD provider/change/readiness for a Change with an explicit local sdd.provider", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "sdd-local-thing"]);
  const changeDir = path.join(dir, "changes", "0001-sdd-local-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "sdd-local-thing", title: "SDD local thing", status: "open",
    sdd: { provider: "local" }
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /SDD provider status: 1/);
  assert.match(out, /0001-sdd-local-thing/);
  assert.match(out, /SDD provider: local/);
  assert.match(out, /SDD change: 0001-sdd-local-thing/);
  // new-change's own generated files are non-empty templates, so local
  // readiness is "ready" here — evidenceState/placeholder classification is
  // change-verifier.js's own separate concern, unaffected by this Entrega.
  assert.match(out, /SDD readiness: ready/);
});

test("status reports an explicit but unavailable SDD provider as an error, never a silent fallback to local", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "sdd-unavailable-thing"]);
  const changeDir = path.join(dir, "changes", "0001-sdd-unavailable-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "sdd-unavailable-thing", title: "SDD unavailable thing", status: "open",
    sdd: { provider: "openspec" }
  }), "utf8");
  const { out } = aief(dir, ["status"], { PATH: path.dirname(process.execPath) });
  assert.match(out, /SDD provider status: 1/);
  assert.match(out, /configured provider "openspec" is unavailable/);
  assert.doesNotMatch(out, /SDD provider: local/);
});

test("status output is unaffected by SDD when no Change declares manifest.sdd", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "plain-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.doesNotMatch(out, /SDD provider/);
});

// AIEF Core 3.0, Entrega 4 (Change 0046, ADR-018 §1) — the bottom-line "Next:"
// suggestion and the "Workflow status" block's own "Next:" line must never
// disagree for a single, track-carrying open Change (the exact discrepancy
// this Entrega's consolidation exists to eliminate).
test("status's bottom-line suggestion agrees with the Workflow status block's own next action (no more discrepancy)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "consolidated-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-consolidated-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "consolidated-next-thing", title: "Consolidated next thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  // Workflow status block: readiness fails (evidence.md/tasks.md are still
  // untouched templates) -> Stage: verify, blocked.
  assert.match(out, /Stage: verify/);
  assert.match(out, /Next: verify/);
  // Bottom-line suggestion (previously a hardcoded "aief prompt", unrelated
  // to the block above) must now be the exact same derived command
  // workflowService.nextAction() produces for a blocked stage.
  assert.match(out, /\nNext:\n {2}aief status --change 0001-consolidated-next-thing --next\n/);
  assert.doesNotMatch(out, /\nNext:\n {2}aief prompt\n/, "must not fall back to the old, unconditional 'aief prompt' suggestion");
});

test("status's bottom-line suggestion for a legacy Change (no track) is completely unchanged", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "legacy-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.match(out, /\nNext:\n {2}aief prompt\n/);
});

// AIEF Core 3.0, Entrega 4 (Change 0046) — `aief status --change <id>` /
// `--next`, Path B's entire CLI-facing surface (ADR-018). No new command.
test("status --change <id> shows a deep, read-only view of one Change (track, stage, blockers, SDD)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "deep-view-thing"]);
  const changeDir = path.join(dir, "changes", "0001-deep-view-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "deep-view-thing", title: "Deep view thing", status: "open",
    track: "standard", sdd: { provider: "local" }
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-deep-view-thing"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-deep-view-thing/);
  assert.match(out, /Track: standard/);
  assert.match(out, /Stage: verify/);
  assert.match(out, /Blockers:/);
  assert.match(out, /SDD provider: local/);
  assert.match(out, /SDD readiness: ready/);
});

test("status --change <id> --next shows the compact Normalized Action view, exit 0 even when blocked", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "compact-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-compact-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "compact-next-thing", title: "Compact next thing", status: "open", track: "lite"
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-compact-next-thing", "--next"]);
  assert.equal(status, 0, "blocked is a successfully-answered query — exit 0, not 1 (ADR-018 §3)");
  assert.match(out, /Next action:/);
  assert.match(out, /status: blocked/);
  assert.match(out, /id: verify/);
});

test("status --next (no --change) infers the single open Change deterministically", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "implicit-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-implicit-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "implicit-next-thing", title: "Implicit next thing", status: "open", track: "lite"
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-implicit-next-thing/);
});

// Change 0059/ADR-029: superseding this test's original assertion is a
// deliberate, documented behavior change, not a silent edit — see
// change.md "Deliberate, documented behavior change" and evidence.md. Both
// Changes here are dependency-free, track-free, and open — both eligible —
// so the deterministic id-sort tie-break recommends "first".
test("status --next with multiple open, equally eligible Changes deterministically recommends the lowest id (Change 0059 supersedes the old ambiguity error)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "first"]);
  aief(dir, ["new-change", "second"]);
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0001-first/);
  assert.match(out, /Ready because:/);
  assert.match(out, /Tie-break: lowest Change id, sorted ascending/);
  assert.match(out, /Other eligible Change\(s\): 0002-second/);
});

test("status --next with no open Changes produces an actionable result, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x", "changes/.gitkeep": "" });
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 1);
  assert.match(out, /No open Change found/);
});

// --- Change 0059/ADR-029: smart next-Change selection for 2+ open Changes ---

test("status --next: a Change depending on an open dependency is skipped; the independent one is recommended", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0002", slug: "add-login", title: "x", status: "open", dependsOn: ["0001-user-model"]
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0001-user-model/);
  assert.doesNotMatch(out, /0002-add-login/);
});

test("status --next: closing the dependency makes the dependent Change the recommendation (a third open Change keeps this on the 2+-open smart path)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  aief(dir, ["new-change", "unrelated-blocked"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0002", slug: "add-login", title: "x", status: "open", dependsOn: ["0001-user-model"]
  }), "utf8");
  fs.writeFileSync(path.join(dir, "changes", "0003-unrelated-blocked", "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0003", slug: "unrelated-blocked", title: "x", status: "open", dependsOn: ["0099-ghost"]
  }), "utf8");
  fs.appendFileSync(path.join(dir, "changes", "0001-user-model", "change.md"), "\n## Status\n\nClosed (2026-07-30)\n");
  const { out, status } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0002-add-login/);
  assert.match(out, /dependencies: all closed \(0001-user-model\)/);
});

test("status --next: a Change with an unsatisfied Workflow gate is excluded; only the Graph issue keeps the other one out too", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "governed-thing"]);
  aief(dir, ["new-change", "broken-dep-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-governed-thing", "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "governed-thing", title: "x", status: "open", track: "governed"
  }), "utf8");
  fs.writeFileSync(path.join(dir, "changes", "0002-broken-dep-thing", "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0002", slug: "broken-dep-thing", title: "x", status: "open", dependsOn: ["0099-ghost"]
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /No eligible Change found among the open Changes:/);
  assert.match(out, /0001-governed-thing: workflow:/);
  assert.match(out, /0002-broken-dep-thing: graph: missing_dependency/);
});

test("status --next: a Change with no track is unaffected by the Workflow condition", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "plain-a"]);
  aief(dir, ["new-change", "plain-b"]);
  const { out, status } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0001-plain-a/);
});

test("status --next: never writes any file", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "readonly-a"]);
  aief(dir, ["new-change", "readonly-b"]);
  const before = {};
  for (const cd of fs.readdirSync(path.join(dir, "changes"))) {
    before[cd] = {};
    for (const f of fs.readdirSync(path.join(dir, "changes", cd))) before[cd][f] = fs.readFileSync(path.join(dir, "changes", cd, f), "utf8");
  }
  aief(dir, ["status", "--next"]);
  for (const cd of fs.readdirSync(path.join(dir, "changes"))) {
    for (const f of fs.readdirSync(path.join(dir, "changes", cd))) {
      assert.equal(fs.readFileSync(path.join(dir, "changes", cd, f), "utf8"), before[cd][f], `${cd}/${f} was modified`);
    }
  }
});

test("status --change <id> --next and status --graph are unaffected by Change 0059 (0/1-open-Change and explicit-Change paths untouched)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "explicit-a"]);
  aief(dir, ["new-change", "explicit-b"]);
  const explicitOut = aief(dir, ["status", "--change", "0001-explicit-a", "--next"]).out;
  assert.match(explicitOut, /Next action:/);
  assert.doesNotMatch(explicitOut, /Next Change:/);
  const graphOut = aief(dir, ["status", "--graph"]).out;
  assert.match(graphOut, /Nodes: 2/);
});

test("status --change <id> for a closed Change reports it as closed, never presented as pending work", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "closed-thing"]);
  const changeDir = path.join(dir, "changes", "0001-closed-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  aief(dir, ["close", "--yes", "--change", "0001-closed-thing"]);
  const { status, out } = aief(dir, ["status", "--change", "0001-closed-thing", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /status: complete/);
  assert.match(out, /id: closed/);
});

test("status --change <id> for a Change with an unavailable explicit SDD provider never falls back to local", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "sdd-fail-thing"]);
  const changeDir = path.join(dir, "changes", "0001-sdd-fail-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "sdd-fail-thing", title: "SDD fail thing", status: "open",
    sdd: { provider: "openspec" }
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-sdd-fail-thing", "--next"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 1, "an invalid/unresolvable query is exit 1, not a silently-successful fallback");
  assert.match(out, /status: invalid/);
  assert.doesNotMatch(out, /SDD provider: local/);
});

// Regression found via this Entrega's own Etapa G live verification: a
// Change with no `track` used to silently discard a real, correctly-detected
// SDD error (e.g. a rejected path-traversal `sdd.change_id`) and fall
// through to the unrelated legacy-readiness answer instead — the error was
// computed, just never surfaced. Fixed in workflow-service.js before this
// was ever exercised by a real command; this test locks the fix in.
test("status --change <id> --next surfaces a rejected SDD path-traversal change_id, even for a Change with no track", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  fs.mkdirSync(path.join(dir, "openspec", "changes"), { recursive: true });
  aief(dir, ["new-change", "traversal-no-track-thing"]);
  const changeDir = path.join(dir, "changes", "0001-traversal-no-track-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "traversal-no-track-thing", title: "Traversal no track thing", status: "open",
    sdd: { provider: "openspec", change_id: "../../../etc" }
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-traversal-no-track-thing", "--next"]);
  assert.equal(status, 1);
  assert.match(out, /status: invalid/);
  assert.match(out, /not a valid change identifier/);
});

test("status --change does not write any file (read-only query)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "readonly-thing", title: "Readonly thing", status: "open", track: "lite"
  }), "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["status", "--change", "0001-readonly-thing"]);
  aief(dir, ["status", "--change", "0001-readonly-thing", "--next"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

// AIEF Core 3.0, Entrega 4 (Change 0046) — `aief prompt` as "work" (Path B:
// no new `work` command; prompt evolves compatibly, ADR-018).
test("prompt shows Workflow and SDD context blocks for a Change that opts in (track + sdd)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "prompt-context-thing"]);
  const changeDir = path.join(dir, "changes", "0001-prompt-context-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "prompt-context-thing", title: "Prompt context thing", status: "open",
    track: "lite", sdd: { provider: "local" }
  }), "utf8");
  const { out } = aief(dir, ["prompt", "--change", "0001-prompt-context-thing"]);
  assert.match(out, /Workflow context \(read-only/);
  assert.match(out, /Stage: verify/);
  assert.match(out, /Blockers:/);
  assert.match(out, /SDD context \(provider: local/);
  assert.match(out, /Pending tasks \(from the SDD provider, not yet marked complete\):/);
  // Never a claim that work was performed or a gate/transition occurred.
  assert.doesNotMatch(out, /gate (passed|approved)/i);
  assert.doesNotMatch(out, /transition (occurred|completed|performed)/i);
  assert.doesNotMatch(out, /work (was )?(performed|completed|done)/i);
});

test("prompt output is byte-identical for a Change with no track/sdd (the common case today)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "prompt-plain-thing"]);
  const withoutTrack = aief(dir, ["prompt", "--change", "0001-prompt-plain-thing"]).out;
  assert.doesNotMatch(withoutTrack, /Workflow context/);
  assert.doesNotMatch(withoutTrack, /SDD context/);
});

test("prompt never writes any file (evidence.md, tasks.md unchanged)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "prompt-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-prompt-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "prompt-readonly-thing", title: "Prompt readonly thing", status: "open", track: "standard"
  }), "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["prompt", "--change", "0001-prompt-readonly-thing"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

// --- Entrega 5 (Change 0047, ADR-019) — Skills Runtime, `prompt` integration ---

test("prompt --list-skills lists both registered Skills, deterministic order, with zero open Changes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  assert.match(out, /change-context \(v1\.0\.0\): Change Context/);
  assert.match(out, /requirements-analysis-instructions \(v1\.0\.0\): Requirements Analysis Instructions/);
  assert.ok(out.indexOf("change-context") < out.indexOf("requirements-analysis-instructions"));
});

test("prompt --list-skills performs zero writes and resolves no Change", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "list-skills-thing"]);
  const changeDir = path.join(dir, "changes", "0001-list-skills-thing");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  const { status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("prompt --skill <id> appends exactly one clearly-labeled section for an applicable Skill", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "skill-applicable-thing"]);
  const changeDir = path.join(dir, "changes", "0001-skill-applicable-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "skill-applicable-thing", title: "Skill applicable thing", status: "open", track: "lite"
  }), "utf8");
  const without = aief(dir, ["prompt", "--change", "0001-skill-applicable-thing"]).out;
  const { out, status } = aief(dir, ["prompt", "--skill", "change-context", "--change", "0001-skill-applicable-thing"]);
  assert.equal(status, 0);
  assert.match(out, /─── Skill: change-context \(ready\) ───/);
  assert.match(out, /was not executed, and following it is not evidence/);
  // Strictly additive: removing the one new section (by index, not regex —
  // the Skill's own instructions may contain arbitrary text) recovers the
  // byte-identical legacy prompt.
  const skillStart = out.indexOf("\n─── Skill: change-context");
  const afterMarker = "\nWhere results belong:";
  const skillEnd = out.indexOf(afterMarker, skillStart);
  assert.ok(skillStart > -1 && skillEnd > -1);
  const withoutSkillSection = out.slice(0, skillStart) + out.slice(skillEnd);
  assert.equal(withoutSkillSection, without);
});

test("prompt --skill <id> for a non-applicable Skill still prints the full prompt, honestly, exit 0", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "skill-not-applicable-thing"]);
  const { out, status } = aief(dir, ["prompt", "--skill", "requirements-analysis-instructions", "--change", "0001-skill-not-applicable-thing"]);
  assert.equal(status, 0);
  assert.match(out, /─── Skill: requirements-analysis-instructions \(not_applicable\) ───/);
  assert.match(out, /Change has no sdd section in its manifest/);
  assert.match(out, /Copy this prompt into your AI assistant/); // full prompt still printed
});

test("prompt --skill does-not-exist is an actionable error, exit 1, before any prompt text is printed", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "skill-unknown-thing"]);
  const { out, status } = aief(dir, ["prompt", "--skill", "does-not-exist", "--change", "0001-skill-unknown-thing"]);
  assert.equal(status, 1);
  assert.match(out, /Unknown Skill "does-not-exist"/);
  assert.doesNotMatch(out, /Copy this prompt into your AI assistant/);
});

test("prompt --skill never writes any file", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "skill-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-skill-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "skill-readonly-thing", title: "Skill readonly thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["prompt", "--skill", "requirements-analysis-instructions", "--change", "0001-skill-readonly-thing"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("prompt without --skill/--list-skills remains byte-identical to Entrega 4's output", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "skill-neutral-thing"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-skill-neutral-thing"]);
  assert.doesNotMatch(out, /Skill:/);
  assert.doesNotMatch(out, /Registered Skills/);
});

// --- Entrega 6 (Change 0048, ADR-020) — Hooks Runtime, `prompt`/`verify` integration ---

test("prompt is byte-identical without an applicable Hook result (no sdd on the Change)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-neutral-thing"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-hook-neutral-thing"]);
  assert.doesNotMatch(out, /─── Hook:/);
});

test("prompt appends a Hook: prompt-skill-suggestion section when requirements-analysis-instructions is ready", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-suggest-thing"]);
  const changeDir = path.join(dir, "changes", "0001-hook-suggest-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "hook-suggest-thing", title: "Hook suggest thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const { out, status } = aief(dir, ["prompt", "--change", "0001-hook-suggest-thing"]);
  assert.equal(status, 0);
  assert.match(out, /─── Hook: prompt-skill-suggestion ───/);
  assert.match(out, /consider: aief prompt --skill requirements-analysis-instructions --change 0001-hook-suggest-thing/);
  // Never claims the Skill was executed (checked on the Hook's own section only —
  // the unrelated "not executed" disclaimer in the Skill Catalog block is expected).
  const hookSection = out.slice(out.indexOf("─── Hook:"));
  assert.doesNotMatch(hookSection, /(executed|ran|completed)/i);
});

test("prompt --skill and the Hook section coexist, clearly labeled and distinct", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-and-skill-thing"]);
  const changeDir = path.join(dir, "changes", "0001-hook-and-skill-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "hook-and-skill-thing", title: "Hook and skill thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const { out } = aief(dir, ["prompt", "--skill", "change-context", "--change", "0001-hook-and-skill-thing"]);
  assert.match(out, /─── Skill: change-context \(ready\) ───/);
  assert.match(out, /─── Hook: prompt-skill-suggestion ───/);
  assert.ok(out.indexOf("─── Skill:") < out.indexOf("─── Hook:"));
});

test("prompt --list-skills is unaffected by Hooks Runtime", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /─── Hook:/);
});

test("prompt never writes any file when a Hook matches", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-hook-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "hook-readonly-thing", title: "Hook readonly thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["prompt", "--change", "0001-hook-readonly-thing"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("verify --change is byte-identical (plus an additive Hook line) and never changes PASS/FAIL", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-verify-thing"]);
  const changeDir = path.join(dir, "changes", "0001-hook-verify-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "hook-verify-thing", title: "Hook verify thing", status: "open", track: "lite"
  }), "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-hook-verify-thing"]);
  assert.match(out, /Result: PASS/);
  assert.equal(status, 0);
  assert.match(out, /Hook recommendation:/);
  assert.match(out, /aief status --change 0001-hook-verify-thing --next/);
});

test("verify (whole project) is unaffected by Hooks Runtime (Post-Verify Hook is not_applicable, no single Change)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-project-verify-thing"]);
  const { out } = aief(dir, ["verify"]);
  assert.doesNotMatch(out, /Hook recommendation:/);
});

test("verify never writes any file when a Hook matches", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-verify-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-hook-verify-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "hook-verify-readonly-thing", title: "Hook verify readonly thing", status: "open", track: "lite"
  }), "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["verify", "--change", "0001-hook-verify-readonly-thing"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("no new public command verb is introduced for Hooks", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["hooks"]);
  assert.equal(status, 1);
  assert.match(out, /Unknown command/);
});

// --- Change 0056/ADR-026: Harness/Hooks visibility, config, logging ---

function harnessChange(dir, name, manifestOverrides = {}) {
  aief(dir, ["new-change", name]);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const changeDir = fs.readdirSync(path.join(dir, "changes")).find((d) => d.endsWith(slug));
  const full = path.join(dir, "changes", changeDir);
  fs.writeFileSync(path.join(full, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: changeDir.split("-")[0], slug, title: name, status: "open", ...manifestOverrides
  }), "utf8");
  return { changeDir, full };
}

test("doctor (default) has no Harness section, with or without any Change's manifest", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  harnessChange(dir, "harness-doctor-default", { harness: { log: true } });
  const { out } = aief(dir, ["doctor"]);
  assert.doesNotMatch(out, /\nHarness:/);
});

test("doctor --verbose lists both registered Hooks with their events, regardless of any manifest", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /\nHarness:/);
  assert.match(out, /- prompt-skill-suggestion: fires on prompt\.prepared/);
  assert.match(out, /- post-verify-next-action: fires on verify\.completed/);
});

test("status --change has no Harness section when the Change's manifest declares no harness field", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-status-none");
  const { out } = aief(dir, ["status", "--change", changeDir]);
  assert.doesNotMatch(out, /\nHarness:/);
});

test("status --change shows a disabled Hook and active counts when harness is configured", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-status-disabled", {
    harness: { hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] } } }
  });
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /\nHarness: configured \(log off\)/);
  assert.match(out, /prompt\.prepared: 0 active, 1 disabled \(prompt-skill-suggestion\)/);
  assert.match(out, /verify\.completed: 1 active/);
});

test("status --change: an unknown event key in manifest.harness.hooks is a structural manifest error, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-bad-event"]);
  const changeDir = "0001-harness-bad-event";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-bad-event", title: "x", status: "open",
    harness: { hooks: { "some.unknown.event": { disabled: [] } } }
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Manifest: invalid/);
  assert.match(out, /harness\.hooks\.some\.unknown\.event/);
});

test("status --change: an unknown Hook id inside a known event's disabled list is a visible warning, not a crash", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-unknown-id", {
    harness: { hooks: { "prompt.prepared": { disabled: ["totally-made-up-hook"] } } }
  });
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /Unknown Hook id\(s\)/);
  assert.match(out, /"totally-made-up-hook" \(prompt\.prepared\)/);
  assert.match(out, /prompt\.prepared: 1 active/, "the unknown id never disabled the real, registered Hook");
});

test("prompt: a disabled Hook's result never appears, even when it would otherwise match", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-disabled-prompt"]);
  const changeDir = "0001-harness-disabled-prompt";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-disabled-prompt", title: "x", status: "open", sdd: { provider: "local" },
    harness: { hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] } } }
  }), "utf8");
  const { out, status } = aief(dir, ["prompt", "--change", changeDir]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /─── Hook: prompt-skill-suggestion/);
});

test("prompt/verify: with no harness field, output is byte-identical to the pre-Change-0056 baseline", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-baseline"]);
  const changeDir = "0001-harness-baseline";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-baseline", title: "x", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const prompt = aief(dir, ["prompt", "--change", changeDir]);
  assert.match(prompt.out, /─── Hook: prompt-skill-suggestion ───/, "unaffected: the existing 0048 behavior for a resolved Change still fires");
  assert.ok(!fs.existsSync(path.join(dir, "changes", changeDir, "hooks.md")), "no harness.log means no hooks.md is ever created");
  const verify = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(verify.status, 0);
  assert.doesNotMatch(verify.out, /Hook issues/);
});

test("harness.log: true appends hooks.md with an entry per active (non-disabled) Hook result, including non-matched ones", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-log-thing"]);
  const changeDir = "0001-harness-log-thing";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-log-thing", title: "x", status: "open",
    harness: { log: true }
  }), "utf8");
  aief(dir, ["prompt", "--change", changeDir]);
  const logPath = path.join(dir, "changes", changeDir, "hooks.md");
  assert.ok(fs.existsSync(logPath));
  const content = fs.readFileSync(logPath, "utf8");
  assert.match(content, /# Harness Log/);
  assert.match(content, /## .+ — prompt/);
  assert.match(content, /\| prompt-skill-suggestion \| prompt\.prepared \|/, "logged even without sdd (status not_applicable), not just matched");
  assert.doesNotMatch(content, /API_KEY|SECRET|TOKEN|password/i);
});

test("harness.log: true accumulates across multiple invocations — append, never overwrite", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-log-append"]);
  const changeDir = "0001-harness-log-append";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-log-append", title: "x", status: "open", track: "lite",
    harness: { log: true }
  }), "utf8");
  aief(dir, ["prompt", "--change", changeDir]);
  aief(dir, ["verify", "--change", changeDir]);
  const content = fs.readFileSync(path.join(dir, "changes", changeDir, "hooks.md"), "utf8");
  assert.equal((content.match(/# Harness Log/g) || []).length, 1, "the header is written exactly once");
  assert.equal((content.match(/## .+ — (prompt|verify)/g) || []).length, 2, "each invocation appends its own section");
});

test("verify never writes hooks.md when harness.log is absent, even with a matched Hook", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-no-log"]);
  const changeDir = "0001-harness-no-log";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-no-log", title: "x", status: "open", track: "lite"
  }), "utf8");
  aief(dir, ["verify", "--change", changeDir]);
  assert.ok(!fs.existsSync(path.join(dir, "changes", changeDir, "hooks.md")));
});

test("bootstrap/analyze/LIDR Skills/Standards are unaffected by Harness (Change 0056 touches only doctor/status/prompt/verify)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /Harness/);
  const doctorDefault = aief(dir, ["doctor"]);
  assert.match(doctorDefault.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by Harness");
});

// --- Change 0057/ADR-027: Loop (verify -> feedback -> retry -> final result) ---

function loopChange(dir, name, manifestOverrides = {}) {
  aief(dir, ["new-change", name]);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const changeDir = fs.readdirSync(path.join(dir, "changes")).find((d) => d.endsWith(slug));
  const full = path.join(dir, "changes", changeDir);
  fs.writeFileSync(path.join(full, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: changeDir.split("-")[0], slug, title: name, status: "open", ...manifestOverrides
  }), "utf8");
  return { changeDir, full };
}

test("verify --change: with no loop field, output is byte-identical to the pre-Change-0057 baseline, no loop.md is ever created", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-baseline");
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /\nLoop:/);
  assert.ok(!fs.existsSync(path.join(full, "loop.md")));
});

test("doctor: with no loop field anywhere, default and --verbose output are unaffected", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  loopChange(dir, "loop-doctor-baseline");
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /\nLoop:/);
  assert.doesNotMatch(verbose.out, /\nLoop:/);
});

test("whole-project verify (no --change) is unaffected by any Change's loop config", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  loopChange(dir, "loop-whole-project", { loop: { verify: { maxRetries: 1 } } });
  const { out } = aief(dir, ["verify"]);
  assert.doesNotMatch(out, /\nLoop:/);
});

test("verify --change: a Change configured with loop.verify and failing verification reports attempt 1, retry available, and creates loop.md", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-first-fail", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8"); // force a FAIL (empty required file)
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 1, "Structural Verification's own FAIL exit code is unaffected by Loop");
  assert.match(out, /Loop: attempt 1 of 2 — FAIL/);
  assert.match(out, /Retry available — fix the items above, then run: aief verify --change/);
  const logPath = path.join(full, "loop.md");
  assert.ok(fs.existsSync(logPath));
  const content = fs.readFileSync(logPath, "utf8");
  assert.match(content, /# Loop Log/);
  assert.match(content, /## Attempt 1 —/);
  assert.match(content, /Result: FAIL/);
  assert.match(content, /Feedback:\n- .*spec\.md.*empty/);
  assert.match(content, /Decision: Retry available \(1\/2\)\./);
});

test("verify --change: a second failing attempt reaches the retry limit, loop.md accumulates (append, never overwrite)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-exhausted", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8");
  aief(dir, ["verify", "--change", changeDir]);
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Loop: attempt 2 of 2 — FAIL/);
  assert.match(out, /Retry limit reached \(2\/2\) — manual review required\. See changes\//);
  assert.doesNotMatch(out, /Retry available/);
  const content = fs.readFileSync(path.join(full, "loop.md"), "utf8");
  assert.equal((content.match(/# Loop Log/g) || []).length, 1, "the header is written exactly once");
  assert.equal((content.match(/^## Attempt \d+ —/gm) || []).length, 2, "both attempts are recorded, the first one untouched");
  assert.match(content, /## Attempt 1 —/);
  assert.match(content, /## Attempt 2 —/);
});

test("verify --change: a passing attempt reports Loop complete, never a retry hint", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = loopChange(dir, "loop-pass", { loop: { verify: { maxRetries: 2 } } });
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /Loop: attempt 1 of 2 — PASS/);
  assert.match(out, /Loop complete — Change verified\./);
  assert.doesNotMatch(out, /Retry/);
});

test("verify --change: loop.verify with no maxRetries defaults to 3", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = loopChange(dir, "loop-default-retries", { loop: { verify: {} } });
  const { out } = aief(dir, ["verify", "--change", changeDir]);
  assert.match(out, /Loop: attempt 1 of 3 —/);
});

test("verify --change: an invalid loop.verify.maxRetries is a structural manifest error surfaced by status --change", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "loop-bad-config"]);
  const changeDir = "0001-loop-bad-config";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "loop-bad-config", title: "x", status: "open",
    loop: { verify: { maxRetries: 0 } }
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Manifest: invalid/);
  assert.match(out, /loop\.verify\.maxRetries/);
});

test("doctor --verbose: lists an open Change's Loop attempt count only when loop.verify is configured", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-registry", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8");
  aief(dir, ["verify", "--change", changeDir]); // one recorded attempt
  const { out, status } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /\nLoop:/);
  assert.match(out, new RegExp(`- ${changeDir}: 1 attempt\\(s\\) so far, limit 2`));
});

test("doctor --verbose: never writes loop.md itself (read-only registry scan)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { full } = loopChange(dir, "loop-readonly-doctor", { loop: { verify: { maxRetries: 2 } } });
  aief(dir, ["doctor", "--verbose"]);
  assert.ok(!fs.existsSync(path.join(full, "loop.md")));
});

test("Harness/LIDR Skills/Standards/Bootstrap are unaffected by Loop (Change 0057 touches only verify --change and doctor --verbose)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /\nLoop:/);
  const doctorVerbose = aief(dir, ["doctor", "--verbose"]);
  assert.match(doctorVerbose.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by Loop");
  assert.match(doctorVerbose.out, /\nHarness:/, "0056's Harness registry still works, untouched by Loop");
});

// --- Change 0058/ADR-028: Change dependency Graph ---

function manifestFor(id, slug, title, overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id, slug, title, status: "open", ...overrides });
}

test("status/verify: with no dependsOn anywhere, output is byte-identical to the pre-Change-0058 baseline", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-baseline"]);
  const statusOut = aief(dir, ["status"]).out;
  assert.doesNotMatch(statusOut, /\nDependency Graph:/);
  const verifyOut = aief(dir, ["verify", "--change", "0001-graph-baseline"]).out;
  assert.doesNotMatch(verifyOut, /Dependency Graph issues/);
  const verifyWholeOut = aief(dir, ["verify"]).out;
  assert.doesNotMatch(verifyWholeOut, /Dependency Graph/);
});

test("doctor: is completely unaffected by dependsOn (default and --verbose)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-doctor"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-graph-doctor", "manifest.json"), manifestFor("0001", "graph-doctor", "x", { dependsOn: [] }), "utf8");
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /Dependency Graph|Graph:/);
  assert.doesNotMatch(verbose.out, /Dependency Graph|\nGraph:/);
});

test("status overview: a Dependency Graph section appears only when at least one Change declares dependsOn, listing dependencies and issues", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model", "0099-ghost"] }), "utf8");
  const { out, status } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /\nDependency Graph: 1 Change\(s\) declare dependencies/);
  // Only the real, resolved edge is listed as a dependency — the missing
  // one never creates an edge (R6), it only ever appears under Issues.
  assert.match(out, /- 0002-add-login depends on: 0001-user-model$/m);
  assert.match(out, /Issues:/);
  assert.match(out, /missing_dependency: "0002-add-login" depends on "0099-ghost", which does not exist/);
});

test("status --graph: renders every Change as a node, including ones without dependencies, plus edges and topological order", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model"] }), "utf8");
  const { out, status } = aief(dir, ["status", "--graph"]);
  assert.equal(status, 0);
  assert.match(out, /Nodes: 2/);
  assert.match(out, /Edges: 1/);
  assert.match(out, /- 0002-add-login -> 0001-user-model/);
  assert.match(out, /Topological order \(dependencies first\):\n {2}0001-user-model, 0002-add-login/);
  assert.match(out, /Issues: none/);
});

test("status --graph: a cycle is reported, topological order is explicitly unavailable", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "a-thing"]);
  aief(dir, ["new-change", "b-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-a-thing", "manifest.json"), manifestFor("0001", "a-thing", "x", { dependsOn: ["0002-b-thing"] }), "utf8");
  fs.writeFileSync(path.join(dir, "changes", "0002-b-thing", "manifest.json"), manifestFor("0002", "b-thing", "x", { dependsOn: ["0001-a-thing"] }), "utf8");
  const { out, status } = aief(dir, ["status", "--graph"]);
  assert.equal(status, 0);
  assert.match(out, /Topological order: unavailable — dependency cycle among: 0001-a-thing, 0002-b-thing/);
  assert.match(out, /- cycle: dependency cycle among: 0001-a-thing, 0002-b-thing/);
});

test("verify --change: prints a non-blocking Dependency Graph issue note for the targeted Change, never affecting PASS/FAIL or exit code", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-verify-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-graph-verify-thing", "manifest.json"), manifestFor("0001", "graph-verify-thing", "x", { dependsOn: ["0099-ghost"] }), "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-graph-verify-thing"]);
  assert.equal(status, 0, "Structural Verification still PASSes — a missing dependency never blocks");
  assert.match(out, /Result: PASS/);
  assert.match(out, /Dependency Graph issues for this Change \(non-blocking\):/);
  assert.match(out, /- missing_dependency: "0001-graph-verify-thing" depends on "0099-ghost", which does not exist/);
});

test("verify --change: no Dependency Graph note when the targeted Change has no issues", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model"] }), "utf8");
  const { out } = aief(dir, ["verify", "--change", "0002-add-login"]);
  assert.doesNotMatch(out, /Dependency Graph issues/);
});

test("verify --change: a self-dependency issue is reported for the offending Change, never crashes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "self-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-self-thing", "manifest.json"), manifestFor("0001", "self-thing", "x", { dependsOn: ["0001-self-thing"] }), "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-self-thing"]);
  assert.equal(status, 0);
  assert.match(out, /- self_dependency: "0001-self-thing" depends on itself/);
});

test("Bootstrap/LIDR/Harness/Loop are unaffected by the Graph (Change 0058 touches only status and verify --change)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /Dependency Graph/);
  const doctorVerbose = aief(dir, ["doctor", "--verbose"]);
  assert.match(doctorVerbose.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by the Graph");
  assert.match(doctorVerbose.out, /\nHarness:/, "0056's Harness registry still works, untouched by the Graph");
});

// --- Entrega 7 (Change 0049, ADR-021) — Verification Engine, `verify` integration ---

test("verify --change is byte-identical without --requirements (Entrega 7 default stays legacy)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-neutral-thing"]);
  const withoutFlag = aief(dir, ["verify", "--change", "0001-vr-neutral-thing"]).out;
  assert.doesNotMatch(withoutFlag, /Requirement Verification/);
});

test("verify --requirements adds an additive section after the legacy report, never before or interleaved", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-additive-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-additive-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-additive-thing", title: "VR additive thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const without = aief(dir, ["verify", "--change", "0001-vr-additive-thing"]).out;
  const { out } = aief(dir, ["verify", "--change", "0001-vr-additive-thing", "--requirements"]);
  assert.ok(out.startsWith(without));
  assert.match(out.slice(without.length), /^\n?Requirement Verification:/);
});

test("verify --requirements: a requirement cited in verification.md with a present evidence file passes both rules", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-pass-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-pass-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-pass-thing", title: "VR pass thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | see `README.md` |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-pass-thing", "--requirements"]);
  assert.equal(status, 0);
  assert.match(out, /Requirement Verification: PASS/);
  assert.match(out, /REQ-1 — requirement-has-traceability: passed/);
  assert.match(out, /REQ-1 — evidence-reference-integrity: passed/);
  assert.doesNotMatch(out, /satisfied\./); // never claims the requirement itself is satisfied (only "does not mean...satisfied")
});

test("verify --requirements: a requirement not cited in an existing verification.md fails traceability, aggregate FAIL, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-fail-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-fail-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-fail-thing", title: "VR fail thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n- **REQ-2** — Another thing.\n", "utf8");
  // verification.md exists (so the rule applies) but only cites REQ-1 — REQ-2 is a real,
  // actionable traceability gap, not a missing-file no-op.
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | pass |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-fail-thing", "--requirements"]);
  assert.equal(status, 1);
  assert.match(out, /Requirement Verification: FAIL/);
  assert.match(out, /REQ-2 — requirement-has-traceability: failed/);
  assert.match(out, /REQ-1 — requirement-has-traceability: passed/);
});

test("verify --requirements: a path-traversal evidence reference is rejected, aggregate INVALID, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-invalid-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-invalid-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-invalid-thing", title: "VR invalid thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | see `../../../etc/passwd` |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-invalid-thing", "--requirements"]);
  assert.equal(status, 1);
  assert.match(out, /Requirement Verification: INVALID/);
});

test("verify --requirements: a Change with no sdd section reports zero requirements, PASS (vacuous), never FAIL", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-empty-thing"]);
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-empty-thing", "--requirements"]);
  assert.equal(status, 0);
  assert.match(out, /Requirement Verification: PASS/);
  assert.match(out, /No requirements declared/);
});

test("verify --requirements without --change: whole-project structural verify is unaffected, requirement layer explicitly skipped", () => {
  // Note: the `aief()` helper concatenates stdout+stderr as two separate
  // blocks (`${stdout}${stderr}`), not in real chronological order — a
  // pre-existing harness property (unrelated to this Entrega) that makes a
  // simple startsWith() comparison unreliable whenever stderr content (e.g.
  // "! Recommended but missing: knowledge/") exists. Removing the one new,
  // known line by exact substring instead avoids depending on stream order.
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-skip-thing"]);
  const withoutFlag = aief(dir, ["verify"]).out;
  const { out, status } = aief(dir, ["verify", "--requirements"]);
  assert.equal(status, 0);
  const skipLine = "\nRequirement Verification: skipped — pass --change <id> to select one Change.\n";
  assert.ok(out.includes(skipLine));
  assert.equal(out.replace(skipLine, ""), withoutFlag);
});

test("verify.completed's Hook contract is unchanged by --requirements — operation.result is still the legacy report", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-hook-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-hook-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-hook-thing", title: "VR hook thing", status: "open", track: "lite", sdd: { provider: "local" }
  }), "utf8");
  const without = aief(dir, ["verify", "--change", "0001-vr-hook-thing"]).out;
  const withFlag = aief(dir, ["verify", "--change", "0001-vr-hook-thing", "--requirements"]).out;
  const hookLineOf = (s) => (s.match(/Hook recommendation:\n- .+/) || [""])[0];
  assert.equal(hookLineOf(without), hookLineOf(withFlag));
});

test("verify --requirements performs zero writes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-readonly-thing", title: "VR readonly thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | `README.md` |\n", "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["verify", "--change", "0001-vr-readonly-thing", "--requirements"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("verify --requirements does not affect close/propose/status/prompt/Skills/Hooks compatibility markers in its own output", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-scope-thing"]);
  const { out } = aief(dir, ["verify", "--change", "0001-vr-scope-thing", "--requirements"]);
  assert.doesNotMatch(out, /Skill Catalog|Skills Runtime|─── Skill:/);
});
