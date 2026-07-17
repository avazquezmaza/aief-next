// F1 — status parsing (Flux Portal dogfooding).
//
// Every "real Flux Portal" fixture below is copied from an actual change.md in
// the migration this finding came from. Before the fix, isClosedContent()
// returned false for 13 of 13 genuinely closed Changes — silently. These tests
// exist so that never regresses into a confident wrong answer again.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { parseChangeStatus, isClosedContent, loadChange } from "../src/core/domain/change.js";
import { verifyProject, checkChangeReadiness } from "../src/core/services/change-verifier.js";

const body = "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nImplementation\n";

// --- Formats that must read as CLOSED -------------------------------------

test("F1: AIEF's own format written by `aief close` — ## Status + Closed (date)", () => {
  const md = `${body}\n## Status\n\nClosed (2026-07-03)\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
  assert.equal(isClosedContent(md), true);
});

test("F1 (real Flux 0004): ## Status + bold **CLOSED** with a date and a note", () => {
  const md = `${body}\n## Status\n\n**CLOSED** (2026-07-11; label normalized 2026-07-16)\n\n> Was already \`Closed (2026-07-11)\` — the only Change whose declared status matched\n> reality before the reconciliation.\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
});

test("F1 (real Flux 0003): blockquote > **Status: CLOSED (reconciled …).**", () => {
  const md = `# Change\n\n> **Status: CLOSED (reconciled 2026-07-16).** The backend foundation and the n8n\n> orchestration surface this Change opened were completed.\n\n## ID\n\n\`0003-x\`\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
});

test("F1 (real Flux 0001): CLOSED · ARCHIVED — the leading token decides", () => {
  const md = `# Change\n\n> **Status: CLOSED · ARCHIVED (reconciled 2026-07-16).** AIEF was adopted and the\n> \`changes/\` structure has governed every subsequent Change.\n`;
  const parsed = parseChangeStatus(md);
  assert.equal(parsed.state, "closed");
  assert.equal(parsed.token, "CLOSED");
});

test("F1 (real Flux 0013): CLOSED — CUTOVER EXECUTED, ROLLBACK REHEARSED (date)", () => {
  const md = `# Change\n\n> **Status: CLOSED — CUTOVER EXECUTED, ROLLBACK REHEARSED (2026-07-16).**\n> Closes the frontend/backend separation programme.\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
});

// --- Decoys: real lines that must NOT be read as the status ---------------

test("F1 (real Flux 0011): `Status (orig):` is qualified — historical, not the status", () => {
  // The reconciled status is CLOSED; the ORIGINAL status is preserved beneath it.
  // Treating both as declarations would report a contradiction on a well-formed file.
  const md = `# Change\n\n> **Status: CLOSED (reconciled 2026-07-16).** Largest status drift found.\n>\n> **Status (orig): IN PROGRESS (2026-07-16).** Recovers the *experience* parity.\n`;
  const parsed = parseChangeStatus(md);
  assert.equal(parsed.state, "closed");
  assert.equal(parsed.declarations.length, 1, "the qualified `Status (orig):` must not be a declaration");
});

test("F1 (real Flux 0008): `Status (orig): PASS` does not turn a closed Change unknown", () => {
  const md = `# Change\n\n> **Status: CLOSED (reconciled 2026-07-16).** Formally closed.\n>\n> **Status (orig): PASS (2026-07-14).** All mutations implemented + validated.\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
});

test("F1 (real Flux 0013/0001): prose beginning with 'Status' is not a declaration", () => {
  const md = `# Change\n\n> **Status confirmed by the governance reconciliation (2026-07-16)** — this was the\n> only Change whose declared status already matched reality.\n>\n> *Status field added during governance reconciliation (2026-07-16).*\n`;
  const parsed = parseChangeStatus(md);
  assert.equal(parsed.declarations.length, 0);
  assert.equal(parsed.state, "open", "no declaration => open, not an error");
});

// --- Absence, ambiguity, and the loud failure -----------------------------

test("F1: no status section => open, never an error (AIEF's own 0001-0012)", () => {
  const parsed = parseChangeStatus(body);
  assert.equal(parsed.state, "open");
  assert.equal(parsed.declarations.length, 0);
});

test("F1: a declared but uninterpretable status => unknown, never a silent false", () => {
  const md = `${body}\n## Status\n\nBananas\n`;
  const parsed = parseChangeStatus(md);
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.raw, "Bananas", "the raw value is kept so the error can quote it");
  assert.equal(isClosedContent(md), false);
});

test("F1: COMPLETE / PASS are NOT guessed as closed — they are unknown (loud)", () => {
  // Flux Portal wrote both meaning "done" and AIEF silently read them as open.
  // Guessing intent is how a parser starts lying; unknown asks the author to say CLOSED.
  for (const token of ["COMPLETE", "PASS"]) {
    const parsed = parseChangeStatus(`${body}\n## Status\n\n${token} (2026-07-14)\n`);
    assert.equal(parsed.state, "unknown", `${token} must not be guessed`);
  }
});

test("F1: two disagreeing declarations => unknown, never 'first wins'", () => {
  const md = `# Change\n\n> **Status: CLOSED (2026-07-16).**\n\n## Status\n\nOpen\n`;
  const parsed = parseChangeStatus(md);
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.declarations.length, 2);
});

test("F1: agreeing duplicate declarations are fine", () => {
  const md = `# Change\n\n> **Status: CLOSED (2026-07-16).**\n\n## Status\n\nClosed (2026-07-16)\n`;
  assert.equal(parseChangeStatus(md).state, "closed");
});

test("F1: explicitly open vocabulary reads as open", () => {
  for (const token of ["Open", "Proposed", "Draft", "In Progress", "WIP"]) {
    const parsed = parseChangeStatus(`${body}\n## Status\n\n${token}\n`);
    assert.equal(parsed.state, "open", `${token} should be open`);
  }
});

// --- integration: the failure must be LOUD --------------------------------

function makeChange(changeMd) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-status-"));
  fs.writeFileSync(path.join(dir, "change.md"), changeMd);
  fs.writeFileSync(path.join(dir, "spec.md"), "# Specification\n\n## Goal\n\nDo it.\n");
  fs.writeFileSync(path.join(dir, "tasks.md"), "# Tasks\n\n- [x] Done.\n");
  fs.writeFileSync(path.join(dir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n");
  return loadChange(dir);
}

test("F1: verify FAILS explicitly on an uninterpretable status, quoting the value", () => {
  const change = makeChange(`${body}\n## Status\n\nBananas\n`);
  assert.equal(change.statusState, "unknown");
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(change.dir) });
  assert.equal(report.passed, false, "an unreadable status must fail the run, never pass as 'open'");
  assert.ok(report.errors.some((e) => e.includes("not understood") && e.includes("Bananas")));
});

test("F1: close refuses on an uninterpretable status", () => {
  const change = makeChange(`${body}\n## Status\n\nBananas\n`);
  assert.ok(checkChangeReadiness(change).some((p) => p.includes("not understood")));
});

test("F1: a well-formed closed Change still verifies clean (no new noise)", () => {
  const change = makeChange(`${body}\n## Status\n\nClosed (2026-07-03)\n`);
  const report = verifyProject({ hasReadme: true, hasAgents: true, hasChangesDir: true, hasKnowledge: true, changes: [change], cwd: path.dirname(change.dir) });
  assert.equal(report.passed, true);
  assert.equal(report.errors.length, 0);
  assert.ok(report.lines.some((l) => l.text.includes("(closed)")));
});
