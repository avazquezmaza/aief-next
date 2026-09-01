import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

// --- Nested bootstrap protection (Change 0078) ---------------------------

test("bootstrap from the actual project root is unchanged", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /Bootstrap complete/);
  assert.ok(fs.existsSync(path.join(dir, "AGENTS.md")));
});

test("bootstrap from a fresh, unrelated directory with no AIEF ancestor anywhere is unchanged", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /Bootstrap complete/);
});

test("bootstrap from a subdirectory of an already-bootstrapped project refuses and creates nothing (Change 0078)", () => {
  const root = makeProject();
  aief(root, ["bootstrap"]);
  const sub = path.join(root, "src");
  fs.mkdirSync(sub, { recursive: true });
  const { status, out } = aief(sub, ["bootstrap"]);
  assert.equal(status, 1);
  assert.match(out, /already exists at/i);
  assert.ok(!fs.existsSync(path.join(sub, "AGENTS.md")), "no nested AGENTS.md should be created");
  assert.ok(!fs.existsSync(path.join(sub, "changes")), "no nested changes/ should be created");
});

test("bootstrap --force in that same subdirectory proceeds, creating the nested structure explicitly (Change 0078)", () => {
  const root = makeProject();
  aief(root, ["bootstrap"]);
  const sub = path.join(root, "src");
  fs.mkdirSync(sub, { recursive: true });
  const { status, out } = aief(sub, ["bootstrap", "--force"]);
  assert.equal(status, 0);
  assert.match(out, /Bootstrap complete/);
  assert.ok(fs.existsSync(path.join(sub, "AGENTS.md")), "--force should still create the nested structure, explicitly opted into");
});

test("bootstrap re-run in an already-bootstrapped directory (idempotency) is unaffected by the ancestor guard", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /already exists|already bootstrapped/i);
});

test("bootstrap <name> (new project elsewhere) is unaffected by the ancestor guard even from inside an already-bootstrapped project", () => {
  const root = makeProject();
  aief(root, ["bootstrap"]);
  const { status, out } = aief(root, ["bootstrap", "new-elsewhere-project"]);
  assert.equal(status, 0);
  assert.match(out, /Created AIEF project/);
  assert.ok(fs.existsSync(path.join(root, "new-elsewhere-project", "AGENTS.md")));
});

// --- Change 0084: end-to-end pre-implementation Definition flow ---

const E2E_PRD_README = `# Fleet Maintenance Portal — Product Requirements

## Context

Regional trucking operators currently track vehicle maintenance across spreadsheets and paper
logs. This project will let fleet managers schedule, record, and audit maintenance work for every
vehicle in their fleet from a single web application.

## Unresolved Concerns

- Multi-tenancy isolation model is not yet decided.
- Authentication (per-company SSO vs. our own login) is not yet decided.
- RBAC permission matrix is not yet defined.
- Data retention period and storage technology are not yet decided.
- Deployment region/on-premise requirements are not yet decided.
- Whether to integrate with existing fleet-telematics systems is unresolved.
- Audit/regulatory reporting requirements are unresolved.
- No SLA has been discussed with any customer yet.
- Expected scale (tenants, vehicles, concurrent users) is unknown.
`;

test("end-to-end: a PRD-only repository flows through bootstrap -> analyze (Definition) -> enrichment -> human gate -> durable decision -> strict verify -> close, without ever creating an Analysis Change or application code", () => {
  const dir = makeProject({ "README.md": E2E_PRD_README });

  const bootstrap = aief(dir, ["bootstrap"]);
  assert.equal(bootstrap.status, 0);

  const analyze = aief(dir, ["analyze"]);
  assert.equal(analyze.status, 0);
  assert.match(analyze.out, /Detected maturity: Definition/);
  const changeDir = path.join(dir, "changes", "0002-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nDefinition/);

  // Enrichment: fill in a Decisions Required entry and its Recommendation, marked (human).
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd
    .replace("## Context\n\n-", "## Context\n\nReplaces spreadsheets/paper logs with one multi-tenant web app.")
    .replace("## Decisions Required\n\n-", "## Decisions Required\n\n- Multi-tenancy isolation model. (decision required)")
    .replace("## Recommendation\n\n-", "## Recommendation\n\n- Shared schema with row-level security. (human)");
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");

  const midStatus = aief(dir, ["status", "--change", "0002-analyze-current-architecture"]);
  assert.match(midStatus.out, /Decision required: 1 item\(s\)/);
  assert.match(midStatus.out, /Human approval required: 1 item\(s\)/);

  const midStrict = aief(dir, ["verify", "--strict", "--change", "0002-analyze-current-architecture"]);
  assert.equal(midStrict.status, 1, "an approved-but-not-yet-recorded decision must still fail strict verification");
  assert.match(midStrict.out, /\[strict\] Decisions Required has content but Decision \(human\) records no outcome yet/);
  assert.match(midStrict.out, /\[strict\] unresolved required human decision/);

  // Human gate: approve, record the durable decision, fill Requirements, check off tasks.
  changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd.replace(
    "## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.",
    "## Decision (human)\n\nApproved 2026-08-14 by the project owner: shared schema with row-level security."
  );
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");

  // bootstrap does not create knowledge/decisions.md itself (it is a project-authored ledger,
  // not scaffolded structure) — recording a durable decision means creating or appending to it.
  const decisionsPath = path.join(dir, "knowledge", "decisions.md");
  const decisionsBefore = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, "utf8") : "# Decisions\n";
  fs.writeFileSync(decisionsPath, `${decisionsBefore}\n\n## ADR-001: Multi-tenancy — shared schema with row-level security\n\nApproved 2026-08-14. See changes/0002-analyze-current-architecture.\n`, "utf8");

  let specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  specMd = specMd.replace("## Requirements\n\n-", "## Requirements\n\n- Multi-tenant shared-schema data model with row-level tenant isolation.");
  fs.writeFileSync(path.join(changeDir, "spec.md"), specMd, "utf8");

  let tasksMd = fs.readFileSync(path.join(changeDir, "tasks.md"), "utf8");
  tasksMd = tasksMd.replace(/- \[ \] /g, "- [x] ");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), tasksMd, "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nMulti-tenancy isolation decided and recorded. Real work performed and verified end-to-end.\n", "utf8");

  const finalStrict = aief(dir, ["verify", "--strict", "--change", "0002-analyze-current-architecture"]);
  assert.equal(finalStrict.status, 0, "once approved, recorded, and completed, strict verification must pass");

  const close = aief(dir, ["close", "--yes", "--change", "0002-analyze-current-architecture"]);
  assert.equal(close.status, 0);

  // Never an Analysis Change, never application code.
  assert.ok(!fs.existsSync(path.join(dir, "src")), "a Definition flow must never create application source as a side effect");
  const finalChangeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  assert.doesNotMatch(finalChangeMd, /## Type\n\nAnalysis/);
});

test("end-to-end regression: a real implemented Node app is unaffected by the maturity-routing addition (still routes to Analysis, no Definition note)", () => {
  const dir = makeProject({
    "README.md": E2E_PRD_README,
    "package.json": JSON.stringify({ name: "fleet-portal", dependencies: { express: "^4.0.0" } }),
    "src/index.js": "import express from \"express\";\nconst app = express();\napp.listen(3000);\n"
  });
  aief(dir, ["bootstrap"]);
  const analyze = aief(dir, ["analyze"]);
  assert.equal(analyze.status, 0);
  assert.doesNotMatch(analyze.out, /Detected maturity: Definition/);
  const changeDir = path.join(dir, "changes", "0002-analyze-current-architecture");
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Type\n\nAnalysis/);
});
