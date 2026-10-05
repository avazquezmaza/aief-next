import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { inspectAgents, agentsTemplate } from "../src/core/domain/agents-file.js";
import { classifyShipped, sha256 } from "../src/core/domain/shipped-file.js";
import { SKILL_TARGETS, skillTemplate } from "../src/core/domain/assistant-skill.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0160: `aief update` refreshes AGENTS.md and installed aief-change
// skills that are unmodified older AIEF versions; edited files are never
// touched and missing ones are not created.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OLD_AGENTS = fs.readFileSync(path.join(HERE, "fixtures", "AGENTS-3.5.0.md"), "utf8");
const OLD_SKILL = fs.readFileSync(path.join(HERE, "fixtures", "aief-change-skill-1.1.0.md"), "utf8");

test("classifyShipped: missing, current, shipped-older, modified", () => {
  const known = new Set([sha256("old")]);
  assert.equal(classifyShipped(null, "t", known), "missing");
  assert.equal(classifyShipped("t", "t", known), "current");
  assert.equal(classifyShipped("old", "t", known), "shipped-older");
  assert.equal(classifyShipped("other", "t", known), "modified");
});

test("inspectAgents recognizes the AGENTS.md shipped in 3.5.0 as unmodified, an edit as modified", () => {
  assert.equal(inspectAgents(makeProject({ "AGENTS.md": OLD_AGENTS })).state, "shipped-older");
  assert.equal(inspectAgents(makeProject({ "AGENTS.md": agentsTemplate() })).state, "current");
  assert.equal(inspectAgents(makeProject({ "AGENTS.md": `${OLD_AGENTS}\n## Our rule\n` })).state, "modified");
});

test("aief update refreshes an unmodified old AGENTS.md and an old installed skill", () => {
  const dir = makeProject({ "AGENTS.md": OLD_AGENTS, [SKILL_TARGETS.kiro]: OLD_SKILL });
  const { status, out } = aief(dir, ["update"]);
  assert.equal(status, 0);
  assert.match(out, /✓ Updated AGENTS\.md/);
  assert.match(out, /✓ Updated \.kiro\/skills\/aief-change\/SKILL\.md/);
  assert.equal(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8"), agentsTemplate());
  assert.equal(fs.readFileSync(path.join(dir, SKILL_TARGETS.kiro), "utf8"), skillTemplate());
  assert.match(out, /skill not installed for: claude, codex/);
});

test("aief update never touches an edited file and never creates a missing one", () => {
  const edited = `${OLD_AGENTS}\n## Team rule\n\nRun the linter.\n`;
  const dir = makeProject({ "AGENTS.md": edited });
  const { status, out } = aief(dir, ["update"]);
  assert.equal(status, 0);
  assert.match(out, /! AGENTS\.md was edited — left as is/);
  assert.equal(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8"), edited);
  for (const target of Object.values(SKILL_TARGETS)) assert.equal(fs.existsSync(path.join(dir, target)), false);

  const empty = makeProject();
  assert.match(aief(empty, ["update"]).out, /○ AGENTS\.md is missing — run aief bootstrap/);
  assert.equal(fs.existsSync(path.join(empty, "AGENTS.md")), false);
});

test("aief update is idempotent", () => {
  const dir = makeProject({ "AGENTS.md": OLD_AGENTS });
  aief(dir, ["update"]);
  const again = aief(dir, ["update"]).out;
  assert.match(again, /✓ AGENTS\.md is up to date/);
  assert.doesNotMatch(again, /Updated/);
});

test("doctor reports an old unmodified AGENTS.md and points to aief update", () => {
  const out = aief(makeProject({ "AGENTS.md": OLD_AGENTS }), ["doctor"]).out;
  assert.match(out, /AIEF-shipped files:\n! AGENTS\.md is an older AIEF version — run: aief update/);
  assert.match(aief(makeProject({ "AGENTS.md": agentsTemplate() }), ["doctor"]).out, /✓ AGENTS\.md \(current\)/);
});

test("every AGENTS.md this repository ever shipped is known to aief update", () => {
  const known = JSON.parse(fs.readFileSync(path.join(HERE, "..", "templates", "agents", "previous-versions.json"), "utf8")).sha256;
  assert.ok(known.length >= 10, `only ${known.length} known versions`);
  assert.equal(inspectAgents(makeProject({ "AGENTS.md": OLD_AGENTS })).state, "shipped-older");
});
