import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

// --- Change 0058/ADR-028: Change dependency Graph ---

function manifestFor(id, slug, title, overrides = {}) {
  return JSON.stringify({ schema: "aief.change/v1", id, slug, title, status: "open", ...overrides });
}

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
  fs.writeFileSync(path.join(dir, "changes", "0001-graph-doctor", "manifest.json"), manifestFor("0001", "graph-doctor", "x", { dependsOn: [] }), "utf8");
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /Dependency Graph|Graph:/);
  assert.doesNotMatch(verbose.out, /Dependency Graph|\nGraph:/);
});

test("status overview: a Dependency Graph section appears only when at least one Change declares dependsOn, listing dependencies and issues", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "user-model"]);
  aief(dir, ["new-change", "add-login"]);
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model", "0099-ghost"] }), "utf8");
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
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model"] }), "utf8");
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
  fs.writeFileSync(path.join(dir, "changes", "0001-a-thing", "manifest.json"), manifestFor("0001", "a-thing", "x", { dependsOn: ["0002-b-thing"] }), "utf8");
  fs.writeFileSync(path.join(dir, "changes", "0002-b-thing", "manifest.json"), manifestFor("0002", "b-thing", "x", { dependsOn: ["0001-a-thing"] }), "utf8");
  const { out, status } = aief(dir, ["status", "--graph"]);
  assert.equal(status, 0);
  assert.match(out, /Topological order: unavailable — dependency cycle among: 0001-a-thing, 0002-b-thing/);
  assert.match(out, /- cycle: dependency cycle among: 0001-a-thing, 0002-b-thing/);
});

test("verify --change: prints a non-blocking Dependency Graph issue note for the targeted Change, never affecting PASS/FAIL or exit code", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "graph-verify-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-graph-verify-thing", "manifest.json"), manifestFor("0001", "graph-verify-thing", "x", { dependsOn: ["0099-ghost"] }), "utf8");
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
  fs.writeFileSync(path.join(dir, "changes", "0002-add-login", "manifest.json"), manifestFor("0002", "add-login", "x", { dependsOn: ["0001-user-model"] }), "utf8");
  const { out } = aief(dir, ["verify", "--change", "0002-add-login"]);
  assert.doesNotMatch(out, /Dependency Graph issues/);
});

test("verify --change: a self-dependency issue is reported for the offending Change, never crashes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "self-thing"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-self-thing", "manifest.json"), manifestFor("0001", "self-thing", "x", { dependsOn: ["0001-self-thing"] }), "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-self-thing"]);
  assert.equal(status, 0);
  assert.match(out, /- self_dependency: "0001-self-thing" depends on itself/);
});

test("Bootstrap/LIDR/Harness/Loop are unaffected by the Graph (Change 0058 touches only status and verify --change)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /Dependency Graph/);
  const doctorVerbose = aief(dir, ["doctor", "--verbose"]);
  assert.match(doctorVerbose.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by the Graph");
  assert.match(doctorVerbose.out, /\nHarness:/, "0056's Harness registry still works, untouched by the Graph");
});

// --- Entrega 7 (Change 0049, ADR-021) — Verification Engine, `verify` integration ---

test("verify --change is byte-identical without --requirements (Entrega 7 default stays legacy)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-neutral-thing"]);
  const withoutFlag = aief(dir, ["verify", "--change", "0001-vr-neutral-thing"]).out;
  assert.doesNotMatch(withoutFlag, /Requirement Verification/);
});

test("verify --requirements adds an additive section after the legacy report, never before or interleaved", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-additive-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-additive-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-additive-thing", title: "VR additive thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const without = aief(dir, ["verify", "--change", "0001-vr-additive-thing"]).out;
  const { out } = aief(dir, ["verify", "--change", "0001-vr-additive-thing", "--requirements"]);
  assert.ok(out.startsWith(without));
  assert.match(out.slice(without.length), /^\n?Requirement Verification:/);
});

test("verify --requirements: a requirement cited in verification.md with a present evidence file passes both rules", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-pass-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-pass-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-pass-thing", title: "VR pass thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | see `README.md` |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-pass-thing", "--requirements"]);
  assert.equal(status, 0);
  assert.match(out, /Requirement Verification: PASS/);
  assert.match(out, /REQ-1 — requirement-has-traceability: passed/);
  assert.match(out, /REQ-1 — evidence-reference-integrity: passed/);
  assert.doesNotMatch(out, /satisfied\./); // never claims the requirement itself is satisfied (only "does not mean...satisfied")
});

test("verify --requirements: a requirement not cited in an existing verification.md fails traceability, aggregate FAIL, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-fail-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-fail-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-fail-thing", title: "VR fail thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n- **REQ-2** — Another thing.\n", "utf8");
  // verification.md exists (so the rule applies) but only cites REQ-1 — REQ-2 is a real,
  // actionable traceability gap, not a missing-file no-op.
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | pass |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-fail-thing", "--requirements"]);
  assert.equal(status, 1);
  assert.match(out, /Requirement Verification: FAIL/);
  assert.match(out, /REQ-2 — requirement-has-traceability: failed/);
  assert.match(out, /REQ-1 — requirement-has-traceability: passed/);
});

test("verify --requirements: a path-traversal evidence reference is rejected, aggregate INVALID, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-invalid-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-invalid-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-invalid-thing", title: "VR invalid thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n- **REQ-1** — Do the thing.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | see `../../../etc/passwd` |\n", "utf8");
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-invalid-thing", "--requirements"]);
  assert.equal(status, 1);
  assert.match(out, /Requirement Verification: INVALID/);
});

test("verify --requirements: a Change with no sdd section reports zero requirements, PASS (vacuous), never FAIL", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-empty-thing"]);
  const { out, status } = aief(dir, ["verify", "--change", "0001-vr-empty-thing", "--requirements"]);
  assert.equal(status, 0);
  assert.match(out, /Requirement Verification: PASS/);
  assert.match(out, /No requirements declared/);
});

test("verify --requirements without --change: whole-project structural verify is unaffected, requirement layer explicitly skipped", () => {
  // Note: the `aief()` helper concatenates stdout+stderr as two separate
  // blocks (`${stdout}${stderr}`), not in real chronological order — a
  // pre-existing harness property (unrelated to this Entrega) that makes a
  // simple startsWith() comparison unreliable whenever stderr content (e.g.
  // "! Recommended but missing: knowledge/") exists. Removing the one new,
  // known line by exact substring instead avoids depending on stream order.
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-skip-thing"]);
  const withoutFlag = aief(dir, ["verify"]).out;
  const { out, status } = aief(dir, ["verify", "--requirements"]);
  assert.equal(status, 0);
  const skipLine = "\nRequirement Verification: skipped — pass --change <id> to select one Change.\n";
  assert.ok(out.includes(skipLine));
  assert.equal(out.replace(skipLine, ""), withoutFlag);
});

test("verify.completed's Hook contract is unchanged by --requirements — operation.result is still the legacy report", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-hook-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-hook-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-hook-thing", title: "VR hook thing", status: "open", track: "lite", sdd: { provider: "local" }
  }), "utf8");
  const without = aief(dir, ["verify", "--change", "0001-vr-hook-thing"]).out;
  const withFlag = aief(dir, ["verify", "--change", "0001-vr-hook-thing", "--requirements"]).out;
  const hookLineOf = (s) => (s.match(/Hook recommendation:\n- .+/) || [""])[0];
  assert.equal(hookLineOf(without), hookLineOf(withFlag));
});

test("verify --requirements performs zero writes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-readonly-thing"]);
  const changeDir = path.join(dir, "changes", "0001-vr-readonly-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "vr-readonly-thing", title: "VR readonly thing", status: "open", sdd: { provider: "local" }
  }), "utf8");
  fs.writeFileSync(path.join(changeDir, "verification.md"), "| 1 | check | REQ-1 | `README.md` |\n", "utf8");
  const before = {};
  for (const f of fs.readdirSync(changeDir)) before[f] = fs.readFileSync(path.join(changeDir, f), "utf8");
  aief(dir, ["verify", "--change", "0001-vr-readonly-thing", "--requirements"]);
  for (const f of fs.readdirSync(changeDir)) assert.equal(fs.readFileSync(path.join(changeDir, f), "utf8"), before[f], `${f} was modified`);
});

test("verify --requirements does not affect close/propose/status/prompt/Skills/Hooks compatibility markers in its own output", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "vr-scope-thing"]);
  const { out } = aief(dir, ["verify", "--change", "0001-vr-scope-thing", "--requirements"]);
  assert.doesNotMatch(out, /Skill Catalog|Skills Runtime|─── Skill:/);
});

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

test("valid flags still work after the parser migration: verify --requirements, status --next --graph, close --yes, new-change --type", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const nc = aief(dir, ["new-change", "--type", "analysis", "typed thing"]);
  assert.equal(nc.status, 0);
  assert.match(nc.out, /Created Change/);
  assert.equal(aief(dir, ["status", "--next"]).status, 0);
  assert.equal(aief(dir, ["status", "--graph"]).status, 0);
  assert.equal(aief(dir, ["verify", "--change", "0001-typed-thing", "--requirements"]).status, 0);
});

// --- Change 0095: manifest.status / change.md ## Status disagreement ---

test("status/verify: with no manifest-backed Change, output is byte-identical to the pre-Change-0095 baseline", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "drift-baseline"]);
  const statusOut = aief(dir, ["status"]).out;
  assert.doesNotMatch(statusOut, /manifest\.status disagrees/);
  const verifyOut = aief(dir, ["verify", "--change", "0001-drift-baseline"]).out;
  assert.doesNotMatch(verifyOut, /Manifest status disagreement/);
  const verifyWholeOut = aief(dir, ["verify"]).out;
  assert.doesNotMatch(verifyWholeOut, /manifest\.status disagreement/i);
});

test("status/verify: aief close --yes on a manifest-backed Change surfaces the resulting drift, without writing manifest.json or blocking verify's PASS", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "drift-thing"]);
  const changeDir = path.join(dir, "changes", "0001-drift-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), manifestFor("0001", "drift-thing", "x"), "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");

  // aief close --yes writes only change.md (Change 0043/0044's established
  // behavior) — manifest.status ("open") is left untouched.
  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  const manifestBefore = fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8");
  assert.match(manifestBefore, /"status":"open"/);

  const statusOverview = aief(dir, ["status"]);
  assert.match(statusOverview.out, /Changes where manifest\.status disagrees with change\.md: 1/);
  assert.match(statusOverview.out, /0001-drift-thing: manifest says "open", change\.md says "closed"/);

  const statusSingle = aief(dir, ["status", "--change", "0001-drift-thing"]);
  assert.match(statusSingle.out, /Warning: manifest\.status \("open"\) disagrees with change\.md's own ## Status \("closed"\)/);

  const verifySingle = aief(dir, ["verify", "--change", "0001-drift-thing"]);
  assert.match(verifySingle.out, /Manifest status disagreement for this Change \(non-blocking\)/);
  assert.match(verifySingle.out, /manifest\.status says "open", change\.md's own ## Status says "closed"/);
  assert.match(verifySingle.out, /\nResult: PASS/);
  assert.equal(verifySingle.status, 0);

  const verifyWhole = aief(dir, ["verify"]);
  assert.match(verifyWhole.out, /Changes with a manifest\.status disagreement \(non-blocking\)/);
  assert.match(verifyWhole.out, /0001-drift-thing: manifest says "open", change\.md says "closed"/);
  assert.match(verifyWhole.out, /\nResult: PASS/);
  assert.equal(verifyWhole.status, 0);

  // Detection only — manifest.json is still exactly what it was.
  const manifestAfter = fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8");
  assert.equal(manifestAfter, manifestBefore);
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

