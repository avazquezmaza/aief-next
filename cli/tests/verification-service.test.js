import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { evaluateRequirements, evaluateRule, aggregateVerificationResult } from "../src/core/services/verification-service.js";
import { buildVerificationContext } from "../src/core/services/verification-context.js";
import { explain } from "../src/core/services/workflow-service.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-vrsvc-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

// buildVerificationContext() is non-fetching (Entrega 6's Hook Context
// precedent) — the caller computes explain(dir, dir) itself, once.
function buildCtx(dir, operation) {
  return buildVerificationContext(explain(dir, dir), dir, dir, operation);
}

const SPEC_TWO_REQS = "# Specification\n\n## Goal\n\nDo the thing.\n\n- **REQ-1** — First requirement.\n- **REQ-2** — Second requirement.\n";
const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": SPEC_TWO_REQS,
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function manifestFor(overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id: "0001", slug: "thing", title: "Thing", status: "open", ...overrides });
}

// --- evaluateRequirements(): real registered rules ---

test("evaluateRequirements: requirement-has-traceability passes for a cited requirement, fails for one not cited", () => {
  const dir = makeChangeDir({
    ...COMPLETE,
    "manifest.json": manifestFor({ sdd: { provider: "local" } }),
    "verification.md": "| 1 | check | REQ-1 | pass |\n"
  });
  const context = buildCtx(dir, { input: {}, result: null });
  const { requirementResults } = evaluateRequirements(context);
  assert.equal(requirementResults.length, 2);
  const req1 = requirementResults.find((r) => r.requirement.id === "REQ-1");
  const req2 = requirementResults.find((r) => r.requirement.id === "REQ-2");
  const traceRule = (r) => r.ruleResults.find((rr) => rr.rule === "requirement-has-traceability");
  assert.equal(traceRule(req1).status, "passed");
  assert.equal(traceRule(req2).status, "failed");
});

test("evaluateRequirements: requirement-has-traceability is not_applicable with no verification.md", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }) });
  const context = buildCtx(dir, { input: {}, result: null });
  const { requirementResults } = evaluateRequirements(context);
  const traceRule = requirementResults[0].ruleResults.find((rr) => rr.rule === "requirement-has-traceability");
  assert.equal(traceRule.status, "not_applicable");
});

test("evaluateRequirements: evidence-reference-integrity passes for a present cited file, fails for a missing one", () => {
  const dir = makeChangeDir({
    ...COMPLETE,
    "manifest.json": manifestFor({ sdd: { provider: "local" } }),
    "verification.md": "| 1 | check | REQ-1 | see `spec.md` |\n| 2 | check | REQ-2 | see `nope.md` |\n"
  });
  const context = buildCtx(dir, { input: {}, result: null });
  const { requirementResults } = evaluateRequirements(context);
  const evRule = (id) => requirementResults.find((r) => r.requirement.id === id).ruleResults.find((rr) => rr.rule === "evidence-reference-integrity");
  assert.equal(evRule("REQ-1").status, "passed");
  assert.equal(evRule("REQ-2").status, "failed");
});

test("evaluateRequirements: evidence-reference-integrity is not_applicable with no file_assertion evidence cited", () => {
  const dir = makeChangeDir({
    ...COMPLETE,
    "manifest.json": manifestFor({ sdd: { provider: "local" } }),
    "verification.md": "| 1 | check | REQ-1 | pass |\n"
  });
  const context = buildCtx(dir, { input: {}, result: null });
  const { requirementResults } = evaluateRequirements(context);
  const evRule = requirementResults[0].ruleResults.find((rr) => rr.rule === "evidence-reference-integrity");
  assert.equal(evRule.status, "not_applicable");
});

test("evaluateRequirements: a path-traversal evidence reference is 'invalid', never read", () => {
  const dir = makeChangeDir({
    ...COMPLETE,
    "manifest.json": manifestFor({ sdd: { provider: "local" } }),
    "verification.md": "| 1 | check | REQ-1 | see `../../../etc/passwd` |\n"
  });
  const context = buildCtx(dir, { input: {}, result: null });
  const { requirementResults } = evaluateRequirements(context);
  const evRule = requirementResults[0].ruleResults.find((rr) => rr.rule === "evidence-reference-integrity");
  assert.equal(evRule.status, "invalid");
});

test("evaluateRequirements: deterministic — same inputs, same result, every call", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }), "verification.md": "| 1 | x | REQ-1 | y |\n" });
  const context = buildCtx(dir, { input: {}, result: null });
  assert.deepEqual(evaluateRequirements(context), evaluateRequirements(context));
});

test("evaluateRequirements performs zero writes", () => {
  const dir = makeChangeDir({ ...COMPLETE, "manifest.json": manifestFor({ sdd: { provider: "local" } }), "verification.md": "| 1 | x | REQ-1 | `spec.md` |\n" });
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  const context = buildCtx(dir, { input: {}, result: null });
  evaluateRequirements(context);
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

// --- aggregateVerificationResult(): precedence ---

function fakeResult(status, overrides = {}) {
  return { rule: "fake", requirement: "REQ-1", status, summary: "x", findings: [], evidence: [], missingEvidence: [], warnings: [], errors: [], effects: [], ...overrides };
}
function reqResults(...ruleResults) {
  return [{ requirement: { id: "REQ-1" }, evidence: [], ruleResults }];
}

test("aggregation: PASS when structural passes and every rule passed/not_applicable/unsupported", () => {
  assert.equal(aggregateVerificationResult(true, reqResults(fakeResult("passed"), fakeResult("not_applicable"), fakeResult("unsupported"))), "PASS");
});

test("aggregation: INCOMPLETE when a rule is blocked, nothing failed", () => {
  assert.equal(aggregateVerificationResult(true, reqResults(fakeResult("passed"), fakeResult("blocked"))), "INCOMPLETE");
});

test("aggregation: FAIL when structural fails, even if every rule passed", () => {
  assert.equal(aggregateVerificationResult(false, reqResults(fakeResult("passed"))), "FAIL");
});

test("aggregation: FAIL when any rule failed", () => {
  assert.equal(aggregateVerificationResult(true, reqResults(fakeResult("passed"), fakeResult("failed"))), "FAIL");
});

test("aggregation: INVALID outranks FAIL", () => {
  assert.equal(aggregateVerificationResult(false, reqResults(fakeResult("failed"), fakeResult("invalid"))), "INVALID");
});

test("aggregation: ERROR outranks INVALID and everything else", () => {
  assert.equal(aggregateVerificationResult(false, reqResults(fakeResult("failed"), fakeResult("invalid"), fakeResult("error"))), "ERROR");
});

test("aggregation: not_applicable/unsupported never affect the outcome even when mixed with blocked", () => {
  assert.equal(aggregateVerificationResult(true, reqResults(fakeResult("not_applicable"), fakeResult("unsupported"), fakeResult("blocked"))), "INCOMPLETE");
});

test("aggregation: no requirements at all -> PASS if structural passes (vacuously true, never FAIL/INCOMPLETE by default)", () => {
  assert.equal(aggregateVerificationResult(true, []), "PASS");
});

// --- evaluateRule(): adversarial fixture rules ---

function fixtureRule(overrides) {
  return {
    id: "fixture", version: "1.0.0", title: "Fixture", description: "adversarial fixture",
    scope: "requirement", capabilities: { readContext: true }, evidenceTypes: [],
    appliesTo: () => ({ applicable: true }),
    evaluate: () => ({ status: "passed", summary: "fixture matched" }),
    ...overrides
  };
}
function neutralRequirement() { return Object.freeze({ id: "REQ-1", title: "x", text: "x", source: {} }); }
function neutralContext() { return Object.freeze({ verificationDoc: null, projectRoot: "/tmp" }); }

test("evaluateRule: rule/requirement fields always match the descriptor and evaluated requirement, never spoofable", () => {
  const mod = fixtureRule({ evaluate: () => ({ status: "passed", rule: "other-id", requirement: "OTHER-REQ", summary: "x" }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.rule, "fixture");
  assert.equal(result.requirement, "REQ-1");
});

test("evaluateRule: a passed result can never carry effects — attempted effects are invalid", () => {
  const mod = fixtureRule({ evaluate: () => ({ status: "passed", summary: "x", effects: [{ type: "write" }] }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.effects, []);
});

test("evaluateRule: a rule cannot invent evidence not present in what the Service resolved", () => {
  const realEvidence = Object.freeze([Object.freeze({ type: "file_assertion", ref: "a.txt", state: "present" })]);
  const fabricated = { type: "file_assertion", ref: "b.txt", state: "present" };
  const mod = fixtureRule({ evidenceTypes: ["file_assertion"], evaluate: () => ({ status: "passed", summary: "x", evidence: [fabricated] }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), realEvidence);
  assert.equal(result.status, "invalid");
  assert.match(result.errors.join(" "), /invented evidence/);
});

test("evaluateRule: reporting a real subset of the resolved evidence is accepted", () => {
  const realEvidence = Object.freeze([Object.freeze({ type: "file_assertion", ref: "a.txt", state: "present" })]);
  const mod = fixtureRule({ evidenceTypes: ["file_assertion"], evaluate: (c, r, evidence) => ({ status: "passed", summary: "x", evidence: [evidence[0]] }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), realEvidence);
  assert.equal(result.status, "passed");
  assert.deepEqual(result.evidence, [realEvidence[0]]);
});

test("evaluateRule: a rule claiming evidence types cannot report passed with zero resolved evidence (defense-in-depth)", () => {
  const mod = fixtureRule({ evidenceTypes: ["file_assertion"], evaluate: () => ({ status: "passed", summary: "no evidence but I say passed anyway" }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "invalid");
});

test("evaluateRule: manual_attestation evidence alone can never justify a passed verdict (VR-R7)", () => {
  const attestationOnly = Object.freeze([Object.freeze({ type: "manual_attestation", ref: null, source: "human", confidence: "unverifiable" })]);
  const mod = fixtureRule({ evidenceTypes: ["manual_attestation"], evaluate: () => ({ status: "passed", summary: "a human said it's fine" }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), attestationOnly);
  assert.equal(result.status, "invalid");
});

test("evaluateRule: manual_attestation mixed with real supporting evidence is fine", () => {
  const mixed = Object.freeze([
    Object.freeze({ type: "manual_attestation", ref: null, source: "human", confidence: "unverifiable" }),
    Object.freeze({ type: "file_assertion", ref: "a.txt", source: "verification.md", confidence: "deterministic", state: "present" })
  ]);
  const mod = fixtureRule({ evidenceTypes: ["manual_attestation", "file_assertion"], evaluate: (c, r, ev) => ({ status: "passed", summary: "x", evidence: ev }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), mixed);
  assert.equal(result.status, "passed");
});

test("evaluateRule: appliesTo() cannot spoof passed/failed/error from its non-applicable result", () => {
  const modPassed = fixtureRule({ appliesTo: () => ({ applicable: false, status: "passed", reason: "spoof" }) });
  const modError = fixtureRule({ appliesTo: () => ({ applicable: false, status: "error", reason: "spoof" }) });
  assert.equal(evaluateRule(modPassed, neutralContext(), neutralRequirement(), []).status, "not_applicable");
  assert.equal(evaluateRule(modError, neutralContext(), neutralRequirement(), []).status, "not_applicable");
});

test("evaluateRule: appliesTo() throwing is 'error', not an uncaught exception", () => {
  const mod = fixtureRule({ appliesTo: () => { throw new Error("boom"); } });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "error");
});

test("evaluateRule: evaluate() throwing is 'error', distinct from a 'failed' verdict", () => {
  const mod = fixtureRule({ evaluate: () => { throw new Error("boom"); } });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "error");
});

test("evaluateRule: a rule that throws while mutating the frozen requirement fails safely", () => {
  const mod = fixtureRule({
    evaluate: (context, requirement) => { requirement.id = "hijacked"; return { status: "passed", summary: "unreachable" }; }
  });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "error");
});

test("evaluateRule: a rule that throws while mutating the frozen evidence array fails safely", () => {
  const evidence = Object.freeze([Object.freeze({ type: "file_assertion", ref: "a.txt", state: "present" })]);
  const mod = fixtureRule({ evaluate: (c, r, ev) => { ev.push({}); return { status: "passed", summary: "unreachable" }; } });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), evidence);
  assert.equal(result.status, "error");
});

test("evaluateRule: evaluate() returning a non-object is invalid", () => {
  const mod = fixtureRule({ evaluate: () => "not an object" });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "invalid");
});

test("evaluateRule: evaluate() returning an unrecognized status is invalid", () => {
  const mod = fixtureRule({ evaluate: () => ({ status: "super-duper-passed", summary: "x" }) });
  const result = evaluateRule(mod, neutralContext(), neutralRequirement(), []);
  assert.equal(result.status, "invalid");
});

test("evaluateRule: a non-applicable rule returns a normal result, never throws", () => {
  const mod = fixtureRule({ appliesTo: () => ({ applicable: false, reason: "nope" }) });
  assert.doesNotThrow(() => evaluateRule(mod, neutralContext(), neutralRequirement(), []));
});
