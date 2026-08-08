// Shared shell-process helpers (Change 0070, ADR-017's own recorded
// obligation): cli.js and sdd-providers/openspec.js each carried their own,
// nearly-identical run()/commandExists() — the provider's copy existed only
// because Change 0045's commissioning instruction forbade touching cli.js in
// that Entrega. This module is the single implementation both now import.
import { spawnSync } from "node:child_process";

export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, { stdio: options.stdio || "pipe", shell: process.platform === "win32", encoding: "utf8" });
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" };
}

export function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return run(checker, [command]).status === 0;
}
