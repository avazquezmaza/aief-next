import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { normalizeChangeType, changeTypeFromContent, CHANGE_TYPES } from "../src/core/domain/change.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0161: `## Type` is a closed list; the first word decides, case and
// accents ignored, Spanish aliases accepted, unknown values are a
// `verify --strict` notice.

test("the closed list", () => {
  assert.deepEqual(CHANGE_TYPES, ["general", "analysis", "definition", "enrichment", "fix", "feature", "documentation"]);
});

test("normalizeChangeType: first word, case and accents ignored, aliases mapped", () => {
  const cases = {
    "Definition": ["definition", true],
    "Definición": ["definition", true],
    "ANÁLISIS": ["analysis", true],
    "General (consolidation — no new subsystem)": ["general", true],
    "Documentation (handoff package)": ["documentation", true],
    "Implementation": ["general", true],
    "Corrección": ["fix", true],
    "Build": ["build", false],
    "Research → Implementation": ["research", false],
    "": ["", true]
  };
  for (const [raw, [type, recognized]] of Object.entries(cases)) {
    assert.deepEqual(normalizeChangeType(raw), { type, recognized }, raw);
  }
});

test("changeTypeFromContent reads ## Type and normalizes it", () => {
  assert.equal(changeTypeFromContent("# Change\n\n## Type\n\nDefinición\n"), "definition");
  assert.equal(changeTypeFromContent("# Change\n\n## Objective\n\nx\n"), "");
});

function projectWithType(type) {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing", "--no-branch"]);
  const file = path.join(dir, "changes", "0001-thing", "change.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/## Type\n\n[^\n]+/, `## Type\n\n${type}`), "utf8");
  return dir;
}

test("a Change typed «Definición» gets the Definition guards in aief prompt", () => {
  const out = aief(projectWithType("Definición"), ["prompt", "--change", "0001-thing"]).out;
  assert.match(out, /This is a Definition Change \(pre-implementation\)/);
  assert.match(out, /Do not implement application code/);
});

test("verify --strict notes an unknown Type without failing, and is silent for a known one", () => {
  const unknown = aief(projectWithType("Build"), ["verify", "--strict"]).out;
  assert.match(unknown, /! changes\/0001-thing: \[strict\] Type "Build" is not a known value — use one of: General, Analysis, Definition, Enrichment, Fix, Feature, Documentation/);
  assert.doesNotMatch(unknown, /✗ changes\/0001-thing: \[strict\] Type/);
  assert.doesNotMatch(aief(projectWithType("Fix"), ["verify", "--strict"]).out, /is not a known value/);
});
