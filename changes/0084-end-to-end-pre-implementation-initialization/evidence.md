# Evidence

## Summary

Ran the complete pre-implementation Definition flow against a disposable, realistic PRD-only
project ("Fleet Maintenance Portal") and a real implemented-Node-app regression scenario, both by
hand and as permanent automated tests. Updated `docs/concepts.md`, `docs/cli.md`,
`docs/getting-started.md` to document exactly the behavior exercised. Two honest, non-blocking
gaps found during manual validation are recorded under Findings, deliberately left unfixed
(out of this Change's/this program's scope) and listed under Recommendations.

## Activities Performed

### Manual end-to-end run (disposable project, not committed)

1. Wrote a PRD-only `README.md` naming nine unresolved concerns (multi-tenancy, authentication,
   RBAC, data storage, deployment, external integrations, audit requirements, availability,
   expected scale) in a scratch directory.
2. `aief bootstrap` — created `AGENTS.md`, `changes/`, `knowledge/standards/*` (with the
   maturity-aware sections from Change 0082), `knowledge/skills.md`, the CI gate, and
   `changes/0001-adopt-aief`.
3. `aief analyze` — printed `Detected maturity: Definition.` with its reasons (no application
   source under the recognized directories; one definition document, ~354 words) and created
   `changes/0002-analyze-current-architecture` with `## Type` / `Definition` — not Analysis.
4. Filled in Context, Business/Product Constraints, Known Requirements, Assumptions, Open
   Questions, Decisions Required, Options Considered, Recommendation — using all four line
   markers (`(decision required)`, `(ambiguous)`, `(deferred)`, `(human)`).
5. `aief status --change 0002-...` — reported `8/18 sections filled in`, 6 Decision required
   items, 2 Ambiguous, 2 Human approval required, 1 Deferred — matching exactly what was written.
6. `aief verify --strict --change 0002-...` — failed with 4 objective gaps: empty `spec.md`
   Requirements, `Decisions Required` with no `Decision (human)` outcome, and 2 unresolved
   `(human)` tasks.
7. Recorded human approval: filled `Decision (human)` with the approved multi-tenancy and
   authentication decisions, added two ADR entries to `knowledge/decisions.md`, filled `spec.md`
   Requirements, checked off every task, wrote real `evidence.md` content, filled Implementation
   Prerequisites and 4 Follow-up Changes (3 further Definition Changes, 1 Implementation Change).
8. `aief status --change` — now `11/18` sections filled; the `Human approval required` markers on
   the two `Recommendation` lines still showed (see Findings — expected, not a bug).
9. `aief verify --strict --change 0002-...` — passed (`Result: PASS`).
10. `aief close --yes --change 0002-...` — succeeded on the first attempt after checking off the
    one task initially missed (`Update evidence.md`) — `close` correctly refused until it was.
11. `aief verify` (whole project, default) — PASS throughout every step above; never affected by
    the Definition Change being "in progress".
12. Confirmed no `src/` or any application code existed at any point.

### Implemented-project regression (real app, not synthetic)

- Copied `examples/todo-app` (a real, executable Node/Express-style todo app already in this
  repository) to a scratch directory, removed its `changes/` and `.git/`, and ran
  `aief bootstrap` → `aief analyze`. Result: an ordinary Analysis Change, byte-for-byte the
  pre-existing behavior — no "Detected maturity" line at all (only Definition and forced-ambiguous
  paths print one).

### Automated regression tests

- Added to `cli.test.js`: the full PRD-only flow (Definition creation → enrichment →
  `verify --strict` fail → human approval → durable decision → `verify --strict` pass → `close`
  → asserts no `src/` and never `## Type: Analysis`), and the implemented-app regression
  (unaffected routing).

### Documentation

- `docs/concepts.md`: added Definition Change to the `## Change` type list, corrected the stale
  "no separate Change type field" sentence, added a `## Project Maturity` section stating the
  exact Implemented/Definition/Ambiguous rules from `classifyMaturity()`.
- `docs/cli.md`: extended the `analyze`, `new-change`, `status --change`, and `verify` table rows
  with the new flags/behavior, each citing its Change number, matching the existing convention.
- `docs/getting-started.md`: added "Starting from a PRD (no code yet)", using the exact commands
  and (representative) output produced during the manual run above.

## Verification

- `node --test --test-name-pattern="end-to-end" cli/tests/cli.test.js` — 2/2 pass.
- `npm test` (full suite) — 893/893 pass, 0 fail (890 before this Change + 3 new — the 2
  end-to-end tests plus one already counted from the prior session boundary).
- `node cli/bin/aief.js verify` (real repo, default) — Result: PASS.
- `git diff --check` — clean.

## Findings

1. **A `Recommendation` line's `(human)` marker does not disappear once `Decision (human)` is
   filled in.** `analyzeDefinitionSections()` classifies from markers alone, never from whether a
   *different* section was later completed (§9/§10 of the commissioning brief: no prose inference,
   no cross-section inference either). This is correct behavior, not a bug — but worth naming: the
   "Human approval required" list in `aief status` reflects marked lines, not overall Change
   state, and a human/assistant may want to remove or annotate a marker once its decision lands.
   Not fixed — would require a second, heavier mechanism (e.g. marker versioning) not justified by
   evidence of real friction yet.
2. **`aief verify --strict` on the whole project flags the auto-generated `changes/0001-adopt-aief`
   Change** (untouched `Scope`/`Success Criteria`/`Requirements`/`Acceptance Criteria` placeholders
   — it is boilerplate nobody is expected to hand-edit, since its `evidence.md` is already
   auto-generated by `bootstrap`). This is honest, correct behavior for what `--strict` promises
   (objective incompleteness, no exceptions list) but is a real, slightly noisy interaction the
   next iteration of `--strict` or of `bootstrap`'s own template could address. Not fixed here —
   out of this Change's scope (Change 0083 is closed; touching `bootstrap`'s adoption template
   would be new, unreviewed scope). Recorded as a candidate follow-up.
3. **`knowledge/decisions.md` is not created by `aief bootstrap`.** Every Definition scaffold
   (Change 0079) and this program's own instructions repeatedly point to it as the durable-decision
   ledger, but a fresh `bootstrap` never creates the file — the manual run above had to create it
   by hand on first use. This works (the file is just Markdown; any editor/assistant can create it
   the first time a decision needs recording) but is a minor discoverability gap. Not fixed here —
   scaffolding a new file is new capability subject to the same ADR-013 "name what it replaces"
   accounting the rest of this program went through, and deserves its own small, deliberate Change
   rather than a side effect of end-to-end validation.

## Risks

- None new. The two non-blocking findings above are documented, not hidden.

## Recommendations

- A small follow-up Change could have `aief bootstrap` create a minimal `knowledge/decisions.md`
  template (mirroring how it already creates `knowledge/standards/*`), closing Finding 3.
- A small follow-up Change could give `bootstrap`'s own `adopt-aief` Change template real
  Scope/Success Criteria content (or exempt it from `--strict`'s scaffold-placeholder checks the
  same way it's already exempted from README-required checks via `discoveryOnly`), closing
  Finding 2.

## Artifacts Produced

- `cli/tests/cli.test.js` (+2 end-to-end tests).
- `docs/concepts.md`, `docs/cli.md`, `docs/getting-started.md` (updated).
- `changes/0084-end-to-end-pre-implementation-initialization/`.

## Lessons Learned

- Running the full flow by hand before writing the automated test caught two real findings
  (Findings 1–3) that a test written directly from the spec would not have surfaced — the manual
  pass is not redundant with the automated one, it's what the automated one is validated against.

## Next Change

None required to close this program — Findings 2 and 3 above are recorded as optional follow-up
work, not blockers.
