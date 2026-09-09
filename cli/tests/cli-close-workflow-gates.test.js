import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeProject, aief } from "./helpers/cli-runner.js";

// ADR-037 (Change 0124/0125): `aief close` now consults the Workflow Engine
// for a Change that declares a `track`, and review/approval/security_review
// resolve from an explicit `(gate:<id>)` tasks.md task. A Change with no
// track is untouched — covered by the pre-existing, unmodified close/verify
// test suite; these tests cover only the new, tracked behavior.

const REAL_EVIDENCE = "# Evidence\n\n## Summary\n\nReal work happened.\n";

function writeManifest(dir, changeBasename, track) {
  const [id, ...slugParts] = changeBasename.split("-");
  fs.writeFileSync(path.join(dir, "changes", changeBasename, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id, slug: slugParts.join("-"), title: "x", status: "open", track
  }), "utf8");
}

function completeStructurally(dir, changeBasename) {
  // Satisfies checkChangeReadiness() (the "readiness" gate) on its own —
  // mirrors gate-evaluator.test.js's COMPLETE_LEGACY_FILES.
  fs.writeFileSync(path.join(dir, "changes", changeBasename, "evidence.md"), REAL_EVIDENCE, "utf8");
}

test("close: a governed Change with an unresolved (gate:approval) task cannot close, even though every other check passes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "governed-thing"]);
  const basename = "0001-governed-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), [
    "# Tasks", "",
    "- [ ] (gate:approval) Architecture approved",
    "- [x] (gate:security_review) Security review completed",
    "- [x] (gate:review) Independent review completed"
  ].join("\n"), "utf8");
  writeManifest(dir, basename, "governed");

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /approval/);
  assert.match(out, /Not closed: resolve the items above first\./);
  const changeMd = fs.readFileSync(path.join(dir, "changes", basename, "change.md"), "utf8");
  assert.doesNotMatch(changeMd, /## Status\s*\n\s*Closed/, "close must not have written a Closed status");
});

test("close: the same governed Change closes once every (gate:<id>) task is checked and structural readiness passes", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "governed-thing"]);
  const basename = "0001-governed-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), [
    "# Tasks", "",
    "- [x] (gate:approval) Architecture approved",
    "- [x] (gate:security_review) Security review completed",
    "- [x] (gate:review) Independent review completed"
  ].join("\n"), "utf8");
  writeManifest(dir, basename, "governed");

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 0);
  assert.match(out, /All readiness checks passed\./);
  assert.match(out, /Closed/);
  const changeMd = fs.readFileSync(path.join(dir, "changes", basename, "change.md"), "utf8");
  assert.match(changeMd, /## Status\s*\n\s*Closed/);
});

test("close: a governed Change with no (gate:<id>) task at all for a declared gate is refused, naming the missing task, never fabricated as passed", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "governed-thing"]);
  const basename = "0001-governed-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), "# Tasks\n\n- [x] Ordinary task done.\n", "utf8");
  writeManifest(dir, basename, "governed");

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /no "\(gate:approval\)" task found/);
});

// `standard`'s stage order is work -> verify(readiness) -> review -> close
// (workflows/standard.json, unchanged by this Change): resolveState() walks
// stages in that declared order and reports only the FIRST blocked stage.
// An unchecked (gate:review) line is itself an unchecked tasks.md line, so
// it also fails "verify"'s readiness gate — which comes first — masking
// "review"'s own named reason behind the generic one. close still correctly
// refuses either way (never a false "passed"); only the reported reason
// differs. See evidence.md for this Change's note on the interaction.
test("close: a standard-track Change with an unresolved (gate:review) task cannot close (reported via readiness, since verify precedes review in stage order)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "standard-thing"]);
  const basename = "0001-standard-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), "# Tasks\n\n- [ ] (gate:review) Independent review completed\n", "utf8");
  writeManifest(dir, basename, "standard");

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /unchecked task\(s\) in tasks\.md/);
});

// The case where the named "review" gate DOES surface distinctly: the task
// is missing entirely (not merely unchecked), so readiness itself has
// nothing to flag (zero unchecked lines) — only the dedicated gate does.
test("close: a standard-track Change with no (gate:review) task at all is refused by the named gate specifically, once readiness itself is otherwise satisfied", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "standard-thing"]);
  const basename = "0001-standard-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), "# Tasks\n\n- [x] Ordinary task done.\n", "utf8");
  writeManifest(dir, basename, "standard");

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /no "\(gate:review\)" task found/);
});

test("close: a Change with no track is completely unaffected by any (gate:<id>) mechanism — a stray (gate:approval) task is just an ordinary unchecked task", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "plain-thing"]);
  const basename = "0001-plain-thing";
  completeStructurally(dir, basename);
  fs.writeFileSync(path.join(dir, "changes", basename, "tasks.md"), "# Tasks\n\n- [ ] (gate:approval) Not a real gate for this Change — no track declared.\n", "utf8");
  // No manifest.json at all — the exact pre-0125, no-track path.

  const { out, status } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /1 unchecked task\(s\) in tasks\.md/, "resolved via the generic, pre-existing check — not the new gate mechanism");
});
