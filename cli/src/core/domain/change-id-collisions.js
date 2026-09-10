// Duplicate Change numeric-ID detection (Change 0135, external-audit finding
// C0130-F2). `nextChangeId()` derives the next numeric id only from the
// current checkout — two Changes scaffolded on separate branches can (and,
// live, during this project's own work, twice did — 0122 and 0123 each
// collided) allocate the same numeric prefix. Neither branch is wrong in
// isolation; the collision is only visible once both land in the same
// checkout. This module only detects it — a pure comparator, no I/O, no
// gate, no blocker — the same "unverified hint, disagreement reported,
// never silently resolved" posture ADR-016 already established for
// manifest.next_action, and Change 0095 already established for
// manifest/change.md status drift.
//
// detectDuplicateChangeIds(basenames) -> [{ id, basenames: string[] }]
// Groups by the leading numeric id (the part before the first "-") and
// returns only groups with more than one basename. Applies regardless of
// open/closed state — resolveExplicitChange()'s numeric-id tier (change.js)
// is ambiguous either way, and the collision is a fact about the repository,
// not about any one Change's current lifecycle stage.
export function detectDuplicateChangeIds(basenames) {
  const byId = new Map();
  for (const basename of basenames) {
    const match = basename.match(/^(\d+)-/);
    if (!match) continue;
    const id = match[1];
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(basename);
  }
  return [...byId.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([id, names]) => ({ id, basenames: [...names].sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
