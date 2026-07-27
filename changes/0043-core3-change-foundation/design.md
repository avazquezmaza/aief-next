# Design

## 1. Context — what exists today

A Change is a directory under `changes/<id>-<slug>/` with four required Markdown files
(`CHANGE_FILES` in `cli/src/core/domain/change.js:12`). There is no manifest, no JSON, no YAML in
any Change today. The domain model lives in one file:

- `cli/src/core/domain/change.js` — `loadChange(changeDir)` (line 194) reads the four files and
  returns a plain object (`missing`, `empty`, `closed`, `statusState`, `type`, `evidenceState`,
  `openTasksCount`), derived by regex over `change.md`/`tasks.md`/`evidence.md`. Pure, well
  tested, explicitly documented as "not a repository" (file header, lines 1–8).
- `cli/src/core/services/change-verifier.js` — `verifyProject()`, `verifyChange()`,
  `checkChangeReadiness()`: the rule engine consuming `loadChange()`'s output for `verify`/`close`.
- `cli/src/cli.js` — the 858-line command dispatcher. `status()` (line 692) and
  `openChangeDirs()` (line 66) call `loadChange`/`isClosedContent` directly to list open Changes.
- Zero runtime dependencies (`package.json`, both root and `cli/`): only `node:fs`, `node:path`,
  `node:child_process`, `node:url`. No YAML parser exists anywhere in the dependency tree.
- ADR-009 ("no hidden state — the Change files are the only source of truth") already rejected a
  cross-cutting `.aief/state.json`. A per-Change `manifest.json` is different in kind — it is one
  of that Change's own files, not global state — but the same discipline (derive, don't
  duplicate) applies to what the manifest is allowed to contain.

## 2. Domain model

Rather than the vision document's `cli/core/change/{change-model,change-loader,change-resolver,
change-validator,manifest-repository}.js` (five files, a new top-level `core/change/` directory),
this design adds two files next to the existing domain file, inside the existing
`cli/src/core/domain/` directory:

```text
cli/src/core/domain/
├── change.js              (existing — untouched)
├── change-manifest.js     (new — parse + validate manifest.json)
└── change-loader.js       (new — unified loader: manifest-or-legacy)
```

Reasoning: `change.js` is 227 lines, single-responsibility, and already correct for the legacy
path — moving or splitting it has no benefit for Entrega 1 and would be exactly the "cosmetic
refactor" AGENTS.md's coding guidance warns against. A `core/change/` directory with five files is
premature structure for two new, small responsibilities; the vision document itself says "no
fuerces exactamente esta estructura... propone la adaptación con el menor número de movimientos."
`change-resolver.js` and `manifest-repository.js` are not created: active-Change resolution
already works and is out of scope (§ change.md); a "repository" abstraction has no second
implementation to justify it yet (vision document principle 18 / AGENTS.md: no abstractions
without an immediate use case). If Entrega 3 (SDD Integration) or Entrega 4 (start/work) later
need a real repository seam, it is extracted then, against real second-caller pressure — not
speculatively now.

### `change-manifest.js`

```js
export function parseManifest(raw)      // JSON.parse with a caught, wrapped error
export function validateManifest(obj)   // -> { valid: boolean, errors: [{field, message}] }
export const MANIFEST_SCHEMA_VERSION = "aief.change/v1";
```

`validateManifest` is a hand-written function (no schema library), checking exactly the R3 field
set from `spec.md`. See §5 for why no JSON Schema library is introduced.

### `change-loader.js`

```js
export function loadChangeUnified(changeDir) {
  const manifestPath = path.join(changeDir, "manifest.json");
  if (fs.existsSync(manifestPath)) return loadManifestChange(changeDir, manifestPath);
  return mapLegacyChange(changeDir);
}

function mapLegacyChange(changeDir) {
  return { ...loadChange(changeDir), source: "legacy", manifest: null };
}

function loadManifestChange(changeDir, manifestPath) {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const parsed = parseManifest(raw);          // { ok, value, error }
  if (!parsed.ok) return { dir: changeDir, source: "manifest", manifest: null,
                            manifestError: parsed.error, ...errorShape() };
  const { valid, errors } = validateManifest(parsed.value);
  if (!valid) return { dir: changeDir, source: "manifest", manifest: parsed.value,
                        manifestError: errors, ...errorShape() };
  return {
    dir: changeDir,
    basename: path.basename(changeDir),
    source: "manifest",
    manifest: parsed.value,
    manifestError: null,
    closed: parsed.value.status === "closed",
    statusState: parsed.value.status,
    type: parsed.value.track || "",
    // evidenceState / openTasksCount: Entrega 1 still derives these from the Change's own
    // evidence.md / tasks.md files (R7 — those files stay required and meaningful); the
    // manifest does not yet replace them. Revisit when Entrega 6 (Verification) needs to.
    evidenceState: classifyEvidence(readIfExists(changeDir, "evidence.md")),
    openTasksCount: countOpenTasks(readIfExists(changeDir, "tasks.md")),
    missing: [], empty: []   // recomputed against CHANGE_FILES, same as mapLegacyChange
  };
}
```

`errorShape()` returns safe defaults (`closed: false`, `statusState: "unknown"`, etc.) so a caller
that only checks `.closed`/`.statusState` never crashes on an invalid manifest — it degrades to
"unknown", the same non-guessing posture `parseChangeStatus()` already uses for legacy Changes
(R5).

This is conceptual pseudocode for the design review, not final code — exact field plumbing is a
task-level decision, not a design-level one.

## 3. Precedence

Matches the vision document's pseudocode exactly (§7 of `docs/aief-core-3-claude-code-prompt.md`):
manifest existence is the only signal. No field-by-field merge — a manifest with a `status` field
that disagrees with `change.md`'s `## Status` heading is not reconciled; the manifest wins
entirely for that Change (R1, R3 of `spec.md`). Reconciliation/consistency warnings between the
two are an explicit non-goal for Entrega 1: producing them would require deciding what a
disagreement *means*, which depends on the workflow engine's gate model (Entrega 2) — building
that logic now would be exactly the kind of premature abstraction the vision document's principle
18 warns against.

## 4. Loading flow

```text
status() / openChangeDirs()
        │
        ▼
loadChangeUnified(changeDir)
        │
   manifest.json exists? ── no ──► mapLegacyChange(changeDir) ──► loadChange(changeDir) (existing, untouched)
        │ yes
        ▼
loadManifestChange(changeDir)
        │
   parseManifest(raw) ── parse error ──► { manifestError, statusState: "unknown", ... }
        │ ok
   validateManifest(value) ── invalid ──► { manifestError: [...], statusState: "unknown", ... }
        │ valid
   { source: "manifest", statusState: value.status, ... }
```

## 5. YAML vs. JSON — decision

The vision document's own examples (§6, §12, §17, §18, §19) use YAML throughout, but §25
explicitly requires reviewing the repository before choosing, and allows substituting JSON with a
documented reason. Findings that drive the decision:

- The repository has **zero runtime dependencies** today (root and `cli/` `package.json` both).
  Introducing `js-yaml` (or any YAML library) would be the first runtime dependency in the
  project's history.
- AGENTS.md coding guidance: "do not introduce dependencies unless necessary."
- A precedent for structured, non-Markdown data already exists and is unparsed by any library:
  `cli/src/skills-catalog.json`, read with plain `JSON.parse` (`cli/src/detect.js:7-9`).
- YAML's advantages over JSON for this use case (comments, multiline strings) are not exercised
  by the field set in R3 — none of `id`, `slug`, `title`, `status`, `track` benefit from YAML's
  extra expressiveness at this stage.

**Decision: `manifest.json`, not `manifest.yaml`, for Entrega 1.** This is consistent with
existing project precedent, adds no dependency, and is easy to reverse (a later Entrega can add a
YAML front-end that produces the same in-memory shape, without touching `change-loader.js`'s
consumers, if a real need for YAML's expressiveness — e.g. hand-authored comments in gates —
appears once the workflow engine exists). Flagged for human confirmation in `spec.md`'s
acceptance criteria, not assumed silently.

## 6. Schema strategy

The vision document's target tree includes `schemas/change.schema.json`. This design **defers**
creating a standalone JSON Schema file for Entrega 1: a schema file maintained by hand, next to a
hand-rolled validator that does not consume it, is two definitions of the same shape with no
mechanism to keep them consistent — worse than one definition. `spec.md`'s R3 field list is the
single source of truth for Entrega 1; `change-manifest.js`'s `validateManifest()` implements it
directly. A real `schemas/*.schema.json` file is proposed once either (a) a schema-validation
library is deliberately adopted (a dependency decision, not made here), or (b) a second consumer
needs the schema independent of this JS module (e.g. an editor/IDE integration) — neither is true
yet.

## 7. Error handling

Three distinct failure modes, each reported without throwing past the loader boundary:

1. **No manifest** — not an error; `mapLegacyChange` path (R1).
2. **Manifest exists but is not valid JSON** — `parseManifest` catches `JSON.parse`'s exception
   and returns `{ ok: false, error: "manifest.json is not valid JSON: <message>" }`.
3. **Manifest is valid JSON but fails structural validation** — `validateManifest` returns one
   `{ field, message }` entry per violation (R4), e.g.:
   `{ field: "status", message: "must be 'open' or 'closed', got 'in_progress'" }`.

In all error cases the loader still returns a well-formed object (`errorShape()`, §2) so callers
that only branch on `.closed`/`.statusState` do not need new error-handling code in Entrega 1 —
they see `"unknown"`, the same value `parseChangeStatus()` already produces for an uninterpretable
legacy status. Callers that need the raw error (a future `aief status --verbose`, not built in
Entrega 1) read `.manifestError`.

## 8. Tests

New files, `cli/tests/`:

- `change-manifest.test.js` — `parseManifest`/`validateManifest`: valid manifest; missing each
  required field one at a time; wrong `schema` value; invalid `status` enum; malformed JSON.
- `change-loader.test.js` — `loadChangeUnified`: legacy Change (no manifest) matches
  `loadChange()` output plus `source`/`manifest`; manifest Change resolves from the manifest;
  manifest + disagreeing `change.md` resolves to the manifest (R1); invalid manifest degrades to
  `statusState: "unknown"` without throwing (R5); zero-drift regression looping every real
  directory under `changes/` and asserting equality with today's `loadChange()` (R2).

Modified files (no new assertions changed, only new coverage added where noted):

- `cli/tests/cli.test.js` — add one scenario: a Change with a valid manifest.json shows up
  correctly in `aief status` output. No existing assertion is edited.

Verification command (documented, to be run once implementation exists):

```bash
cd cli && npm test
```

## 9. Migration (future, not built here)

No migration is needed for Entrega 1 — manifest support is purely additive and no Change adopts
it automatically. A future `aief migrate` (mentioned in the vision document §7) that writes
`manifest.json` from an existing `change.md` is out of scope; when built, it should be able to
reuse `change.js`'s existing parsers (`parseChangeStatus`, `changeTypeFromContent`) as its input
side, and `validateManifest()` as its output-side check, so migration produces a manifest that the
unified loader accepts by construction.

## 10. Open design questions carried into "Blocking Questions"

- Whether ADR-013 governs this initiative as a whole and, if so, what capability the wider
  program (Entregas 2–8) proposes to retire.
- Confirmation of JSON over YAML (§5) — reversible, but a real decision, not inferred from silence.

## 11. Post-review architectural amendments (2026-07-25)

Two decisions made in response to this Change's own independent review, recorded here because
Entrega 2 will build directly on both.

**Decision (finding B1): a "closed" predicate used for *reading* Change state and a "did my write
succeed" check used for *verifying a specific write* must never be the same function, even when
they currently agree.** §2's original pseudocode gave `loadChangeUnified()`/`isClosed()` a single
role — "is this Change closed" — and `cli.js` reused it for both `openChangeDirs()` (a read) and
`markClosed()` (a post-write check). The two only look identical while `close` never writes
anything a manifest could disagree with; the moment a manifest exists, `close` writes to a file
the manifest-aware predicate doesn't consult, and "did my write succeed" silently starts asking
"does *any* source of truth for this Change agree with what I just wrote" — a different, stricter
question that `close` never should have been asking, since it only owns `change.md`. Fix:
`markClosed()` now reads `change.md` directly (`isClosedContent(read(file))`); `isClosed()` stays
manifest-aware and is used only by `openChangeDirs()`. **Rule for Entrega 2 and beyond**: a
command's post-write verification must always read the exact file it wrote, never a broader
unified view — even one it also reads elsewhere for a different purpose.

**Decision (finding H1): `missing`/`empty` are not manifest-branch-specific data — they are a
property of the four required files, computed once, and reused by both branches.** §2's original
pseudocode described this correctly in a comment but the implementation never carried it out,
because the manifest branch's return object was written independently rather than by composing a
shared primitive. Fix: `readChangeFiles()` extracted in `change.js`, called by both `loadChange()`
and `loadManifestChange()`. **Rule for Entrega 2 and beyond**: when a pseudocode comment says
"same as the other branch," that must be true by construction (a shared function call), not by
two independently maintained implementations that are merely intended to agree.
