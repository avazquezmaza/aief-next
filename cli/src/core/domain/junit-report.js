// JUnit XML report parsing (Change 0071 — evidence capture from `aief close
// --evidence-from <path>`). AIEF never executes a test, a command, or
// reaches the network (ADR-021's own discipline) — this only reads a file
// the user's own test runner/CI already produced. Extraction is a fixed,
// deterministic regex over <testsuite ...> root attributes, summed across
// every suite found — the same "fixed regular expressions, never a
// heuristic parser, never AI" discipline sdd-model.js already established
// for Markdown extraction. No XML parser dependency — still zero runtime
// dependencies.

const TESTSUITE_RE = /<testsuite\b([^>]*)>/gi;
const ATTR_RE = /(\w[\w:-]*)="([^"]*)"/g;

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// parseJUnitReport(content) -> { suiteCount, suiteNames, tests, failures,
//   errors, skipped, time, passed } | null (no <testsuite> element found).
export function parseJUnitReport(content) {
  const text = String(content || "");
  const suites = [];
  let match;
  TESTSUITE_RE.lastIndex = 0;
  while ((match = TESTSUITE_RE.exec(text))) {
    const attrs = {};
    let attrMatch;
    ATTR_RE.lastIndex = 0;
    while ((attrMatch = ATTR_RE.exec(match[1]))) attrs[attrMatch[1]] = attrMatch[2];
    suites.push(attrs);
  }
  if (!suites.length) return null;

  const totals = suites.reduce((acc, s) => ({
    tests: acc.tests + num(s.tests),
    failures: acc.failures + num(s.failures),
    errors: acc.errors + num(s.errors),
    skipped: acc.skipped + num(s.skipped),
    time: acc.time + num(s.time)
  }), { tests: 0, failures: 0, errors: 0, skipped: 0, time: 0 });

  const passed = Math.max(0, totals.tests - totals.failures - totals.errors - totals.skipped);

  return {
    suiteCount: suites.length,
    suiteNames: suites.map((s) => s.name).filter(Boolean),
    ...totals,
    passed
  };
}

// renderCapturedVerification(reportPath, report) -> the "## Verification"
// section body text (Change 0071's own marker: literally starts with
// "Captured from `" — replaceOrAppendEvidenceSection() uses this prefix to
// recognize its own previous capture and safely re-capture, never to
// mistake genuine human prose for one).
export function renderCapturedVerification(reportPath, report) {
  return `Captured from \`${reportPath}\` (JUnit XML, ${report.suiteCount} suite(s)) — not executed by AIEF.\n\n- Tests: ${report.tests}\n- Passed: ${report.passed}\n- Failed: ${report.failures}\n- Errors: ${report.errors}\n- Skipped: ${report.skipped}\n- Duration: ${report.time}s`;
}
