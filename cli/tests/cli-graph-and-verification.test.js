import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput, declareDependsOn } from "./helpers/cli-runner.js";

// --- Change 0058/ADR-028: Change dependency Graph ---

test("status/verify: with no dependsOn anywhere, output is byte-identical to the pre-Change-0058 baseline", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-baseline"]);
  const statusOut = aief(dir, ["status"]).out;
  assert.doesNotMatch(statusOut, /\nDependency Graph:/);
  const verifyOut = aief(dir, ["verify", "--change", "0001-graph-baseline"]).out;
  assert.doesNotMatch(verifyOut, /Dependency Graph issues/);
  const verifyWholeOut = aief(dir, ["verify"]).out;
  assert.doesNotMatch(verifyWholeOut, /Dependency Graph/);
});

test("doctor: is completely unaffected by dependsOn (default and --verbose)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-doctor"]);
  declareDependsOn(path.join(dir, "changes", "0001-graph-doctor"), []);
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /Dependency Graph|Graph:/);
  assert.doesNotMatch(verbose.out, /Dependency Graph|\nGraph:/);
});

test("status overview: a Dependency Graph section appears only when at least one Change declares dependsOn, listing dependencies and issues", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  declareDependsOn(path.join(dir, "changes", "0002-add-login"), ["0001-user-model", "0099-ghost"]);
  const { out, status } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /\nDependency Graph: 1 Change\(s\) declare dependencies/);
  // Only the real, resolved edge is listed as a dependency — the missing
  // one never creates an edge (R6), it only ever appears under Issues.
  assert.match(out, /- 0002-add-login depends on: 0001-user-model$/m);
  assert.match(out, /Issues:/);
  assert.match(out, /missing_dependency: "0002-add-login" depends on "0099-ghost", which does not exist/);
});

test("status --graph: renders every Change as a node, including ones without dependencies, plus edges and topological order", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  declareDependsOn(path.join(dir, "changes", "0002-add-login"), ["0001-user-model"]);
  const { out, status } = aief(dir, ["status", "--graph"]);
  assert.equal(status, 0);
  assert.match(out, /Nodes: 2/);
  assert.match(out, /Edges: 1/);
  assert.match(out, /- 0002-add-login -> 0001-user-model/);
  assert.match(out, /Topological order \(dependencies first\):\n {2}0001-user-model, 0002-add-login/);
  assert.match(out, /Issues: none/);
});

test("status --graph: a cycle is reported, topological order is explicitly unavailable", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "a-thing"]);
  aief(dir, ["new-change", "b-thing"]);
  declareDependsOn(path.join(dir, "changes", "0001-a-thing"), ["0002-b-thing"]);
  declareDependsOn(path.join(dir, "changes", "0002-b-thing"), ["0001-a-thing"]);
  const { out, status } = aief(dir, ["status", "--graph"]);
  assert.equal(status, 0);
  assert.match(out, /Topological order: unavailable — dependency cycle among: 0001-a-thing, 0002-b-thing/);
  assert.match(out, /- cycle: dependency cycle among: 0001-a-thing, 0002-b-thing/);
});

test("verify --change: prints a non-blocking Dependency Graph issue note for the targeted Change, never affecting PASS/FAIL or exit code", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-verify-thing"]);
  declareDependsOn(path.join(dir, "changes", "0001-graph-verify-thing"), ["0099-ghost"]);
  const { out, status } = aief(dir, ["verify", "--change", "0001-graph-verify-thing"]);
  assert.equal(status, 0, "Structural Verification still PASSes — a missing dependency never blocks");
  assert.match(out, /Result: PASS/);
  assert.match(out, /Dependency Graph issues for this Change \(non-blocking\):/);
  assert.match(out, /- missing_dependency: "0001-graph-verify-thing" depends on "0099-ghost", which does not exist/);
});

test("verify --change: no Dependency Graph note when the targeted Change has no issues", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  declareDependsOn(path.join(dir, "changes", "0002-add-login"), ["0001-user-model"]);
  const { out } = aief(dir, ["verify", "--change", "0002-add-login"]);
  assert.doesNotMatch(out, /Dependency Graph issues/);
});

test("verify --change: a self-dependency issue is reported for the offending Change, never crashes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "self-thing"]);
  declareDependsOn(path.join(dir, "changes", "0001-self-thing"), ["0001-self-thing"]);
  const { out, status } = aief(dir, ["verify", "--change", "0001-self-thing"]);
  assert.equal(status, 0);
  assert.match(out, /- self_dependency: "0001-self-thing" depends on itself/);
});

// --- Entrega 7 (Change 0049, ADR-021) — Verification Engine, `verify` integration ---

// --- F7/H4: unknown CLI options are rejected explicitly (Change 0077) ----

test("verify --verboes (unknown flag) fails explicitly instead of running as plain verify", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { status, out } = aief(dir, ["verify", "--verboes"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
});

test("doctor --verbos (unknown flag) fails explicitly instead of silently running non-verbose doctor", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["doctor", "--verbos"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
});

test("status --nex (unknown flag) fails explicitly instead of silently running plain status", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { status, out } = aief(dir, ["status", "--nex"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
});

test("new-change --typ enrichment (unknown flag) fails explicitly, no Change is created", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["new-change", "--typ", "enrichment", "a thing"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
  assert.ok(!fs.existsSync(path.join(dir, "changes")), "no changes/ directory should be created on a rejected invocation");
});

test("close --yess (unknown flag) fails explicitly instead of silently behaving like a dry run", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "yess-thing"]);
  const changeDir = path.join(dir, "changes", "0001-yess-thing");
  const before = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  const { status, out } = aief(dir, ["close", "--yess", "--change", "0001-yess-thing"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
  assert.equal(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), before, "close --yess must not mutate change.md");
});

test("a genuinely unknown top-level flag on a flag-free command (analyze --bogus) fails explicitly", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { status, out } = aief(dir, ["analyze", "--bogus"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
});

// --- Change 0083: aief verify --strict ---

test("default aief verify is unaffected by an objectively incomplete Change (backward compatible)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "untouched thing"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 0, "an untouched but structurally valid scaffold still passes default verify");
  assert.doesNotMatch(out, /\[strict\]/);
});

test("aief verify --strict flags an untouched scaffold that default verify accepts", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "untouched thing"]);
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.equal(status, 1);
  assert.match(out, /\[strict\] change.md Success Criteria is still the scaffold placeholder/);
  assert.match(out, /\[strict\] spec.md Requirements is empty/);
  assert.match(out, /\[strict\] spec.md Acceptance Criteria is empty/);
  assert.match(out, /Result: FAIL/);
});

test("aief verify --strict --change <id> scopes strict checking to one Change", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "untouched thing"]);
  const { status, out } = aief(dir, ["verify", "--change", "0001-untouched-thing", "--strict"]);
  assert.equal(status, 1);
  assert.match(out, /\[strict\]/);
});

test("aief verify --strict passes once the placeholder content is filled in", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "filled thing"]);
  const changeDir = path.join(dir, "changes", "0001-filled-thing");
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd.replace("### In scope\n\n-", "### In scope\n\n- Real scope.").replace("### Out of scope\n\n-", "### Out of scope\n\n- Real exclusion.").replace("## Success Criteria\n\n-", "## Success Criteria\n\n- Real, verifiable outcome.");
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  let specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  specMd = specMd.replace("## Requirements\n\n-", "## Requirements\n\n- Real requirement.").replace("## Acceptance Criteria\n\n- [ ]", "## Acceptance Criteria\n\n- [ ] Real, checkable criterion.");
  fs.writeFileSync(path.join(changeDir, "spec.md"), specMd, "utf8");
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /\[strict\]/);
});

test("aief verify --strict on a Definition Change flags a Decisions Required entry with no recorded Decision (human) outcome", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "define architecture", "--type", "definition"]);
  const changeDir = path.join(dir, "changes", "0001-define-architecture");
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd.replace("## Decisions Required\n\n-", "## Decisions Required\n\n- Multi-tenancy model.");
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.equal(status, 1);
  assert.match(out, /\[strict\] Decisions Required has content but Decision \(human\) records no outcome yet/);
});

test("aief verify --strict flags an unresolved required human decision", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "define architecture", "--type", "definition"]);
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.equal(status, 1);
  assert.match(out, /\[strict\] unresolved required human decision: Review and approve, amend or reject each Recommendation in change\.md\./);
});

test("aief verify --strict --change <id> on an unknown option is still rejected explicitly (Change 0077 regression)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { status, out } = aief(dir, ["verify", "--strikt"]);
  assert.equal(status, 1);
  assert.match(out, /unknown option|Unknown option/i);
});

test("valid flags still work after the parser migration: status --next --graph, verify --change, new-change --type; --requirements is gone (ADR-038)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const nc = aief(dir, ["new-change", "--type", "analysis", "typed thing"]);
  assert.equal(nc.status, 0);
  assert.match(nc.out, /Created Change/);
  assert.equal(aief(dir, ["status", "--next"]).status, 0);
  assert.equal(aief(dir, ["status", "--graph"]).status, 0);
  assert.equal(aief(dir, ["verify", "--change", "0001-typed-thing"]).status, 0);
  assert.notEqual(aief(dir, ["verify", "--change", "0001-typed-thing", "--requirements"]).status, 0);
});

// Change 0135 (external-audit finding C0130-F2): two Changes scaffolded on
// separate branches can allocate the same numeric id before either merges —
// live during this project's own work, Changes 0122 and 0123 each did.
// `aief verify` now names the collision, non-blockingly.
test("verify: two Changes sharing a numeric ID are reported non-blockingly", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "first-thing"]);
  const secondDir = path.join(dir, "changes", "0001-second-thing");
  fs.mkdirSync(secondDir);
  for (const f of ["change.md", "spec.md", "tasks.md", "evidence.md"]) fs.writeFileSync(path.join(secondDir, f), "# x\n", "utf8");

  const { out, status } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.match(out, /\nResult: PASS/, "a numeric-id collision never fails verify's exit code");
  assert.match(out, /Changes sharing a numeric ID \(non-blocking\):/);
  assert.match(out, /- 0001: 0001-first-thing, 0001-second-thing — a bare "--change 0001" reference is ambiguous; use the full basename\./);
});

test("verify: no collision line at all when every Change has a unique numeric id", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "only-thing"]);
  const { out } = aief(dir, ["verify"]);
  assert.doesNotMatch(out, /sharing a numeric ID/);
});

// Change 0137: the same collision, surfaced from `aief status` too — a
// human sees it without having to separately run `aief verify`.
test("status: two Changes sharing a numeric ID are reported in the overview", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "first-thing"]);
  const secondDir = path.join(dir, "changes", "0001-second-thing");
  fs.mkdirSync(secondDir);
  for (const f of ["change.md", "spec.md", "tasks.md", "evidence.md"]) fs.writeFileSync(path.join(secondDir, f), "# x\n", "utf8");

  const { out, status } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /Changes sharing a numeric ID: 1/);
  assert.match(out, /- 0001: 0001-first-thing, 0001-second-thing — a bare "--change 0001" reference is ambiguous; use the full basename\./);
});

test("status: no collision line at all when every Change has a unique numeric id", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "only-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.doesNotMatch(out, /sharing a numeric ID/);
});

test("--help / help / --version output is unaffected by the parser migration", () => {
  const dir = makeProject();
  const help1 = aief(dir, ["--help"]);
  const help2 = aief(dir, ["help"]);
  const version = aief(dir, ["--version"]);
  assert.equal(help1.status, 0);
  assert.equal(help1.out, help2.out);
  assert.equal(version.status, 0);
  assert.match(version.out, /^aief \d+\.\d+\.\d+/);
});

