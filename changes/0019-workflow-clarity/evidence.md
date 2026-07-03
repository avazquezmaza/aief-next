# Evidence

## Summary

The complete workflow is now explained once, canonically, in `docs/Workflow.md` as three levels — 1 · AIEF Context (doctor → adopt → verify → analyze → prompt), 2 · OpenSpec / Assistant Feature Workflow (verified official OpenSpec: Explore → Propose → Apply → Archive, via assistant slash commands), 3 · AIEF Governance (verify → close) — and every other workflow description summarizes it. Documentation-only Change: zero modifications under `cli/src/` or `cli/tests/`, no new commands, no new state.

## Activities Performed

- Reviewed current documentation first and reported findings before touching anything (per the agreed working mode); received confirmation with three decisions: reuse `docs/Workflow.md` (avoiding a `docs/workflow.md` case-collision on case-insensitive filesystems), document only the verified OpenSpec flow, and present *enrich-us* / *adversarial review* as Specboot-style skill examples, not official OpenSpec commands.
- Rewrote `docs/Workflow.md` as the canonical document with the agreed documental optimizations: three-level Mermaid diagram, responsibilities table with a "Never does" column (AIEF / OpenSpec / Specboot / Assistants / Skills), with-OpenSpec vs without-OpenSpec command guide (local path labeled normal, not degradation), `aief close` vs `/archive` comparison table, "What AIEF does not do" section, and a unified Change lifecycle view.
- Removed the four conflicting workflow phrasings by aligning: README (three-line level summary + link), adapters/openspec/README.md (level positioning + close ≠ archive note), adapters/openspec/workflow.md (both paths expressed against the levels), docs/cli.md (command → level table), cli/README.md (level note), docs/navigator/workflows.md (pointer).
- Added ADR-011 (three-level workflow model, Specboot as clarity inspiration, OpenSpec not duplicated) and the CHANGELOG entry.

## Verification

- `git diff --name-only`: only CHANGELOG.md, README.md, adapter docs, cli/README.md, docs/Workflow.md, docs/cli.md, docs/navigator/workflows.md, knowledge/decisions.md + `changes/0019-workflow-clarity/` — **0 files under `cli/src/` or `cli/tests/`**.
- CLI test suite: **31/31 pass** (unchanged, as expected for a docs-only Change).
- `aief verify` at repo root: PASS.

## Findings

- The pre-existing `docs/Workflow.md` predated CLI v2 entirely (no command mapping); the scope's suggested `docs/workflow.md` would have collided with it on macOS/Windows — reusing the existing path was the safe interpretation.
- The clearest single improvement was the "Never does" column: most prior ambiguity came from documents stating what each tool does without stating what it deliberately does not.

## Risks

- The verified OpenSpec facts remain documentation-derived (repository review, 2026-07-03), not exercised against an installed release — stated as such everywhere it matters.
- Mermaid subgraph rendering varies slightly across viewers; the text flows carry the same information for non-rendering contexts.

## Recommendations

- When OpenSpec is installed for real (pending from 0015/0016), re-check the Level 2 description and the adapter table against the observed command surface.
- Consider linking docs/Workflow.md from `aief help` output text in a future Change (would be a CLI change; out of scope here).

## Artifacts Produced

- `docs/Workflow.md` (canonical rewrite)
- `README.md`, `adapters/openspec/README.md`, `adapters/openspec/workflow.md`, `docs/cli.md`, `cli/README.md`, `docs/navigator/workflows.md` (aligned)
- `knowledge/decisions.md` (ADR-011), `CHANGELOG.md`

## Lessons Learned

- Multiple "simple" one-line workflow summaries drift independently; a single canonical document with summaries pointing at it is cheaper to maintain than four consistent restatements.
- Distinguishing verified facts from ecosystem folklore (official OpenSpec stages vs Specboot-style skill extensions) keeps the docs honest without hiding useful practices.

## Next Change

Re-validate the full adoption experience on a real project with the 0018 features (standards + seeded analysis) using the fresh-user protocol, and revisit the open UX frictions (verify Next hint, Analysis profile default, status context-awareness).
