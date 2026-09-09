import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Change 0128 — architecture fitness functions. docs/architecture.md's layer
// model (CLI Commands -> Application Services -> Domain Models/Registries &
// Providers -> Repository) is enforced by eslint.config.js, not only
// documented. These tests exercise the ESLint config itself (via its Node
// API, not by shelling out to `npm run lint`) against synthetic source that
// deliberately violates each invariant — a probe file, never written to
// disk, matched against the real config's `files` globs via `filePath`.
const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// `eslint` is a devDependency, deliberately NOT installed in CI's plain
// `npm test` job — docs/maintainer.md states this explicitly ("runtime
// tests use Node 22 and 24 without installing ESLint"), because this CLI
// has zero runtime dependencies and that job proves it. These tests still
// run wherever devDependencies ARE installed (a local `npm ci && npm test`,
// or any environment that ran `npm ci` first) — skipped, not failed,
// everywhere else. The rules themselves are still fully enforced on every
// push/PR regardless, by the separate `lint` CI job, which does run
// `npm ci` and lints the entire `src` tree including these three rules.
let ESLint = null;
try {
  ({ ESLint } = await import("eslint"));
} catch {
  // not installed in this environment — tests below skip themselves
}
const skip = ESLint ? false : "eslint (devDependency) is not installed in this environment — expected in CI's plain test job; see docs/maintainer.md";

async function lint(virtualPath, source) {
  const eslint = new ESLint({ overrideConfigFile: path.join(CLI_ROOT, "eslint.config.js"), cwd: CLI_ROOT });
  const [result] = await eslint.lintText(source, { filePath: path.join(CLI_ROOT, virtualPath) });
  return result.messages;
}

test("architecture fitness: a Domain Model importing an Application Service is a lint error", { skip }, async () => {
  const messages = await lint(
    "src/core/domain/__probe.js",
    'import { checkChangeReadiness } from "../services/change-verifier.js";\nexport const x = checkChangeReadiness;\n'
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "no-restricted-imports");
  assert.match(messages[0].message, /Domain Models must not import Application Services or CLI Commands/);
});

test("architecture fitness: a Domain Model importing a CLI Command is a lint error", { skip }, async () => {
  const messages = await lint(
    "src/core/domain/__probe.js",
    'import { close } from "../../commands/close.js";\nexport const x = close;\n'
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "no-restricted-imports");
});

test("architecture fitness: a Domain Model importing another Domain Model (the legitimate case) is clean", { skip }, async () => {
  const messages = await lint(
    "src/core/domain/__probe.js",
    'import { loadChange } from "./change.js";\nexport const x = loadChange;\n'
  );
  assert.deepEqual(messages, []);
});

test("architecture fitness: an Application Service importing a CLI Command is a lint error", { skip }, async () => {
  const messages = await lint(
    "src/core/services/__probe.js",
    'import { close } from "../../commands/close.js";\nexport const x = close;\n'
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "no-restricted-imports");
  assert.match(messages[0].message, /Application Services must not import CLI Commands/);
});

test("architecture fitness: an Application Service importing a Domain Model (the legitimate case) is clean", { skip }, async () => {
  const messages = await lint(
    "src/core/services/__probe.js",
    'import { loadChange } from "../domain/change.js";\nexport const x = loadChange;\n'
  );
  assert.deepEqual(messages, []);
});

test("architecture fitness: a Hook writing to the filesystem is a lint error (Hooks are observation-only)", { skip }, async () => {
  const messages = await lint(
    "src/hooks/__probe.js",
    'import fs from "node:fs";\nexport function run() { fs.writeFileSync("x", "y"); }\n'
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, "no-restricted-properties");
  assert.match(messages[0].message, /Hooks are observation-only/);
});

test("architecture fitness: a Hook reading the filesystem (the legitimate case) is clean", { skip }, async () => {
  const messages = await lint(
    "src/hooks/__probe.js",
    'import fs from "node:fs";\nexport function run() { return fs.existsSync("x") ? fs.readFileSync("x", "utf8") : null; }\n'
  );
  assert.deepEqual(messages, []);
});

test("architecture fitness: the real cli/src tree has zero violations of any of the above", { skip }, async () => {
  const eslint = new ESLint({ overrideConfigFile: path.join(CLI_ROOT, "eslint.config.js"), cwd: CLI_ROOT });
  const results = await eslint.lintFiles(["src/**/*.js"]);
  const fitnessMessages = results.flatMap((r) => r.messages).filter((m) => m.ruleId === "no-restricted-imports" || m.ruleId === "no-restricted-properties");
  assert.deepEqual(fitnessMessages, []);
});
