import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classifyMaturity } from "../src/core/domain/project-maturity.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const PRD_TEXT = `# Product Requirements

## Context

This project will let internal support agents look up a customer's account
history across three legacy systems from a single screen, replacing the
current process of opening each legacy system separately for every ticket.

## Stakeholders

Support operations, Engineering, Compliance.

## Constraints

Must integrate with the existing SSO provider. Must retain audit logs for
seven years. No new legacy system integrations may be added without
Compliance sign-off.

## Open Questions

Which legacy systems are in scope for the first release? What is the
expected concurrent user count?
`;

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-maturity-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

test("classifyMaturity: PRD only -> definition", () => {
  const dir = makeProject({ "README.md": PRD_TEXT });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "definition");
  assert.equal(result.sourceFiles.length, 0);
});

test("classifyMaturity: PRD + tooling-only metadata (package.json, no src) -> definition", () => {
  const dir = makeProject({
    "README.md": PRD_TEXT,
    "package.json": JSON.stringify({ name: "future-app", version: "0.0.0", devDependencies: { eslint: "^9.0.0", prettier: "^3.0.0" } })
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "definition");
});

test("classifyMaturity: real Node app -> implemented", () => {
  const dir = makeProject({
    "README.md": PRD_TEXT,
    "package.json": JSON.stringify({ name: "app", dependencies: { express: "^4.0.0" } }),
    "src/index.js": "import express from \"express\";\n\nconst app = express();\napp.get(\"/\", (req, res) => res.send(\"ok\"));\napp.listen(3000);\n"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "implemented");
  assert.ok(result.sourceFiles.includes(path.join("src", "index.js")));
});

test("classifyMaturity: real non-Node app (Python) -> implemented", () => {
  const dir = makeProject({
    "README.md": PRD_TEXT,
    "requirements.txt": "flask==3.0.0\n",
    "src/app.py": "from flask import Flask\n\napp = Flask(__name__)\n\n@app.route(\"/\")\ndef index():\n    return \"ok\"\n"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "implemented");
});

test("classifyMaturity: sparse ambiguous repo -> ambiguous", () => {
  const dir = makeProject({ "README.md": "# TODO\n" });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});

test("classifyMaturity: a totally empty directory -> ambiguous", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-maturity-empty-"));
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});

test("classifyMaturity: AIEF itself -> implemented", () => {
  const result = classifyMaturity(REPO_ROOT);
  assert.equal(result.maturity, "implemented");
  assert.ok(result.sourceFiles.length > 0);
});

test("classifyMaturity: source files win over rich definition content (a well-documented implemented project is still implemented)", () => {
  const dir = makeProject({
    "README.md": PRD_TEXT,
    "src/index.js": "export function main() {\n  return 42;\n}\n\nmain();\n"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "implemented");
});

test("classifyMaturity: tooling config files under src/ do not count as source", () => {
  const dir = makeProject({
    "README.md": "short",
    "src/webpack.config.js": "module.exports = { mode: \"production\" };\n"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});

test("classifyMaturity: substantial PRD content under docs/ (short root README) -> definition (Change 0085)", () => {
  const dir = makeProject({
    "README.md": "Fleet Maintenance Portal. See docs for details.",
    "docs/prd.md": PRD_TEXT,
    "docs/security.md": "Authentication must integrate with per-tenant SSO. Authorization must be enforced server-side. ".repeat(5),
    "docs/architecture-options.md": "Option A: shared schema with row-level security. Option B: schema-per-tenant. ".repeat(5)
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "definition");
  assert.ok(result.definitionFiles.includes("docs/prd.md"));
  assert.ok(result.definitionFiles.includes("docs/security.md"));
});

test("classifyMaturity: documentation/ (alternate directory name) is also scanned", () => {
  const dir = makeProject({
    "README.md": "short",
    "documentation/prd.md": PRD_TEXT
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "definition");
});

test("classifyMaturity: docs/ scanning is one level only — a nested docs/adr/ subdirectory is not scanned", () => {
  const dir = makeProject({
    "README.md": "short",
    "docs/adr/0001-something.md": PRD_TEXT
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});

test("classifyMaturity: non-.md/.txt files under docs/ (e.g. an image) do not count", () => {
  const dir = makeProject({
    "README.md": "short",
    "docs/diagram.svg": "<svg>" + "x".repeat(200) + "</svg>"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});

test("classifyMaturity: docs/ content never overrides real source (implemented still wins)", () => {
  const dir = makeProject({
    "README.md": "short",
    "docs/prd.md": PRD_TEXT,
    "src/index.js": "export function main() {\n  return 42;\n}\n\nmain();\n"
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "implemented");
});

test("classifyMaturity: node_modules is never scanned for source signal", () => {
  const dir = makeProject({
    "README.md": "short",
    "src/node_modules/some-dep/index.js": "module.exports = () => {};\n".repeat(5)
  });
  const result = classifyMaturity(dir);
  assert.equal(result.maturity, "ambiguous");
});
