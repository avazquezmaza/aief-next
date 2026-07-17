// F3 — evidence classification (Flux Portal dogfooding).
//
// The old rule fired at ">= 3 Pending. lines" regardless of context, so Flux
// Portal's Change 0003 — 688 lines of real, cited evidence containing three
// residual "Pending." markers — was reported as an untouched template, and
// `close` was blocked on evidence that was demonstrably complete. These tests
// pin the shape of that real document, not a synthetic one.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { classifyEvidence, isEvidencePlaceholderContent, loadChange } from "../src/core/domain/change.js";
import { checkChangeReadiness, verifyProject } from "../src/core/services/change-verifier.js";

// The exact template `aief` generates: nine sections, nine "Pending." lines.
const TEMPLATE = "# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n\n## Findings\n\nPending.\n\n## Risks\n\nPending.\n\n## Recommendations\n\nPending.\n\n## Artifacts Produced\n\nPending.\n\n## Lessons Learned\n\nPending.\n\n## Next Change\n\nPending.\n";

// Reproduces the real proportions of Flux Portal's changes/0003 evidence.md:
// hundreds of substantive lines, exactly three residual "Pending." markers.
function fluxLikeEvidence(substantiveLines = 600, pendingLines = 3) {
  const out = ["# Evidence", "", "## Summary", ""];
  for (let i = 0; i < substantiveLines; i++) out.push(`- Increment ${i}: validated against real services (HTTPS, Postgres) — PASS.`);
  out.push("", "## Deferred", "");
  for (let i = 0; i < pendingLines; i++) out.push("Pending.");
  return out.join("\n");
}

test("F3: the untouched template is a placeholder", () => {
  assert.equal(classifyEvidence(TEMPLATE), "placeholder");
  assert.equal(isEvidencePlaceholderContent(TEMPLATE), true);
});

test("F3 (real Flux 0003): 688-line evidence with 3 residual 'Pending.' is COMPLETE", () => {
  const evidence = fluxLikeEvidence(600, 3);
  assert.equal(classifyEvidence(evidence), "complete");
  assert.equal(isEvidencePlaceholderContent(evidence), false, "this is the false positive that blocked close");
});

test("F3 (real Flux 0005): 496-line evidence with 3 residual 'Pending.' is COMPLETE", () => {
  assert.equal(classifyEvidence(fluxLikeEvidence(430, 3)), "complete");
});

test("F3: real content with no placeholders is complete", () => {
  assert.equal(classifyEvidence("# Evidence\n\n## Summary\n\nReal work happened.\n"), "complete");
});

test("F3: placeholders still dominating a little content is partial", () => {
  const evidence = ["# Evidence", "", "## Summary", "", "Did one thing.", "", "## Findings", "", "Pending.", "", "## Risks", "", "Pending.", "", "## Next Change", "", "Pending."].join("\n");
  assert.equal(classifyEvidence(evidence), "partial");
});

test("F3: an absent/empty evidence.md is not a 'placeholder' — it is missing/empty", () => {
  // Reported once, as its own problem; never twice under two names.
  assert.equal(isEvidencePlaceholderContent(""), false);
  assert.equal(isEvidencePlaceholderContent("   \n\n"), false);
});

// --- integration: readiness + the "Next:" hint ----------------------------

function makeChange(evidence) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-evidence-"));
  fs.writeFileSync(path.join(dir, "change.md"), "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nGeneral\n\n## Objective\n\nDo it.\n");
  fs.writeFileSync(path.join(dir, "spec.md"), "# Specification\n\n## Goal\n\nDo it.\n");
  fs.writeFileSync(path.join(dir, "tasks.md"), "# Tasks\n\n- [x] Done.\n");
  fs.writeFileSync(path.join(dir, "evidence.md"), evidence);
  return loadChange(dir);
}

test("F3: complete evidence does not block close (the false positive is gone)", () => {
  const change = makeChange(fluxLikeEvidence(600, 3));
  assert.equal(change.evidenceState, "complete");
  assert.deepEqual(checkChangeReadiness(change), [], "a finished Change must be closable");
});

test("F3: a placeholder still blocks close (safety property preserved)", () => {
  const change = makeChange(TEMPLATE);
  assert.ok(checkChangeReadiness(change).some((p) => p.includes("has not been completed")));
});

test("F3: partial evidence blocks close, and says why", () => {
  const change = makeChange(["# Evidence", "", "## Summary", "", "Did one thing.", "", "Pending.", "", "Pending.", "", "Pending."].join("\n"));
  assert.equal(change.evidenceState, "partial");
  assert.ok(checkChangeReadiness(change).some((p) => p.includes("partially completed")));
});

test("F3: the Next hint points a finished Change at close, not back at prompt", () => {
  const change = makeChange(fluxLikeEvidence(600, 3));
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(change.dir) });
  assert.equal(report.passed, true);
  assert.ok(report.next.join(" ").includes("aief close"), "complete evidence => close");
  assert.ok(!report.next.join(" ").includes("aief prompt"), "must not send finished work back to be redone");
});

test("F3: the Next hint points an untouched Change at prompt", () => {
  const change = makeChange(TEMPLATE);
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(change.dir) });
  assert.ok(report.next.join(" ").includes("aief prompt"));
});
