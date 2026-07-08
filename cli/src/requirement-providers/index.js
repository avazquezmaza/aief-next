// The adapter registry: the single place that knows which Requirement Source
// providers actually have an implementation. cli.js calls only
// retrieveRequirement()/hasAdapter() and never branches on a provider name
// itself — adding notion/github/azure-devops/markdown means adding one file
// here and one entry in ADAPTERS, not touching the workflow commands.
import * as manual from "./manual.js";
import * as jira from "./jira.js";

const ADAPTERS = { manual, jira };

export function hasAdapter(provider) {
  return Boolean(ADAPTERS[provider]);
}

export function implementedProviders() {
  return Object.keys(ADAPTERS);
}

export function retrieveRequirement(provider, sourceId, options = {}) {
  const adapter = ADAPTERS[provider];
  if (!adapter) throw new Error(`No requirement provider adapter registered for "${provider}".`);
  return adapter.retrieve(sourceId, options);
}
