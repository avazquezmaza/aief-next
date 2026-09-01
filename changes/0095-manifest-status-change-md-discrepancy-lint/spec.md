# Specification

## Goal

A Change that carries a valid `manifest.json` and whose `change.md` also carries its own
`## Status / Closed` section (e.g. because `aief close --yes` ran against it after the manifest was
created) surfaces the disagreement between `manifest.status` and `change.md`'s status as a visible,
non-blocking warning — from both `aief status` and `aief verify` — instead of the manifest's value
winning in total silence, as it does today. Nothing is written to either file by this detection.

## Requirements

- **R1 — read-only comparator.** A pure function, e.g. `detectManifestStatusDrift(change)` in
  `cli/src/core/domain/` (co-located with `change-manifest.js`/`change-loader.js`), taking an
  already-loaded Change record and returning `{ drift: boolean, manifestStatus, changeMdStatus }`.
  It must not read any file itself — it operates on data `loadChangeUnified()` already produced,
  the same discipline `resolveHarnessConfig()`/`resolveLoopConfig()` already follow for their inputs.
- **R2 — reuses the existing status parser.** `changeMdStatus` comes from the same tolerant
  `## Status` reader Change 0036/F1 built (not a second, competing regex) — read `change.md`
  regardless of `source: "manifest"`, since today's loader intentionally skips that read for the
  closed/open decision; this Change adds the read back in, for comparison only, never for deciding
  closed/open.
- **R3 — no gate, no blocker.** The drift is surfaced as a warning/note. It never changes
  `verify`'s PASS/FAIL, never changes `status`'s derived open/closed state, never appears as a
  `change-graph.js`-style blocking issue.
- **R4 — `aief status` surfaces it** in the per-Change block (same place `manifestError` and
  workflow-blocker warnings already render), only when `drift` is true. Silent otherwise — a Change
  with no manifest, or a manifest whose status agrees with `change.md`, renders byte-identical to
  before this Change.
- **R5 — `aief verify` surfaces it** as a non-blocking note (same tier as the existing
  `change-graph.js` issue note for a targeted Change), only when `--change <id>` targets a Change
  with drift, or (whole-project `verify`) for any Change found with drift while iterating.
- **R6 — `docs/concepts.md` updated**, not just code. The "Current limitation" paragraph under
  Change Manifest gains one sentence: a disagreement is now detected and reported by `status`/
  `verify`, while explicitly preserving today's wording that no writer/reconciliation exists —
  the fix is detection, not resolution.

## Acceptance Criteria

- [ ] `detectManifestStatusDrift()` exists, is pure (no I/O), and is unit-tested for: no manifest
      (returns no drift, trivially), manifest present with no `change.md` Status section (no
      drift), manifest present and `change.md` Status agrees (no drift), manifest present and
      `change.md` Status disagrees (drift: true, both values reported).
- [ ] `aief status` prints the warning only for a drifting Change; a fixture corpus with zero
      drifting Changes (i.e. today's real `changes/` directory) produces byte-identical `status`
      output before/after this Change.
- [ ] `aief verify` prints the non-blocking note only for a drifting Change; exit code and PASS/FAIL
      are unaffected by drift in every test case.
- [ ] No test or manual run of `status`/`verify` writes to `manifest.json` or `change.md`
      (byte-comparison before/after, same pattern `workflow-service.js`'s own tests use).
- [ ] `docs/concepts.md`'s "Current limitation" paragraph updated to describe detection.
- [ ] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
