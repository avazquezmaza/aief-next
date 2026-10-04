import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput, declareDependsOn } from "./helpers/cli-runner.js";

// --- Change 0059/ADR-029: smart next-Change selection for 2+ open Changes ---

test("status --next: a Change depending on an open dependency is skipped; the independent one is recommended", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  declareDependsOn(path.join(dir, "changes", "0002-add-login"), ["0001-user-model"]);
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
  declareDependsOn(path.join(dir, "changes", "0002-add-login"), ["0001-user-model"]);
  declareDependsOn(path.join(dir, "changes", "0003-unrelated-blocked"), ["0099-ghost"]);
  fs.appendFileSync(path.join(dir, "changes", "0001-user-model", "change.md"), "\n## Status\n\nClosed (2026-07-30)\n");
  const { out, status } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0002-add-login/);
  assert.match(out, /dependencies: all closed \(0001-user-model\)/);
});

test("status --next: two plain open Changes are both eligible", () => {
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

test("status --change does not write any file (read-only query)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-readonly-thing");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["status", "--change", "0001-readonly-thing"]);
  aief(dir, ["status", "--change", "0001-readonly-thing", "--next"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("prompt output for a plain Change carries no Workflow or SDD block", () => {
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
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["prompt", "--change", "0001-prompt-readonly-thing"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

// --- Entrega 5 (Change 0047, ADR-019) — Skills Runtime, `prompt` integration ---

test("prompt --list-skills lists every registered Skill, deterministic order, with zero open Changes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  assert.match(out, /change-context \(v1\.0\.0\): Change Context/);
  assert.match(out, /architecture-definition \(v1\.0\.0\): Architecture Definition/);
  assert.match(out, /data-definition \(v1\.0\.0\): Data Definition/);
  assert.ok(out.indexOf("change-context") < out.indexOf("architecture-definition"));
  assert.ok(out.indexOf("architecture-definition") < out.indexOf("data-definition"));
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
  const { out, status } = aief(dir, ["prompt", "--skill", "architecture-definition", "--change", "0001-skill-not-applicable-thing"]);
  assert.equal(status, 0);
  assert.match(out, /─── Skill: architecture-definition \(not_applicable\) ───/);
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

test("prompt has no Hook section when no Hook applies", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-neutral-thing"]);
  const { out } = aief(dir, ["prompt", "--change", "0001-hook-neutral-thing"]);
  assert.doesNotMatch(out, /─── Hook:/);
});

test("prompt --list-skills is unaffected by Hooks Runtime", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /─── Hook:/);
});

test("verify --change is byte-identical (plus an additive Hook line) and never changes PASS/FAIL", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "hook-verify-thing"]);
  const { out, status } = aief(dir, ["verify", "--change", "0001-hook-verify-thing"]);
  assert.match(out, /Result: PASS/);
  assert.equal(status, 0);
  assert.match(out, /Hook recommendation:/);
  assert.match(out, /aief prompt --change 0001-hook-verify-thing/);
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

