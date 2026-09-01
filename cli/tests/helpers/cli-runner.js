import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Two ".." — this file lives one directory deeper than the original
// cli.test.js did (cli/tests/helpers/, not cli/tests/).
export const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "bin", "aief.js");
export const POSIX = process.platform !== "win32";

export function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-cli-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

export function aief(cwd, args, env = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}
// For --interactive (Change 0068): feeds piped stdin, simulating a user's
// typed answers (one per line). Also proves --interactive never hangs when
// stdin isn't a real TTY, since spawnSync would time out rather than pass.
export function aiefWithInput(cwd, args, input, env = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    input,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}
