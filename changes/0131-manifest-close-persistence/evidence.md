# Evidence

## Summary

Fixes finding C0130-F1 from the external Codex audit: `aief close --yes` now updates
`manifest.json`'s `status` field for a manifest-backed Change, atomically with `change.md` —
either both update, or the whole close is refused with a clear error. Before this Change, close
reported success while silently leaving the authoritative manifest state stale.

## Activities Performed

- Reproduced the bug independently before opening this Change (recorded in
  `changes/0130-codex-external-audit/evidence.md`'s "Independent Verification" section): a
  `lite`-track Change with `manifest.json.status: "open"` closed successfully via
  `aief close --yes`, yet the manifest remained `"open"` and `aief status` immediately
  contradicted the "Closed" message.
- Added `markManifestClosed(changeDir)` to `change-loader.js`, reusing the exact
  `parseManifest()`/`validateManifest()` functions that module already uses for reading — no
  second notion of "valid manifest."
- Wired it into `close.js` **before** `markClosed()` (the `change.md` writer): a manifest that
  can't be safely updated aborts the close before anything is written — true atomicity, not
  "write change.md regardless."
- Updated the one pre-existing test (`cli-graph-and-verification.test.js`) that had documented
  the bug as established behavior, replacing it with the corrected expectation; added a
  separate test to keep the manifest/change.md drift-*detection* mechanism (unrelated to this
  fix) exercised via a disagreement created independently of `close`.
- Added unit tests for `markManifestClosed()` (no-op, success, malformed JSON, schema-invalid)
  and an integration test for atomicity (a malformed manifest leaves `change.md` untouched too).

## Verification

- `npm test` (cli/): 1095/1095 passed (10 new/updated).
- `npm run lint`: clean — including Change 0128's architecture-fitness rules (the fix stays
  inside `core/domain/`, imports no Service or Command).
- `node cli/bin/aief.js verify --change 0131-manifest-close-persistence --strict`: PASS.
- `git diff --check`: clean.
- Confirmed the pre-existing "manifest.json is never touched by close" test
  (`cli-definition-enrichment.test.js`) — the *refused*-close case (unresolved Workflow gate) —
  still passes unmodified: `markManifestClosed()` only runs after the blocked-check, so a
  refused close still writes nothing at all, exactly as before.

## Findings

- None beyond what change.md already named.

## Risks

- None identified. The change is scoped to exactly one field (`status`) on
  `manifest.json`, only on a successful close, and aborts cleanly (writing nothing) on any
  manifest problem rather than proceeding partially.

## Recommendations

- C0130-F2 (the general ID-collision gap), C0130-F3, and C0130-F4 remain open in
  `changes/0130-codex-external-audit/evidence.md`'s Findings Status table — small, separate
  corrections, left for a human or a future Change to pick up, per this session's own
  "stop once scope is satisfied" discipline (Change 0127).

## Artifacts Produced

- `cli/src/core/domain/change-loader.js`, `cli/src/commands/close.js` (implementation).
- `cli/tests/change-loader.test.js`, `cli/tests/cli-graph-and-verification.test.js` (new/updated
  tests).

## Lessons Learned

- An external audit's claim was independently reproduced before this fix Change was even
  opened, and again exercised by an automated regression test here — the same "verify before
  accepting" discipline this session applied throughout, now applied to an audit finding rather
  than a self-generated design claim.
- The pre-existing test this Change replaced had a comment explicitly documenting the bug as
  "established behavior" from an earlier Entrega — a reminder that a comment asserting
  something is "by design" is not itself proof that it should stay that way once a real defect
  is found; it only records what was true then.

## Next Change

- None required by this fix. See Recommendations for the still-open findings tracked in
  Change 0130.
