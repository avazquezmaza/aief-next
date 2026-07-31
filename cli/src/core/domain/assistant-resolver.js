// Assistant resolution (AIEF 3.1, Change 0061). Mirrors
// sdd-provider-resolver.js's shape exactly: a plain precedence function over
// a static registry, a project-level JSON config under knowledge/, never a
// class, never a second registry. `ASSISTANT_FILES` here is the single
// source of truth for known assistants and their native instruction file —
// cli.js imports it rather than declaring a parallel list; adding a fifth
// assistant means adding one entry here, nowhere else.
//
// Deterministic precedence (spec.md AR-R1):
//
//   1. explicit (positional / --assistant)   — always wins, never overridden
//   2. AIEF_ASSISTANT (environment variable) — developer-local, not committed
//   3. knowledge/assistant.json              — project preference, versioned
//   4. passive detection (native file present in cwd)
//   5./6. interactive TTY prompt / non-interactive error — decided by the
//      caller (cli.js), since only it knows whether stdin is a TTY; this
//      module never touches stdin.
//
// An explicit-but-unknown assistant, an unknown AIEF_ASSISTANT value, or an
// invalid/unknown knowledge/assistant.json are reported as errors — never
// silently replaced (same discipline as SDD-R9/R10).
import fs from "node:fs";
import path from "node:path";

export const ASSISTANT_FILES = { claude: "CLAUDE.md", gemini: "GEMINI.md", codex: "CODEX.md", cursor: "CURSOR.md" };

export function hasAssistant(id) {
  return Boolean(ASSISTANT_FILES[id]);
}

export function assistantIds() {
  return Object.keys(ASSISTANT_FILES);
}

export function assistantConfigPath(cwd) {
  return path.join(cwd, "knowledge", "assistant.json");
}

// Reads knowledge/assistant.json if present. Returns null when absent (the
// common case — never written unless `aief prompt --set-assistant` ran), or
// `{ assistantId }` / `{ error }` when present. Never throws. Exported
// separately from resolveAssistant() so `aief prompt --show-assistant` can
// report the raw project preference distinctly from the final resolution
// (e.g. AIEF_ASSISTANT overriding a saved knowledge/assistant.json).
export function readProjectAssistantConfig(cwd) {
  const file = assistantConfigPath(cwd);
  if (!fs.existsSync(file)) return null;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return { error: `knowledge/assistant.json is not valid JSON: ${err.message}` };
  }
  if (typeof parsed.defaultAssistant !== "string" || !parsed.defaultAssistant.trim()) {
    return { error: `knowledge/assistant.json: "defaultAssistant" must be a non-empty string` };
  }
  if (!hasAssistant(parsed.defaultAssistant)) {
    return { error: `knowledge/assistant.json: unknown assistant ${JSON.stringify(parsed.defaultAssistant)}` };
  }
  return { assistantId: parsed.defaultAssistant };
}

// Symmetric passive detection: every registered assistant is checked the
// same way (native file present in cwd) — no assistant gets a structural
// advantage over another.
function detectAssistants(cwd) {
  return assistantIds().filter((id) => fs.existsSync(path.join(cwd, ASSISTANT_FILES[id])));
}

// Resolves layers 1-4. `explicit` and `env` are expected already
// lowercased/trimmed by the caller, or omitted (undefined/empty) when not
// given. Returns one of:
//
//   { assistantId, source: "explicit" | "env" | "project-config" | "detected" }
//   { error, source }                              — invalid input at some layer
//   { ambiguous: [ids], source: "ambiguous" }       — 2+ native files, caller must disambiguate
//   { assistantId: null, source: "none" }           — no signal at all (valid: generic prompt)
export function resolveAssistant({ explicit, env, cwd } = {}) {
  if (explicit) {
    if (!hasAssistant(explicit)) return { error: `unknown assistant ${JSON.stringify(explicit)}`, source: "explicit" };
    return { assistantId: explicit, source: "explicit" };
  }
  if (env) {
    if (!hasAssistant(env)) return { error: `unknown assistant ${JSON.stringify(env)} in AIEF_ASSISTANT`, source: "env" };
    return { assistantId: env, source: "env" };
  }
  const projectConfig = readProjectAssistantConfig(cwd);
  if (projectConfig) {
    if (projectConfig.error) return { error: projectConfig.error, source: "project-config" };
    return { assistantId: projectConfig.assistantId, source: "project-config" };
  }
  const detected = detectAssistants(cwd);
  if (detected.length === 1) return { assistantId: detected[0], source: "detected" };
  if (detected.length > 1) return { ambiguous: detected, source: "ambiguous" };
  return { assistantId: null, source: "none" };
}
