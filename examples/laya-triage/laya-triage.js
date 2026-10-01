#!/usr/bin/env node
// Experimental triage of a requirement with a locally installed Laya (Change 0144).
// Prints unvalidated scores only: writes no files, never calls `aief`, never blocks AIEF.
// Change 0145 measured zero-shot Laya on 131 real Changes: no reliable signal (see README).
//
//   node examples/laya-triage/laya-triage.js "Fix the login 500 on expired passwords"
//   node examples/laya-triage/laya-triage.js requirement.txt
//   cat requirement.txt | node examples/laya-triage/laya-triage.js -
//
// Exit codes: 0 proposals printed; 2 usage error; 3 Laya unavailable (classify manually).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { freemem } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = {
  bin: process.env.LAYA_BIN || "laya",
  model: process.env.LAYA_MODEL || "multilingual",
  timeoutMs: Number(process.env.LAYA_TIMEOUT_MS || 60_000),
  minFreeMb: Number(process.env.LAYA_MIN_FREE_MB || 3072),
  questions: path.join(here, "questions.json"),
};

function unavailable(reason) {
  console.error(`Laya unavailable: ${reason}`);
  console.error("Classify this requirement manually; AIEF does not depend on Laya.");
  process.exit(3);
}

function readRequirement(arg) {
  if (arg === undefined) {
    console.error('usage: laya-triage.js "<requirement text>" | <file> | -');
    process.exit(2);
  }
  const text = arg === "-" ? readFileSync(0, "utf8") : existsSync(arg) ? readFileSync(arg, "utf8") : arg;
  // The Laya CLI takes the request as one argument; keep it on one line.
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) {
    console.error("laya-triage: the requirement text is empty");
    process.exit(2);
  }
  return oneLine;
}

function runLaya(text) {
  const freeMb = Math.floor(freemem() / 1024 / 1024);
  if (freeMb < config.minFreeMb) {
    unavailable(`${freeMb} MB of memory available, ${config.minFreeMb} MB required (LAYA_MIN_FREE_MB).`);
  }
  const result = spawnSync(
    config.bin,
    [text, "--questions", config.questions, "--model", config.model, "--json"],
    {
      encoding: "utf8",
      timeout: config.timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: { LAYA_REVISION: "reviewed", HF_HUB_DISABLE_TELEMETRY: "1", ...process.env },
    },
  );
  if (result.error?.code === "ENOENT") unavailable(`"${config.bin}" not found (install Laya or set LAYA_BIN).`);
  if (result.error?.code === "ETIMEDOUT") unavailable(`no answer within ${config.timeoutMs} ms (LAYA_TIMEOUT_MS).`);
  if (result.error) unavailable(result.error.message);
  if (result.status !== 0) {
    const detail = (result.stderr || "").trim().split("\n").pop() || `exit code ${result.status ?? result.signal}`;
    unavailable(detail);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return unavailable("Laya returned output that is not JSON.");
  }
}

function choice(answer) {
  const label = answer.choice;
  return `${label} (p=${(answer.probabilities?.[label] ?? 0).toFixed(2)})`;
}

const text = readRequirement(process.argv[2]);
const { answers = {}, routing = {} } = runLaya(text);
const security = answers.security_sensitive?.noul ?? 0;

console.log(`Laya triage (EXPERIMENTAL, not validated; model: ${routing.model ?? config.model}). Do not base decisions on it.`);
console.log(`  change_type        : ${choice(answers.change_type)}`);
console.log(`  security_sensitive : ${security.toFixed(2)}`);
console.log(`  governance_track   : ${choice(answers.governance_track)}`);
console.log("Change 0145: change_type no better than always \"general\"; security_sensitive 24 % false positives at 0.8.");
