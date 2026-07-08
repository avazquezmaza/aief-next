# Enrichment Workflow

Specialized detail for the `aief enrich` step. **The canonical workflow model is [docs/Workflow.md](Workflow.md)** — this document does not restate or compete with it; it only expands the "Starting from a Requirement Source" part of Level 1.

## Where this fits

`aief enrich` is an entry into **Level 1 — AIEF Context Workflow**, alongside `analyze` and `new-change` (see [docs/Workflow.md#level-1--aief-context-workflow](Workflow.md#level-1--aief-context-workflow)):

```text
Requirement Source (Jira, Notion, GitHub Issues, Markdown, manual, ...)
        |
        v
   aief enrich <provider> <source-id>     — read-only, no source ever modified
        |
        v
   Normalized Requirement + Change artifacts (change.md, spec.md, tasks.md, evidence.md)
        |
        v
   Human Review (mandatory gate)  ────────────────────────────────►  continues into
                                                                      docs/Workflow.md's
                                                                      Level 1/2/3 as usual:
                                                                      aief propose [--change <id>]
                                                                      -> aief prompt -> implementation
                                                                      -> evidence/verify/close
```

Everything after Human Review is the same lifecycle every other Change already follows — see [docs/Workflow.md](Workflow.md) for that full picture. This document only covers what is specific to enrichment: the command, the Human Review Gate, and how `verify` treats a Discovery/Enrichment-only project.

## `aief enrich <provider> <source-id>`

```bash
aief enrich manual TEST-001
aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json
```

What it does, every time:

1. Validates the provider is known and implemented (`manual`, `jira` today — see [docs/requirement-sources.md](requirement-sources.md)). Unknown or not-yet-implemented providers fail loudly with the list of what is available.
2. Checks whether a Change already exists for this exact `provider`/`source-id` — if so, **it does not create a duplicate**; it points you at the existing Change instead.
3. Retrieves the requirement, read-only (nothing is ever written back to the source).
4. Creates a new Change (`changes/<next-id>-<provider>-<source-id>/`) with:
   - **`change.md`** — objective, scope, out of scope, a **Requirement Source** section (provider, source ID, source URL, retrieved-at, and an explicit "Read-only: yes" line), and a **Review Status: Requires Human Review**.
   - **`spec.md`** — the Normalized Requirement, split into:
     - **`[H]` Facts** — values that came directly from the source.
     - **`[I]` Inferences** — anything derived rather than stated (empty by default; a human or assistant adds these deliberately, with reasoning).
     - **`[S]` Assumptions** — fields the source did not provide, explicitly marked as unknown rather than silently blank.
     - An **Open Questions** section — always present, even if it just says "none identified yet."
   - **`tasks.md`** — a **Human Review** checklist first (unchecked), and the enrichment steps AIEF already performed (checked).
   - **`evidence.md`** — real evidence generated immediately (what was retrieved, that the source stayed read-only, that no application code was touched) — never left as three "Pending." placeholders.
5. Prints the Human Review requirement and the next steps — it never tells you to start implementing.

## The Human Review Gate

An enrichment Change is not implementation-ready by construction. This is enforced two ways, both already part of AIEF, not new machinery:

- **`aief close --yes` refuses** while `tasks.md`'s Human Review items are unchecked — the same "unchecked task(s)" check every Change already goes through.
- **`aief prompt` tells the assistant not to implement** when it detects an Enrichment Change (`## Type` → `Enrichment` in `change.md`): no application code, no touching the external source, and no checking off Human Review tasks on the assistant's own initiative.

A human clears the gate by: reviewing `spec.md`, answering (or explicitly deferring) every Open Question, approving or adjusting scope in `change.md`, checking off the Human Review tasks, and only then moving on.

**Continuing after Human Review:** run `aief propose --change <the-enrichment-change-id>` (e.g. `aief propose --change 0002-manual-test-001`) to add `proposal.md` to the **same** Change — it never creates a new one and never touches `change.md`/`spec.md`/`tasks.md`, so the Requirement Source, Normalized Requirement, `[H]`/`[I]`/`[S]` classification and Human Review record already there stay exactly as they are. `aief propose "<idea>"` **without** `--change` still creates a brand-new Change, as it always has — `--change` is strictly additive. Or skip `propose` entirely and go straight to `aief prompt` for the same Change.

## Verify, by phase

Enrichment Changes are Discovery-phase — they exist before any implemented product. Two consequences reflected in `aief verify`:

- **`README.md` is not required** while every open/closed Change is an Enrichment or the `adopt-aief` Change (i.e., no real product Change exists yet). Once any other Change appears, `README.md` becomes required again.
- Every Enrichment Change is checked for: `change.md` has a **Requirement Source** section and marks the source **read-only**; `spec.md` has an **Open Questions** section; `change.md` states **Requires Human Review**. Missing any of these fails `verify`.

### Known limitation

`verify` cannot mechanically confirm "no application code was modified" by an enrichment step — that would require diffing against a pre-enrichment snapshot, which this Change does not build. In practice this is safe because `aief enrich` itself only ever writes under `changes/<id>-.../`; but if you hand-edit an Enrichment Change afterward, `verify` will not catch a stray application-code edit. Documented here rather than silently assumed — a fuller closability contract (evidence completeness, scope containment) is future Workflow Cohesion work, not part of this Change.

## Related documents

- [docs/Workflow.md](Workflow.md) — **canonical** workflow model (all three levels); this document only expands its Level 1 "Requirement Source" entry.
- [docs/requirement-sources.md](requirement-sources.md) — the Requirement Source and Normalized Requirement model, and the provider table.
- [docs/TEAM-USAGE-GUIDE.md](TEAM-USAGE-GUIDE.md) — how this fits into daily developer use.
- [docs/lifecycle.md](lifecycle.md) — stage-by-stage lifecycle detail.
