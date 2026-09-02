import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

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

test("prompt: a project-only ai-specs skill (no built-in match) appears tagged [project], pointed at its own file (Change 0110: no more generic 'no operational content' for a Skill AIEF can actually locate)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nRotate driver/navigator often.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- pair-programming \[project\]: recommended for this project — read ai-specs\/skills\/pair-programming\.md for its full instructions before starting\./);
});

test("prompt: an ai-specs skill overriding a built-in id replaces it wholly — the built-in's promptContext/commonRisks never show for that id", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/ai-workflow-governance.md": "# Our Own Governance\n\nOverride text.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- ai-workflow-governance \[project override\]: recommended for this project — read ai-specs\/skills\/ai-workflow-governance\.md for its full instructions before starting\./);
  assert.doesNotMatch(out, /AI-generated artifacts start inactive/, "the built-in's own promptContext must not leak through for an overridden id");
});

test("prompt: a built-in Skill not overridden by any ai-specs/skills/ file keeps its full promptContext/commonRisks rendering", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  // "AI Workflow Governance" is triggered by the aiRoadmap detector (a weak,
  // keyword-in-doc signal — AGENTS.md's own boilerplate text mentions "AI
  // assistants") — Change 0072 tags it accordingly; this assertion was
  // updated to match, not silently left describing untagged output.
  assert.match(out, /- AI Workflow Governance \(weak signal — confirm before relying on this\): AI-generated artifacts start inactive/);
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
  // Tagged per Change 0072 (aiRoadmap is a weak signal) — see the dedicated
  // test above for that reasoning; this assertion only cares that the
  // built-in Skill itself is untouched by an unrelated ai-specs entry.
  assert.match(out, /- AI Workflow Governance \(weak signal — confirm before relying on this\): AI-generated artifacts start inactive/, "the built-in Skill set is untouched by an unrelated ai-specs entry");
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

// --- Change 0072: weak-signal Skills are tagged in prompt's Skill context ---

test("prompt: a Skill triggered only by a weak (keyword-in-doc) signal is tagged 'weak signal — confirm before relying on this'", () => {
  const dir = makeProject({ "README.md": "Multi-tenant SaaS platform." });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- Multitenant SaaS Architect \(weak signal — confirm before relying on this\): This is a multitenant system/);
});

test("prompt: the no-signals fallback Skill is never tagged as a weak signal — it is an honest statement, not a guess", () => {
  // Deliberately no bootstrap: AIEF's own generated AGENTS.md text ("AI
  // assistants...") would itself trigger the weak aiRoadmap signal, making
  // a genuine zero-signal project impossible to reach post-bootstrap. A
  // plain new-change on a project with no AGENTS.md/README keyword avoids
  // that self-triggering entirely.
  const dir = makeProject({ "README.md": "x" });
  aief(dir, ["new-change", "thing"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /- Project Architecture Reviewer: recommended for this project, but it has no operational content yet/);
  assert.doesNotMatch(out, /weak signal/);
});

test("prompt: project-sourced ai-specs Skills keep their existing [project]/[project override] tags, unaffected by Change 0072's weak-signal tag", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  aief(dir, ["bootstrap"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-adopt-aief"]);
  assert.match(out, /- pair-programming \[project\]: recommended for this project/);
  assert.doesNotMatch(out, /pair-programming.*weak signal/);
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

// --- Change 0080: project maturity detection routes `aief analyze` ---

const PRD_ONLY_README = `# Product Requirements

## Context

This project will let internal support agents look up a customer's account
history across three legacy systems from a single screen, replacing the
current process of opening each legacy system separately for every ticket.

## Constraints

Must integrate with the existing SSO provider. Must retain audit logs for
seven years. No new legacy system integrations may be added without
Compliance sign-off.

## Open Questions

Which legacy systems are in scope for the first release? What is the
expected concurrent user count?
`;

test("analyze on a PRD-only repository (no application source) creates a Definition Change instead of Analysis", () => {
  const dir = makeProject({ "README.md": PRD_ONLY_README });
  const { status, out } = aief(dir, ["analyze"]);
  assert.equal(status, 0);
  assert.match(out, /Detected maturity: Definition/);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nDefinition/);
});

test("analyze on a real Node app (src/ present) is unaffected — still creates an Analysis Change", () => {
  const dir = makeProject({
    "README.md": PRD_ONLY_README,
    "package.json": JSON.stringify({ name: "app", dependencies: { express: "^4.0.0" } }),
    "src/index.js": "import express from \"express\";\nconst app = express();\napp.listen(3000);\n"
  });
  const { status, out } = aief(dir, ["analyze"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Detected maturity: Definition/);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nAnalysis/);
});

test("analyze on a sparse/ambiguous repository falls back to an Analysis Change, with an explicit (non-silent) note", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["analyze"]);
  assert.equal(status, 0);
  assert.match(out, /Project maturity is ambiguous — defaulting to Analysis/);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nAnalysis/);
});

test("analyze --maturity definition forces Definition routing regardless of detection", () => {
  const dir = makeProject();
  const { status } = aief(dir, ["analyze", "--maturity", "definition"]);
  assert.equal(status, 0);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nDefinition/);
});

test("analyze --maturity implemented forces Analysis routing on an otherwise Definition-looking repo", () => {
  const dir = makeProject({ "README.md": PRD_ONLY_README });
  const { status } = aief(dir, ["analyze", "--maturity", "implemented"]);
  assert.equal(status, 0);
  const changeDir = path.join(dir, "changes", "0001-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nAnalysis/);
});

test("analyze --maturity bogus is rejected explicitly, no Change is created", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["analyze", "--maturity", "bogus"]);
  assert.equal(status, 1);
  assert.match(out, /Unknown --maturity/);
  assert.ok(!fs.existsSync(path.join(dir, "changes")), "no changes/ directory should be created on a rejected --maturity value");
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

test("prompt accepts the assistant as a positional argument for all five assistants", () => {
  const dir = makeProject({ "CLAUDE.md": "#c", "GEMINI.md": "#g", "CODEX.md": "#x", "CURSOR.md": "#u", ".kiro/skills/aief-change/SKILL.md": "---\nname: aief-change\n---\n" });
  aief(dir, ["new-change", "thing"]);
  for (const [name, file] of [["gemini", "GEMINI.md"], ["claude", "CLAUDE.md"], ["codex", "CODEX.md"], ["cursor", "CURSOR.md"], ["kiro", ".kiro/skills/aief-change/SKILL.md"]]) {
    const r = aief(dir, ["prompt", name]);
    assert.equal(r.status, 0, `prompt ${name} must succeed`);
    assert.match(r.out, new RegExp(`- ${file.replace(/[.\/]/g, "\\$&")}`), `prompt ${name} must include ${file}`);
  }
});

// Change 0112: prompt.js previously fell back to CLAUDE.md whenever the
// resolved/requested assistant had no native file of its own and CLAUDE.md
// happened to exist — real, reproducible behavior that docs/cli.md never
// actually documented (it claimed "falls back to AGENTS.md-only"). Fixed for
// every assistant, not only Kiro, since Kiro would otherwise inherit it.
test("prompt never substitutes CLAUDE.md for another assistant's missing native file", () => {
  const dir = makeProject({ "CLAUDE.md": "# Claude rules" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt", "gemini"]);
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.out, /- CLAUDE\.md/);
  assert.match(r.out, /Note: GEMINI\.md not found in this project; using the generic, AGENTS\.md-only prompt instead\./);
});

test("prompt kiro succeeds even without .kiro/skills/aief-change/SKILL.md present, with no CLAUDE.md fallback", () => {
  const dir = makeProject({ "CLAUDE.md": "# Claude rules" });
  aief(dir, ["new-change", "thing"]);
  const r = aief(dir, ["prompt", "kiro"]);
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.out, /- CLAUDE\.md/);
  assert.doesNotMatch(r.out, /- \.kiro\/skills/);
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

