# Change

## ID

`0102-aief-3-3-0-release-readiness-and-documentation`

## Type

General

## Objective

Prepare AIEF 3.3.0 for release, following the 3.2.0 precedent (Change 0087 → 0088): verify Changes
0089–0101 are integrated on `main`, clean up merged branches, refresh documentation so it stays
accurate, and record release-readiness evidence — without bumping the version, tagging, or
pushing (those are separate, later steps).

## Inventory of what already exists (read before touching anything)

AIEF 3.3.0 is thirteen Changes since 3.2.0 (0089–0101), each already closed with its own evidence:

- **0090 — `context.definitionEnrichment`**: `buildSkillContext()` exposes a Definition Change's
  own Known/Missing sections and marker-classified items to Skills.
- **0091 — `architecture-definition` Skill**: instructions-only expert Definition enrichment for
  architecture concerns (auth, tenancy, integration, persistence, availability, scalability).
- **0092 — validated 0091** against realistic, imperfect Definition-stage projects.
- **0093 — design review**: durable-knowledge access stays per-Skill-instruction, not shared
  context — no new orchestration layer.
- **0094 — `data-definition` Skill**: second expert Definition Skill (PII, retention, residency,
  classification), validated to coexist with `architecture-definition` on the same Change.
- **0095 — manifest/change.md status drift detection**: `status`/`verify` surface (never
  reconcile) a manifest-backed Change's `manifest.status` disagreeing with its own `change.md`.
- **0096 — usability validation study executed**: Change 0042's protocol run (P0 pilot + P1–P5),
  consolidated into evidence.
- **0097 — ADR-015 remainder thawed**: governance record of the decision to lift the freeze on
  Candidate DELETE/ARCHIVE and Type↔Track, now that 0096 produced the usability evidence ADR-015
  itself named as sufficient.
- **0098–0101 — this session's work**: 20 new `skills-catalog.json` detectors + 2 Skills
  (payments, container/deployment); 3 CLI error messages made actionable; the `python` detector
  specialized into `django`/`flask`/`fastapi` + 1 Skill; 4 dangling doc references (pointing at
  files deleted by an earlier documentation Change) repointed to their current home.

The base suite at the start of this Change is 1009/1009 tests PASS (`npm test`, repo root); `aief
verify` PASSES; `git diff --check` is clean; `main` and `origin/main` are identical.

## Scope

### In scope

- **Integration verification**: confirm 0089–0101 are reachable from `main`, all closed.
- **Documentation audit, scoped to what actually changed**: a `docs/<name>.md` reference scan
  (repeating Change 0101's method) plus a targeted read of every doc section touching Skills,
  Requirement Sources, and manifest status. Found one real gap: `docs/workflow.md`'s "Skills
  Runtime" section says "Four Skills ship this release" and names only `change-context`,
  `requirements-analysis-instructions`, `architecture-definition`, `data-definition` — the Skills
  Runtime registry (`cli/src/skills/index.js`) has shipped a 5th, `adversarial-review`, since
  Core 3.0 (Changes 0047–0049), predating even 3.2.0; the paragraph was last edited around
  0091/0094 and simply never counted it. Fixed: "Five Skills", `adversarial-review` added to the
  list with its own one-line description.
- **Branch cleanup**: delete the 4 remote branches already merged into `origin/main` by this
  session (`feat/0098-expand-skills-catalog-detectors`, `feat/0099-actionable-error-messages`,
  `feat/0100-python-framework-detectors`, `fix/0101-dangling-doc-references`) — confirmed merged,
  pending the user's explicit go-ahead per the standing git-discipline rule (delete a branch only
  with confirmation for that specific action).
- This Change's own `spec.md`, `tasks.md`, `evidence.md`.

### Out of scope

- `package.json`/`cli/package.json` version bump — a separate Change, per the 0087→0088
  precedent.
- Git tag, `releases/v3.3.0.md`, or a GitHub Release — deferred until after the version-bump
  Change, and only with the user's explicit confirmation to tag/push.
- Any new subsystem, command, or manifest field.
- Re-litigating 0089–0101's own decisions — this Change only verifies integration and documents
  what already shipped.

## Success Criteria

- Changes 0089–0101 confirmed reachable from `main`, closed, and functioning as documented.
- `docs/workflow.md`'s Skills Runtime section accurately counts and names all 5 registered
  Skills.
- No other dangling doc reference or stale count found by the audit is left unfixed.
- `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass before commit.

## Status

Closed (2026-09-01)
