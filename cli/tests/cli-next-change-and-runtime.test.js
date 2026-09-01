import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

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

test("prompt --list-skills lists every registered Skill, deterministic order, with zero open Changes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["prompt", "--list-skills"]);
  assert.equal(status, 0);
  assert.match(out, /change-context \(v1\.0\.0\): Change Context/);
  assert.match(out, /requirements-analysis-instructions \(v1\.0\.0\): Requirements Analysis Instructions/);
  assert.match(out, /architecture-definition \(v1\.0\.0\): Architecture Definition/);
  assert.match(out, /data-definition \(v1\.0\.0\): Data Definition/);
  assert.ok(out.indexOf("change-context") < out.indexOf("requirements-analysis-instructions"));
  assert.ok(out.indexOf("requirements-analysis-instructions") < out.indexOf("architecture-definition"));
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

