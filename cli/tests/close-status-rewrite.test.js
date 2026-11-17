// Change 0171 — `aief close` used to patch change.md with a regex of its own,
// unrelated to parseChangeStatus(): beside an inline or H3 declaration it
// appended a SECOND declaration (two disagreeing declarations read as
// `unknown`, so the Change could no longer be verified as closed), and after a
// valueless `## Status` it overwrote the next line, deleting the heading that
// followed. The tests below state the invariant — every accepted status format
// closes — rather than the failure enumerations one by one, plus the two
// concrete regressions that made this a finding.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeProject, aief } from "./helpers/cli-runner.js";

import {
  markClosedContent,
  parseChangeStatus,
  isClosedContent,
  loadChange
} from "../src/core/domain/change.js";
import { checkChangeReadiness } from "../src/core/services/change-verifier.js";

const DATE = "2026-07-11";

// Every shape the parser accepts as a declaration, each with a body line that
// must survive the rewrite untouched.
const ACCEPTED_FORMATS = {
  "inline `Status: <open value>`": "# Change\n\nStatus: In Progress\n\n## Objective\n\nKeep me.\n",
  "H3 `### Status` with a value": "# Change\n\n### Status\n\nWIP\n\n## Objective\n\nKeep me.\n",
  "H2 `## Status` with a value": "# Change\n\n## Status\n\nOpen\n\n## Objective\n\nKeep me.\n",
  "inline + H2, both open": "# Change\n\nStatus: Open\n\n## Status\n\nOpen\n\n## Objective\n\nKeep me.\n",
  "H2 `## Status` without a value, followed by a heading": "# Change\n\n## Status\n\n## Objective\n\nKeep me.\n",
  "H2 `## Status` without a value, at end of file": "# Change\n\n## Objective\n\nKeep me.\n\n## Status\n",
  "blockquote `> **Status: ...**`": "# Change\n\n> **Status: OPEN (2026-07-01).** In flight.\n\n## Objective\n\nKeep me.\n",
  "no declaration at all (AIEF's own 0001-0012)": "# Change\n\n## Objective\n\nKeep me.\n"
};

test("0171 R6: every accepted status format closes — the result reads `closed` and nothing else is lost", () => {
  for (const [name, md] of Object.entries(ACCEPTED_FORMATS)) {
    const out = markClosedContent(md, DATE);
    assert.equal(parseChangeStatus(out).state, "closed", `${name}: must read back as closed`);
    assert.equal(isClosedContent(out), true, `${name}: isClosedContent must agree`);
    assert.match(out, /## Objective\n\nKeep me\./, `${name}: the body must survive the rewrite`);
    assert.ok(out.includes(`Closed (${DATE})`), `${name}: the date is the caller's`);
  }
});

test("0171 R2: an inline declaration is rewritten in place, not accompanied by a second one", () => {
  const md = "# Change\n\nStatus: In Progress\n\n## Objective\n\nKeep me.\n";
  const out = markClosedContent(md, DATE);
  assert.equal(parseChangeStatus(out).declarations.length, 1, "exactly one declaration, so no contradiction");
  assert.equal(out, "# Change\n\nStatus: Closed (2026-07-11)\n\n## Objective\n\nKeep me.\n");
});

test("0171 R2: an H3 declaration keeps its level and its place", () => {
  const md = "# Change\n\n### Status\n\nWIP\n\n## Objective\n\nKeep me.\n";
  assert.equal(markClosedContent(md, DATE), "# Change\n\n### Status\n\nClosed (2026-07-11)\n\n## Objective\n\nKeep me.\n");
});

test("0171 R2/R3: every declaration in the file is made coherent, so two of them never disagree", () => {
  const md = "# Change\n\nStatus: Open\n\n## Status\n\nOpen\n\n## Objective\n\nKeep me.\n";
  const out = markClosedContent(md, DATE);
  assert.equal(parseChangeStatus(out).declarations.length, 2);
  assert.equal(parseChangeStatus(out).state, "closed");
});

test("0171 R4 (regression): a valueless `## Status` does not eat the heading that follows it", () => {
  const md = "# Change\n\n## Status\n\n## Objective\n\nKeep me.\n";
  const out = markClosedContent(md, DATE);
  assert.match(out, /## Objective\n\nKeep me\./, "the heading and its body must still be there");
  assert.equal(out.match(/## Objective/g).length, 1);
});

test("0171 R4: a valueless `## Status` at end of file gains a value instead of a dangling blank", () => {
  const out = markClosedContent("# Change\n\n## Objective\n\nKeep me.\n\n## Status\n", DATE);
  assert.equal(out, "# Change\n\n## Objective\n\nKeep me.\n\n## Status\n\nClosed (2026-07-11)\n");
});

test("0171 R2: with no declaration at all, one is appended exactly as `aief close` always wrote it", () => {
  const out = markClosedContent("# Change\n\n## ID\n\n`0001-x`\n", DATE);
  assert.equal(out, "# Change\n\n## ID\n\n`0001-x`\n\n## Status\n\nClosed (2026-07-11)\n");
});

test("0171 R3: the rewrite is pure and idempotent — same input, same output; no disk touched", () => {
  const md = "# Change\n\nStatus: Open\n\n## Objective\n\nKeep me.\n";
  assert.equal(markClosedContent(md, DATE), markClosedContent(md, DATE));
  const once = markClosedContent(md, DATE);
  assert.equal(markClosedContent(once, DATE), once, "closing an already closed document changes nothing");
  assert.equal(md, "# Change\n\nStatus: Open\n\n## Objective\n\nKeep me.\n", "the input string is not mutated");
});

test("0171 R4: CRLF documents keep CRLF — a value rewrite must not convert every line ending", () => {
  const md = "# Change\r\n\r\nStatus: Open\r\n\r\n## Objective\r\n\r\nKeep me.\r\n";
  const out = markClosedContent(md, DATE);
  assert.equal(isClosedContent(out), true);
  assert.doesNotMatch(out.replace(/\r\n/g, ""), /\n/, "no bare LF left behind");
});

// --- R5: the message that sends the author to a dead end --------------------

test("0171 R5: an unreadable status is explained without recommending a command that cannot fix it", () => {
  const dir = makeProject();
  const files = {
    "change.md": "# Change\n\n## ID\n\n`0001-thing`\n\n## Type\n\nGeneral\n\n## Status\n\nBananas\n",
    "spec.md": "# Specification\n\n## Goal\n\nx\n",
    "tasks.md": "# Tasks\n\n- [x] Done.\n",
    "evidence.md": "# Evidence\n\n## Summary\n\nReal work.\n"
  };
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content, "utf8");
  const problems = checkChangeReadiness(loadChange(dir)).join("\n");
  // The old advice was `aief close`, which refuses to write while this problem
  // stands — a loop. The message now names both causes and the accepted values.
  assert.doesNotMatch(problems, /run aief close/);
  assert.match(problems, /not understood/);
  assert.match(problems, /"Bananas"/);
  assert.match(problems, /accepted values are Closed, Open, Proposed, Draft, In Progress/);
  assert.match(problems, /two Status declarations that disagree/);
});

// --- End to end: the finding as a user hit it ------------------------------

test("0171: close --yes closes a Change whose status is declared inline, and verify agrees", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.appendFileSync(path.join(changeDir, "change.md"), "\nStatus: In Progress\n");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");

  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0, closed.out);
  assert.match(closed.out, /✓ Closed changes\/0001-thing/);

  const changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  assert.equal(parseChangeStatus(changeMd).declarations.length, 1, "no second, contradicting declaration");
  assert.equal(parseChangeStatus(changeMd).state, "closed");
  assert.match(aief(dir, ["verify"]).out, /0001-thing \(closed\)/);
});
