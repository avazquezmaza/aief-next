# Specification

## Goal

Every already-closed Change's own `spec.md`/`evidence.md` accurately reflects what was actually
done, and Change 0130's Findings Status table accurately reflects which findings are resolved.

## Requirements

- R1: Change 0122 (multi-agent)'s `spec.md` "Document" requirement is amended to authorize the
  `docs/history/README.md` index entry, matching what `evidence.md` already correctly recorded;
  the correction is visibly marked as a retroactive edit citing C0130-F3, not silently rewritten
  as if it had always read that way.
- R2: Change 0122 (multi-agent)'s acceptance criterion "No file outside this Change and the new
  document was created or modified" is corrected to name the one authorized exception.
- R3: Change 0122 (CI)'s `evidence.md` "awaiting confirmation" passage is corrected to state the
  confirmed outcome, visibly marked as a retroactive edit citing C0130-F4.
- R4: Change 0122 (CI)'s `evidence.md` "Next Change" passage is corrected the same way.
- R5: Change 0130's Findings Status table marks C0130-F1 (already resolved by Change 0131),
  C0130-F3, and C0130-F4 as Resolved, each pointing at its resolving Change — per `AGENTS.md`'s
  Evidence Guidance for a living Findings Status table.

## Acceptance Criteria

- [ ] `changes/0122-multi-agent-runtime-open-questions/spec.md`'s Document requirement and
      acceptance criterion both name the `docs/history/README.md` exception.
- [ ] `changes/0122-ci-apt-chrome-mirror-flakiness/evidence.md` contains no passage written as
      if CI confirmation were still pending.
- [ ] `changes/0130-codex-external-audit/evidence.md`'s Findings Status table shows C0130-F1,
      C0130-F3, C0130-F4 as Resolved with this Change (or 0131, for F1) named.
- [ ] Every correction is visibly marked as a correction (citing the finding id), not silently
      rewritten as original text.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0134-resolve-codex-audit-doc-findings --strict` all
      pass.
