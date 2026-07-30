import test from "node:test";
import assert from "node:assert/strict";

import { resolveHarnessConfig, partitionOutcome, describeHarnessRegistry, hookTitle, formatHookLogSection, formatHookResultsBlock, describeFailingHooks } from "../src/core/services/harness-service.js";
import { hookIds } from "../src/hooks/index.js";

test("resolveHarnessConfig: no manifest is a strict no-op", () => {
  const config = resolveHarnessConfig(null);
  assert.equal(config.configured, false);
  assert.equal(config.log, false);
  assert.deepEqual(config.disabledByEvent, {});
  assert.deepEqual(config.unknownHookIds, []);
});

test("resolveHarnessConfig: a manifest with no harness field is a strict no-op", () => {
  const config = resolveHarnessConfig({ schema: "aief.change/v1", id: "1", slug: "x", title: "X", status: "open" });
  assert.equal(config.configured, false);
});

test("resolveHarnessConfig: a valid config with one disabled Hook resolves per event, defaulting every event to an empty disabled list", () => {
  const manifest = { harness: { log: true, hooks: { "prompt.prepared": { disabled: ["prompt-skill-suggestion"] } } } };
  const config = resolveHarnessConfig(manifest);
  assert.equal(config.configured, true);
  assert.equal(config.log, true);
  assert.deepEqual(config.disabledByEvent["prompt.prepared"], ["prompt-skill-suggestion"]);
  assert.deepEqual(config.disabledByEvent["verify.completed"], [], "an event with no explicit config still resolves to an empty (not missing) disabled list");
  assert.deepEqual(config.unknownHookIds, []);
});

test("resolveHarnessConfig: an unknown Hook id is reported, never treated as disabling something real", () => {
  const manifest = { harness: { hooks: { "prompt.prepared": { disabled: ["totally-made-up-hook"] } } } };
  const config = resolveHarnessConfig(manifest);
  assert.deepEqual(config.disabledByEvent["prompt.prepared"], []);
  assert.deepEqual(config.unknownHookIds, [{ event: "prompt.prepared", id: "totally-made-up-hook" }]);
});

test("resolveHarnessConfig: log defaults to false when absent", () => {
  const config = resolveHarnessConfig({ harness: { hooks: {} } });
  assert.equal(config.log, false);
});

test("resolveHarnessConfig: is deterministic across repeated calls", () => {
  const manifest = { harness: { log: true, hooks: { "verify.completed": { disabled: ["post-verify-next-action"] } } } };
  const first = resolveHarnessConfig(manifest);
  const second = resolveHarnessConfig(manifest);
  assert.deepEqual(first, second);
});

test("partitionOutcome: splits results by the disabled set for the outcome's own event", () => {
  const outcome = {
    event: "prompt.prepared",
    results: [
      { hook: "prompt-skill-suggestion", status: "matched" },
      { hook: "some-other-hook", status: "not_applicable" }
    ]
  };
  const config = { disabledByEvent: { "prompt.prepared": ["prompt-skill-suggestion"] } };
  const { active, disabled } = partitionOutcome(outcome, config);
  assert.deepEqual(active.map((r) => r.hook), ["some-other-hook"]);
  assert.deepEqual(disabled.map((r) => r.hook), ["prompt-skill-suggestion"]);
});

test("partitionOutcome: nothing disabled for this event returns every result as active", () => {
  const outcome = { event: "verify.completed", results: [{ hook: "post-verify-next-action", status: "matched" }] };
  const { active, disabled } = partitionOutcome(outcome, { disabledByEvent: {} });
  assert.equal(active.length, 1);
  assert.deepEqual(disabled, []);
});

test("describeHarnessRegistry: matches the real Hook Registry's own descriptors exactly", () => {
  const descriptors = describeHarnessRegistry();
  assert.deepEqual(descriptors.map((d) => d.id).sort(), [...hookIds()].sort());
  for (const d of descriptors) {
    assert.ok(Array.isArray(d.events) && d.events.length > 0);
    assert.equal(typeof d.title, "string");
  }
});

test("hookTitle: returns the registered Hook's real title", () => {
  const [firstId] = hookIds();
  const title = hookTitle(firstId);
  assert.equal(typeof title, "string");
  assert.ok(title.length > 0);
});

test("hookTitle: falls back to the id itself for an unregistered id, never throws", () => {
  assert.equal(hookTitle("not-a-real-hook"), "not-a-real-hook");
});

test("formatHookLogSection: never includes anything beyond id/event/status/summary — no raw context, no secrets", () => {
  const text = formatHookLogSection({
    timestamp: "2026-07-30T00:00:00.000Z",
    operation: "prompt",
    changeId: "0001-thing",
    event: "prompt.prepared",
    entries: [{ hook: "prompt-skill-suggestion", event: "prompt.prepared", status: "matched", summary: "ready" }]
  });
  assert.match(text, /prompt-skill-suggestion/);
  assert.match(text, /matched/);
  assert.match(text, /ready/);
  assert.doesNotMatch(text, /API_KEY|SECRET|TOKEN|password/i);
});

test("formatHookLogSection: includes PASS/FAIL only when `passed` is explicitly provided (verify.completed)", () => {
  const withPass = formatHookLogSection({ timestamp: "t", operation: "verify", changeId: "c", event: "verify.completed", passed: true, entries: [] });
  assert.match(withPass, /PASS/);
  const withoutPass = formatHookLogSection({ timestamp: "t", operation: "prompt", changeId: "c", event: "prompt.prepared", entries: [] });
  assert.doesNotMatch(withoutPass, /PASS|FAIL/);
});

test("formatHookLogSection: escapes pipe characters and newlines in a summary so the Markdown table never breaks", () => {
  const text = formatHookLogSection({
    timestamp: "t", operation: "prompt", changeId: "c", event: "prompt.prepared",
    entries: [{ hook: "x", event: "prompt.prepared", status: "matched", summary: "a | b\nc" }]
  });
  const tableLine = text.split("\n").find((l) => l.startsWith("| x "));
  assert.ok(tableLine);
  assert.match(tableLine, /a \\\| b c \|$/, "the summary's own pipe is backslash-escaped and the newline collapsed, so the table row stays exactly 4 columns");
});

test("formatHookResultsBlock: renders a matched Hook with content", () => {
  const text = formatHookResultsBlock([{ hook: "h1", status: "matched", summary: "ready", instructions: ["do X"], warnings: [] }]);
  assert.match(text, /─── Hook: h1 ───/);
  assert.match(text, /ready/);
  assert.match(text, /- do X/);
});

test("formatHookResultsBlock: a matched Hook with no instructions/warnings is silent", () => {
  const text = formatHookResultsBlock([{ hook: "h1", status: "matched", summary: "nothing to say", instructions: [], warnings: [] }]);
  assert.equal(text, "");
});

test("formatHookResultsBlock: not_applicable/blocked/unsupported are silent", () => {
  for (const status of ["not_applicable", "blocked", "unsupported"]) {
    const text = formatHookResultsBlock([{ hook: "h1", status, summary: "n/a", instructions: [], warnings: [], errors: [] }]);
    assert.equal(text, "", `status ${status} must be silent`);
  }
});

test("formatHookResultsBlock: a failed Hook is rendered — id, event, error message, never a stack trace", () => {
  const text = formatHookResultsBlock([{ hook: "broken-hook", status: "failed", summary: "evaluate() failed: boom", errors: ["evaluate() failed: boom"], instructions: [], warnings: [] }]);
  assert.match(text, /─── Hook: broken-hook \(failed\) ───/);
  assert.match(text, /evaluate\(\) failed: boom/);
  assert.doesNotMatch(text, /at Object\.<anonymous>|node:internal|\.js:\d+:\d+/, "no stack trace leakage");
});

test("formatHookResultsBlock: an invalid Hook result is rendered the same way as failed", () => {
  const text = formatHookResultsBlock([{ hook: "bad-hook", status: "invalid", summary: "Hook result violated its own declared capabilities", errors: ["Hook attempted blocking without authority."], instructions: [], warnings: [] }]);
  assert.match(text, /─── Hook: bad-hook \(invalid\) ───/);
  assert.match(text, /Hook attempted blocking without authority\./);
});

test("formatHookResultsBlock: renders multiple Hooks in the given order", () => {
  const text = formatHookResultsBlock([
    { hook: "a", status: "matched", summary: "s1", instructions: ["i1"], warnings: [] },
    { hook: "b", status: "failed", summary: "s2", errors: ["e2"], instructions: [], warnings: [] }
  ]);
  assert.ok(text.indexOf("Hook: a") < text.indexOf("Hook: b"));
});

test("describeFailingHooks: only failed/invalid, one line each, no stack trace", () => {
  const lines = describeFailingHooks([
    { hook: "ok-hook", event: "verify.completed", status: "matched", summary: "fine", errors: [] },
    { hook: "broken-hook", event: "verify.completed", status: "failed", summary: "boom", errors: ["boom"] }
  ]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^broken-hook \(verify\.completed, failed\): boom$/);
  assert.doesNotMatch(lines[0], /at Object\.<anonymous>|node:internal/);
});

test("describeFailingHooks: empty when nothing failed", () => {
  assert.deepEqual(describeFailingHooks([{ hook: "a", status: "matched", errors: [] }]), []);
});
