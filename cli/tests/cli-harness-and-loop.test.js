import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

// --- Change 0056/ADR-026: Harness/Hooks visibility, config, logging ---

function harnessChange(dir, name, manifestOverrides = {}) {
  aief(dir, ["new-change", name]);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const changeDir = fs.readdirSync(path.join(dir, "changes")).find((d) => d.endsWith(slug));
  const full = path.join(dir, "changes", changeDir);
  fs.writeFileSync(path.join(full, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: changeDir.split("-")[0], slug, title: name, status: "open", ...manifestOverrides
  }), "utf8");
  return { changeDir, full };
}

test("doctor (default) has no Harness section, with or without any Change's manifest", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  harnessChange(dir, "harness-doctor-default", { harness: { log: true } });
  const { out } = aief(dir, ["doctor"]);
  assert.doesNotMatch(out, /\nHarness:/);
});

test("doctor --verbose lists both registered Hooks with their events, regardless of any manifest", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { out, status } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /\nHarness:/);
  assert.match(out, /- prompt-skill-suggestion: fires on prompt\.prepared/);
  assert.match(out, /- post-verify-next-action: fires on verify\.completed/);
});

test("status --change has no Harness section when the Change's manifest declares no harness field", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-status-none");
  const { out } = aief(dir, ["status", "--change", changeDir]);
  assert.doesNotMatch(out, /\nHarness:/);
});

test("status --change shows a disabled Hook and active counts when harness is configured", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-status-disabled", {
    harness: { hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] } } }
  });
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /\nHarness: configured \(log off\)/);
  assert.match(out, /prompt\.prepared: 0 active, 1 disabled \(prompt-skill-suggestion\)/);
  assert.match(out, /verify\.completed: 1 active/);
});

test("status --change: an unknown event key in manifest.harness.hooks is a structural manifest error, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-bad-event"]);
  const changeDir = "0001-harness-bad-event";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-bad-event", title: "x", status: "open",
    harness: { hooks: { "some.unknown.event": { disabled: [] } } }
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Manifest: invalid/);
  assert.match(out, /harness\.hooks\.some\.unknown\.event/);
});

test("status --change: an unknown Hook id inside a known event's disabled list is a visible warning, not a crash", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = harnessChange(dir, "harness-unknown-id", {
    harness: { hooks: { "prompt.prepared": { disabled: ["totally-made-up-hook"] } } }
  });
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /Unknown Hook id\(s\)/);
  assert.match(out, /"totally-made-up-hook" \(prompt\.prepared\)/);
  assert.match(out, /prompt\.prepared: 1 active/, "the unknown id never disabled the real, registered Hook");
});

test("prompt: a disabled Hook's result never appears, even when it would otherwise match", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-disabled-prompt"]);
  const changeDir = "0001-harness-disabled-prompt";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-disabled-prompt", title: "x", status: "open", sdd: { provider: "local" },
    harness: { hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] } } }
  }), "utf8");
  const { out, status } = aief(dir, ["prompt", "--change", changeDir]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /─── Hook: prompt-skill-suggestion/);
});

test("prompt/verify: with no harness field, output is byte-identical to the pre-Change-0056 baseline", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-baseline"]);
  const changeDir = "0001-harness-baseline";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-baseline", title: "x", status: "open", sdd: { provider: "local" }
  }), "utf8");
  const prompt = aief(dir, ["prompt", "--change", changeDir]);
  assert.match(prompt.out, /─── Hook: prompt-skill-suggestion ───/, "unaffected: the existing 0048 behavior for a resolved Change still fires");
  assert.ok(!fs.existsSync(path.join(dir, "changes", changeDir, "hooks.md")), "no harness.log means no hooks.md is ever created");
  const verify = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(verify.status, 0);
  assert.doesNotMatch(verify.out, /Hook issues/);
});

test("harness.log: true appends hooks.md with an entry per active (non-disabled) Hook result, including non-matched ones", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-log-thing"]);
  const changeDir = "0001-harness-log-thing";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-log-thing", title: "x", status: "open",
    harness: { log: true }
  }), "utf8");
  aief(dir, ["prompt", "--change", changeDir]);
  const logPath = path.join(dir, "changes", changeDir, "hooks.md");
  assert.ok(fs.existsSync(logPath));
  const content = fs.readFileSync(logPath, "utf8");
  assert.match(content, /# Harness Log/);
  assert.match(content, /## .+ — prompt/);
  assert.match(content, /\| prompt-skill-suggestion \| prompt\.prepared \|/, "logged even without sdd (status not_applicable), not just matched");
  assert.doesNotMatch(content, /API_KEY|SECRET|TOKEN|password/i);
});

test("harness.log: true accumulates across multiple invocations — append, never overwrite", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-log-append"]);
  const changeDir = "0001-harness-log-append";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-log-append", title: "x", status: "open", track: "lite",
    harness: { log: true }
  }), "utf8");
  aief(dir, ["prompt", "--change", changeDir]);
  aief(dir, ["verify", "--change", changeDir]);
  const content = fs.readFileSync(path.join(dir, "changes", changeDir, "hooks.md"), "utf8");
  assert.equal((content.match(/# Harness Log/g) || []).length, 1, "the header is written exactly once");
  assert.equal((content.match(/## .+ — (prompt|verify)/g) || []).length, 2, "each invocation appends its own section");
});

test("verify never writes hooks.md when harness.log is absent, even with a matched Hook", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "harness-no-log"]);
  const changeDir = "0001-harness-no-log";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "harness-no-log", title: "x", status: "open", track: "lite"
  }), "utf8");
  aief(dir, ["verify", "--change", changeDir]);
  assert.ok(!fs.existsSync(path.join(dir, "changes", changeDir, "hooks.md")));
});

test("bootstrap/analyze/LIDR Skills/Standards are unaffected by Harness (Change 0056 touches only doctor/status/prompt/verify)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /Harness/);
  const doctorDefault = aief(dir, ["doctor"]);
  assert.match(doctorDefault.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by Harness");
});

// --- Change 0057/ADR-027: Loop (verify -> feedback -> retry -> final result) ---

function loopChange(dir, name, manifestOverrides = {}) {
  aief(dir, ["new-change", name]);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const changeDir = fs.readdirSync(path.join(dir, "changes")).find((d) => d.endsWith(slug));
  const full = path.join(dir, "changes", changeDir);
  fs.writeFileSync(path.join(full, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: changeDir.split("-")[0], slug, title: name, status: "open", ...manifestOverrides
  }), "utf8");
  return { changeDir, full };
}

test("verify --change: with no loop field, output is byte-identical to the pre-Change-0057 baseline, no loop.md is ever created", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-baseline");
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /\nLoop:/);
  assert.ok(!fs.existsSync(path.join(full, "loop.md")));
});

test("doctor: with no loop field anywhere, default and --verbose output are unaffected", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  loopChange(dir, "loop-doctor-baseline");
  const plain = aief(dir, ["doctor"]);
  const verbose = aief(dir, ["doctor", "--verbose"]);
  assert.doesNotMatch(plain.out, /\nLoop:/);
  assert.doesNotMatch(verbose.out, /\nLoop:/);
});

test("whole-project verify (no --change) is unaffected by any Change's loop config", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  loopChange(dir, "loop-whole-project", { loop: { verify: { maxRetries: 1 } } });
  const { out } = aief(dir, ["verify"]);
  assert.doesNotMatch(out, /\nLoop:/);
});

test("verify --change: a Change configured with loop.verify and failing verification reports attempt 1, retry available, and creates loop.md", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-first-fail", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8"); // force a FAIL (empty required file)
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 1, "Structural Verification's own FAIL exit code is unaffected by Loop");
  assert.match(out, /Loop: attempt 1 of 2 — FAIL/);
  assert.match(out, /Retry available — fix the items above, then run: aief verify --change/);
  const logPath = path.join(full, "loop.md");
  assert.ok(fs.existsSync(logPath));
  const content = fs.readFileSync(logPath, "utf8");
  assert.match(content, /# Loop Log/);
  assert.match(content, /## Attempt 1 —/);
  assert.match(content, /Result: FAIL/);
  assert.match(content, /Feedback:\n- .*spec\.md.*empty/);
  assert.match(content, /Decision: Retry available \(1\/2\)\./);
});

test("verify --change: a second failing attempt reaches the retry limit, loop.md accumulates (append, never overwrite)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-exhausted", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8");
  aief(dir, ["verify", "--change", changeDir]);
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Loop: attempt 2 of 2 — FAIL/);
  assert.match(out, /Retry limit reached \(2\/2\) — manual review required\. See changes\//);
  assert.doesNotMatch(out, /Retry available/);
  const content = fs.readFileSync(path.join(full, "loop.md"), "utf8");
  assert.equal((content.match(/# Loop Log/g) || []).length, 1, "the header is written exactly once");
  assert.equal((content.match(/^## Attempt \d+ —/gm) || []).length, 2, "both attempts are recorded, the first one untouched");
  assert.match(content, /## Attempt 1 —/);
  assert.match(content, /## Attempt 2 —/);
});

test("verify --change: a passing attempt reports Loop complete, never a retry hint", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = loopChange(dir, "loop-pass", { loop: { verify: { maxRetries: 2 } } });
  const { out, status } = aief(dir, ["verify", "--change", changeDir]);
  assert.equal(status, 0);
  assert.match(out, /Loop: attempt 1 of 2 — PASS/);
  assert.match(out, /Loop complete — Change verified\./);
  assert.doesNotMatch(out, /Retry/);
});

test("verify --change: loop.verify with no maxRetries defaults to 3", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir } = loopChange(dir, "loop-default-retries", { loop: { verify: {} } });
  const { out } = aief(dir, ["verify", "--change", changeDir]);
  assert.match(out, /Loop: attempt 1 of 3 —/);
});

test("verify --change: an invalid loop.verify.maxRetries is a structural manifest error surfaced by status --change", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "loop-bad-config"]);
  const changeDir = "0001-loop-bad-config";
  fs.writeFileSync(path.join(dir, "changes", changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "loop-bad-config", title: "x", status: "open",
    loop: { verify: { maxRetries: 0 } }
  }), "utf8");
  const { out, status } = aief(dir, ["status", "--change", changeDir]);
  assert.equal(status, 1);
  assert.match(out, /Manifest: invalid/);
  assert.match(out, /loop\.verify\.maxRetries/);
});

test("doctor --verbose: lists an open Change's Loop attempt count only when loop.verify is configured", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { changeDir, full } = loopChange(dir, "loop-registry", { loop: { verify: { maxRetries: 2 } } });
  fs.writeFileSync(path.join(full, "spec.md"), "", "utf8");
  aief(dir, ["verify", "--change", changeDir]); // one recorded attempt
  const { out, status } = aief(dir, ["doctor", "--verbose"]);
  assert.equal(status, 0);
  assert.match(out, /\nLoop:/);
  assert.match(out, new RegExp(`- ${changeDir}: 1 attempt\\(s\\) so far, limit 2`));
});

test("doctor --verbose: never writes loop.md itself (read-only registry scan)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const { full } = loopChange(dir, "loop-readonly-doctor", { loop: { verify: { maxRetries: 2 } } });
  aief(dir, ["doctor", "--verbose"]);
  assert.ok(!fs.existsSync(path.join(full, "loop.md")));
});

test("Harness/LIDR Skills/Standards/Bootstrap are unaffected by Loop (Change 0057 touches only verify --change and doctor --verbose)", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant SaaS platform.",
    "ai-specs/skills/pair-programming.md": "# Pair Programming\n\nGuidance.\n"
  });
  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);
  assert.doesNotMatch(bootstrap.out, /\nLoop:/);
  const doctorVerbose = aief(dir, ["doctor", "--verbose"]);
  assert.match(doctorVerbose.out, /pair-programming \[project\]/, "0054's Skill wiring still works, untouched by Loop");
  assert.match(doctorVerbose.out, /\nHarness:/, "0056's Harness registry still works, untouched by Loop");
});

