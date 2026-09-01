# Evidence

## Summary

Implemented the read-only detection this Change scoped: a pure comparator, `detectManifestStatusDrift()`,
plus surfacing it from `aief status` (overview and `--change`) and `aief verify` (targeted and
whole-project). No writer, no reconciliation, no gate — matching the rejected-alternative
reasoning in `change.md` against ADR-009/ADR-016. `docs/concepts.md`'s "Current limitation"
paragraph updated to describe the new detection without claiming the underlying gap is resolved.

## Activities Performed

- Added `cli/src/core/domain/manifest-status-drift.js` — `detectManifestStatusDrift(change)`,
  a pure function reusing the existing tolerant `## Status` parser (`parseChangeStatus`,
  Change 0036/F1) rather than a second, competing regex.
- Exposed `change.md`'s raw content on the manifest branch of `loadChangeUnified()`
  (`changeMdRaw`, `cli/src/core/domain/change-loader.js`) so the comparator can read it without
  doing its own I/O (R1). `.closed` still derives from `manifest.status` alone — unchanged.
- Added `manifestStatusDriftChanges()` to `cli/src/commands/shared.js`, mirroring the existing
  `invalidManifestChanges()` additive-section pattern.
- Wired the warning into `aief status`'s overview (a new "Changes where manifest.status disagrees
  with change.md" section, present only when at least one Change drifts) and into
  `aief status --change <id>` (a warning line right after `Status: open/closed`).
- Wired a matching non-blocking note into `aief verify --change <id>` (via `runManifestStatusDriftCheck()`,
  reusing the `inspection.change` that `explainWorkflow()` already computed — no second
  `loadChangeUnified()` call for that path) and into whole-project `aief verify` (scanned
  alongside the Changes it already iterates).
- Updated `docs/concepts.md`'s "Current limitation" paragraph under Change Manifest.

## Verification

- New unit test file `cli/tests/manifest-status-drift.test.js` (7 tests): no manifest (no drift),
  manifest present with no `change.md` status declaration (no drift), agreement (no drift), the
  real target scenario — `change.md` closed after the manifest was created open (drift, both
  values reported, `.closed` still decided by the manifest alone) — an unparseable `change.md`
  status (reported as drift, not silently ignored), an invalid manifest (never a drift candidate),
  and a zero-drift regression across every real Change in this repository (none carries a
  manifest.json yet).
- Two new CLI-level tests added to `cli/tests/cli-graph-and-verification.test.js`: a byte-identical
  baseline (no manifest-backed Change — `status`/`verify` output unchanged), and an end-to-end
  case — `aief new-change` + a hand-written `manifest.json` (`status: "open"`) + `aief close --yes`
  (which writes only `change.md`, per Change 0043/0044's established behavior) — asserting the
  warning appears from `status` (overview and `--change`) and `verify` (`--change` and
  whole-project), `verify`'s exit code and PASS line are unaffected, and `manifest.json` is
  byte-identical before/after every command in the scenario.
- `npm test`: **997/997 pass** (988 baseline + 9 new tests from this Change).
- `node cli/bin/aief.js verify`: **PASS**.
- `git diff --check`: clean (exit 0).

## Findings

- The exact scenario this Change targets is real and reachable today: `aief close --yes`
  (`cli/src/commands/close.js`) calls `loadChange()` directly and has never read `manifest.json` —
  confirmed by reading the command, not assumed. A manifest-backed Change closed this way is
  silently misreported as open by every command that treats the manifest as authoritative
  (`status`, `status --next`, `prompt`) until this Change's detection.
- No existing test asserted the manifest branch's full return shape via deep-equal (only the
  legacy branch's tests do, via a `rest` destructure), so adding `changeMdRaw` to the manifest
  branch's return object was additive with zero risk to `cli/tests/change-loader.test.js` —
  confirmed by re-running that file, unmodified, after the change.

## Risks

- None identified beyond what `change.md` already scoped out: this Change does not decide which
  of `manifest.status`/`change.md`'s status is authoritative when they disagree, and does not
  change what `close`/`status`/`verify` already do with either value — only that the disagreement
  is now visible.

## Recommendations

- None beyond `change.md`'s own explicit "Out of scope": a writer/reconciliation command remains
  deliberately unbuilt (ADR-009/ADR-016), and any new `status --plan`-shaped surface stays gated by
  ADR-015/ADR-018 pending Change 0042's consolidation.

## Artifacts Produced

- `cli/src/core/domain/manifest-status-drift.js` (new)
- `cli/src/core/domain/change-loader.js` (edited — `changeMdRaw` exposure)
- `cli/src/commands/shared.js` (edited — `manifestStatusDriftChanges()`)
- `cli/src/commands/status.js` (edited — overview section + `--change` warning line)
- `cli/src/commands/verify.js` (edited — `runManifestStatusDriftCheck()` + whole-project scan)
- `cli/tests/manifest-status-drift.test.js` (new — 7 tests)
- `cli/tests/cli-graph-and-verification.test.js` (edited — 2 new CLI-level tests)
- `docs/concepts.md` (edited — "Current limitation" paragraph)

## Lessons Learned

- The comparator-as-hint pattern ADR-016 already established for `manifest.next_action` transfers
  directly to `manifest.status` — no new architectural decision was needed, only applying an
  already-accepted one to a second field. Worth remembering as the default move any time a future
  Change is tempted to add a writer for a value that's cheap to recompute and expensive to keep
  correct as a cache.

## Next Change

- None required by this Change. If a future adopter ends up running `aief close --yes` against a
  manifest-backed Change regularly (once `track`-carrying Changes exist for real, per ADR-016's own
  "dormant until a Change actually carries a manifest.json" framing), the visible warning this
  Change adds is the expected long-term interface — no follow-up is anticipated unless real usage
  shows the warning itself needs to change shape.
