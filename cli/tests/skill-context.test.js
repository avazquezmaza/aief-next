import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildSkillContext } from "../src/core/services/skill-context.js";
import { explain } from "../src/core/services/next-action.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "../src/core/domain/definition-enrichment.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-skctx-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const COMPLETE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

function definitionScaffold(overrides = {}) {
  const content = Object.fromEntries(DEFINITION_SECTIONS.map((name) => [name, "-"]));
  content["Decision (human)"] = "Pending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.";
  Object.assign(content, overrides);
  const body = DEFINITION_SECTIONS.map((name) => `## ${name}\n\n${content[name]}\n`).join("\n");
  return `# Change\n\n## ID\n\n\`0002-def\`\n\n## Type\n\nDefinition\n\n## Objective\n\nx\n\n${body}`;
}

test("buildSkillContext: carries the Change, its next action and the project", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildSkillContext(dir, dir);
  assert.ok(context.change);
  assert.ok(context.action);
  assert.ok(context.project);
  assert.ok(Array.isArray(context.project.signals));
});

test("buildSkillContext: adds exactly `project` and `definitionEnrichment` beyond explain()'s own fields", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildSkillContext(dir, dir);
  const inspection = explain(dir);
  assert.deepEqual(context.change, inspection.change);
  assert.deepEqual(context.action, inspection.action);
  assert.deepEqual(Object.keys(context).sort(), ["action", "change", "definitionEnrichment", "project"]);
});

test("buildSkillContext: definitionEnrichment is null for a General Change", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildSkillContext(dir, dir);
  assert.equal(context.change.type, "");
  assert.equal(context.definitionEnrichment, null);
});

test("buildSkillContext: definitionEnrichment is null for an Analysis Change", () => {
  const dir = makeChangeDir({ ...COMPLETE, "change.md": "# Change\n\n## Type\n\nAnalysis\n\n## Objective\n\nx\n" });
  const context = buildSkillContext(dir, dir);
  assert.equal(context.definitionEnrichment, null);
});

test("buildSkillContext: definitionEnrichment reflects an untouched Definition scaffold — every section missing", () => {
  const dir = makeChangeDir({ ...COMPLETE, "change.md": definitionScaffold() });
  const context = buildSkillContext(dir, dir);
  assert.ok(context.definitionEnrichment);
  assert.equal(context.definitionEnrichment.known.length, 0);
  assert.equal(context.definitionEnrichment.missing.length, DEFINITION_SECTIONS.length);
});

test("buildSkillContext: definitionEnrichment surfaces (deferred)/(ambiguous)/(decision required)/(human) markers", () => {
  const dir = makeChangeDir({
    ...COMPLETE,
    "change.md": definitionScaffold({
      "Context": "Real context.",
      "Open Questions": "- Which caching layer? (deferred)\n- Expected concurrent users? (ambiguous)",
      "Decisions Required": "- Multi-tenancy model: shared schema vs. schema-per-tenant. (decision required)",
      "Recommendation": "- Adopt schema-per-tenant for stronger isolation. (human)"
    })
  });
  const context = buildSkillContext(dir, dir);
  assert.ok(context.definitionEnrichment.known.includes("Context"));
  assert.equal(context.definitionEnrichment.deferred.length, 1);
  assert.equal(context.definitionEnrichment.ambiguous.length, 1);
  assert.equal(context.definitionEnrichment.decisionRequired.length, 1);
  assert.equal(context.definitionEnrichment.humanApprovalRequired.length, 1);
});

test("buildSkillContext: definitionEnrichment matches analyzeDefinitionSections() called directly — no second parser", () => {
  const changeMd = definitionScaffold({ Context: "Real content.", "Known Requirements": "- Users can log in." });
  const dir = makeChangeDir({ ...COMPLETE, "change.md": changeMd });
  const context = buildSkillContext(dir, dir);
  assert.deepEqual(context.definitionEnrichment, analyzeDefinitionSections(changeMd));
});

test("buildSkillContext: definitionEnrichment is frozen — a caller cannot mutate its arrays", () => {
  const dir = makeChangeDir({ ...COMPLETE, "change.md": definitionScaffold() });
  const context = buildSkillContext(dir, dir);
  assert.throws(() => { context.definitionEnrichment.known.push("hijacked"); }, TypeError);
});

test("buildSkillContext: is idempotent — same Change, same inputs, same context, every call", () => {
  const dir = makeChangeDir(COMPLETE);
  const a = buildSkillContext(dir, dir);
  const b = buildSkillContext(dir, dir);
  assert.deepEqual(a, b);
});

test("buildSkillContext: performs zero writes (byte-comparison before/after)", () => {
  const dir = makeChangeDir(COMPLETE);
  const before = {};
  for (const f of fs.readdirSync(dir)) before[f] = fs.readFileSync(path.join(dir, f), "utf8");
  buildSkillContext(dir, dir);
  for (const f of fs.readdirSync(dir)) assert.equal(fs.readFileSync(path.join(dir, f), "utf8"), before[f], `${f} was modified`);
});

test("buildSkillContext: the returned context is frozen — a caller cannot mutate it", () => {
  const dir = makeChangeDir(COMPLETE);
  const context = buildSkillContext(dir, dir);
  assert.throws(() => { context.change = { hijacked: true }; }, TypeError);
  assert.throws(() => { context.action.status = "hijacked"; }, TypeError);
});
