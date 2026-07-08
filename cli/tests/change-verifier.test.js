import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadChange } from "../src/core/domain/change.js";
import { verifyProject, checkChangeReadiness } from "../src/core/services/change-verifier.js";

function makeChangeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-change-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

const VALID_CHANGE = {
  "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nGeneral\n\n## Objective\n\nDo the thing.\n",
  "spec.md": "# Specification\n\n## Goal\n\nDo the thing.\n",
  "tasks.md": "# Tasks\n\n- [x] Everything done.\n",
  "evidence.md": "# Evidence\n\n## Summary\n\nReal work happened.\n"
};

test("loadChange: a valid Change has no missing/empty files, is not closed, no placeholder, no open tasks", () => {
  const dir = makeChangeDir(VALID_CHANGE);
  const change = loadChange(dir);
  assert.deepEqual(change.missing, []);
  assert.deepEqual(change.empty, []);
  assert.equal(change.closed, false);
  assert.equal(change.type, "general");
  assert.equal(change.evidencePlaceholder, false);
  assert.equal(change.openTasksCount, 0);
  assert.equal(checkChangeReadiness(change).length, 0);
});

test("loadChange: missing spec.md is reported and fails verifyProject", () => {
  const { "spec.md": _omit, ...withoutSpec } = VALID_CHANGE;
  const dir = makeChangeDir(withoutSpec);
  const change = loadChange(dir);
  assert.deepEqual(change.missing, ["spec.md"]);
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(dir) });
  assert.equal(report.passed, false);
  assert.ok(report.errors.some((e) => e.includes("spec.md missing")));
});

test("loadChange: missing evidence.md is reported as missing, not as placeholder", () => {
  const dir = makeChangeDir(VALID_CHANGE);
  fs.rmSync(path.join(dir, "evidence.md"));
  const change = loadChange(dir);
  assert.deepEqual(change.missing, ["evidence.md"]);
  assert.equal(change.evidencePlaceholder, false);
  const readiness = checkChangeReadiness(change);
  assert.ok(readiness.includes("evidence.md is missing"));
});

test("loadChange: placeholder evidence.md is detected and surfaced by both verify and close", () => {
  const dir = makeChangeDir({
    ...VALID_CHANGE,
    "evidence.md": "# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n"
  });
  const change = loadChange(dir);
  assert.equal(change.evidencePlaceholder, true);
  assert.ok(checkChangeReadiness(change).includes("evidence.md has not been completed yet"));
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(dir) });
  assert.equal(report.passed, true, "an open Change with placeholder evidence still passes verify (in-progress, not a failure)");
  assert.ok(report.lines.some((l) => l.level === "info" && l.text.includes("in progress")));
});

test("loadChange: pending tasks are counted and surfaced by close's readiness check", () => {
  const dir = makeChangeDir({ ...VALID_CHANGE, "tasks.md": "# Tasks\n\n- [ ] One.\n- [ ] Two.\n- [x] Done.\n" });
  const change = loadChange(dir);
  assert.equal(change.openTasksCount, 2);
  assert.ok(checkChangeReadiness(change).includes("2 unchecked task(s) in tasks.md"));
});

test("Discovery/Enrichment rules: an Enrichment Change missing its required sections fails verifyProject with specific problems", () => {
  const dir = makeChangeDir({
    "change.md": "# Change\n\n## ID\n\n`0002-jira-issue-1`\n\n## Type\n\nEnrichment\n\n## Objective\n\nEnrich.\n",
    "spec.md": "# Specification\n\n## Goal\n\nUnknown.\n",
    "tasks.md": "# Tasks\n\n- [ ] Review.\n",
    "evidence.md": "# Evidence\n\n## Summary\n\nRetrieved.\n"
  });
  const change = loadChange(dir);
  assert.equal(change.type, "enrichment");
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(dir) });
  assert.equal(report.passed, false);
  assert.ok(report.errors.some((e) => e.includes("missing a Requirement Source section")));
  assert.ok(report.errors.some((e) => e.includes("does not mark the source as read-only")));
  assert.ok(report.errors.some((e) => e.includes("missing an Open Questions section")));
  assert.ok(report.errors.some((e) => e.includes("missing the Requires Human Review status")));
});

test("Discovery/Enrichment rules: a well-formed Enrichment Change passes and does not require README.md", () => {
  const dir = makeChangeDir({
    "change.md": "# Change\n\n## ID\n\n`0002-jira-issue-1`\n\n## Type\n\nEnrichment\n\n## Requirement Source\n\n- **Provider:** jira\n- **Read-only:** yes\n\n## Review Status\n\nRequires Human Review\n",
    "spec.md": "# Specification\n\n## Open Questions\n\n- None.\n",
    "tasks.md": "# Tasks\n\n- [ ] Human review.\n",
    "evidence.md": "# Evidence\n\n## Summary\n\nRetrieved.\n"
  });
  const change = loadChange(dir);
  const report = verifyProject({ hasReadme: false, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(dir) });
  assert.equal(report.passed, true);
  assert.ok(report.lines.some((l) => l.level === "info" && l.text.includes("README.md: not required yet")));
});

test("close's readiness (checkChangeReadiness) combines every problem type without a second implementation", () => {
  const dir = makeChangeDir({
    "change.md": VALID_CHANGE["change.md"],
    "tasks.md": "# Tasks\n\n- [ ] Pending.\n",
    "evidence.md": "# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n"
  });
  const change = loadChange(dir);
  const problems = checkChangeReadiness(change);
  assert.deepEqual(problems, ["spec.md is missing", "evidence.md has not been completed yet", "1 unchecked task(s) in tasks.md"]);
});
