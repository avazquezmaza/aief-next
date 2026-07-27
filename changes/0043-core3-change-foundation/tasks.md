# Tasks

## Design (this Change)

- [x] Inspect the current CLI entrypoint, command dispatch, Change domain model, `status`,
      `verify`, `close`, Prompt Engine, skills catalog, OpenSpec integration, tests.
- [x] Read every accepted ADR in `knowledge/decisions.md` for constraints bearing on this work
      (ADR-009, ADR-013, ADR-015 especially).
- [x] Compare current state against `docs/aief-core-3-claude-code-prompt.md`.
- [x] Decide manifest format (JSON vs. YAML) against the repository's actual dependency footprint.
- [x] Decide module placement (extend `core/domain/`, not create `core/change/`).
- [x] Decide schema strategy (defer standalone `schemas/*.schema.json`, see design.md §6).
- [x] Write `proposal.md`, `spec.md`, `design.md` for Entrega 1.
- [x] Surface the ADR-013 / ADR-015 tension explicitly rather than resolving it by implication.

## Implementation

- [x] `cli/src/core/domain/change-manifest.js`: `parseManifest()`, `validateManifest()`.
- [x] `cli/src/core/domain/change-loader.js`: `loadChangeUnified()`, `mapLegacyChange()`,
      `loadManifestChange()`.
- [x] Wire `cli/src/cli.js` `status()` / `openChangeDirs()` to `loadChangeUnified()` (surgical —
      no output change for legacy Changes; only `isClosed()`'s implementation changed).
- [x] `cli/tests/change-manifest.test.js` (10 tests).
- [x] `cli/tests/change-loader.test.js` (7 tests), including the zero-drift regression over every
      real Change under `changes/` (42 Changes, all manifest-free today).
- [x] Extend `cli/tests/cli.test.js` with one manifest-based `status` scenario (no existing
      assertion edited).
- [x] Capture a baseline of current `aief status` output (every existing Change) before touching
      `cli.js`, diff against after — byte-identical (spec.md acceptance criterion).
- [x] Run `cd cli && npm test`; all 128 pre-existing assertions pass unmodified; 146 total after
      the 18 new tests.
- [x] Update `evidence.md` with the verification transcript.

## Independent review and fixes (2026-07-25)

- [x] Independent adversarial review performed against
      `docs/aief-core-3-claude-code-prompt.md`, `proposal.md`, `spec.md`, `design.md`, `tasks.md`,
      the git diff, tests, and documentation. Verdict: `changes_required` (B1 blocking; H1, H2
      high; M1–M3 medium; L1–L3 low). Full findings in `spec.md` "Independent review findings".
- [x] Fix B1: `markClosed()` now verifies its own write against `change.md` directly
      (`isClosedContent(read(file))`), never through the manifest-aware `isClosed()`. Comment added
      to `isClosed()` explaining why it must not be shared with `markClosed()`.
- [x] Fix H1: extracted `readChangeFiles()` in `cli/src/core/domain/change.js`, shared by
      `loadChange()` and the manifest branch (`change-loader.js`) — `missing`/`empty` are now
      computed identically on both branches, including on the manifest-invalid error path.
- [x] Add regression tests: `cli.test.js` "close --yes succeeds and updates change.md even when
      the Change carries a manifest.json (B1 regression)"; `change-loader.test.js` "missing Change
      files are reported under the manifest branch too (H1 regression)" and "...even when the
      manifest itself is invalid (H1 regression)".
- [x] Re-run full suite after the fixes: 149/149 passing (146 + 3 new regression tests).
- [x] Re-diff `aief status` output before/after the full set of changes (design + fixes) — still
      byte-identical.
- [x] Removed a stray `changes/0044-manifest-closed-test/` directory accidentally created in the
      real repository during manual reproduction of B1 (a `cd`-ordering mistake in a throwaway
      shell command, never committed) — confirmed via `git status` before deletion.
- [x] Document H2, M1, L1–L3 as accepted non-blocking technical debt (see "Deferred" below and
      `evidence.md`), per explicit user decision to fix B1 + H1 now and defer the rest.

## Verification

- [x] `aief verify` passes on this Change (`0043-core3-change-foundation`).
- [x] No file deleted or renamed (outside the stray artifact removed above, which was never
      committed); no existing test assertion edited; no `changes/<id>/` structure changed for any
      other existing Change.
- [x] `docs/aief-core-3-claude-code-prompt.md` untouched (source document, read-only for this work).

## Human gates

- [x] (human) Approve or amend the manifest field set (`spec.md` R3) and the JSON-over-YAML
      decision (`design.md` §5). — Approved as documented; user approved "el plan de la Entrega 1"
      in full, 2026-07-25.
- [x] (human) Confirm or reject the ADR-013 scoping argument (`proposal.md` "Problem" section) —
      that Entrega 1 is additive-and-dormant rather than a core expansion requiring a named
      removal. — Approved as documented, 2026-07-25.
- [x] (human) Confirm whether ADR-015's "new commands" freeze needs re-checking before any later
      Entrega (4+) proceeds, given it depends on Change 0042's consolidation state at that time. —
      Confirmed: re-check required at that time, not assumed now. No command was added in this
      Change (R8).
- [x] (review) Independent review before Entrega 2 (Workflow Engine) begins. — Performed
      2026-07-25; `changes_required` findings B1/H1 fixed and re-verified; H2/M1/L1–L3 accepted as
      non-blocking technical debt below, per explicit user decision.

## Deferred

- [-] `schemas/change-manifest.schema.json` — deferred until a schema-validation approach is
      chosen (design.md §6). `change-manifest.js` remains the single source of truth for the
      Entrega 1 field set.
- [-] Wiring `verify` / `close`'s readiness gate to the unified loader — deferred; out of scope for
      Entrega 1 (change.md "Out of scope"). Only `close`'s write-verification was touched, and only
      to isolate it from the manifest (B1 fix), not to add manifest awareness to it.
- [-] `aief migrate` (writing a `manifest.json` from an existing `change.md`) — deferred, per
      design.md §9.
- [-] **H2 (accepted technical debt)** — an invalid `manifest.json` is never surfaced to the user
      by any command (`manifestError` is computed but unread by `cli.js`). Low risk today: no
      command writes `manifest.json` yet. Must be revisited before or alongside whichever Entrega
      first writes manifests (likely Entrega 4, `aief start`) — a human should not be able to
      create a broken manifest without finding out.
- [-] **M1 (accepted technical debt)** — manifest `id`/`slug` are never cross-validated against the
      Change directory name; selection still keys off the directory only. Revisit alongside H2.
- [-] **L1–L3 (accepted technical debt)** — cosmetic `status: ... got undefined` message asymmetry
      when `status` is missing entirely; no typo/unknown-field detection in `validateManifest()`;
      `fs.readFileSync(manifestPath)` in `loadManifestChange()` is not wrapped in try/catch (a
      `manifest.json` that is actually a directory, or hits a permission error, would throw
      uncaught). All low-probability, low-impact; fix opportunistically or when H2/M1 are addressed.
- [-] Entregas 2–8 (Workflow Engine, SDD Integration, User Workflow, Skills and Hooks,
      Verification, Review, Close and Migration) — not started, per the user's explicit
      instruction to stay inside Entrega 1.
