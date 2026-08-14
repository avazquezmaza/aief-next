# Change

## ID

`0085-recognize-docs-directory-for-definition-maturity-signal`

## Type

General

## Objective

Fix a real false negative found by a focused pre-merge adversarial review of Changes 0079–0084:
`classifyMaturity()`'s definition signal (`cli/src/core/domain/project-maturity.js`, Change 0080)
only scanned the repository root for specifically-named files (`README`/`PRD`/`requirements`/...),
so a repository with a short root `README.md` but substantial PRD/architecture/security content
under `docs/` — a convention this very repository itself uses — was misclassified `ambiguous`
instead of `definition`.

## Defect

**Reproduced.** A repository shaped like:

```text
README.md                        (~7 words — a one-line pointer to docs/)
docs/prd.md                      (substantial PRD content)
docs/security.md                 (substantial security constraints)
docs/architecture-options.md     (substantial architecture options)
(no application source)
```

classified as `ambiguous` (falls back to an Analysis Change) instead of `definition`, because
`findDefinitionDocuments()` only ever called `fs.readdirSync(rootDir)` — `docs/` was never
inspected. Confirmed via `node`-script reproduction against the exact scenario a focused pre-merge
review specified, before any code change: `Scenario A: ambiguous [...]`.

**Violated invariant.** "A PRD/no-code project reliably reaches Definition" — false when the PRD
lives under `docs/` rather than at the repository root under one of five recognized filenames.

## Fix

`findDefinitionDocuments()` now also scans exactly one level into `docs/` and `documentation/`
(if present) and counts every `.md`/`.txt` file found there toward the definition signal — no
filename match required inside those directories, since the directory itself is the convention
(this repository's own `docs/getting-started.md`, `docs/concepts.md`, etc. are instances of it).
Deliberately **not** recursive (a nested `docs/adr/` is not scanned) and **not** a general
"scan every Markdown file in the repository" rule — both would reintroduce the arbitrary-scope
problem the review warned against. No new dependency, no scoring, no LLM classification — the same
deterministic, evidence-based model Change 0080 already established, with one more recognized
evidence location.

## Inventory of what already exists (ADR-013 accounting)

- Extends `findDefinitionDocuments()` (Change 0080) — no new module, no new exported function
  signature change to `classifyMaturity()`.
- `Implemented` precedence is unchanged: real source still wins unconditionally, so this cannot
  create a new false positive for an already-implemented project with a `docs/` folder (extremely
  common) — verified by a new regression test.

## Scope

### In scope

- `docs/`/`documentation/` (one level, `.md`/`.txt` only) added to the definition-signal scan.
- Regression tests: the exact reported scenario, an alternate directory name, one-level-only
  (nested `docs/adr/` not scanned), non-document files under `docs/` excluded, and
  Implemented-still-wins-over-docs-content.

### Out of scope

- Changing the 30-word threshold (reviewed; not found to be a defect — see evidence.md).
- Any change to the `Implemented` source-detection rules.
- Any change to `aief analyze`'s routing logic itself (`cli.js`) — this Change only corrects the
  evidence `classifyMaturity()` collects; the routing that consumes its result (Change 0080) is
  unmodified.

## Success Criteria

- The exact reported scenario (short root README, substantial `docs/prd.md` +
  `docs/security.md` + `docs/architecture-options.md`, no source) classifies `definition`.
- Every existing `project-maturity.test.js` test still passes unmodified.
- An implemented project with a `docs/` folder still classifies `implemented`.

## Status

Closed (2026-08-14)
