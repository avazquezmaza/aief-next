import test from "node:test";
import assert from "node:assert/strict";

import { replaceOrAppendEvidenceSection } from "../src/core/domain/evidence-sections.js";

const MARKER = "Captured from `";
const evidenceMd = (verificationBody) => `# Evidence\n\n## Summary\n\nPending.\n\n## Verification\n\n${verificationBody}\n\n## Findings\n\nPending.\n`;
const bodyV1 = "Captured from `report.xml` (JUnit XML, 1 suite(s)) — not executed by AIEF.\n\n- Tests: 10\n- Failed: 1";
const bodyV2 = "Captured from `report.xml` (JUnit XML, 1 suite(s)) — not executed by AIEF.\n\n- Tests: 10\n- Failed: 0";

test("replaceOrAppendEvidenceSection: placeholder body becomes the sub-block", () => {
  const result = replaceOrAppendEvidenceSection(evidenceMd("Pending."), "Verification", MARKER, bodyV1);
  assert.match(result, /## Verification\n\n### Captured Test Report\n\nCaptured from `report\.xml`/);
  assert.match(result, /## Findings\n\nPending\./, "sections after the one touched are untouched");
});

test("replaceOrAppendEvidenceSection: human prose (no prior capture) is preserved, sub-block appended below it", () => {
  const humanText = "I manually ran the tests and they passed.";
  const result = replaceOrAppendEvidenceSection(evidenceMd(humanText), "Verification", MARKER, bodyV1);
  assert.match(result, new RegExp(`## Verification\\n\\n${humanText}\\n\\n### Captured Test Report`));
});

test("replaceOrAppendEvidenceSection: re-capture after a placeholder-origin capture replaces in place, no duplicate", () => {
  const first = replaceOrAppendEvidenceSection(evidenceMd("Pending."), "Verification", MARKER, bodyV1);
  const second = replaceOrAppendEvidenceSection(first, "Verification", MARKER, bodyV2);
  assert.equal((second.match(/### Captured Test Report/g) || []).length, 1);
  assert.match(second, /Failed: 0/);
  assert.doesNotMatch(second, /Failed: 1/);
});

test("replaceOrAppendEvidenceSection: re-capture after a human-prose-origin capture replaces in place, human prose still untouched, no duplicate (the bug an earlier design had)", () => {
  const humanText = "I manually ran the tests and they passed.";
  const first = replaceOrAppendEvidenceSection(evidenceMd(humanText), "Verification", MARKER, bodyV1);
  const second = replaceOrAppendEvidenceSection(first, "Verification", MARKER, bodyV2);
  assert.equal((second.match(/### Captured Test Report/g) || []).length, 1);
  assert.match(second, new RegExp(humanText.replace(/\./g, "\\.")), "human prose must survive a second capture");
  assert.match(second, /Failed: 0/);
  assert.doesNotMatch(second, /Failed: 1/);
});

test("replaceOrAppendEvidenceSection: section is the last one in the file, multi-line body — never truncated", () => {
  const lastSection = "# Evidence\n\n## Summary\n\nPending.\n\n## Verification\n\nLine one.\n\nLine two.\n";
  const result = replaceOrAppendEvidenceSection(lastSection, "Verification", MARKER, bodyV1);
  assert.match(result, /Line one\.\n\nLine two\./, "prior multi-line body must survive intact, not be truncated at the first blank line");
  assert.match(result, /### Captured Test Report/);
});

test("replaceOrAppendEvidenceSection: heading not found at all appends a new section at the end", () => {
  const noVerification = "# Evidence\n\n## Summary\n\nPending.\n";
  const result = replaceOrAppendEvidenceSection(noVerification, "Verification", MARKER, bodyV1);
  assert.match(result, /## Verification\n\n### Captured Test Report/);
});

test("replaceOrAppendEvidenceSection: only the named section is ever touched", () => {
  const md = "# Evidence\n\n## Summary\n\nReal summary text, untouched.\n\n## Verification\n\nPending.\n\n## Findings\n\nReal findings, untouched.\n";
  const result = replaceOrAppendEvidenceSection(md, "Verification", MARKER, bodyV1);
  assert.match(result, /## Summary\n\nReal summary text, untouched\./);
  assert.match(result, /## Findings\n\nReal findings, untouched\./);
});
