// SDD provider selection (AIEF Core 3.0, Entrega 3 — SDD Provider, Change
// 0045; step 2 implemented in Change 0052). Deterministic precedence
// (design.md §6, spec.md SDD-R7):
//
//   1. manifest.sdd.provider (explicit)      — always wins, never fell back from
//   2. project-level configuration           — knowledge/sdd-provider.json, written
//                                               only by `aief bootstrap` when the
//                                               choice is genuinely ambiguous
//                                               (Change 0052); absent by default
//   3. unambiguous OpenSpec detection
//   4. LocalSddProvider (default)
//
// Never guesses: an explicit-but-unknown or explicit-but-unavailable
// provider is reported as an error, not silently replaced (SDD-R9/R10).
import fs from "node:fs";
import path from "node:path";
import { hasProvider, getProvider } from "../../sdd-providers/index.js";

export function sddProviderConfigPath(cwd) {
  return path.join(cwd, "knowledge", "sdd-provider.json");
}

// Reads knowledge/sdd-provider.json if present. Returns null when absent
// (the common case — step 2 is opt-in), or `{ providerId }` /
// `{ error }` when present. Never throws: malformed JSON or an unknown
// provider id is reported, matching R5's manifest-error discipline.
function readProjectSddConfig(cwd) {
  const file = sddProviderConfigPath(cwd);
  if (!fs.existsSync(file)) return null;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return { error: `knowledge/sdd-provider.json is not valid JSON: ${err.message}` };
  }
  if (typeof parsed.provider !== "string" || !parsed.provider.trim()) {
    return { error: `knowledge/sdd-provider.json: "provider" must be a non-empty string` };
  }
  if (!hasProvider(parsed.provider)) {
    return { error: `knowledge/sdd-provider.json: unknown SDD provider ${JSON.stringify(parsed.provider)}` };
  }
  return { providerId: parsed.provider };
}

export function resolveSddProvider(change, cwd) {
  const declared = change.manifest?.sdd?.provider;
  if (declared !== undefined) {
    if (!hasProvider(declared)) {
      return { error: `unknown SDD provider ${JSON.stringify(declared)}`, source: "manifest" };
    }
    const provider = getProvider(declared);
    const detection = provider.detect(cwd);
    if (!detection.available) {
      return { error: `configured provider ${JSON.stringify(declared)} is unavailable: ${detection.reason}`, source: "manifest" };
    }
    return { provider, source: "manifest" };
  }

  const projectConfig = readProjectSddConfig(cwd);
  if (projectConfig) {
    if (projectConfig.error) return { error: projectConfig.error, source: "project-config" };
    const provider = getProvider(projectConfig.providerId);
    const detection = provider.detect(cwd);
    if (!detection.available) {
      return { error: `configured provider ${JSON.stringify(projectConfig.providerId)} (knowledge/sdd-provider.json) is unavailable: ${detection.reason}`, source: "project-config" };
    }
    return { provider, source: "project-config" };
  }

  const openspecProvider = getProvider("openspec");
  const openspecDetection = openspecProvider.detect(cwd);
  if (openspecDetection.available) {
    return { provider: openspecProvider, source: "detected" };
  }

  return { provider: getProvider("local"), source: "default" };
}
