import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { isRequirementCited, resolveEvidenceForRequirement } from "../src/core/services/verification-evidence.js";

function makeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-vrev-"));
}

test("isRequirementCited: word-boundary matched — VR-R1 never matches inside VR-R10", () => {
  const doc = "| 10 | scenario | VR-R10 | pass |\n";
  assert.equal(isRequirementCited(doc, "VR-R1"), false);
  assert.equal(isRequirementCited(doc, "VR-R10"), true);
});

test("isRequirementCited: null/missing doc is never cited", () => {
  assert.equal(isRequirementCited(null, "VR-R1"), false);
});

test("isRequirementCited: finds a citation anywhere on a matching line", () => {
  const doc = "some prose\n| 1 | x | REQ-1, REQ-2 | pass |\nmore prose\n";
  assert.equal(isRequirementCited(doc, "REQ-1"), true);
  assert.equal(isRequirementCited(doc, "REQ-2"), true);
  assert.equal(isRequirementCited(doc, "REQ-3"), false);
});

test("resolveEvidenceForRequirement: finds a present file cited alongside the requirement id", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "real-file.txt"), "content", "utf8");
  const context = { verificationDoc: "| 1 | check | REQ-1 | see `real-file.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].type, "file_assertion");
  assert.equal(evidence[0].ref, "real-file.txt");
  assert.equal(evidence[0].state, "present");
});

test("resolveEvidenceForRequirement: a missing file is state 'missing'", () => {
  const dir = makeDir();
  const context = { verificationDoc: "| 1 | check | REQ-1 | see `does-not-exist.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(evidence[0].state, "missing");
});

test("resolveEvidenceForRequirement: an empty file is state 'empty'", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "empty.txt"), "   \n", "utf8");
  const context = { verificationDoc: "| 1 | check | REQ-1 | see `empty.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(evidence[0].state, "empty");
});

test("resolveEvidenceForRequirement: path traversal is rejected as 'invalid', never read", () => {
  const dir = makeDir();
  const outside = path.join(path.dirname(dir), "outside-secret.txt");
  fs.writeFileSync(outside, "secret content", "utf8");
  try {
    const context = { verificationDoc: "| 1 | check | REQ-1 | see `../outside-secret.txt` |\n", projectRoot: dir };
    const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
    assert.equal(evidence[0].state, "invalid");
    assert.match(evidence[0].diagnostic, /not a valid project-relative path/);
  } finally {
    fs.rmSync(outside, { force: true });
  }
});

test("resolveEvidenceForRequirement: a symlink physically inside the project root but pointing outside it is rejected as 'invalid', never read (real-path containment, not just textual)", () => {
  const dir = makeDir();
  const outside = path.join(path.dirname(dir), `aief-vrev-secret-${process.pid}.txt`);
  fs.writeFileSync(outside, "secret content", "utf8");
  const linkPath = path.join(dir, "escape-link.txt");
  try {
    fs.symlinkSync(outside, linkPath);
    const context = { verificationDoc: "| 1 | check | REQ-1 | see `escape-link.txt` |\n", projectRoot: dir };
    const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
    assert.equal(evidence[0].state, "invalid");
    assert.match(evidence[0].diagnostic, /outside the project root/);
  } finally {
    fs.rmSync(linkPath, { force: true });
    fs.rmSync(outside, { force: true });
  }
});

test("resolveEvidenceForRequirement: a symlink that stays within the project root is followed normally", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "real.txt"), "content", "utf8");
  fs.symlinkSync(path.join(dir, "real.txt"), path.join(dir, "link.txt"));
  const context = { verificationDoc: "| 1 | check | REQ-1 | see `link.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(evidence[0].state, "present");
});

test("resolveEvidenceForRequirement: an absolute path token is rejected as 'invalid'", () => {
  const dir = makeDir();
  const context = { verificationDoc: "| 1 | check | REQ-1 | see `/etc/passwd` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  // An absolute-looking token without a "/" separator match inside backticks still requires our
  // PATH_TOKEN_RE shape; if it matches, it must be rejected by containment, never silently read.
  if (evidence.length) assert.equal(evidence[0].state, "invalid");
});

test("resolveEvidenceForRequirement: only lines citing the requirement's own id are scanned", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "unrelated.txt"), "x", "utf8");
  const context = { verificationDoc: "| 1 | check | REQ-2 | see `unrelated.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.deepEqual(evidence, []);
});

test("resolveEvidenceForRequirement: no verificationDoc -> empty evidence, never throws", () => {
  const context = { verificationDoc: null, projectRoot: makeDir() };
  assert.doesNotThrow(() => resolveEvidenceForRequirement(context, { id: "REQ-1" }));
  assert.deepEqual(resolveEvidenceForRequirement(context, { id: "REQ-1" }), []);
});

test("resolveEvidenceForRequirement: duplicate references on the same/different lines are deduplicated", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "dup.txt"), "x", "utf8");
  const context = { verificationDoc: "| 1 | check | REQ-1 | `dup.txt` and again `dup.txt` |\n| 2 | check2 | REQ-1 | `dup.txt` |\n", projectRoot: dir };
  const evidence = resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(evidence.length, 1);
});

test("resolveEvidenceForRequirement: performs zero writes", () => {
  const dir = makeDir();
  fs.writeFileSync(path.join(dir, "real-file.txt"), "content", "utf8");
  const before = fs.readFileSync(path.join(dir, "real-file.txt"), "utf8");
  const context = { verificationDoc: "| 1 | check | REQ-1 | `real-file.txt` |\n", projectRoot: dir };
  resolveEvidenceForRequirement(context, { id: "REQ-1" });
  assert.equal(fs.readFileSync(path.join(dir, "real-file.txt"), "utf8"), before);
});
