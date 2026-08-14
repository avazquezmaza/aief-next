# Change

## ID

`0080-project-maturity-detection-and-analyze-routing`

## Type

General

## Objective

Introduce a small, deterministic project-maturity classifier (`Definition` / `Implemented` /
`Ambiguous`) and route `aief analyze` by it, so a repository with requirements/context but no
application source gets a Definition Change instead of an Analysis Change asking it to "review
package configuration" and "inspect source modules" that do not exist.

## Inventory of what already exists (ADR-013 accounting)

- `createChange()`'s `definition`/`analysis` dispatch (Change 0079) already exists — this Change
  adds the classifier that decides which branch `analyze()` calls, it does not touch the branches
  themselves.
- `analyze()` already computes `detectProject()` (technology signals, for Skill/standard
  recommendations) — a separate concern from maturity (does source code exist at all) and left
  untouched; `classifyMaturity()` is a new, narrow function, not a re-implementation of
  `detectProject()`.
- `KNOWN_FLAGS.analyze` already exists (currently `{}`); this Change adds one flag, `--maturity`,
  the same "explicit override" pattern `--type` already gives `new-change` — not a new command.
- ADR-013 (name what you remove/merge): this Change does not remove a command, but it does replace
  `analyze()`'s previous unconditional behavior — "always create an Analysis Change, regardless of
  whether the repository has any source code at all" — with routed behavior. The previous
  behavior is preserved byte-for-byte for the `implemented` and `ambiguous` classifications (the
  two cases every existing caller/test already exercises); only the newly-distinguished
  `definition` case gets different output. See "Ambiguous routing decision" below for why
  `ambiguous` intentionally keeps the old default rather than refusing to act.

## Ambiguous routing decision (recorded per the governing brief's autonomous decision policy)

A literal reading of "Ambiguous → explicit explanation, no silent guess" could mean refusing to
create any Change on an ambiguous repository. The existing test suite's `analyze` fixtures
(`makeProject()` with no files, or a one-line README) are exactly this case, and every one of them
asserts an Analysis Change is created — that is real, already-tested backward-compatible behavior
per the autonomous decision policy's own priority order (existing tested behavior and backward
compatibility both outrank satisfying the letter of a new, still-open requirement). Refusing to
act on `ambiguous` would be an observable regression for any project already running `aief
analyze` today, not a safety improvement — a near-empty repository is not evidence the user wants
Definition work; it is evidence there is not enough signal to tell. Resolution: `ambiguous` keeps
today's exact default (create an Analysis Change) but reports the ambiguity and the override
explicitly (`--maturity definition` / `aief new-change --type definition`) — satisfying "no silent
guess" without breaking existing callers. `--maturity` gives an explicit human escape hatch either
way.

## Scope

### In scope

- `classifyMaturity(rootDir)` (`cli/src/core/domain/project-maturity.js`): a pure, deterministic
  classifier using two independent, file-evidence-based signals (real source under recognized
  source directories; requirements/context documents at the repository root with real content).
- `aief analyze` routing: `implemented` → today's Analysis Change (unchanged); `definition` → a
  Definition Change (Change 0079's scaffold); `ambiguous` → today's Analysis Change, with an
  explicit note and override guidance (see decision above).
- `aief analyze --maturity <definition|implemented|ambiguous>`: explicit human override.

### Out of scope

- The richer Definition enrichment workflow (Known/Missing/Ambiguous/Decision-required) —
  Change 0081.
- Maturity-aware standards — Change 0082.
- `aief verify --strict` — Change 0083.
- Any change to `detectProject()`/Skill or standard recommendation logic.
- Any change to `analyze()`'s behavior for a repository this classifier calls `implemented`.

## Success Criteria

- `classifyMaturity()` correctly classifies, at minimum: a PRD-only repository (Definition); a
  repository with tooling-only `package.json` metadata and no source (Definition); a real Node app
  (Implemented); a real non-Node app (Implemented); a sparse/near-empty repository (Ambiguous);
  AIEF's own repository (Implemented).
- `aief analyze` on a Definition-classified repository creates a Definition Change, not an
  Analysis Change.
- `aief analyze` on every repository shape the existing test suite already exercises (implemented
  or ambiguous) is behaviorally unchanged — zero regression.
- `aief analyze --maturity <value>` overrides detection explicitly.

## Status

Closed (2026-08-14)
