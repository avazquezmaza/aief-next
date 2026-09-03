# Change

## ID

`0087-aief-3-2-0-release-readiness-and-documentation`

## Type

General (consolidation — no new subsystem)

## Objective

Prepare AIEF 3.2.0 for release: verify Changes 0073–0086 (Pre-Implementation Definition) are fully
integrated on `main`, clean up stale merged branches, refresh user-facing documentation so it
accurately represents both existing-implementation and pre-implementation projects, and record
release-readiness evidence — without introducing a new subsystem, bumping the version, tagging, or
pushing (those are separate, later steps, following the 0060/0062 precedent).

## Inventory of what already exists (read before touching anything)

AIEF 3.2.0 is fourteen Changes since 3.1.0 (0073–0086), each already closed with its own evidence:

- **0073–0078 — post-3.1 remediation**: complete CLI test discovery in CI, Jira file-path
  containment, standard Markdown checkbox support, lifecycle/trust-boundary documentation, strict
  unknown-CLI-option rejection, nested-bootstrap protection.
- **0079 — Definition Change type**: a new pre-implementation Change shape (Context, Known
  Requirements, Open Questions, Decisions Required, `Decision (human)`, Implementation
  Prerequisites) alongside Adoption/Analysis/Delivery.
- **0080 — Project maturity detection**: `aief analyze` classifies a repository deterministically
  (Implemented / Definition / Ambiguous) from file evidence and routes accordingly; `--maturity`
  override.
- **0081 — Definition enrichment workflow**: `(decision required)` / `(ambiguous)` / `(deferred)` /
  `(human)` line-marker convention; `aief status --change` reads it without inferring from prose.
- **0082 — Maturity-aware standards**: `base-standards.md`, `testing-standards.md`,
  `security-standards.md` split into "Applies now" (Definition-stage) and "Applies once
  implementation starts" sections.
- **0083 — `aief verify --strict`**: opt-in, additive, deterministic objective-completeness checks
  (unresolved `TODO`/`TBD`, untouched placeholders, unresolved Decisions Required, unresolved `(human)`
  tasks) layered on top of unchanged default `verify`.
- **0084 — End-to-end pre-implementation initialization**: the full bootstrap → analyze → Definition
  → decide → verify --strict → close flow, validated live.
- **0085 — `docs/` maturity signal**: a `docs/` directory with real PRD/requirements content is also
  recognized as Definition evidence, not just a root-level file.
- **0086 — Close protection**: `aief close` refuses to close a Definition Change with an unresolved
  `Decisions Required` item or an unchecked `(human)` task, closing the one gap 0083's `--strict`
  check could still be bypassed through.

The base suite at the start of this Change is 907/907 tests PASS (`npm test`, repo root); `aief
verify` PASSES; `git diff --check` is clean; `main` and `origin/main` are identical.

## Scope

### In scope

- **Integration verification**: confirm 0073–0086 are reachable from `main`, all closed, and the
  Definition capability (maturity detection, Definition Change type, enrichment markers,
  maturity-aware standards, `verify --strict`, close protection) is present and working.
- **Branch cleanup**: verify and safe-delete (`git branch -d`, `git push origin --delete`) local and
  remote branches proven merged into `main`/`origin/main` — `core3`, `feat/bump-v3.1.0`,
  `feat/findings-status-tracking`, `feat/v3.1`, `feature/pre-implementation-definition`,
  `feature/workflow-cohesion-governance-conventions`, `remediation/audit-fixes-2026-08` (local
  only — no remote counterpart).
- **Documentation refresh** so a new user can discover the pre-implementation Definition workflow
  without reading Change evidence:
  - `README.md` — product positioning now names definition/implementation/verification/change
    lifecycle governance (not just "existing codebase"); new "Definition and Analysis: two starting
    points" section with the maturity routing table; new "Start a software initiative before code
    exists" section mirroring the existing "Adopt AIEF in an existing project" one; a
    pre-implementation-governance bullet under "What AIEF adds"; two new Documentation-table rows.
  - `docs/cheat-sheet.md` — added "Project Maturity" and "Definition Change" glossary rows (were
    entirely absent); "Canonical flow" step 2 now names both the Implemented and Definition paths.
  - `docs/concepts.md` — added a short "Applies now / Applies once implementation starts" paragraph
    under Project Maturity, naming which three standards are actually maturity-split (base, testing,
    security) and which are not (frontend, backend, documentation).
  - Audit confirmed `docs/getting-started.md` ("Starting from a PRD (no code yet)"), `docs/cli.md`
    (`analyze`/`new-change --type definition`/`verify --strict` rows), and `docs/concepts.md`
    (Change types, Project Maturity) were already accurate and complete from Changes 0079–0086's own
    documentation scope — left unchanged beyond the maturity-aware-standards addition above.
  - `docs/architecture.md` and `AGENTS.md` audited and found to make no claim that contradicts
    Definition — left unchanged (avoids unrelated restructuring).
- **CLI documentation validation**: `aief analyze --maturity <value>`, `aief new-change --type
  definition`, `aief verify --strict`, `aief status --change <id>` all confirmed against the actual
  implementation (`cli/src/cli.js`) and CLI `--help` output.
- **Documentation consistency search**: `grep` sweep for `aief analyze`/`aief verify`/`Definition`/
  `existing.*implementation`/`existing.*code` across README/docs/AGENTS.md — no stale contradictory
  statement found; historical docs under `docs/history/` left untouched.
- This Change's own `spec.md`, `tasks.md`, `evidence.md`.

### Out of scope

- Definition Expert Enrichment, Architecture/Security/Data Definition Skills, or any other
  post-3.2.0 program — not started, not referenced as a current capability.
- `package.json`/`cli/package.json` version bump — a separate Change (0088), per the 0062 precedent.
- Git tag, `releases/vX.Y.Z.md`, or a GitHub Release — per the established 3.0→3.1 precedent (only
  `v3.0.0` was ever actually tagged; `v3.1.0` shipped with a version-bump commit only, no tag, no
  `releases/` file, no GitHub Release), 3.2.0 follows the same minimal pattern. See `evidence.md` for
  the full precedent audit.
- Any new subsystem, command, or manifest field.
- Deleting any branch not proven merged, or any remote branch outside the explicitly reviewed set
  (six additional merged-but-unreviewed remote branches — `docs/0066-*`, `feat/0067-*`,
  `feat/0068-*`, `feat/0069-*`, `feat/0072-*`, `refactor/0070-*` — are reported, not deleted).
- `git push` of this Change's own commit — deferred to the final release step after 0088 closes, per
  standing Git-discipline rule (explicit confirmation before every push).

## Success Criteria

- Changes 0073–0086 confirmed reachable from `main`, closed, and functioning as documented.
- All merged, explicitly-reviewed stale branches (local and remote) safely deleted; no unmerged or
  unreviewed branch touched.
- README explains Definition vs Analysis and covers a pre-implementation starting point.
- Getting Started, Concepts, CLI Reference and Cheat Sheet documentation verified accurate against
  actual CLI behavior; identified gaps (README positioning, cheat-sheet glossary, maturity-aware
  standards) fixed.
- No documentation claims unimplemented Architecture/Security/Data Definition Skills exist.
- `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass before commit.

## Status

Closed (2026-08-14)
