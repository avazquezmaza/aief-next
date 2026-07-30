// Loop Service (AIEF 3.1, Change 0057, ADR-027).
//
// Verify -> Feedback -> Retry (if applicable) -> Final result, as opt-in,
// per-Change attempt tracking over the existing, unmodified verify
// pipeline. Mirrors harness-service.js's own split exactly: every function
// here is pure (no filesystem access, no command execution, no network) —
// cli.js reads/writes <changeDir>/loop.md and decides when to call these.
//
// "Retry" is an outcome this module reports, never an action it performs —
// nothing here re-invokes verify, a Hook, a Skill, or any process (ADR-027).
export const DEFAULT_MAX_RETRIES = 3;

// resolveLoopConfig(manifest) -> { configured: boolean, maxRetries: number|null }
//
// `manifest` may be null/undefined (no manifest.json) or a manifest without
// a `loop` field — both resolve to `configured: false`, the strict no-op
// every existing Change (none of which declares `loop`) gets.
export function resolveLoopConfig(manifest) {
  const loop = manifest && typeof manifest === "object" ? manifest.loop : undefined;
  const verifyConfig = loop && typeof loop === "object" ? loop.verify : undefined;
  if (!verifyConfig || typeof verifyConfig !== "object") {
    return { configured: false, maxRetries: null };
  }
  const declared = verifyConfig.maxRetries;
  const maxRetries = Number.isInteger(declared) && declared >= 1 ? declared : DEFAULT_MAX_RETRIES;
  return { configured: true, maxRetries };
}

// countPreviousAttempts(logContent) -> number
//
// Counts "## Attempt <n>" section headers already present in loop.md's own
// content (R3, ADR-009: the visible file is the only source of truth — no
// hidden counter, no manifest mutation). `logContent` is whatever cli.js
// read from disk (or "" / undefined when loop.md does not exist yet) —
// never throws on malformed content, simply counts what matches.
export function countPreviousAttempts(logContent) {
  if (!logContent) return 0;
  const matches = String(logContent).match(/^## Attempt \d+/gm);
  return matches ? matches.length : 0;
}

// decideLoopOutcome({ attempt, maxRetries, passed }) -> {
//   attempt, maxRetries, passed, status: "passed" | "retry_available" | "exhausted",
//   retryAvailable: boolean, exhausted: boolean
// }
//
// A pure function of exactly three already-known facts (R4) — never a
// fourth input, never inferred from anything else.
export function decideLoopOutcome({ attempt, maxRetries, passed }) {
  if (passed) {
    return { attempt, maxRetries, passed: true, status: "passed", retryAvailable: false, exhausted: false };
  }
  if (attempt < maxRetries) {
    return { attempt, maxRetries, passed: false, status: "retry_available", retryAvailable: true, exhausted: false };
  }
  return { attempt, maxRetries, passed: false, status: "exhausted", retryAvailable: false, exhausted: true };
}

// formatLoopSummary(outcome, changeId) -> the additive "Loop:" block printed
// after aief verify's existing report and Hook output (R5). Never touches
// the report's own PASS/FAIL text or exit code — purely informational.
export function formatLoopSummary(outcome, changeId) {
  const lines = [`\nLoop: attempt ${outcome.attempt} of ${outcome.maxRetries} — ${outcome.passed ? "PASS" : "FAIL"}`];
  if (outcome.status === "retry_available") {
    lines.push(`Retry available — fix the items above, then run: aief verify --change ${changeId}`);
  } else if (outcome.status === "exhausted") {
    lines.push(`Retry limit reached (${outcome.attempt}/${outcome.maxRetries}) — manual review required. See changes/${changeId}/loop.md.`);
  } else {
    lines.push("Loop complete — Change verified.");
  }
  return lines.join("\n");
}

// formatLoopLogEntry({ timestamp, outcome, feedback }) -> Markdown text for
// one loop.md entry (R7). `feedback` is expected to be
// VerificationReport.errors — already-computed, already-printed strings;
// this function does not fetch, derive, or accept anything else as
// feedback content.
export function formatLoopLogEntry({ timestamp, outcome, feedback }) {
  const lines = [`## Attempt ${outcome.attempt} — ${timestamp}`, "", `Result: ${outcome.passed ? "PASS" : "FAIL"}`, ""];
  if (feedback && feedback.length) {
    lines.push("Feedback:");
    for (const line of feedback) lines.push(`- ${line}`);
    lines.push("");
  }
  const decision = outcome.status === "passed"
    ? "Loop complete."
    : outcome.status === "retry_available"
      ? `Retry available (${outcome.attempt}/${outcome.maxRetries}).`
      : `Retry limit reached (${outcome.attempt}/${outcome.maxRetries}).`;
  lines.push(`Decision: ${decision}`, "");
  return lines.join("\n");
}
