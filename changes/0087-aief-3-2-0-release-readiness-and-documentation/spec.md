# Specification

## Goal

`main` is verified to contain the complete, working Pre-Implementation Definition capability
(Changes 0073–0086); stale merged branches are cleaned; user-facing documentation accurately
represents both existing-implementation and pre-implementation projects; and the repository is
ready for a separate version-bump Change (0088) and, after that, a human-confirmed push.

## Requirements

- Changes 0073–0086 must be reachable from `main`, closed, and their functionality present:
  Definition Change type, project maturity classification, Definition analyze routing, Definition
  enrichment markers, maturity-aware standards, `verify --strict`, the pre-implementation E2E flow,
  `docs/` maturity recognition, and the unresolved-decision close protection.
- Every branch deleted (local or remote) must first be proven merged via
  `git merge-base --is-ancestor`. No unmerged or unreviewed branch may be touched.
- README.md must explain the Definition-vs-Analysis distinction and give a pre-implementation
  entry point discoverable without reading Change evidence.
- Documentation must not claim `aief bootstrap` pre-creates `knowledge/decisions.md` (it does not).
- Documentation must not claim Architecture/Security/Data Definition Skills or Definition Expert
  Enrichment exist.
- Every documented CLI flag/command referenced by the documentation changes here must be verified
  against `cli/src/cli.js` and `aief help`.
- `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` must all pass before this
  Change closes.

## Acceptance Criteria

- [x] Changes 0073–0086 confirmed closed and reachable from `main` (`aief verify` output, `git log`).
- [x] All 7 explicitly-reviewed local branches and their 6 remote counterparts proven merged and
      safely deleted; 6 additional merged-but-unreviewed remote branches identified and left alone.
- [x] README.md documents Definition vs Analysis and a PRD/no-code starting point.
- [x] docs/cheat-sheet.md's glossary includes Project Maturity and Definition Change.
- [x] docs/concepts.md documents which standards are maturity-aware (base/testing/security) and
      which are not.
- [x] docs/getting-started.md, docs/cli.md audited and confirmed already accurate — no changes
      needed beyond what's listed above.
- [x] `aief analyze --maturity <value>`, `aief new-change --type definition`, `aief verify --strict`
      confirmed to exist and behave as documented.
- [x] Documentation consistency search completed; no stale contradictory statement found.
- [x] `npm test` (907/907), `node cli/bin/aief.js verify` (PASS), `git diff --check` (clean).
