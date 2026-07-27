# Proposal

> **Note:** this file originally described Change 0050's discarded 12-document canonical-matrix
> plan (`docs/learning-path.md`/`docs/install.md`/`docs/troubleshooting.md`/`docs/historical/`,
> "no file is deleted"). That plan was never implemented and was discarded in full, per
> `change.md`'s own Objective. The text below is corrected to describe what this Change actually
> proposed and built instead, for consistency with `change.md`'s Final Report — this is a
> correction, not new scope.

## Why

AIEF Core 3.0 shipped seven real subsystems (Changes 0043–0049, all Closed) but only 4 of ~114
documentation files mentioned it — the same information-architecture gap Change 0050 diagnosed.
Change 0050's own proposed fix (a 12-document canonical surface with no deletion allowed) was left
uncommitted and was superseded by an explicit commissioning brief that authorized a smaller,
deletion-allowed rebuild instead.

## What changes

- `README.md` rewritten as the project's landing page: what AIEF is, the problem it solves, the
  product-workflow Mermaid diagram, install, use, extend, a documentation index, ecosystem table,
  contributing, status, license.
- A small `docs/` set created or rewritten from the implemented source (`cli/src/cli.js`,
  `cli/src/core/domain/*`, `cli/src/core/services/*`), Changes 0043–0049, and
  `knowledge/decisions.md`: `getting-started.md`, `concepts.md`, `workflow.md`, `architecture.md`,
  `cli.md`, `configuration.md`, `examples.md`, `maintainer.md`.
- Historical/superseded material consolidated under one location, `docs/history/` (21 relocated
  files, not the two-name split — `docs/historical/` vs. `docs/history/` — the discarded plan used).
- Obsolete/duplicated Markdown deleted outright, in two passes: 26 files under `docs/` (this
  Change's own initial work, listed in `change.md`'s Final Report) and a second, repository-wide
  pass across `NAVIGATOR.md`, `specs/`, `releases/v--help.md`, `reference-implementation/`,
  `starter-project/`, and dead entries under `templates/`/`cli/templates/` (listed in this Change's
  `evidence.md`).
- Every internal Markdown link touched or left dangling by the above fixed.

## What does not change

- `changes/*` — immutable project history, untouched.
- `knowledge/decisions.md`'s ADR decision text — untouched; only ADR-021's status line was updated,
  to reflect Change 0049's own already-recorded closure, not a new decision made by this Change.
- CLI behavior — this is a documentation-only Change. No file under `cli/src/`, `cli/tests/`, or
  `cli/bin/` is touched by this Change.

## Risks

- A merge could silently drop unique information — mitigated by reading every source file in full
  before merging and naming what was preserved in `change.md`'s Final Report.
- A relocation or deletion could break an inbound link — mitigated by a repository-wide link scan
  before and after every move or removal (see `evidence.md`).
