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

// AIEF Core 3.0, Entrega 1 (Change 0043) — status reads an optional
// manifest.json when a Change has one. change.md carries no ## Status
// section here on purpose: under legacy-only inference this Change would
// read as open. The manifest is authoritative (no merge), so status must
// list it as closed instead — proving the wiring end-to-end through the
// real CLI binary, not just through the domain-layer unit tests.
test("status honors a Change's manifest.json over legacy inference (no ## Status in change.md)", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "manifest-thing"]);
  const changeDir = path.join(dir, "changes", "0001-manifest-thing");
  assert.doesNotMatch(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status/);
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1",
    id: "0001",
    slug: "manifest-thing",
    title: "Manifest thing",
    status: "closed"
  }), "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Open Changes/);
});

// Regression test for Change 0043's independent review, finding B1: close
// used to share isClosed() (manifest-aware) between openChangeDirs() and
// markClosed()'s own write-verification. A Change carrying a manifest.json
// with status "open" would then have close --yes write "Closed" to
// change.md, immediately followed by markClosed() re-checking the
// (untouched) manifest and reporting the write as a failure — exit code 1
// on a command that had, in fact, just succeeded.
test("close --yes succeeds and updates change.md even when the Change carries a manifest.json (B1 regression)", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "manifest-close-thing"]);
  const changeDir = path.join(dir, "changes", "0001-manifest-close-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1",
    id: "0001",
    slug: "manifest-close-thing",
    title: "Manifest close thing",
    status: "open"
  }), "utf8");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 0);
  assert.match(out, /✓ Closed changes\/0001-manifest-close-thing/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
});

// AIEF Core 3.0, Entrega 2 (Change 0044, WF-R1–WF-R4 — H2 hardening).
// A present-but-invalid manifest.json must be visibly distinct from both "no
// manifest" (legacy) and "valid manifest" — never silently merged into a
// plain "Open Changes" entry with no indication anything is wrong.
test("status reports a malformed manifest.json as invalid, with the exact parse error, not silently as a healthy Change", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "broken-manifest"]);
  const changeDir = path.join(dir, "changes", "0001-broken-manifest");
  const rawManifest = "{ this is not valid json";
  fs.writeFileSync(path.join(changeDir, "manifest.json"), rawManifest, "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
  assert.match(out, /0001-broken-manifest/);
  assert.match(out, /manifest\.json: manifest\.json is not valid JSON/);
  // Not repaired, not deleted, not rewritten — status is read-only (WF-R4).
  assert.equal(fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8"), rawManifest);
});

test("status reports a structurally invalid manifest.json (valid JSON, missing required fields) with one message per problem", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "incomplete-manifest"]);
  const changeDir = path.join(dir, "changes", "0001-incomplete-manifest");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({ schema: "aief.change/v1" }), "utf8");
  const { status, out } = aief(dir, ["status"]);
  assert.equal(status, 0);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
  assert.match(out, /id: is required/);
  assert.match(out, /slug: is required/);
  assert.match(out, /title: is required/);
  assert.match(out, /status: must be "open" or "closed"/);
});

test("status does not fall back silently to legacy for an invalid manifest — the Change still shows in Open Changes too, per design.md §4", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "invalid-but-open"]);
  const changeDir = path.join(dir, "changes", "0001-invalid-but-open");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), "not json at all", "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Open Changes: 1/);
  assert.match(out, /- 0001-invalid-but-open/);
  assert.match(out, /Changes with an invalid manifest\.json: 1/);
});

test("status output for a Change with no manifest.json, or a valid one, is unaffected by H2's new section", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "plain-legacy-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.doesNotMatch(out, /invalid manifest/);
});

// AIEF Core 3.0, Entrega 2 (Change 0044) — Workflow Engine, integration with
// `status`. A Change without every required file cannot pass the "readiness"
// gate, so Lite's next action is "verify", never "close".
test("status shows a Lite Change's stage/blockers when readiness fails", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "lite-thing"]);
  const changeDir = path.join(dir, "changes", "0001-lite-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "lite-thing", title: "Lite thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Workflow status: 1/);
  assert.match(out, /0001-lite-thing \(track: lite\)/);
  assert.match(out, /Stage: verify/);
  assert.match(out, /Next: verify/);
  assert.match(out, /Blockers:/);
  assert.match(out, /readiness: failed/);
});

test("status shows a Lite Change resolving to close when readiness passes", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "lite-ready"]);
  const changeDir = path.join(dir, "changes", "0001-lite-ready");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "lite-ready", title: "Lite ready", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: close/);
  assert.match(out, /Next: close/);
  assert.doesNotMatch(out, /Blockers:/);
});

// Standard can never show "Next: close" through this Entrega's engine — the
// review gate has no automated evaluator yet (WF-R14), even when every other
// gate passes.
test("status never shows Standard resolving to close — review has no evaluator yet", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "standard-thing"]);
  const changeDir = path.join(dir, "changes", "0001-standard-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "standard-thing", title: "Standard thing", status: "open", track: "standard"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: review/);
  assert.doesNotMatch(out, /Next: close/);
  assert.match(out, /No automated evaluator yet \(planned for Entrega 7\)/);
});

// Governed represents approval/security_review/review as pending
// capabilities — none can ever appear as "passed" through this Entrega.
test("status represents Governed's approval/security_review/review gates as pending, never passed", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "governed-thing"]);
  const changeDir = path.join(dir, "changes", "0001-governed-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "governed-thing", title: "Governed thing", status: "open", track: "governed"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: approval/);
  assert.match(out, /approval: pending/);
  assert.doesNotMatch(out, /: passed/);
});

test("status reports an unrecognized track distinctly from an invalid manifest", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "custom-track-thing"]);
  const changeDir = path.join(dir, "changes", "0001-custom-track-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "custom-track-thing", title: "Custom track thing", status: "open", track: "custom"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Changes with an unrecognized or broken workflow track: 1/);
  assert.match(out, /unknown track "custom"/);
  assert.doesNotMatch(out, /invalid manifest\.json/);
});

test("status shows a warning (identity mismatch) without blocking Lite from reaching close", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "warn-thing"]);
  const changeDir = path.join(dir, "changes", "0001-warn-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "a-totally-different-slug", title: "Warn thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /Stage: close/);
  assert.doesNotMatch(out, /Blockers:/);
  assert.match(out, /Warnings:/);
  assert.match(out, /identity: warning/);
});

// WF-R20 / design.md §9: close's readiness gate is deliberately blind to the
// Workflow Engine in this Entrega, even for a Governed Change with a
// permanently-pending "approval" gate — this is the approved scope boundary
// (commissioning instruction: "no intentes corregir ese límite
// indirectamente"), not an oversight. This test documents the boundary so a
// future Entrega that changes it does so as a visible, deliberate decision.
test("close succeeds on a Governed Change even though its 'approval' workflow gate is permanently pending — close stays blind to the Workflow Engine by design", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "governed-close-boundary"]);
  const changeDir = path.join(dir, "changes", "0001-governed-close-boundary");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  const manifestBefore = JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "governed-close-boundary", title: "Governed close boundary", status: "open", track: "governed"
  });
  fs.writeFileSync(path.join(changeDir, "manifest.json"), manifestBefore, "utf8");

  const preClose = aief(dir, ["status"]);
  assert.match(preClose.out, /Stage: approval/);
  assert.match(preClose.out, /Blockers:/);

  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(closed.out, /✓ Closed changes\/0001-governed-close-boundary/);
  // manifest.json is never touched by close (B1 non-repetition, extended to
  // the Workflow Engine's own fields) — still "open", still "governed".
  assert.equal(fs.readFileSync(path.join(changeDir, "manifest.json"), "utf8"), manifestBefore);
});

// AIEF Core 3.0, Entrega 3 (Change 0045) — SDD Provider, status integration.
test("status shows SDD provider/change/readiness for a Change with an explicit local sdd.provider", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "sdd-local-thing"]);
  const changeDir = path.join(dir, "changes", "0001-sdd-local-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "sdd-local-thing", title: "SDD local thing", status: "open",
    sdd: { provider: "local" }
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  assert.match(out, /SDD provider status: 1/);
  assert.match(out, /0001-sdd-local-thing/);
  assert.match(out, /SDD provider: local/);
  assert.match(out, /SDD change: 0001-sdd-local-thing/);
  // new-change's own generated files are non-empty templates, so local
  // readiness is "ready" here — evidenceState/placeholder classification is
  // change-verifier.js's own separate concern, unaffected by this Entrega.
  assert.match(out, /SDD readiness: ready/);
});

test("status reports an explicit but unavailable SDD provider as an error, never a silent fallback to local", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "sdd-unavailable-thing"]);
  const changeDir = path.join(dir, "changes", "0001-sdd-unavailable-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "sdd-unavailable-thing", title: "SDD unavailable thing", status: "open",
    sdd: { provider: "openspec" }
  }), "utf8");
  const { out } = aief(dir, ["status"], { PATH: path.dirname(process.execPath) });
  assert.match(out, /SDD provider status: 1/);
  assert.match(out, /configured provider "openspec" is unavailable/);
  assert.doesNotMatch(out, /SDD provider: local/);
});

test("status output is unaffected by SDD when no Change declares manifest.sdd", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "plain-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.doesNotMatch(out, /SDD provider/);
});

// AIEF Core 3.0, Entrega 4 (Change 0046, ADR-018 §1) — the bottom-line "Next:"
// suggestion and the "Workflow status" block's own "Next:" line must never
// disagree for a single, track-carrying open Change (the exact discrepancy
// this Entrega's consolidation exists to eliminate).
test("status's bottom-line suggestion agrees with the Workflow status block's own next action (no more discrepancy)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "consolidated-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-consolidated-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "consolidated-next-thing", title: "Consolidated next thing", status: "open", track: "lite"
  }), "utf8");
  const { out } = aief(dir, ["status"]);
  // Workflow status block: readiness fails (evidence.md/tasks.md are still
  // untouched templates) -> Stage: verify, blocked.
  assert.match(out, /Stage: verify/);
  assert.match(out, /Next: verify/);
  // Bottom-line suggestion (previously a hardcoded "aief prompt", unrelated
  // to the block above) must now be the exact same derived command
  // workflowService.nextAction() produces for a blocked stage.
  assert.match(out, /\nNext:\n {2}aief status --change 0001-consolidated-next-thing --next\n/);
  assert.doesNotMatch(out, /\nNext:\n {2}aief prompt\n/, "must not fall back to the old, unconditional 'aief prompt' suggestion");
});

test("status's bottom-line suggestion for a legacy Change (no track) is completely unchanged", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "legacy-thing"]);
  const { out } = aief(dir, ["status"]);
  assert.match(out, /\nNext:\n {2}aief prompt\n/);
});

// AIEF Core 3.0, Entrega 4 (Change 0046) — `aief status --change <id>` /
// `--next`, Path B's entire CLI-facing surface (ADR-018). No new command.
test("status --change <id> shows a deep, read-only view of one Change (track, stage, blockers, SDD)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "deep-view-thing"]);
  const changeDir = path.join(dir, "changes", "0001-deep-view-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "deep-view-thing", title: "Deep view thing", status: "open",
    track: "standard", sdd: { provider: "local" }
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-deep-view-thing"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-deep-view-thing/);
  assert.match(out, /Track: standard/);
  assert.match(out, /Stage: verify/);
  assert.match(out, /Blockers:/);
  assert.match(out, /SDD provider: local/);
  assert.match(out, /SDD readiness: ready/);
});

test("status --change <id> --next shows the compact Normalized Action view, exit 0 even when blocked", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "compact-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-compact-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "compact-next-thing", title: "Compact next thing", status: "open", track: "lite"
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--change", "0001-compact-next-thing", "--next"]);
  assert.equal(status, 0, "blocked is a successfully-answered query — exit 0, not 1 (ADR-018 §3)");
  assert.match(out, /Next action:/);
  assert.match(out, /status: blocked/);
  assert.match(out, /id: verify/);
});

test("status --next (no --change) infers the single open Change deterministically", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "implicit-next-thing"]);
  const changeDir = path.join(dir, "changes", "0001-implicit-next-thing");
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "implicit-next-thing", title: "Implicit next thing", status: "open", track: "lite"
  }), "utf8");
  const { status, out } = aief(dir, ["status", "--next"]);
  assert.equal(status, 0);
  assert.match(out, /Change: changes\/0001-implicit-next-thing/);
});

// Change 0059/ADR-029: superseding this test's original assertion is a
// deliberate, documented behavior change, not a silent edit — see
// change.md "Deliberate, documented behavior change" and evidence.md. Both
// Changes here are dependency-free, track-free, and open — both eligible —
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

