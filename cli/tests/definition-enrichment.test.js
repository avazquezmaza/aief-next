import test from "node:test";
import assert from "node:assert/strict";

import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "../src/core/domain/definition-enrichment.js";

function scaffold(overrides = {}) {
  const content = {
    "Context": "-",
    "Business / Product Constraints": "-",
    "Known Requirements": "-",
    "Assumptions": "-",
    "Open Questions": "-",
    "Decisions Required": "-",
    "Options Considered": "-",
    "Recommendation": "-",
    "Decision (human)": "Pending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.",
    "Rationale": "-",
    "Consequences": "-",
    "Non-Functional Requirements": "-",
    "Security & Compliance": "-",
    "Data & Domain": "-",
    "Integrations": "-",
    "Deployment & Operations": "-",
    "Implementation Prerequisites": "-",
    "Follow-up Changes": "-",
    ...overrides
  };
  return `# Change\n\n## ID\n\n\`0001-x\`\n\n## Type\n\nDefinition\n\n## Objective\n\nx\n\n${DEFINITION_SECTIONS.map((name) => `## ${name}\n\n${content[name]}\n`).join("\n")}`;
}

test("a fresh, untouched Definition scaffold: every section is missing", () => {
  const result = analyzeDefinitionSections(scaffold());
  assert.deepEqual(result.known, []);
  assert.equal(result.missing.length, DEFINITION_SECTIONS.length);
  assert.ok(result.missing.includes("Decision (human)"), "the pending-approval sentence must count as missing/not-yet-decided");
});

test("a filled-in section is Known", () => {
  const result = analyzeDefinitionSections(scaffold({ Context: "This project replaces three legacy lookup screens with one." }));
  assert.ok(result.known.includes("Context"));
  assert.ok(!result.missing.includes("Context"));
});

test("a real Decision (human) entry (no longer the pending sentence) is Known, not missing", () => {
  const result = analyzeDefinitionSections(scaffold({ "Decision (human)": "Approved: use PostgreSQL with row-level security for tenant isolation. — approved 2026-08-14 by the project owner." }));
  assert.ok(result.known.includes("Decision (human)"));
});

test("(deferred) marks an item as deferred until implementation", () => {
  const md = scaffold({ "Open Questions": "- Which caching layer? (deferred)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.deferred.length, 1);
  assert.match(result.deferred[0], /Which caching layer/);
});

test("(ambiguous) marks an item as ambiguous", () => {
  const md = scaffold({ "Open Questions": "- Expected concurrent users? (ambiguous)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.ambiguous.length, 1);
});

test("(decision required) marks an item as needing a decision", () => {
  const md = scaffold({ "Decisions Required": "- Multi-tenancy model: shared schema vs. schema-per-tenant. (decision required)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.decisionRequired.length, 1);
});

test("(human) marks an item as requiring human approval, reusing the existing convention", () => {
  const md = scaffold({ "Recommendation": "- Adopt schema-per-tenant for stronger isolation. (human)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.humanApprovalRequired.length, 1);
});

// Change 0107: "*" and "+" are valid CommonMark unordered-list bullets too —
// change.js's countOpenTasks() already accepts all three for tasks.md
// (Change 0075); this module previously only recognized "-", silently
// dropping any marker on a "*"/"+" line.
test("(decision required) marks an item the same way with a '*' bullet as with '-'", () => {
  const md = scaffold({ "Decisions Required": "* Multi-tenancy model: shared schema vs. schema-per-tenant. (decision required)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.decisionRequired.length, 1);
  assert.match(result.decisionRequired[0], /Multi-tenancy model/);
});

test("(human) marks an item the same way with a '+' bullet as with '-'", () => {
  const md = scaffold({ "Recommendation": "+ Adopt schema-per-tenant for stronger isolation. (human)" });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.humanApprovalRequired.length, 1);
  assert.match(result.humanApprovalRequired[0], /schema-per-tenant/);
});

test("markers never invent a category from prose alone — an unmarked line is not classified", () => {
  const md = scaffold({ "Open Questions": "- This question might be ambiguous but was not marked." });
  const result = analyzeDefinitionSections(md);
  assert.equal(result.ambiguous.length, 0);
  assert.equal(result.deferred.length, 0);
  assert.equal(result.decisionRequired.length, 0);
  assert.equal(result.humanApprovalRequired.length, 0);
});

test("CRLF line endings classify the same as LF", () => {
  const md = scaffold({ Context: "Real content here." }).replace(/\n/g, "\r\n");
  const result = analyzeDefinitionSections(md);
  assert.ok(result.known.includes("Context"));
});
