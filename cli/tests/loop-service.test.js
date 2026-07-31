import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_MAX_RETRIES, resolveLoopConfig, countPreviousAttempts, decideLoopOutcome, formatLoopSummary, formatLoopLogEntry } from "../src/core/services/loop-service.js";

// --- resolveLoopConfig ---

test("resolveLoopConfig: no manifest is a strict no-op", () => {
  const config = resolveLoopConfig(null);
  assert.equal(config.configured, false);
  assert.equal(config.maxRetries, null);
});

test("resolveLoopConfig: a manifest with no loop field is a strict no-op", () => {
  const config = resolveLoopConfig({ schema: "aief.change/v1", id: "1", slug: "x", title: "X", status: "open" });
  assert.equal(config.configured, false);
});

test("resolveLoopConfig: loop.verify present with no maxRetries defaults to DEFAULT_MAX_RETRIES", () => {
  const config = resolveLoopConfig({ loop: { verify: {} } });
  assert.equal(config.configured, true);
  assert.equal(config.maxRetries, DEFAULT_MAX_RETRIES);
});

test("resolveLoopConfig: an explicit maxRetries is honored", () => {
  const config = resolveLoopConfig({ loop: { verify: { maxRetries: 7 } } });
  assert.equal(config.configured, true);
  assert.equal(config.maxRetries, 7);
});

test("resolveLoopConfig: is deterministic across repeated calls", () => {
  const manifest = { loop: { verify: { maxRetries: 4 } } };
  assert.deepEqual(resolveLoopConfig(manifest), resolveLoopConfig(manifest));
});

// --- countPreviousAttempts ---

test("countPreviousAttempts: empty/absent content is zero attempts", () => {
  assert.equal(countPreviousAttempts(""), 0);
  assert.equal(countPreviousAttempts(null), 0);
  assert.equal(countPreviousAttempts(undefined), 0);
});

test("countPreviousAttempts: counts one Attempt section", () => {
  const content = "# Loop Log\n\n## Attempt 1 — 2026-07-30T00:00:00.000Z\n\nResult: PASS\n";
  assert.equal(countPreviousAttempts(content), 1);
});

test("countPreviousAttempts: counts several Attempt sections regardless of their own numbering", () => {
  const content = "## Attempt 1 — t1\n\nx\n\n## Attempt 2 — t2\n\ny\n\n## Attempt 3 — t3\n\nz\n";
  assert.equal(countPreviousAttempts(content), 3);
});

test("countPreviousAttempts: malformed/unrelated content never throws, counts zero", () => {
  assert.equal(countPreviousAttempts("not a loop log at all"), 0);
  assert.equal(countPreviousAttempts("### Attempt 1 (wrong heading level)"), 0);
});

// --- decideLoopOutcome ---

test("decideLoopOutcome: passed is always status 'passed', regardless of attempt/maxRetries", () => {
  const outcome = decideLoopOutcome({ attempt: 5, maxRetries: 2, passed: true });
  assert.equal(outcome.status, "passed");
  assert.equal(outcome.retryAvailable, false);
  assert.equal(outcome.exhausted, false);
});

test("decideLoopOutcome: failing under the limit is 'retry_available'", () => {
  const outcome = decideLoopOutcome({ attempt: 1, maxRetries: 3, passed: false });
  assert.equal(outcome.status, "retry_available");
  assert.equal(outcome.retryAvailable, true);
  assert.equal(outcome.exhausted, false);
});

test("decideLoopOutcome: failing at exactly maxRetries is 'exhausted', not one more retry_available", () => {
  const outcome = decideLoopOutcome({ attempt: 3, maxRetries: 3, passed: false });
  assert.equal(outcome.status, "exhausted");
  assert.equal(outcome.retryAvailable, false);
  assert.equal(outcome.exhausted, true);
});

test("decideLoopOutcome: failing beyond maxRetries stays 'exhausted', honestly reporting the real attempt number", () => {
  const outcome = decideLoopOutcome({ attempt: 5, maxRetries: 3, passed: false });
  assert.equal(outcome.status, "exhausted");
  assert.equal(outcome.attempt, 5);
  assert.equal(outcome.maxRetries, 3);
});

test("decideLoopOutcome: never a fourth state", () => {
  for (const passed of [true, false]) {
    for (const attempt of [1, 2, 3, 4]) {
      const outcome = decideLoopOutcome({ attempt, maxRetries: 3, passed });
      assert.ok(["passed", "retry_available", "exhausted"].includes(outcome.status));
    }
  }
});

// --- formatLoopSummary / formatLoopLogEntry ---

test("formatLoopSummary: retry_available names the exact next command", () => {
  const text = formatLoopSummary({ attempt: 1, maxRetries: 3, passed: false, status: "retry_available" }, "0002-thing");
  assert.match(text, /Loop: attempt 1 of 3 — FAIL/);
  assert.match(text, /Retry available.*aief verify --change 0002-thing/);
});

test("formatLoopSummary: exhausted points at loop.md, never suggests another retry", () => {
  const text = formatLoopSummary({ attempt: 3, maxRetries: 3, passed: false, status: "exhausted" }, "0002-thing");
  assert.match(text, /Retry limit reached \(3\/3\)/);
  assert.match(text, /changes\/0002-thing\/loop\.md/);
  assert.doesNotMatch(text, /Retry available/);
});

test("formatLoopSummary: passed reports completion, never a retry hint", () => {
  const text = formatLoopSummary({ attempt: 1, maxRetries: 3, passed: true, status: "passed" }, "0002-thing");
  assert.match(text, /Loop: attempt 1 of 3 — PASS/);
  assert.match(text, /Loop complete/);
  assert.doesNotMatch(text, /Retry/);
});

test("formatLoopLogEntry: includes attempt, timestamp, result, feedback (reused verbatim), and decision", () => {
  const outcome = { attempt: 1, maxRetries: 3, passed: false, status: "retry_available" };
  const text = formatLoopLogEntry({ timestamp: "2026-07-30T00:00:00.000Z", outcome, feedback: ["✗ Missing: README.md"] });
  assert.match(text, /^## Attempt 1 — 2026-07-30T00:00:00\.000Z/m);
  assert.match(text, /Result: FAIL/);
  assert.match(text, /- ✗ Missing: README\.md/);
  assert.match(text, /Decision: Retry available \(1\/3\)\./);
});

test("formatLoopLogEntry: no Feedback section when there is nothing to report (a passing attempt)", () => {
  const outcome = { attempt: 1, maxRetries: 3, passed: true, status: "passed" };
  const text = formatLoopLogEntry({ timestamp: "t", outcome, feedback: [] });
  assert.doesNotMatch(text, /Feedback:/);
  assert.match(text, /Decision: Loop complete\./);
});

test("formatLoopLogEntry: never includes anything beyond the given feedback strings — no secrets, no raw context", () => {
  const outcome = { attempt: 2, maxRetries: 3, passed: false, status: "retry_available" };
  const text = formatLoopLogEntry({ timestamp: "t", outcome, feedback: ["✗ Missing: spec.md"] });
  assert.doesNotMatch(text, /API_KEY|SECRET|TOKEN|password/i);
});

test("formatLoopLogEntry: exhausted decision text matches formatLoopSummary's own wording convention", () => {
  const outcome = { attempt: 3, maxRetries: 3, passed: false, status: "exhausted" };
  const text = formatLoopLogEntry({ timestamp: "t", outcome, feedback: [] });
  assert.match(text, /Decision: Retry limit reached \(3\/3\)\./);
});
