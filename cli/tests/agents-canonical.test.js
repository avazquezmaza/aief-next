// Change 0040 — AGENTS.md canonical source.
//
// Guards that (a) the repo-root AGENTS.md never drifts from the canonical
// template the CLI ships, and (b) `aief adopt` delivers that exact canonical
// file to every adopted project — with the human/review gates and the
// assistant-file pointer that the old inline 14-line stub omitted.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin", "aief.js");
const CANONICAL = path.join(HERE, "..", "templates", "agents", "AGENTS.md");
const ROOT_AGENTS = path.join(HERE, "..", "..", "AGENTS.md");

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-agents-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}
function aief(cwd, args, env = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

// Every normative rule that MUST reach an adopted project. Absence of any one
// is the Change 0040 bug (adopters got 7 of ~40). Each string is a distinct rule.
const CANONICAL_RULES = [
  "AI assists. Humans decide.",
  "Never treat AI output as automatically approved",
  "The human owner is responsible for final decisions",
  "Do not invent requirements.",
  "Ask when requirements are ambiguous.",
  "Do not modify unrelated files.",
  "Update documentation when behavior changes.",
  "Prefer simple solutions over clever ones.",
  "Do not implement without a specification.",
  "(human) Human-only approval",
  "(review) Independent review",
  "Both stay blocking for `aief close`",
  "## Required Completion Checklist",
  "## Coding Guidance",
  "## Documentation Guidance",
  "## Evidence Guidance",
  "## Human Responsibilities",
  "release readiness",
  "CLAUDE.md",
  "GEMINI.md",
  "CODEX.md",
  "CURSOR.md",
];

test("root AGENTS.md is byte-identical to the canonical template", () => {
  const root = fs.readFileSync(ROOT_AGENTS, "utf8");
  const canonical = fs.readFileSync(CANONICAL, "utf8");
  assert.equal(root, canonical, "repo-root AGENTS.md has drifted from cli/templates/agents/AGENTS.md");
});

test("aief adopt writes AGENTS.md byte-identical to the canonical", () => {
  const dir = makeProject({ "package.json": '{"name":"x"}' });
  aief(dir, ["adopt"]);
  const generated = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const canonical = fs.readFileSync(CANONICAL, "utf8");
  assert.equal(generated, canonical, "adopt produced an AGENTS.md that differs from the canonical");
});

test("adopted AGENTS.md contains 100% of the canonical normative rules", () => {
  const dir = makeProject({ "package.json": '{"name":"x"}' });
  aief(dir, ["adopt"]);
  const generated = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const rule of CANONICAL_RULES) {
    assert.ok(generated.includes(rule), `adopted AGENTS.md is missing the rule: "${rule}"`);
  }
});

test("adopted AGENTS.md carries the human and review gates the old stub omitted", () => {
  const dir = makeProject({ "package.json": '{"name":"x"}' });
  aief(dir, ["adopt"]);
  const generated = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  assert.match(generated, /\(human\)/, "missing (human) gate");
  assert.match(generated, /\(review\)/, "missing (review) gate");
  assert.match(generated, /aief close/, "missing the close-blocking consequence");
});

test("adopted AGENTS.md keeps the assistant-file pointer (the rule only the stub had)", () => {
  const dir = makeProject({ "package.json": '{"name":"x"}' });
  aief(dir, ["adopt"]);
  const generated = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const f of ["CLAUDE.md", "GEMINI.md", "CODEX.md", "CURSOR.md"]) {
    assert.ok(generated.includes(f), `assistant pointer lost: ${f}`);
  }
});

test("adopt never overwrites an existing AGENTS.md (idempotence, ADR-005)", () => {
  const custom = "# My own rules\n\nKeep these.\n";
  const dir = makeProject({ "package.json": '{"name":"x"}', "AGENTS.md": custom });
  aief(dir, ["adopt"]);
  assert.equal(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8"), custom, "adopt overwrote a user's AGENTS.md");
});

test("no adoption path produces a divergent AGENTS.md (adopt vs init are the same)", () => {
  const a = makeProject({ "package.json": '{"name":"x"}' });
  aief(a, ["adopt"]);
  const b = makeProject({ "package.json": '{"name":"x"}' });
  aief(b, ["init"]);
  assert.equal(
    fs.readFileSync(path.join(a, "AGENTS.md"), "utf8"),
    fs.readFileSync(path.join(b, "AGENTS.md"), "utf8"),
    "adopt and init produced different AGENTS.md"
  );
});
