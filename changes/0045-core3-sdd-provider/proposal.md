# Proposal — Entrega 3: SDD Provider

## Problem

AIEF's only real integration with OpenSpec today is `propose()` (`cli/src/cli.js`): it detects the
`openspec` binary (`commandExists`), validates its CLI contract at runtime (`openspecInfo()`:
`--version`, `--help`, checks `propose` is listed), and shells out (`spawnSync("openspec",
["propose", idea], {stdio:"inherit"})`), falling back to a local Change skeleton on any failure.
That is the entire integration. **No code anywhere reads an OpenSpec Change's actual artifacts** —
`openspec/changes/<name>/proposal.md`, `tasks.md`, `specs/<capability>/spec.md` — the real,
documented (`adapters/openspec/mapping.md`) directory shape exists only as Markdown prose, never as
a path AIEF's code constructs or reads. `status`, `verify`, `close`, and the Workflow Engine
(Change 0044) are entirely unaware OpenSpec Changes exist as a concept with content, only that the
`openspec` binary might be present (`doctor`, `init` report this).

This is evidence of coupling risk, not yet coupling itself: if the Workflow Engine's future
`specification` gate (`docs/aief-core-3-claude-code-prompt.md` §16's integration sketch) needed to
know "are this Change's specs ready," the only path available today would be writing
OpenSpec-specific path logic directly into `gate-evaluator.js` — exactly the dependency direction
this Entrega's commissioning instruction forbids (`Workflow Engine → rutas internas de OpenSpec`).

## Context after Entrega 1 and Entrega 2 (real, not assumed)

- **Manifest**: `manifest.json`'s `sdd` field has been accepted-but-unvalidated since Entrega 1
  (`change-manifest.js`'s `validateManifest()` comment lists it explicitly among fields "later
  Entregas ... own their own validation when they start interpreting them"). Zero Changes in this
  repository set it.
- **Loader**: `loadChangeUnified()` (`change-loader.js`) is the one Change-loading entry point.
  Nothing in it resolves SDD artifacts today — it stops at the manifest's own fields.
- **Workflow Engine** (Change 0044): `evaluateGates()` (`gate-evaluator.js`) has one structural
  gate (`readiness`, wrapping `checkChangeReadiness()`) and three "not yet built" gates
  (`review`/`approval`/`security_review`). No `specification` gate exists. `KNOWN_GATE_IDS` does
  not include it.
- **Existing provider precedent**: `cli/src/requirement-providers/{manual,jira}.js` + `index.js`'s
  `ADAPTERS` registry is a working, tested, **class-free** provider pattern already in production
  for Requirement Sources (ADR references: the Normalized Requirement contract in
  `requirement.js`). Zero ES6 classes exist anywhere in `cli/src/` (confirmed by repository-wide
  grep) — the vision document's `class SddProvider` sketch would be the only class in the codebase.
- **OpenSpec's real, verified directory shape** (`adapters/openspec/mapping.md`, cross-checked
  against the upstream project 2026-07-03 per that file's own note):
  `openspec/changes/<name>/{proposal.md, tasks.md, design.md, specs/<capability>/spec.md}`, with
  completed changes moving to `openspec/changes/archive/`. Multiple `specs/<capability>/spec.md`
  files per Change are normal — OpenSpec has no single `spec.md`, unlike AIEF's local model.
- **Tests**: `cli.test.js` covers `doctor`'s optional-OpenSpec reporting and `propose()`'s three
  fallback paths (not installed, no `propose` command, delegation failure) — end-to-end, spawning
  fake `openspec` binaries. No test reads OpenSpec artifact content, because no code does.

## Objective

Introduce a provider boundary — plain modules, not classes, mirroring `requirement-providers/`'s
proven shape — so the Core can ask "what SDD artifacts does this Change have, are they valid, what
do they say" without knowing whether the answer comes from OpenSpec's directory convention or
AIEF's own local files. Two providers: `OpenSpecProvider` (new code — no prior artifact-reading
code exists to reuse) and `LocalSddProvider` (wraps the *existing*, already-correct local Change
model — `readChangeFiles()`, `loadChange()` — through the new provider shape, not a rewrite).

## Scope

- `SddProvider` contract as a set of documented, per-method-justified plain functions (not a
  class) — see `design.md` for why each method from the vision document's sketch is kept, renamed,
  or dropped.
- `OpenSpecProvider`: detection (reusing `openspecInfo()`'s logic, relocated not rewritten),
  artifact resolution against the real, cited directory shape, structural validation, requirement/
  task extraction limited to what's deterministically extractable (see "Requirements and tasks"
  below).
- `LocalSddProvider`: wraps `readChangeFiles()`/`loadChange()` — the AIEF-native
  `change.md`/`spec.md`/`design.md`/`tasks.md`/`evidence.md` shape, unchanged.
- A deterministic provider-selection policy (manifest-explicit → project config → unambiguous
  OpenSpec detection → local fallback), with ambiguous cases producing a warning/error, never a
  silent guess.
- `manifest.sdd` validation (optional section; absence is never an error for any existing Change).
- A normalized artifact/requirement/task/readiness model, designed to distinguish absent/empty/
  invalid/not-applicable/read-error explicitly (never an empty list standing in for a failure).
- Additive-only `status` integration, following the exact byte-identical discipline Entregas 1–2
  established.
- The Workflow Engine's `specification` gate concept **designed, not wired**: `gate-evaluator.js`
  gains the capability to consume a provider's readiness result, but no shipped workflow definition
  (`lite.json`/`standard.json`/`governed.json`) references it yet.

## Out of Scope

Per the commissioning instruction's own list: Entrega 4 (`start`/`work`/`next`), assistant
execution, Skills, Hooks, Profiles, semantic Verification, Review-as-product-feature, conversational
interface, remote creation, OpenSpec installation, marketplace, automatic migration, spec sync,
destructive archival, additional providers beyond the two named, a database, remote state. Also:
refactoring `propose()` to call the new provider (ADR-017's recorded, deferred obligation) and
adding `specification` to any shipped workflow definition.

## Compatibility

- Legacy Changes (no manifest): untouched — no code path in this Entrega reads a Change without a
  manifest through the new provider machinery.
- Entrega-1-era manifests (no `sdd` section): untouched — absence of `sdd` is never an error
  (explicit requirement, SDD-R\* in `spec.md`).
- Entrega-2-era manifests (`track`, no `sdd`): untouched — the Workflow Engine's gate set is
  unchanged by this Entrega (`specification` stays undeclared in all three definitions).
- `LocalSddProvider` reproduces `readChangeFiles()`/`loadChange()`'s existing behavior exactly —
  proven the same way Change 0043 proved `loadChangeUnified()`'s legacy branch: a zero-drift
  regression across every real Change.
- `close`/`verify`: untouched. No code path introduced by this Entrega changes what they read or
  write (design.md explains why the `specification` gate stays disconnected from `readiness`).
- No migration: no Change file, anywhere, is rewritten by anything in this Entrega.

## Providers (initial two, per the commissioning instruction)

See "Scope" above and `design.md` for full detail. Both are read-only in every operation this
Entrega implements; `OpenSpecProvider`'s only potential external-command use
(`openspec --version`/`--help`, reused from `openspecInfo()`) is detection, not artifact reading —
artifact reading is filesystem-only, since OpenSpec's directory shape is documented and stable.

## Risks

1. **ADR-017 might not be accepted as scoped** — in particular its decision to leave `propose()`
   unrefactored (mirroring ADR-016's precedent). If the project owner wants `propose()` wired in
   this Entrega, `design.md`/`tasks.md` need revision before implementation.
2. **OpenSpec artifact parsing risk**: requirements/tasks extraction from Markdown is inherently
   fragile if over-engineered. Mitigated by explicitly scoping what's deterministically extractable
   (design.md, "Requirements and tasks") and marking the rest `unsupported`, never guessed.
3. **`specification` gate scope creep**: designing it invites wiring it. Mitigated by the same
   discipline Change 0044 used for `review`/`approval`/`security_review` — represented as a
   capability, never silently enabled.
4. **Two "readiness" concepts** (provider readiness vs. Workflow Engine gate readiness) could blur
   if not kept as two distinct, sequential contracts — this is `design.md`'s central integration
   decision, made explicit precisely because Change 0044's own review (finding R1) showed how
   quietly a "not really blocking" default can slip in.

## Alternatives Considered

- **Adopt the vision document's `class SddProvider` literally.** Rejected — zero classes exist in
  this codebase; the `requirement-providers/` pattern is proven, tested, and stylistically
  consistent. See ADR-017.
- **Skip the boundary; let the Workflow Engine read OpenSpec directly when it needs to.** Rejected
  — the exact coupling this Entrega exists to prevent (commissioning instruction, "Principio
  arquitectónico").
- **Build a general SDD-provider plugin system now.** Rejected — no third provider is proposed or
  needed; a static two-entry registry (mirroring `requirement-providers/index.js`'s `ADAPTERS`)
  is the proven minimum, matching the "no plugin system" instruction directly.
- **Wire `propose()` to the new provider in this Entrega**, fully discharging ADR-013's merge
  obligation now. Considered and deferred — bundling a behavior-changing refactor of a working,
  tested command into the same Change that introduces the abstraction it would depend on repeats
  the exact risk Change 0043's B1 finding taught this project to avoid: build and prove the new
  thing in isolation first, wire it as a distinct, reviewable second step.

## Relationship to Entregas 1 and 2

Reuses, unmodified: `loadChangeUnified()`, `readChangeFiles()`, `checkChangeReadiness()`
(Entrega 1); `evaluateGates()`'s gate contract shape and `KNOWN_GATE_IDS` extension point,
`resolveState()`'s stage-walking algorithm (Entrega 2 — the `specification` gate, once wired in a
later Entrega, needs no change to `resolveState()` itself). Extends, additively: `manifest.json`'s
schema (new optional `sdd` section, same "accept and validate only what's declared" discipline as
`track` in Entrega 2). Does not modify: `change-loader.js`'s precedence rules, `cli.js`'s `close`/
`markClosed()` boundary (Change 0043's B1 fix), any of the three shipped workflow definitions.

## Success Criteria

See "Success Criteria" in `change.md`.
