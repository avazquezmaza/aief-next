// Shared shell-process helpers (Change 0070, ADR-017's own recorded
// obligation): cli.js and sdd-providers/openspec.js each carried their own,
// nearly-identical run()/commandExists() — the provider's copy existed only
// because Change 0045's commissioning instruction forbade touching cli.js in
// that Entrega. This module is the single implementation both now import.
import { spawnSync } from "node:child_process";

export function run(command, args = [], options = {}) {
  // Change 0114: forwards `cwd` (needed by git-branch.js and its tests,
  // which run git commands against a temp repo, not process.cwd()) — every
  // other caller already omits cwd, so spawnSync keeps defaulting to
  // process.cwd() for them.
  const result = spawnSync(command, args, { stdio: options.stdio || "pipe", shell: process.platform === "win32", encoding: "utf8", cwd: options.cwd });
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" };
}

export function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return run(checker, [command]).status === 0;
}
