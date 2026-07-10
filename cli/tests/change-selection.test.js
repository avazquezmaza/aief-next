import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { matchChanges } from "../src/core/domain/change.js";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "aief.js");

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-selection-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}
function aief(cwd, args) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
// Two open Changes with distinct, non-substring-colliding names.
function twoOpenChanges() {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "add login"]);      // 0001-add-login
  aief(dir, ["new-change", "remove banner"]);  // 0002-remove-banner
  return dir;
}

// ---- matchChanges() unit tests (the one shared resolver) ----

test("matchChanges: deterministic tiers — exact name, then numeric id, then unique substring", () => {
  const dirs = ["changes/0001-add-login", "changes/0002-remove-banner", "changes/0012-add-login-page"];
  assert.deepEqual(matchChanges("0001-add-login", dirs), ["changes/0001-add-login"]);
  assert.deepEqual(matchChanges("2", dirs), ["changes/0002-remove-banner"]);
  assert.deepEqual(matchChanges("0002", dirs), ["changes/0002-remove-banner"]);
  assert.deepEqual(matchChanges("banner", dirs), ["changes/0002-remove-banner"]);
});

test("matchChanges: exact name wins over a substring collision", () => {
  const dirs = ["changes/0001-add-login", "changes/0012-add-login-page"];
  // "add-login" is a substring of both, but only 0001 matches it exactly.
  assert.deepEqual(matchChanges("0001-add-login", dirs), ["changes/0001-add-login"]);
  // A bare fragment that is a substring of two returns both (ambiguous).
  assert.deepEqual(matchChanges("add-login", dirs), ["changes/0001-add-login", "changes/0012-add-login-page"]);
});

test("matchChanges: unknown selector returns nothing; empty selector returns nothing", () => {
  const dirs = ["changes/0001-add-login"];
  assert.deepEqual(matchChanges("nope", dirs), []);
  assert.deepEqual(matchChanges("", dirs), []);
});

// ---- CLI behavior: the 12 required scenarios ----

test("1. zero open Changes: prompt and close report no open Change", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  const p = aief(dir, ["prompt"]);
  assert.equal(p.status, 1);
  assert.match(p.out, /No open Change found/);
  const c = aief(dir, ["close", "--yes"]);
  assert.equal(c.status, 1);
  assert.match(c.out, /No open Change found/);
});

test("2. one open Change: prompt and close target it implicitly (backward compatible)", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "only thing"]);
  const p = aief(dir, ["prompt"]);
  assert.equal(p.status, 0);
  assert.match(p.out, /0001-only-thing/);
  const c = aief(dir, ["close"]);
  assert.equal(c.status, 0);
  assert.match(c.out, /Change: changes\/0001-only-thing/);
});

test("3. two open Changes: mutating/composing commands refuse implicit selection", () => {
  const dir = twoOpenChanges();
  const p = aief(dir, ["prompt"]);
  assert.equal(p.status, 1);
  assert.match(p.out, /Multiple open Changes \(2\)/);
  assert.match(p.out, /- 0001-add-login/);
  assert.match(p.out, /- 0002-remove-banner/);
  assert.match(p.out, /--change <id>/);
  const c = aief(dir, ["close", "--yes"]);
  assert.equal(c.status, 1);
  assert.match(c.out, /Multiple open Changes/);
});

test("4. selection by numeric id", () => {
  const dir = twoOpenChanges();
  const p = aief(dir, ["prompt", "--change", "0001"]);
  assert.equal(p.status, 0);
  assert.match(p.out, /0001-add-login/);
  assert.doesNotMatch(p.out, /Work only on:\n\nchanges\/0002/);
});

test("5. selection by slug fragment", () => {
  const dir = twoOpenChanges();
  const p = aief(dir, ["prompt", "--change", "banner"]);
  assert.equal(p.status, 0);
  assert.match(p.out, /0002-remove-banner/);
});

test("6. non-existent id fails with an actionable list", () => {
  const dir = twoOpenChanges();
  const p = aief(dir, ["prompt", "--change", "9999"]);
  assert.equal(p.status, 1);
  assert.match(p.out, /No Change found matching "9999"/);
  assert.match(p.out, /0001-add-login/);
});

test("7. ambiguous selector fails and lists the candidates", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "add login"]);       // 0001-add-login
  aief(dir, ["new-change", "add login page"]);  // 0002-add-login-page
  const p = aief(dir, ["close", "--yes", "--change", "add-login"]);
  assert.equal(p.status, 1);
  assert.match(p.out, /Ambiguous --change "add-login" — 2 Changes match/);
  assert.match(p.out, /0001-add-login/);
  assert.match(p.out, /0002-add-login-page/);
});

test("8. prompt with multiple open Changes composes only the selected one", () => {
  const dir = twoOpenChanges();
  const p = aief(dir, ["prompt", "--change", "0002-remove-banner"]);
  assert.equal(p.status, 0);
  assert.match(p.out, /Work only on:\n\nchanges\/0002-remove-banner/);
  assert.doesNotMatch(p.out, /Work only on:\n\nchanges\/0001/);
});

test("9. verify --change checks and names exactly one Change", () => {
  const dir = twoOpenChanges();
  const v = aief(dir, ["verify", "--change", "0001-add-login"]);
  assert.equal(v.status, 0);
  assert.match(v.out, /Verified Change: changes\/0001-add-login/);
  assert.doesNotMatch(v.out, /0002-remove-banner/);
  // Whole-project verify still lists both and, being multi-open, does not name an active one.
  const all = aief(dir, ["verify"]);
  assert.match(all.out, /0001-add-login/);
  assert.match(all.out, /0002-remove-banner/);
  assert.match(all.out, /2 open Changes — select explicitly/);
});

test("10. close with multiple open Changes requires --change and then closes only it", () => {
  const dir = twoOpenChanges();
  // Make 0001 closable.
  fs.writeFileSync(path.join(dir, "changes", "0001-add-login", "tasks.md"), "# Tasks\n\n- [x] Done.\n");
  fs.writeFileSync(path.join(dir, "changes", "0001-add-login", "evidence.md"), "# Evidence\n\n## Summary\n\nReal.\n");
  const refused = aief(dir, ["close", "--yes"]);
  assert.equal(refused.status, 1);
  assert.match(refused.out, /Multiple open Changes/);
  const closed = aief(dir, ["close", "--yes", "--change", "0001-add-login"]);
  assert.equal(closed.status, 0);
  assert.match(closed.out, /✓ Closed changes\/0001-add-login/);
  // 0002 remains open and is now the only open Change.
  assert.match(fs.readFileSync(path.join(dir, "changes", "0002-remove-banner", "change.md"), "utf8"), /## Type/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, "changes", "0002-remove-banner", "change.md"), "utf8"), /## Status\n\nClosed/);
});

test("11. no mutating command silently selects the latest open Change", () => {
  const dir = twoOpenChanges();
  // The chronologically latest open Change is 0002; ensure nothing picks it by default.
  const p = aief(dir, ["prompt"]);
  assert.equal(p.status, 1);
  assert.doesNotMatch(p.out, /Copy this prompt/);
  const pf = aief(dir, ["propose", "--change", "nonexistent-xyz"]);
  assert.equal(pf.status, 1);
  assert.match(pf.out, /No Change found matching/);
  // status must not label either open Change as "active".
  const s = aief(dir, ["status"]);
  assert.doesNotMatch(s.out, /active/i);
  assert.match(s.out, /Multiple Changes in progress/);
});

test("12. backward compatibility: single-open repos keep classic ergonomics end to end", () => {
  const dir = makeProject({ "README.md": "x", "AGENTS.md": "x" });
  aief(dir, ["new-change", "thing"]);
  const p = aief(dir, ["prompt"]);
  assert.equal(p.status, 0);
  assert.match(p.out, /0001-thing/);
  fs.writeFileSync(path.join(dir, "changes", "0001-thing", "tasks.md"), "# Tasks\n\n- [x] Done.\n");
  fs.writeFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "# Evidence\n\n## Summary\n\nReal.\n");
  const c = aief(dir, ["close", "--yes"]);
  assert.equal(c.status, 0);
  assert.match(c.out, /✓ Closed changes\/0001-thing/);
  const v = aief(dir, ["verify"]);
  assert.equal(v.status, 0);
  assert.match(v.out, /Result: PASS/);
});

test("status lists all open Changes and flags multiplicity", () => {
  const dir = twoOpenChanges();
  const s = aief(dir, ["status"]);
  assert.equal(s.status, 0);
  assert.match(s.out, /Open Changes: 2/);
  assert.match(s.out, /- 0001-add-login/);
  assert.match(s.out, /- 0002-remove-banner/);
  assert.match(s.out, /aief prompt --change <id>/);
});
