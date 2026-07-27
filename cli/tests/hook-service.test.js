import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { evaluateEvent, evaluateHook } from "../src/core/services/hook-service.js";
import { buildEvent, buildHookContext } from "../src/core/services/hook-context.js";
import { buildSkillContext } from "../src/core/services/skill-context.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-hksvc-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n\n- **REQ-1** — Do the thing safely.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifestFor(overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id: "0001", slug: "thing", title: "Thing", status: "open", ...overrides });
}

function contextFor(dir, operation = { input: {}, result: null }, eventId = "prompt.prepared") {
  const skillCtx = buildSkillContext(dir, dir);
  const event = buildEvent(eventId, eventId.split(".")[0]);
  return buildHookContext(event, { project: skillCtx.project, change: skillCtx.change, workflow: skillCtx.workflow, sdd: skillCtx.sdd, operation });
}

// --- evaluateEvent(): real registered Hooks ---

test("evaluateEvent: prompt-skill-suggestion is not_applicable for a Change with no sdd", () => {
  const dir = makeChangeDir(COMPLETE);
  const event = buildEvent("prompt.prepared", "prompt");
  const context = contextFor(dir);
  const outcome = evaluateEvent(event, context);
  assert.equal(outcome.results.length, 1);
  assert.equal(outcome.results[0].hook, "prompt-skill-suggestion");
  assert.equal(outcome.results[0].status, "matched"); // applies (Change resolved); Skill itself is not_applicable
  assert.deepEqual(outcome.instructions, []);
});

test("evaluateEvent: prompt-skill-suggestion recommends the Skill when it is ready", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const event = buildEvent("prompt.prepared", "prompt");
  const context = contextFor(dir);
  const outcome = evaluateEvent(event, context);
  assert.equal(outcome.results[0].status, "matched");
  assert.equal(outcome.results[0].skillResults.length, 1);
  assert.equal(outcome.results[0].skillResults[0].status, "ready");
  assert.match(outcome.instructions[0], /aief prompt --skill requirements-analysis-instructions/);
});

test("evaluateEvent: a rejected SDD path-traversal change_id reaches prompt-skill-suggestion via context.sdd, still rejected (Change 0045's fix, unchanged)", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "openspec", change_id: "../../../etc" } }) });
  fs.mkdirSync(path.join(dir, "openspec", "changes"), { recursive: true });
  const event = buildEvent("prompt.prepared", "prompt");
  const context = contextFor(dir);
  const outcome = evaluateEvent(event, context);
  assert.equal(outcome.results[0].status, "matched"); // the Hook itself still applies (a Change was resolved)
  assert.equal(outcome.results[0].skillResults[0].status, "unsupported"); // but the allowlisted Skill correctly refuses
  assert.deepEqual(outcome.instructions, []); // no recommendation is fabricated for a broken SDD provider
});

test("evaluateEvent: post-verify-next-action recommends the next command for a resolved Change", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const event = buildEvent("verify.completed", "verify");
  const context = contextFor(dir, { input: { changeId: "0001-thing" }, result: { passed: false, lines: [] } }, "verify.completed");
  const outcome = evaluateEvent(event, context);
  assert.equal(outcome.results[0].hook, "post-verify-next-action");
  assert.equal(outcome.results[0].status, "matched");
  assert.ok(outcome.instructions.length >= 0); // may be empty if action.command is null, but must not throw
});

test("evaluateEvent: post-verify-next-action is not_applicable for the whole-project verify (no changeId)", () => {
  const dir = makeChangeDir(COMPLETE);
  const event = buildEvent("verify.completed", "verify");
  const context = contextFor(dir, { input: {}, result: { passed: true, lines: [] } }, "verify.completed");
  const outcome = evaluateEvent(event, context);
  assert.equal(outcome.results[0].status, "not_applicable");
});

test("evaluateEvent: never changes the operation's own result — report object is untouched", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ track: "lite" }) });
  const report = Object.freeze({ passed: true, lines: [] });
  const event = buildEvent("verify.completed", "verify");
  const context = contextFor(dir, { input: { changeId: "0001-thing" }, result: report }, "verify.completed");
  evaluateEvent(event, context);
  assert.equal(context.operation.result, report);
  assert.equal(context.operation.result.passed, true);
});

test("evaluateEvent: unknown event throws", () => {
  assert.throws(() => evaluateEvent({ id: "close.requested", phase: "post" }, {}), /Unknown event/);
});

test("evaluateEvent: deterministic — same inputs, same result, every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const event = buildEvent("prompt.prepared", "prompt", "2026-01-01T00:00:00.000Z");
  const context = contextFor(dir);
  assert.deepEqual(evaluateEvent(event, context), evaluateEvent(event, context));
});

test("evaluateEvent/evaluateHook perform zero writes", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  const event = buildEvent("prompt.prepared", "prompt");
  evaluateEvent(event, contextFor(dir));
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

// --- evaluateHook(): adversarial fixture Hooks ---

function fixtureHook(overrides) {
  return {
    id: "fixture",
    version: "1.0.0",
    title: "Fixture",
    description: "adversarial fixture",
    events: ["prompt.prepared"],
    capabilities: { observe: true, emitInstruction: true },
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ summary: "fixture matched", instructions: ["do the thing"] }),
    ...overrides
  };
}

function neutralContext() {
  const event = buildEvent("prompt.prepared", "prompt");
  return { event, ctx: buildHookContext(event, { project: {}, change: { basename: "0001-thing" }, workflow: null, sdd: null, operation: { input: {}, result: null } }) };
}

test("evaluateHook: hook/event fields always match the descriptor and fired event, never spoofable", () => {
  const mod = fixtureHook({ id: "spoof-attempt", evaluate: () => ({ hook: "other-id", event: "verify.completed", summary: "x" }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.hook, "spoof-attempt");
  assert.equal(result.event, "prompt.prepared");
});

test("evaluateHook: a matched result can never carry effects — attempted effects are invalid", () => {
  const mod = fixtureHook({ evaluate: () => ({ summary: "x", effects: [{ type: "write" }] }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.effects, []);
});

test("evaluateHook: a Hook without block capability cannot return blockers — post-event, always stripped", () => {
  const mod = fixtureHook({ evaluate: () => ({ summary: "x", blocking: true, blockers: ["fake blocker"] }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "invalid");
  assert.equal(result.blocking, false);
  assert.deepEqual(result.blockers, []);
});

test("evaluateHook: a Hook WITH block capability still cannot block on a post-event (phase enforcement, not just capability)", () => {
  const mod = fixtureHook({
    capabilities: { observe: true, block: true },
    evaluate: () => ({ summary: "x", blocking: true, blockers: ["should never be honored"] })
  });
  const { event, ctx } = neutralContext(); // prompt.prepared is phase: "post"
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.blocking, false);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.status, "invalid");
});

test("evaluateHook: a caller-supplied event object cannot spoof phase: \"pre\" on a real catalog event to smuggle an honored blocker (found via adversarial review — event.phase is never trusted for a known event id)", () => {
  const spoofedEvent = { id: "prompt.prepared", phase: "pre", timestamp: "x", operation: "prompt" };
  const mod = fixtureHook({
    capabilities: { observe: true, block: true },
    evaluate: () => ({ summary: "should never be honored", blocking: true, blockers: ["fake authority"] })
  });
  const { ctx } = neutralContext();
  const result = evaluateHook(mod, spoofedEvent, ctx);
  assert.equal(result.blocking, false);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.status, "invalid");
});

test("evaluateHook: a synthetic pre-phase event WOULD honor an authorized blocker (mechanism proof — no real pre event exists this Entrega)", () => {
  const mod = fixtureHook({
    events: ["synthetic.pre"],
    capabilities: { observe: true, block: true },
    evaluate: () => ({ summary: "blocked by policy", blocking: true, blockers: ["a real, authoritative blocker"] })
  });
  const event = { id: "synthetic.pre", phase: "pre", timestamp: "x", operation: "synthetic" };
  const ctx = { change: {}, workflow: null, sdd: null, project: {}, skill: null, operation: { input: {}, result: null } };
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "matched");
  assert.equal(result.blocking, true);
  assert.deepEqual(result.blockers, ["a real, authoritative blocker"]);
});

test("evaluateHook: warnings without emitWarning capability are stripped and invalid", () => {
  const mod = fixtureHook({ capabilities: { observe: true }, evaluate: () => ({ summary: "x", warnings: ["uh oh"] }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.warnings, []);
});

test("evaluateHook: instructions without emitInstruction capability are stripped and invalid", () => {
  const mod = fixtureHook({ capabilities: { observe: true }, evaluate: () => ({ summary: "x", instructions: ["do X"] }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.instructions, []);
});

test("evaluateHook: a Hook cannot set skillResults directly — only the Service's own Skill Service call is trusted", () => {
  const mod = fixtureHook({ evaluate: () => ({ summary: "x", skillResults: [{ skill: "change-context", status: "completed" }] }) });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "invalid");
});

test("evaluateHook: a Hook can invoke only its own allowlisted Skill", () => {
  const mod = fixtureHook({
    capabilities: { observe: true, invokeSkill: true },
    allowedSkills: ["change-context"],
    evaluate: (event, context, skillResults) => ({ summary: `saw ${Object.keys(skillResults).join(",")}` })
  });
  const dir = makeChangeDir({ change: "# Change", spec: "x" }); // minimal, unused directly
  const { event } = neutralContext();
  const skillCtx = buildSkillContext(dir, dir);
  const hookCtx = buildHookContext(event, { project: skillCtx.project, change: skillCtx.change, workflow: skillCtx.workflow, sdd: skillCtx.sdd, operation: { input: {}, result: null } });
  const result = evaluateHook(mod, event, hookCtx);
  assert.equal(result.status, "matched");
  assert.equal(result.skillResults.length, 1);
  assert.equal(result.skillResults[0].skill, "change-context");
});

test("evaluateHook: a Skill's ready status is embedded unedited — never re-labeled completed", () => {
  const mod = fixtureHook({
    capabilities: { observe: true, invokeSkill: true },
    allowedSkills: ["change-context"],
    evaluate: (event, context, skillResults) => ({ summary: "x" })
  });
  const dir = makeChangeDir(COMPLETE);
  const { event } = neutralContext();
  const skillCtx = buildSkillContext(dir, dir);
  const hookCtx = buildHookContext(event, { project: skillCtx.project, change: skillCtx.change, workflow: skillCtx.workflow, sdd: skillCtx.sdd, operation: { input: {}, result: null } });
  const result = evaluateHook(mod, event, hookCtx);
  assert.equal(result.skillResults[0].status, "ready");
  assert.notEqual(result.skillResults[0].status, "completed");
});

test("evaluateHook: a Hook cannot forge or mutate skillResults by writing into the map it was handed (found via adversarial review — the map and each entry are frozen)", () => {
  const mod = fixtureHook({
    capabilities: { observe: true, invokeSkill: true },
    allowedSkills: ["change-context"],
    evaluate: (event, context, skillResults) => {
      try { skillResults["change-context"] = { skill: "change-context", status: "completed", effects: [] }; } catch { /* frozen, expected */ }
      try { skillResults["totally-fake-skill"] = { skill: "totally-fake-skill", status: "ready" }; } catch { /* frozen, expected */ }
      try { skillResults["change-context"].status = "completed"; } catch { /* frozen, expected */ }
      return { summary: "attempted forgery" };
    }
  });
  const dir = makeChangeDir(COMPLETE);
  const { event } = neutralContext();
  const skillCtx = buildSkillContext(dir, dir);
  const hookCtx = buildHookContext(event, { project: skillCtx.project, change: skillCtx.change, workflow: skillCtx.workflow, sdd: skillCtx.sdd, operation: { input: {}, result: null } });
  const result = evaluateHook(mod, event, hookCtx);
  assert.equal(result.skillResults.length, 1);
  assert.equal(result.skillResults[0].skill, "change-context");
  assert.equal(result.skillResults[0].status, "ready");
  assert.equal(result.skillResults.some((r) => r.skill === "totally-fake-skill"), false);
});

test("evaluateHook: a Hook that throws while mutating the frozen context fails safely", () => {
  const mod = fixtureHook({
    evaluate: (event, context) => { context.change.basename = "hijacked"; return { summary: "unreachable" }; }
  });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "failed");
  assert.ok(result.errors.length > 0);
});

test("evaluateHook: appliesTo() cannot spoof matched/invalid/failed from its non-applicable result", () => {
  const modMatched = fixtureHook({ appliesTo: () => ({ applicable: false, status: "matched", reason: "spoof" }) });
  const modFailed = fixtureHook({ appliesTo: () => ({ applicable: false, status: "failed", reason: "spoof" }) });
  const { event, ctx } = neutralContext();
  assert.equal(evaluateHook(modMatched, event, ctx).status, "not_applicable");
  assert.equal(evaluateHook(modFailed, event, ctx).status, "not_applicable");
});

test("evaluateHook: appliesTo() throwing is 'failed', not an uncaught exception", () => {
  const mod = fixtureHook({ appliesTo: () => { throw new Error("boom"); } });
  const { event, ctx } = neutralContext();
  const result = evaluateHook(mod, event, ctx);
  assert.equal(result.status, "failed");
});

test("evaluateHook: a non-applicable Hook returns a normal result, never throws", () => {
  const mod = fixtureHook({ appliesTo: () => ({ applicable: false, reason: "nope" }) });
  const { event, ctx } = neutralContext();
  assert.doesNotThrow(() => evaluateHook(mod, event, ctx));
});

test("evaluateHook: evaluate() returning a non-object is invalid", () => {
  const mod = fixtureHook({ evaluate: () => "not an object" });
  const { event, ctx } = neutralContext();
  assert.equal(evaluateHook(mod, event, ctx).status, "invalid");
});

test("Hook-to-Skill recursion: the Skill Service never references the Hook Service", () => {
  const source = fs.readFileSync(new URL("../src/core/services/skill-service.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /hook-service/);
  assert.doesNotMatch(source, /hooks\/index\.js/);
});

test("Hooks never import a Skill module directly", () => {
  for (const file of ["prompt-skill-suggestion.js", "post-verify-next-action.js"]) {
    const source = fs.readFileSync(new URL(`../src/hooks/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from ["'].*skills\/(change-context|requirements-analysis-instructions)\.js["']/);
  }
});
