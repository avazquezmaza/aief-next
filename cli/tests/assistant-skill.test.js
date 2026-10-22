import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SKILL_TARGETS, distinctSkillAssistantIds, skillTemplate, skillVersion, isShippedSkill, inspectSkill, isOlderVersion } from "../src/core/domain/assistant-skill.js";
import { installSkill, skillTargetsFor } from "../src/core/services/skill-installer.js";
import { resolveAssistant } from "../src/core/domain/assistant-resolver.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0159 (ADR-039): one self-contained aief-change skill, installed for
// Claude Code, Kiro and Codex (and Gemini, sharing Codex's path, Change 0163);
// never overwriting an edited copy.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const OLD_SHIPPED = fs.readFileSync(path.join(HERE, "fixtures", "aief-change-skill-1.1.0.md"), "utf8");
const TARGETS = [...new Set(Object.values(SKILL_TARGETS))];

// --- template ---

test("template: frontmatter names the skill, describes when to use it, and carries a version", () => {
  const template = skillTemplate();
  assert.match(template, /^---\nname: aief-change\ndescription: .{100,}\n/);
  assert.equal(skillVersion(template), "2.0.0");
});

test("template: self-contained — no link to a file that only exists in AIEF's repository", () => {
  const template = skillTemplate();
  assert.doesNotMatch(template, /docs\/assistant-workflow\.md|\]\(\.\.?\//);
});

test("this repository's own skills are copies of the template", () => {
  for (const target of [".kiro/skills/aief-change/SKILL.md", ".agents/skills/aief-change/SKILL.md"]) {
    assert.equal(fs.readFileSync(path.join(REPO, target), "utf8"), skillTemplate(), `${target} drifted from the template`);
  }
});

test("AGENTS.md keeps policy only (~110 lines) and stays identical to its template", () => {
  const root = fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf8");
  assert.equal(root, fs.readFileSync(path.join(REPO, "cli", "templates", "agents", "AGENTS.md"), "utf8"));
  assert.ok(root.split("\n").length <= 125, `AGENTS.md has ${root.split("\n").length} lines`);
  assert.doesNotMatch(root, /## AIEF Workflow|## Required Completion Checklist|## Evidence Guidance/);
});

// --- domain ---

test("isShippedSkill: the current template and a previously shipped version count, an edit does not", () => {
  assert.equal(isShippedSkill(skillTemplate()), true);
  assert.equal(isShippedSkill(OLD_SHIPPED), true);
  assert.equal(isShippedSkill(`${skillTemplate()}\nmy note\n`), false);
});

test("isOlderVersion compares dotted versions; a missing version is older", () => {
  assert.equal(isOlderVersion("1.1.0", "2.0.0"), true);
  assert.equal(isOlderVersion("2.0.0", "2.0.0"), false);
  assert.equal(isOlderVersion("2.1.0", "2.0.0"), false);
  assert.equal(isOlderVersion(null, "2.0.0"), true);
});

test("skillTargetsFor: configured skill-capable assistant, none for Cursor, one per distinct path when unset", () => {
  assert.deepEqual(skillTargetsFor(null), ["claude", "kiro", "codex"]);
  assert.deepEqual(skillTargetsFor("claude"), ["claude"]);
  assert.deepEqual(skillTargetsFor("gemini"), ["gemini"]);
  assert.deepEqual(skillTargetsFor("cursor"), []);
});

test("Gemini shares Codex's skill path; distinctSkillAssistantIds lists each path once", () => {
  assert.equal(SKILL_TARGETS.gemini, ".agents/skills/aief-change/SKILL.md");
  assert.equal(SKILL_TARGETS.gemini, SKILL_TARGETS.codex);
  assert.deepEqual(distinctSkillAssistantIds(), ["claude", "kiro", "codex"]);
});

// --- installer ---

test("installSkill: created, then up to date", () => {
  const dir = makeProject();
  assert.equal(installSkill(dir, "claude").status, "created");
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.claude), "utf8"), skillTemplate());
  assert.equal(installSkill(dir, "claude").status, "up-to-date");
});

test("installSkill: an unmodified older AIEF version is updated", () => {
  const dir = makeProject({ [SKILL_TARGETS.kiro]: OLD_SHIPPED });
  assert.equal(inspectSkill(dir, "kiro").state, "shipped-older");
  assert.equal(installSkill(dir, "kiro").status, "updated");
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.kiro), "utf8"), skillTemplate());
});

test("installSkill: an edited copy is never overwritten", () => {
  const edited = `${OLD_SHIPPED}\nOur team also runs the linter.\n`;
  const dir = makeProject({ [SKILL_TARGETS.codex]: edited });
  assert.equal(installSkill(dir, "codex").status, "modified");
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.codex), "utf8"), edited);
});

test("installSkill: Codex then Gemini writes the shared file once", () => {
  const dir = makeProject();
  assert.equal(installSkill(dir, "codex").status, "created");
  const written = fs.statSync(path.join(dir, SKILL_TARGETS.codex)).mtimeMs;
  assert.equal(installSkill(dir, "gemini").status, "up-to-date");
  assert.equal(installSkill(dir, "gemini").status, "up-to-date");
  assert.equal(fs.statSync(path.join(dir, SKILL_TARGETS.gemini)).mtimeMs, written);
});

// --- CLI ---

test("bootstrap with no configured assistant installs the skill for all three", () => {
  const dir = makeProject({ "package.json": '{"name":"x"}' });
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  for (const target of TARGETS) {
    assert.equal(fs.readFileSync(path.join(dir, target), "utf8"), skillTemplate());
    assert.equal(out.split(`Installed ${target}`).length - 1, 1, `"Installed ${target}" should appear once`);
  }
});

test("bootstrap --assistant claude installs only Claude Code's skill; gemini only the shared .agents one; cursor none", () => {
  const claude = makeProject();
  aief(claude, ["bootstrap", "--assistant", "claude"]);
  assert.ok(fs.existsSync(path.join(claude, SKILL_TARGETS.claude)));
  assert.equal(fs.existsSync(path.join(claude, SKILL_TARGETS.kiro)), false);

  const gemini = makeProject();
  aief(gemini, ["bootstrap", "--assistant", "gemini"]);
  for (const target of TARGETS) assert.equal(fs.existsSync(path.join(gemini, target)), target === SKILL_TARGETS.gemini, target);

  const cursor = makeProject();
  const { out } = aief(cursor, ["bootstrap", "--assistant", "cursor"]);
  for (const target of TARGETS) assert.equal(fs.existsSync(path.join(cursor, target)), false);
  assert.match(out, /cursor has no skill mechanism/);
});

test("bootstrap follows knowledge/assistant.json, and rejects an unknown --assistant", () => {
  const dir = makeProject({ "knowledge/assistant.json": JSON.stringify({ defaultAssistant: "kiro" }) });
  aief(dir, ["bootstrap"]);
  assert.ok(fs.existsSync(path.join(dir, SKILL_TARGETS.kiro)));
  assert.equal(fs.existsSync(path.join(dir, SKILL_TARGETS.claude)), false);

  const bad = makeProject();
  const { status, out } = aief(bad, ["bootstrap", "--assistant", "nope"]);
  assert.equal(status, 1);
  assert.match(out, /--assistant: unknown assistant "nope"/);
});

test("bootstrap <name> installs the skill in the new project", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap", "my-project"]);
  for (const target of TARGETS) assert.ok(fs.existsSync(path.join(dir, "my-project", target)), target);
});

test("aief skill install refreshes an older copy, leaves an edited one, and rejects a bad subcommand", () => {
  const edited = `${skillTemplate()}\nlocal edit\n`;
  const dir = makeProject({ [SKILL_TARGETS.claude]: OLD_SHIPPED, [SKILL_TARGETS.kiro]: edited });
  const { status, out } = aief(dir, ["skill", "install"]);
  assert.equal(status, 0);
  assert.match(out, /Updated \.claude\/skills\/aief-change\/SKILL\.md/);
  assert.match(out, /\.kiro\/skills\/aief-change\/SKILL\.md was edited — left as is/);
  assert.match(out, /Installed \.agents\/skills\/aief-change\/SKILL\.md/);
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.kiro), "utf8"), edited);
  assert.equal(aief(dir, ["skill", "remove"]).status, 1);
});

test("doctor reports an edited copy older than AIEF's, and an unmodified older one to refresh", () => {
  const editedOld = `${OLD_SHIPPED}\nlocal edit\n`;
  const dir = makeProject({ [SKILL_TARGETS.kiro]: editedOld, [SKILL_TARGETS.codex]: OLD_SHIPPED, [SKILL_TARGETS.claude]: skillTemplate() });
  const { out } = aief(dir, ["doctor"]);
  assert.match(out, /AIEF-shipped files:/);
  assert.match(out, /! \.kiro\/skills\/aief-change\/SKILL\.md was edited and is older than AIEF's \(v1\.1\.0 < v2\.0\.0\)/);
  assert.match(out, /! \.agents\/skills\/aief-change\/SKILL\.md is an older AIEF version — run: aief update/);
  assert.match(out, /✓ \.claude\/skills\/aief-change\/SKILL\.md \(v2\.0\.0\)/);
  assert.equal(out.split(".agents/skills/aief-change/SKILL.md").length - 1, 1, "the shared path is reported once");
});

test("update refreshes and reports the shared .agents skill once", () => {
  const dir = makeProject({ [SKILL_TARGETS.codex]: OLD_SHIPPED });
  const { status, out } = aief(dir, ["update"]);
  assert.equal(status, 0, out);
  assert.equal(out.split("Updated .agents/skills/aief-change/SKILL.md").length - 1, 1);
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.gemini), "utf8"), skillTemplate());
});

test("prompt points to the installed skill, and carries the procedure for an assistant without one", () => {
  const dir = makeProject({ "README.md": "# x" });
  aief(dir, ["bootstrap"]);
  const claude = aief(dir, ["prompt", "claude", "--change", "0001-adopt-aief"]).out;
  assert.match(claude, /Follow the aief-change skill \(\.claude\/skills\/aief-change\/SKILL\.md\)/);
  assert.doesNotMatch(claude, /Change procedure \(aief-change\):/);
  const gemini = aief(dir, ["prompt", "gemini", "--change", "0001-adopt-aief"]).out;
  assert.match(gemini, /Follow the aief-change skill \(\.agents\/skills\/aief-change\/SKILL\.md\)/);
  const cursor = aief(dir, ["prompt", "cursor", "--change", "0001-adopt-aief"]).out;
  assert.match(cursor, /Change procedure \(aief-change\):\n\n# Working an AIEF Change/);
  assert.match(cursor, /Before calling the work complete, confirm/);
});

test("an AIEF-installed skill is not a passive signal for an assistant; an edited one is", () => {
  const dir = makeProject({ "README.md": "# x" });
  aief(dir, ["bootstrap"]);
  assert.deepEqual(resolveAssistant({ cwd: dir }), { assistantId: null, source: "none" });
  fs.appendFileSync(path.join(dir, SKILL_TARGETS.kiro), "\nTeam note.\n");
  assert.deepEqual(resolveAssistant({ cwd: dir }), { assistantId: "kiro", source: "detected" });
});
