# Specification

## Goal

A Change can optionally carry a `manifest.json`. When present, it is authoritative for that
Change's identity/status/type. When absent, AIEF resolves the Change exactly as it does today.
Both paths return the same shape, so downstream code (today: `status`; later: the workflow
engine) reads one interface regardless of format.

## Requirements

- **R1 — Manifest presence is the only precedence signal.** If `manifest.json` exists in a Change
  directory, it is authoritative for that Change. If it does not exist, the four legacy Markdown
  files are authoritative, exactly as today. There is no field-by-field merge between the two.
- **R2 — Legacy Changes are provably unaffected.** For every Change currently under `changes/`,
  the unified loader's output is equivalent to today's `loadChange()` output (same `closed`,
  `statusState`, `type`, `evidenceState`, `openTasksCount`, `missing`, `empty`), plus two new
  fields: `source: "legacy"` and `manifest: null`.
- **R3 — Manifest structural validation.** A `manifest.json` is validated before use. Required
  fields for Entrega 1: `schema` (must equal `"aief.change/v1"`), `id`, `slug`, `title`, `status`
  (one of `open` \| `closed`). Optional fields (accepted, not yet interpreted beyond storage):
  `track`, `sdd`, `context`, `evidence`, `next_action`, `gates`, `risks`.
- **R4 — Actionable validation errors.** An invalid manifest produces one error per problem,
  naming the field and the reason (e.g. `"status: must be 'open' or 'closed', got 'in_progress'"`),
  never a raw JSON-parse exception surfaced to the user.
- **R5 — Missing or malformed manifest does not crash.** A `manifest.json` that exists but fails
  to parse as JSON, or fails validation, is reported as an error result for that Change — it does
  not throw uncaught, and it does not silently fall back to legacy inference (falling back would
  hide a broken manifest as if it were a Change with no manifest at all — a worse failure mode
  than an explicit error, per AGENTS.md "fail loudly" convention already used in
  `change.js`'s status parsing).
- **R6 — `aief status` reads both formats.** `status` (and the internal `openChangeDirs()` open/
  closed determination it depends on) uses the unified loader. Its printed output for every
  existing Change is unchanged (verified by the existing `cli.test.js` / `change-status.test.js`
  suite passing without modification).
- **R7 — No new required file.** `manifest.json` is never added to `CHANGE_FILES`
  (`change.md`/`spec.md`/`tasks.md`/`evidence.md` stay required, unchanged, per ADR-009's Change
  file discipline).
- **R8 — No new command.** This Change introduces no new CLI command or flag, per the ADR-015
  freeze on new commands.
- **R9 — Format decision documented, not assumed.** The manifest serialization format (JSON vs.
  YAML) is decided against the repository's actual dependency footprint (§10/§25 of the vision
  document) and the decision is recorded in `design.md`, not silently defaulted.
- **R10 — `close`'s write-verification must never depend on the manifest.** `close` writes only to
  `change.md` (`markClosed()`); whatever function verifies that write succeeded must read
  `change.md` directly, never the manifest-aware unified loader — added after the independent
  review found this shared incorrectly (finding B1, see "Independent review findings" below).
- **R11 — The manifest's presence never hides missing required files.** `missing`/`empty`, computed
  against `CHANGE_FILES`, must be accurate for a Change loaded through the manifest branch exactly
  as for the legacy branch — added after the independent review found these hardcoded to `[]` on
  the manifest branch (finding H1, see below).

## Acceptance Criteria

- [x] A Change with only `change.md/spec.md/tasks.md/evidence.md` (no manifest) loads via the
      unified loader with `source: "legacy"` and output identical to today's `loadChange()`.
      Verified: `change-loader.test.js`, "a Change with no manifest.json matches loadChange()
      exactly, plus source/manifest".
- [x] A Change with a valid `manifest.json` loads via the unified loader with `source: "manifest"`
      and fields taken from the manifest, not from `change.md` parsing.
      Verified: `change-loader.test.js`, "a Change with a valid manifest.json resolves from the
      manifest".
- [x] A Change with both a manifest and a `change.md` whose `## Status` disagrees with the
      manifest resolves to the manifest's value — the legacy fields are not consulted (R1).
      Verified: `change-loader.test.js`, "manifest status wins over a disagreeing change.md ##
      Status — no merge"; end-to-end through the real CLI in `cli.test.js`, "status honors a
      Change's manifest.json over legacy inference".
- [x] An invalid manifest (missing required field, bad `status` value, invalid JSON) produces a
      result with actionable error(s) — the loader does not throw, and the CLI process does not
      crash when invoked against such a Change.
      Verified: `change-loader.test.js`, "malformed manifest.json is reported, not thrown" and "a
      manifest.json failing validation is reported, not thrown".
- [x] Every Change currently under `changes/` (zero of which has a manifest today) round-trips
      through the unified loader with output equal to `loadChange()`'s today, plus the two new
      `source`/`manifest` fields — a zero-drift regression test across the real corpus.
      Verified: `change-loader.test.js`, "zero-drift regression across every real Change in this
      repository" — 42 Changes, all pass.
- [x] `aief status` output is byte-identical, for every existing Change, before and after this
      Change (diffed against a captured baseline, not just "tests still pass").
      Verified: manual `diff` of captured `aief status` output before/after the `cli.js` edit —
      zero differences (see evidence.md).
- [x] `aief verify`'s readiness rules and `close`'s readiness gate are untouched — they continue to
      call `loadChange()` / `checkChangeReadiness()` directly, unaffected by this Change. `close`'s
      write-*verification* (`markClosed()`) reads `change.md` directly, independent of any
      manifest (R10 — added after review finding B1; see below).
      Verified: `git diff cli/src/cli.js` shows only the import, `isClosed()`, and `markClosed()`
      changed; `cli.test.js` "close --yes succeeds and updates change.md even when the Change
      carries a manifest.json (B1 regression)".
- [x] `missing`/`empty` are accurate on the manifest branch, not hardcoded (R11 — added after
      review finding H1).
      Verified: `change-loader.test.js`, "missing Change files are reported under the manifest
      branch too (H1 regression)" and "...even when the manifest itself is invalid (H1
      regression)".
- [x] `npm test` (from `cli/`) passes with zero modified assertions in existing test files.
      Verified: 149/149 passing (128 pre-existing + 21 new across three test files); `git diff` on
      every pre-existing test file shows pure additions, no edited lines.
- [x] (human) Approve the manifest field set (R3) and the JSON-over-YAML decision (R9), or
      amend either. — Approved 2026-07-25.
- [x] (human) Confirm the ADR-013 scoping argument in `proposal.md` — that this Change is
      additive-and-dormant rather than a core expansion — or reject it. — Confirmed 2026-07-25.
- [x] (review) Independent review before Entrega 2 begins. — Performed 2026-07-25: verdict
      `changes_required` (1 blocking — B1, 2 high — H1/H2). B1 and H1 fixed and re-verified above;
      H2 accepted as documented non-blocking technical debt (see evidence.md).

## Independent review findings (Change 0043's own adversarial review)

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| B1 | Blocking | `markClosed()`'s write-verification shared `isClosed()` with `openChangeDirs()`; a manifest still saying `"open"` made a successful `close --yes` report failure and leave `change.md`/`manifest.json` disagreeing forever. | **Fixed.** `markClosed()` now reads `change.md` directly (R10). Regression test added. |
| H1 | High | `missing`/`empty` were hardcoded to `[]` on the manifest branch, contradicting R7 — a manifest Change missing all four required files reported nothing missing. | **Fixed.** `readChangeFiles()` extracted and shared by both branches (R11). Regression tests added. |
| H2 | High | An invalid `manifest.json` is never surfaced to the user by any command — `manifestError` is computed but nothing reads it. | **Accepted as non-blocking technical debt.** No command writes `manifest.json` yet (dormant feature); tracked in `tasks.md` "Deferred" for the Entrega that first activates the write path. |
| M1 | Medium | Manifest `id`/`slug` are never cross-validated against the Change directory name. | **Accepted as non-blocking technical debt**, same reasoning as H2. |
| M2 | Medium | `docs/architecture.md` and `evidence.md` understated `isClosed()`'s call sites (missed `markClosed()`), the root cause of B1. | **Fixed** as part of B1's fix — `docs/architecture.md` corrected. |
| M3 | Medium | `manifestErrorShape()` and the valid-manifest return object were two hand-maintained object literals with an implicit shared shape. | **Fixed** as part of H1's fix — both now share `missing`/`empty` computed once via `readChangeFiles()`. |
| L1–L3 | Low | Cosmetic error-message asymmetry; no typo detection on manifest fields; unhandled I/O error if `manifest.json` were a directory. | **Accepted as non-blocking technical debt.** Tracked in `tasks.md`. |
