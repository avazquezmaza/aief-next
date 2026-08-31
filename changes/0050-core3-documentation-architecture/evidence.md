# Evidence

## Summary

This Change is planning/analysis-only: it designs the target documentation information architecture
for AIEF Core 3.0 (Changes 0043–0049) without touching any existing documentation file. All 16 of
its own scope tasks (`tasks.md` §"This Change's own scope") are complete; the 6 further tasks
(17–22, staged implementation phases) are explicitly out of this Change's own scope by design and
were carried out by the separate, already-closed Change 0051 (see "Next Change" below). This
evidence file was completed retroactively, consolidating what `design.md` (757 lines, §1–§17) and
`verification.md` (30/30 scenarios) already recorded, so this Change can be closed through the
normal `aief close` gate instead of sitting open with placeholder evidence.

## Activities Performed

- Read Changes 0043–0049 in full (`proposal.md`/`design.md`/`spec.md` where present) and
  `knowledge/decisions.md` (ADR-016–021) to establish ground truth for what Core 3.0 actually
  shipped, cross-checked against `docs/architecture.md` rather than trusted by default
  (`design.md` §3).
- Inventoried all 382 Markdown files in the repository by location and classified each into one
  primary category (`design.md` §2.1–§2.3).
- Identified semantic duplicates and competing entry points — six concrete, cited findings
  (`design.md` §2.4).
- Identified obsolescence grounded in concrete contradictions with the actual repository state —
  five concrete, cited findings, not impressionistic (`design.md` §3).
- Designed the audience model (Deliverable 1), classification model (Deliverable 2, Current /
  Reference / Historical), canonical product surface of 12 documents (Deliverable 3), Concept
  Ownership Matrix across 33 Core 3.0 concepts (Deliverable 4), target information architecture
  with navigation/cross-linking rules (Deliverable 5), six learning journeys by audience
  (Deliverable 6), source-of-truth and governance rules (Deliverable 7), current-to-target document
  mapping (Deliverable 8), the Change 0051 implementation blueprint (Deliverable 9), and the future
  cleanup decision framework (Deliverable 10) — `design.md` §4–§14.
- Ran a structured architecture-review method in lieu of a dedicated documentation-architecture
  skill (none exists in this environment), applying system boundaries, responsibility ownership,
  separation of concerns, dependency direction, discoverability, and conceptual cohesion
  (`design.md` §2, method table).
- Ran a 30-scenario verification pass and a 9-question adversarial self-review before declaring the
  design complete (`verification.md`; `design.md` §16).
- Confirmed no implementation file was touched: `git status --porcelain` showed only this Change's
  own new files under `changes/0050-.../`; 534/534 tests passed unchanged; `aief verify` continued
  to pass (`verification.md` Evidence block).

## Verification

All 30 scenarios in `verification.md` passed or are explicitly scoped as PARTIAL where full-repo
sweep was deferred (scenarios 24/25: broken-link and orphan-document checks were run against the
~50 individually-read files, not the full 382; the remainder was deferred to Change 0051's own
review pass, per `verification.md` row 24). The three closing acceptance criteria
(`verification.md` §"Acceptance criteria") are all checked: every scenario has an explicit check,
no Change artifact or ADR is recommended for deletion anywhere in this Change's artifacts, the
drafted System Map content stays within its 200-line cap, and the repository diff is limited to
this Change's own seven planning files with all tests passing.

## Findings

- **Core 3.0 has an information architecture problem, not a volume or quality problem**
  (`design.md` §1): of ~114 pre-existing documentation files, only 4 mention Core 3.0 at all
  (grep-confirmed), and three separate historical/proposal bodies of writing sit at the same folder
  depth as current product documentation with no structural signal distinguishing them.
- **Two real multiple-owner conflicts** were caught by the Concept Ownership Matrix's
  concept-first (not file-first) method: "Workflow" and "Verification" each had more than one
  document claiming ownership (`design.md` §2, §7) — a prior, file-first pass on this same Change
  had not surfaced these as clearly.
- **A stale ADR status marker**: ADR-021 reads "Proposed... pending project-owner review" while
  `changes/0049-core3-verification-engine/change.md` records `Status: Closed (2026-07-27)` — the
  Change closed the day after the ADR's "Proposed" status was recorded, and no later edit updated
  the ADR header (`design.md` §3, §15).
- **Two unreconciled project-status narratives**: `README.md`'s "AIEF 2.0 — frozen" framing versus
  `docs/TEAM-USAGE-GUIDE.md`/roadmap docs' "pre-1.0 internal pilot" framing (`design.md` §15).
- **`docs/aief-core-3-claude-code-prompt.md` is the commissioning brief, not an as-built
  description**: it describes a materially larger surface (new commands `start/work/next/review`,
  YAML manifests, executable `skill.yaml` checks) than Changes 0043–0049 actually implemented
  (`design.md` §3).
- **Configuration has no current documentation owner at all** (`design.md` §7, §15).

## Risks

- The three unresolved decisions below block Change 0051's dependent phases until a human resolves
  them — none of them blocked this Change itself, since this Change makes no
  Verification-Engine-specific or README-rewrite documentation claims beyond what already exists
  (`design.md` §15).
- Full-repository link validation and orphan-document sweep (all 382 files) were deferred beyond
  the ~50 individually-read files — a scoped, stated exception, not a silent gap
  (`verification.md` rows 24–25).
- `starter-project/`/`examples/`/`docs/enrichment-workflow.md`/`docs/requirement-sources.md`/
  `docs/governance-conventions.md` and `CONTRIBUTING.md`/`CODE_OF_CONDUCT.md`/`SECURITY.md`/
  `SUPPORT.md` were not read in depth in this Change's evidence-gathering pass — marked REVIEW
  LATER rather than given an action this design could not yet justify with direct evidence
  (`design.md` §15).

## Recommendations

1. **(human decision, unresolved by this Change)** Update ADR-021's status line to Accepted, or
   explicitly document that Verification Engine (Entrega 7) is provisionally shipped pending formal
   ADR sign-off.
2. **(human decision, unresolved by this Change)** Resolve which project-status framing is correct
   — "AIEF 2.0 frozen" vs. "pre-1.0 internal pilot" — before any README rewrite proceeds, so the
   rewrite does not encode a guessed framing.
3. **(human decision, unresolved by this Change)** Decide whether `docs/roadmap.md`/
   `docs/ROADMAP-TO-1.0.md` should be relocated to Historical (this design's default) or rewritten
   to Current if the project intends to keep maintaining a forward-looking roadmap.
4. Execute the Change 0051 implementation blueprint (Deliverable 9) in the staged, human-gated
   order it defines — **already done**, see "Next Change" below.

## Artifacts Produced

- `changes/0050-core3-documentation-architecture/design.md` (757 lines, Deliverables 1–10, §1–§17).
- `changes/0050-core3-documentation-architecture/verification.md` (30 scenarios, evidence block,
  acceptance criteria).
- No product documentation file was created, moved, merged, or edited — by design, this Change is
  planning-only.

## Lessons Learned

- A concept-first ownership analysis (enumerate concepts, then map to documents) surfaces
  multiple-owner conflicts that a file-by-file audit alone can miss — this Change's own prior
  iteration used a file-first method and did not surface the Workflow/Verification ownership
  conflicts as clearly (`design.md` §2).
- Distinguishing repository **facts** (grep-confirmed, directly read) from **interpretations**
  throughout the design document, and naming unresolved human decisions explicitly instead of
  guessing a resolution, kept this Change's own scope honest about what it could and could not
  close on its own (`design.md` §3, §15).
- A Change whose own scope is "planning only" still needs its `evidence.md` completed at close time
  — leaving it as the template's `Pending.` placeholders after the design work is done creates an
  avoidable, self-detectable inconsistency (`evidenceIsPlaceholder()` in `cli/src/cli.js`) between
  a Change's completed `tasks.md` and its evidence trail.

## Next Change

The staged implementation blueprint this Change designed (`tasks.md` items 17–22: publish the
System Map, redirect superseded documents, update `docs/index.md`/`README.md`/operational docs,
merge the three onboarding documents) was carried out by **Change
[0051-core3-documentation-rebuild](../0051-core3-documentation-rebuild/)**, already
**Closed (2026-07-27)** — one day after this Change's own design work concluded. The three human
decisions flagged under "Recommendations" above should be checked against Change 0051's actual
resolution before treating them as still open; that reconciliation is outside this Change's own
scope.
