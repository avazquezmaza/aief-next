// SDD provider selection (AIEF Core 3.0, Entrega 3 — SDD Provider, Change
// 0045). Deterministic precedence (design.md §6, spec.md SDD-R7):
//
//   1. manifest.sdd.provider (explicit)      — always wins, never fell back from
//   2. project-level configuration           — RESERVED, not implemented (no real
//                                               use case exists in this repository
//                                               today; the step is named so a future
//                                               Entrega can add it without renumbering)
//   3. unambiguous OpenSpec detection
//   4. LocalSddProvider (default)
//
// Never guesses: an explicit-but-unknown or explicit-but-unavailable
// provider is reported as an error, not silently replaced (SDD-R9/R10).
import { hasProvider, getProvider } from "../../sdd-providers/index.js";

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

  // Step 2 (project-level configuration) is intentionally skipped — see the
  // module comment above.

  const openspecProvider = getProvider("openspec");
  const openspecDetection = openspecProvider.detect(cwd);
  if (openspecDetection.available) {
    return { provider: openspecProvider, source: "detected" };
  }

  return { provider: getProvider("local"), source: "default" };
}
