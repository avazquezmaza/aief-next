# Evidence

## Summary

Resolves the two remaining documentation-integrity findings from the external Codex audit
(C0130-F3, C0130-F4) and updates Change 0130's Findings Status table to reflect all four
findings' real state — three now resolved (C0130-F1 by Change 0131, C0130-F3/F4 by this
Change), one (C0130-F2's general gap) still open. No application code touched.

## Activities Performed

- **C0130-F3**: Change 0122 (multi-agent)'s `spec.md` said "no existing document modified" and
  marked the matching acceptance criterion `[x]`, while its `evidence.md` already correctly
  recorded the one `docs/history/README.md` index-entry edit. Rather than reverting that
  edit (a genuinely useful navigation link, not a scope violation), amended `spec.md`'s
  requirement and acceptance criterion to explicitly authorize it — per Codex's own
  recommended option. The correction is visibly marked, citing C0130-F3, not silently rewritten
  as if it had always read that way.
- **C0130-F4**: Change 0122 (CI)'s `evidence.md` had two passages still phrased as open
  questions ("awaiting confirmation…", "once CI is confirmed green, this Change can close…")
  after PR #67's CI had already confirmed green and the Change had already closed. Corrected
  both to state the confirmed outcome, each visibly marked, citing C0130-F4.
- Updated Change 0130's Findings Status table: C0130-F1 (previously left as "Open — fix Change
  opened" even though Change 0131 had already closed and resolved it — a stale row, fixed here
  too, in passing, since it's the same table this Change is already correcting) now shows
  Resolved (0131); C0130-F3/F4 now show Resolved (0134, this Change).

## Verification

- Re-read both corrected Change 0122 files end-to-end after editing to confirm no remaining
  contradiction or stale-confirmation language.
- `npm test` (cli/): 1095/1095 passed — unaffected, as expected (no application code touched).
- `npm run lint`: clean — unaffected.
- `node cli/bin/aief.js verify --change 0134-resolve-codex-audit-doc-findings --strict`: PASS.
- `git diff --check`: clean.

## Findings

- Found the C0130-F1 row in Change 0130's own Findings Status table was itself stale (said
  "Open — fix Change opened" after Change 0131 had already closed) — not one of the two findings
  this Change was scoped to fix, but the same category of staleness C0130-F4 flagged, caught
  while already editing the same table. Fixed in the same pass rather than opening a third,
  even-smaller Change for one table cell.

## Risks

- None. Documentation-only corrections to already-closed Changes' own record-keeping; no
  behavior, code, or currently-active Change's scope changes.

## Recommendations

- C0130-F2's general gap (numeric Change-ID collision not caught by `verify`) remains the one
  open item from the external audit. Worth a dedicated, small design pass if pursued: decide
  whether identity allocation should change (so parallel branches can't produce the same id) or
  whether `verify` should reject a repository-wide duplicate — this Change does not decide that,
  per its own scope.

## Artifacts Produced

- `changes/0122-multi-agent-runtime-open-questions/spec.md`
- `changes/0122-ci-apt-chrome-mirror-flakiness/evidence.md`
- `changes/0130-codex-external-audit/evidence.md` (Findings Status table)

## Lessons Learned

- Keeping a living Findings Status table (per `AGENTS.md`'s Evidence Guidance) only works if a
  resolving Change actually updates it — Change 0131 closed C0130-F1 without updating Change
  0130's table, which is exactly the staleness this convention exists to prevent. Worth adding
  "update the resolving Analysis Change's Findings Status table" as an explicit task next time a
  Change resolves a named finding, not just fixing the underlying issue.

## Next Change

- None required now. C0130-F2's general gap remains open, per Recommendations above, for a
  separate future Change if pursued.
