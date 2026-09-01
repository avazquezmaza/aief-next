# Change

## ID

`0095-manifest-status-change-md-discrepancy-lint`

## Type

Implementation

## Objective

Make the known `manifest.status` / `change.md` divergence **visible** instead of silent, without
writing to either file and without making the manifest an authoritative or reconciled store of
derived state. `docs/concepts.md`'s documented limitation stands today: "No AIEF command today
creates, writes, or synchronizes `manifest.json` or its `status` field — `aief close --yes` writes
only `change.md`'s `## Status` section." For a Change that carries a manifest, `loadChangeUnified()`
(`cli/src/core/domain/change-loader.js`) treats `manifest.status` as authoritative and never even
reads `change.md`'s own `## Status` — so if `aief close --yes` is ever run against a manifest-bearing
Change, `change.md` gets a `## Status / Closed` section that every downstream command (`status`,
`status --next`, `prompt`) silently ignores, still reporting the Change open. That is exactly the
"plausible, confident, wrong answer" class Change 0036 named as worse than no governance signal at
all, applied to a different pair of files.

## Why not a writer or a reconciliation command

An external audit initially recommended making `aief close` (or a new command) write
`manifest.status` automatically. Rejected on inspection against the existing ADR log:

- **ADR-009** ("No hidden state — the Change files are the only source of truth") already rejected
  a parallel persisted-state proposal (`.aief/state.json`) for the identical reason: it creates a
  second source of truth that can drift from reality.
- **ADR-016** goes further and forbids exactly this shape of fix: *"turning the manifest into a
  mutable results database is the 'manifest becomes a database' outcome the project owner
  explicitly ruled out."* ADR-016 already establishes the correct pattern for this class of
  problem — treat a manifest field that might disagree with derived reality as an **unverified
  hint**, and **report the disagreement, never silently resolve it** (its own wording, for
  `manifest.next_action`).

This Change applies that already-accepted pattern to `manifest.status`, rather than inventing a new
one.

## Scope

### In scope

- A pure, read-only check: for a Change with `source: "manifest"` (a valid manifest present), also
  read whether `change.md` carries its own `## Status / Closed` section (the same parser Change
  0036/F1 hardened) and compare it against `manifest.status`.
- Surface a disagreement as a visible warning from `aief status` (per-Change block) and `aief
  verify` (non-blocking, mirroring how `change-graph.js` issues are already reported as notes, not
  failures) — never a silent resolution, never a second guess of which one is "right."
- Unit tests built the same way Change 0036 built F1's: a manifest-bearing Change whose `change.md`
  was closed after the manifest was created (the real scenario this ADR gap allows), asserting the
  warning fires and that no file is written by `status`/`verify` (byte-comparison, same discipline
  `workflow-service.js`'s own tests already use).
- Update `docs/concepts.md`'s "Current limitation" paragraph once the warning exists, so it
  describes detection rather than only the raw gap.

### Out of scope

- Writing, synchronizing, or reconciling `manifest.status` from any command. Still nobody's job —
  unchanged from today.
- Deciding which of the two values is authoritative when they disagree. `aief close`/`aief verify`
  keep reading `change.md` directly for closed/open, per ADR-016's explicit "unaffected" carve-out;
  `status`/`status --next`/`prompt` keep treating the manifest as authoritative for those commands,
  per Change 0044/0059's existing, unmodified contract. This Change only makes the disagreement
  observable.
- Any new command, flag rename, or `status --plan`-style surface change (that path is separately
  gated by ADR-015/ADR-018 pending Change 0042's consolidation — not part of this Change).

## Success Criteria

- A Change whose `manifest.status` and `change.md`'s own `## Status` section disagree produces a
  visible warning from `aief status` and a non-blocking note from `aief verify`; a Change with no
  such disagreement (the entire existing 94-Change corpus today) is byte-identical in output to
  before this Change.
- No file writes introduced by this Change; `npm test`, `aief verify`, and `git diff --check` all
  pass.
- `docs/concepts.md` updated to reflect the new detection, without claiming the underlying
  limitation (no writer/reconciliation) is resolved — because it deliberately still isn't.

## Status

Closed (2026-09-01)
