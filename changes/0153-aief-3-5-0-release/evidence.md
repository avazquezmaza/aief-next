# Evidence

## Summary

AIEF 3.5.0 is ready to tag: Changes 0148–0152 are integrated, the documentation audit found one
gap (the README status line, fixed), every manifest reports 3.5.0, and `releases/v3.5.0.md` is
written. Readiness, bump and notes are in one Change at the owner's request.

## Activities Performed

- **R1 integration.** 0148, 0149, 0150, 0151 and 0152 each have `Closed` status in `change.md` and
  are reachable from `main` (`git merge-base --is-ancestor`). `git log v3.4.0..main`: 5 commits
  (#99–#103). No ADR added since 3.4.0 (`knowledge/decisions.md` unchanged since `v3.4.0`).
- **R2 documentation audit:**

  | Item | Where checked | Result |
  |---|---|---|
  | Version strings | `README.md`, `docs/`, `cli/README.md` | one hit: `README.md` `## Status` "AIEF 3.4" (fixed in R3) |
  | `[-]` blocks `(human)`/`(review)` (0150) | `docs/cli.md` `close` row, `docs/security-model.md`, `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `docs/history/governance-conventions.md` §2 | documented by 0150; no gap |
  | "Approvals relied on:" (0150) | `docs/cli.md`, `docs/security-model.md` | documented; no gap |
  | `(human)`/`(review)` mentions elsewhere | `docs/workflow.md`, `concepts.md`, `getting-started.md`, `cheat-sheet.md`, `assistant-workflow.md` | none contradicts 0150 |
  | `protocol-security-reviewer`, `websocket`, `grpc` (0151) | `README.md`, `docs/`, `cli/README.md` | docs do not list catalog Skills or detectors by name (12 catalog Skills); no list to update |

- **R3 bump.** `npm version 3.5.0 --no-git-tag-version` at the root and in `cli/`. Lockfile diffs
  are only the two own-version fields each; no dependency change. `README.md` `## Status`:
  "AIEF 3.4" → "AIEF 3.5".
- **R4 notes.** `aief release 3.5.0` scaffolded `releases/v3.5.0.md`; filled with upgrade notes,
  summary of 0148–0153 and verification. Platform-controls wording checked against
  `docs/security-model.md` lines 88–89; the `graphql` trigger checked against
  `cli/src/skills-catalog.json` (`when: ["websocket", "grpc", "graphql"]`).
- **R5 index.** `changes/README.md`: "Unreleased (after 3.4.0) — 0148+" → "3.5.0 — 0148–0153",
  0153 appended, new empty "Unreleased (after 3.5.0) — 0154+" section.
- **Diagrams.** `python3 scripts/diagrams/generate_all.py`: every SVG byte-identical.
  `docs/images/adoption-workflow.png` re-rasterized with a different byte size on the local
  renderer (same as in 0147) and was restored to the committed version.

## Verification

| Check | Result |
|---|---|
| `node -p "require('./package.json').version"` / `cli/package.json` | `3.5.0` / `3.5.0` |
| `node cli/bin/aief.js --version` | `aief 3.5.0` |
| Pre-tag grep `AIEF 3.4\|3.4.0` in `README.md`, `docs/` (excluding `docs/history/`), `cli/README.md` | no hits |
| `npm test` | 1141/1141 pass |
| `npm run lint` | clean |
| `node cli/bin/aief.js verify` | PASS |
| `git diff --check` | clean |
| Relative link check (all `.md`) | only the 41 historical breaks inside Changes < 0100 (see 0152) |

## Findings

- Version-bump classification: MINOR. 0150 makes `close` and `verify --strict` refuse `[-]` on
  `(human)`/`(review)`, which they accepted in 3.4.0. Additive Skill/detectors (0151) alone would
  also be MINOR.

## Risks

- A project with an existing `[-] (human)` or `[-] (review)` line in an open Change will see
  `close` refuse after upgrading. Called out first in the upgrade notes.

## Recommendations

- After merge, with explicit owner confirmation only: tag `v3.5.0` on the merge commit and publish
  the GitHub Release from `releases/v3.5.0.md` (same flow as 3.4.0).
- Deferred from 0151, still open: a Spike/PoC security-maturity ADR and a Kafka/RabbitMQ broker
  Skill.

## Artifacts Produced

- `package.json`, `package-lock.json`, `cli/package.json`, `cli/package-lock.json` (version)
- `README.md` (`## Status`)
- `releases/v3.5.0.md` (new)
- `changes/README.md` (3.5.0 section)
- `changes/0153-aief-3-5-0-release/`

## Lessons Learned

- The `changes/README.md` index from 0152 made the release inventory a one-section read; its
  "Unreleased" section is now the natural place to start the next release's inventory.

## Next Change

None required before tagging.
