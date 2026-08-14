# Change

## ID

`0076-clarify-lifecycle-and-trust-boundaries`

## Type

General

## Objective

Documentation-only Change resolving four findings from the completed technical audit that were
approved for a DOCUMENT (not code) remediation:

- F3 — manifest.json lifecycle: current documentation does not clearly state that AIEF has no
  command that creates/writes/synchronizes `manifest.status`.
- F5 — `close --evidence-from <path>`'s trust boundary (external paths are intentionally accepted,
  not a containment bug).
- F9 — why `aief verify` can PASS while `aief close` reports blocked, for the same Change.
- Project-root expectation — reinforce that AIEF commands are intended to run from the project's
  repository root (also the documentation half of the nested-bootstrap finding; the code-level
  guard is a separate, later Change).

## Scope

### In scope

- `docs/concepts.md` — the "Change Manifest" section: add a short, factual paragraph stating
  today's actual manifest-write behavior.
- `docs/cli.md` — the `close --evidence-from` row: add a sentence naming the intentional trust
  boundary. The `aief verify`/`aief verify --change` rows: add a sentence distinguishing
  "Structural Verification" from close's readiness check.
- `docs/getting-started.md` — the existing "Where do I run the commands?" answer: reinforce with
  one added sentence naming the consequence of not doing so (without describing a guard that does
  not exist yet).

### Out of scope

- Any manifest write-back, dual-write synchronization, `aief migrate`, or lifecycle-authority
  implementation (F3's architectural half — explicitly deferred, requires a product decision).
- Any project-root containment change to `--evidence-from` (F5 is documentation-only by design;
  see the remediation design's own reasoning: CI-produced JUnit reports legitimately live outside
  the project root).
- Any code change to `bootstrap`'s nested-project behavior (a separate, later Change).
- Rewriting any document beyond the specific paragraphs/sentences needed for these four findings.

## Success Criteria

- A reader of `docs/concepts.md` learns, in the manifest section itself, that AIEF today has no
  command writing `manifest.status`, and that `aief close --yes` only ever writes `change.md`.
- A reader of `docs/cli.md`'s `--evidence-from` row learns the path is intentionally not required
  to be project-local, and why.
- A reader of `docs/cli.md`'s verify rows learns why `verify` can PASS while `close` blocks.
- `docs/getting-started.md` states the consequence of running commands from the wrong directory,
  without claiming a guard exists that does not yet exist.
- No aspirational behavior (anything not actually implemented) is described as current.

## Status

Closed (2026-08-13)
