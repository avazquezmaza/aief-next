// The SDD provider registry (AIEF Core 3.0, Entrega 3 — Change 0045).
// Mirrors cli/src/requirement-providers/index.js exactly: a plain object of
// statically-imported modules, not a class-based factory and not a plugin
// loader. Two known providers today; adding a third means adding one file
// here and one entry in PROVIDERS, not touching any caller (ADR-017).
import * as local from "./local.js";
import * as openspec from "./openspec.js";

const PROVIDERS = { local, openspec };

export function hasProvider(id) {
  return Boolean(PROVIDERS[id]);
}

export function getProvider(id) {
  return PROVIDERS[id];
}

export function providerIds() {
  return Object.keys(PROVIDERS);
}
