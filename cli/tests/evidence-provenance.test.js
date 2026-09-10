import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildProvenance, renderProvenance, gitCommitAt, sha256Of } from "../src/core/domain/evidence-provenance.js";

function git(cwd, args) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

function makeGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-provenance-"));
  git(dir, ["init", "-q"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, "x.txt"), "x", "utf8");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

test("sha256Of: deterministic and content-sensitive", () => {
  const a = sha256Of("hello");
  const b = sha256Of("hello");
  const c = sha256Of("hello!");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("gitCommitAt: returns the real HEAD sha inside a git work tree", () => {
  const dir = makeGitRepo();
  const expected = git(dir, ["rev-parse", "HEAD"]).stdout.trim();
  assert.equal(gitCommitAt(dir), expected);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("gitCommitAt: returns null, never throws, outside a git work tree", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-no-git-"));
  assert.equal(gitCommitAt(dir), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("buildProvenance: hashes the exact content passed, not a re-read of anything on disk", () => {
  const dir = makeGitRepo();
  const record = buildProvenance("report.xml", "<testsuites/>", "aief close --evidence-from", "junit-xml", dir);
  assert.equal(record.source, "report.xml");
  assert.equal(record.sourceDigest, `sha256:${sha256Of("<testsuites/>")}`);
  assert.equal(record.gitCommit, git(dir, ["rev-parse", "HEAD"]).stdout.trim());
  assert.equal(record.verificationType, "junit-xml");
  assert.match(record.producer, /^aief close --evidence-from \(aief .+\)$/);
  assert.ok(!Number.isNaN(Date.parse(record.capturedAt)), "capturedAt must be a valid, parseable timestamp");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("buildProvenance: gitCommit is null (never fabricated) outside a git work tree", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-no-git-"));
  const record = buildProvenance("report.xml", "<testsuites/>", "aief close --evidence-from", "junit-xml", dir);
  assert.equal(record.gitCommit, null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("renderProvenance: every field appears, with a fixed, greppable label per line", () => {
  const record = {
    source: "report.xml",
    sourceDigest: "sha256:abc123",
    gitCommit: "deadbeef",
    capturedAt: "2026-09-09T00:00:00.000Z",
    producer: "aief close --evidence-from (aief 3.3.0)",
    verificationType: "junit-xml"
  };
  const rendered = renderProvenance(record);
  assert.match(rendered, /^\*\*Provenance:\*\*$/m);
  assert.match(rendered, /^- Source: `report\.xml`$/m);
  assert.match(rendered, /^- SHA-256: `sha256:abc123`$/m);
  assert.match(rendered, /^- Git commit: `deadbeef`$/m);
  assert.match(rendered, /^- Captured at: 2026-09-09T00:00:00\.000Z$/m);
  assert.match(rendered, /^- Producer: aief close --evidence-from \(aief 3\.3\.0\)$/m);
  assert.match(rendered, /^- Verification type: junit-xml$/m);
});

test("renderProvenance: a null gitCommit renders an explanatory value, never a blank or a crash", () => {
  const rendered = renderProvenance({
    source: "report.xml", sourceDigest: "sha256:abc123", gitCommit: null,
    capturedAt: "2026-09-09T00:00:00.000Z", producer: "x", verificationType: "junit-xml"
  });
  assert.match(rendered, /^- Git commit: unknown \(not inside a git work tree, or no commits yet\)$/m);
});
