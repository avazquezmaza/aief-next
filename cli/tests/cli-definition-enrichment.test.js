import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

// --- Change 0081: Definition enrichment (Known/Missing/Ambiguous/Decision required/Human approval/Deferred) ---

test("status --change on a fresh Definition Change reports every section as missing", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const { status, out } = aief(dir, ["status", "--change", "0001-define-project-architecture"]);
  assert.equal(status, 0);
  assert.match(out, /Definition readiness: 0\/18 sections filled in/);
  assert.match(out, /Missing: Context, /);
});

test("status --change on a Definition Change reflects Known sections and explicit markers, transparently derived", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const changeDir = path.join(dir, "changes", "0001-define-project-architecture");
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd.replace("## Context\n\n-", "## Context\n\nReplaces three legacy lookup screens with one unified view.");
  changeMd = changeMd.replace("## Open Questions\n\n-", "## Open Questions\n\n- Which caching layer? (deferred)\n- Expected concurrent users? (ambiguous)");
  changeMd = changeMd.replace("## Decisions Required\n\n-", "## Decisions Required\n\n- Multi-tenancy model. (decision required)");
  changeMd = changeMd.replace("## Recommendation\n\n-", "## Recommendation\n\n- Schema-per-tenant. (human)");
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-define-project-architecture"]);
  assert.equal(status, 0);
  assert.match(out, /Definition readiness: 4\/18 sections filled in/);
  assert.match(out, /Decision required: 1 item\(s\)/);
  assert.match(out, /Ambiguous: 1 item\(s\)/);
  assert.match(out, /Human approval required: 1 item\(s\)/);
  assert.match(out, /Deferred until implementation: 1 item\(s\)/);
});

test("status --change on a non-Definition Change never prints a Definition readiness block", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const { out } = aief(dir, ["status", "--change", "0001-thing"]);
  assert.doesNotMatch(out, /Definition readiness/);
});

test("prompt on a Definition Change explains the marker convention", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /\(decision required\)/);
  assert.match(out, /\(ambiguous\)/);
  assert.match(out, /\(deferred\)/);
  assert.match(out, /never invents a category from prose/);
});

test("status's bottom-line suggestion for a single open Change is aief prompt", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "legacy-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.match(out, /\nNext:\n {2}aief prompt\n/);
});

// `aief status --change <id>` / `--next` (Change 0046; ADR-038 removed
// tracks, stages and SDD from this view).
test("status --change <id> shows a deep, read-only view of one Change (blockers, next action)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "deep-view-thing"]);
  const changeDir = path.join(dir, "changes", "0001-deep-view-thing");
  const { status, out } = aief(dir, ["status", "--change", "0001-deep-view-thing"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-deep-view-thing/);
  assert.match(out, /Blockers:\n- evidence\.md has not been completed yet/);
  assert.match(out, /Next:\n {2}aief prompt --change 0001-deep-view-thing/);
});

test("status --change <id> --next shows the compact Normalized Action view, exit 0 even when blocked", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "compact-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-compact-next-thing");
  const { status, out } = aief(dir, ["status", "--change", "0001-compact-next-thing", "--next"]);
  assert.equal(status, 0, "blocked is a successfully-answered query — exit 0, not 1 (ADR-018 §3)");
  assert.match(out, /Next action:/);
  assert.match(out, /status: blocked/);
  assert.match(out, /id: close/);
});

test("status --next (no --change) infers the single open Change deterministically", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "implicit-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-implicit-next-thing");
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-implicit-next-thing/);
});

// Change 0059/ADR-029: superseding this test's original assertion is a
// deliberate, documented behavior change, not a silent edit — see
// change.md "Deliberate, documented behavior change" and evidence.md. Both
// Changes here are dependency-free and open — both eligible —
// so the deterministic id-sort tie-break recommends "first".
test("status --next with multiple open, equally eligible Changes deterministically recommends the lowest id (Change 0059 supersedes the old ambiguity error)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "first"]);
  aief(dir, ["new-change", "second"]);
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Next Change: 0001-first/);
  assert.match(out, /Ready because:/);
  assert.match(out, /Tie-break: lowest Change id, sorted ascending/);
  assert.match(out, /Other eligible Change\(s\): 0002-second/);
});

test("status --next with no open Changes produces an actionable result, exit 1", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x", "changes/.gitkeep": "" });
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 1);
  assert.match(out, /No open Change found/);
});

