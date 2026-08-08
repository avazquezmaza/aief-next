import test from "node:test";
import assert from "node:assert/strict";

import { parseJUnitReport, renderCapturedVerification } from "../src/core/domain/junit-report.js";

test("parseJUnitReport: single testsuite", () => {
  const xml = '<testsuite name="unit" tests="10" failures="2" errors="1" skipped="1" time="3.5"></testsuite>';
  const report = parseJUnitReport(xml);
  assert.deepEqual(report, { suiteCount: 1, suiteNames: ["unit"], tests: 10, failures: 2, errors: 1, skipped: 1, time: 3.5, passed: 6 });
});

test("parseJUnitReport: multiple testsuite elements are summed", () => {
  const xml = `
    <testsuites>
      <testsuite name="unit" tests="10" failures="1" errors="0" skipped="0" time="2"/>
      <testsuite name="integration" tests="5" failures="0" errors="1" skipped="1" time="3"/>
    </testsuites>
  `;
  const report = parseJUnitReport(xml);
  assert.equal(report.suiteCount, 2);
  assert.deepEqual(report.suiteNames, ["unit", "integration"]);
  assert.equal(report.tests, 15);
  assert.equal(report.failures, 1);
  assert.equal(report.errors, 1);
  assert.equal(report.skipped, 1);
  assert.equal(report.time, 5);
  assert.equal(report.passed, 12);
});

test("parseJUnitReport: no <testsuite> element returns null", () => {
  assert.equal(parseJUnitReport("<html>not a test report</html>"), null);
  assert.equal(parseJUnitReport(""), null);
  assert.equal(parseJUnitReport(null), null);
});

test("parseJUnitReport: missing/malformed numeric attributes default to 0, never NaN or a throw", () => {
  const xml = '<testsuite name="weird" tests="not-a-number" time=""></testsuite>';
  const report = parseJUnitReport(xml);
  assert.equal(report.tests, 0);
  assert.equal(report.time, 0);
  assert.equal(Number.isNaN(report.passed), false);
});

test("parseJUnitReport: passed never goes negative even if a report's own numbers are inconsistent", () => {
  const xml = '<testsuite tests="1" failures="5" errors="0" skipped="0" time="0"></testsuite>';
  const report = parseJUnitReport(xml);
  assert.equal(report.passed, 0);
});

test("renderCapturedVerification: deterministic, includes the marker prefix and every count", () => {
  const report = { suiteCount: 2, tests: 15, failures: 1, errors: 1, skipped: 1, time: 5, passed: 12 };
  const body = renderCapturedVerification("results.xml", report);
  assert.match(body, /^Captured from `results\.xml` \(JUnit XML, 2 suite\(s\)\) — not executed by AIEF\./);
  assert.match(body, /- Tests: 15/);
  assert.match(body, /- Passed: 12/);
  assert.match(body, /- Failed: 1/);
  assert.match(body, /- Errors: 1/);
  assert.match(body, /- Skipped: 1/);
  assert.match(body, /- Duration: 5s/);
});
