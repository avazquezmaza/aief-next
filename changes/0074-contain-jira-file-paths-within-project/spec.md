# Specification

## Goal

`aief enrich jira <id> --file <path>` never reads a file outside the project root.

## Requirements

- R1 — A `--file` path that resolves inside the project root (directly, or via `../` segments
  that still land inside) continues to work exactly as today.
- R2 — A `--file` path that resolves outside the project root via a relative `../` escape is
  rejected before `fs.existsSync`/`fs.readFileSync` is called.
- R3 — A `--file` path that resolves outside the project root via an absolute path is rejected
  before any read.
- R4 — A `--file` path that is textually inside the project root but is a symlink pointing
  outside it is rejected before any read (real-path containment, not just textual).
- R5 — A `--file` path that is inside the project root and does not exist retains today's exact
  existing behavior (the "no local Jira export found... creating a placeholder Change" path) —
  containment rejection and "not found" are distinct, differently-worded outcomes.
- R6 — The default (no `--file`) path, `requirements/jira/<sourceId>.json`, is unaffected by this
  Change.
- R7 — No new runtime or dev dependency.

## Acceptance Criteria

- [ ] Project-local `--file requirements/jira/X.json` (file exists) → unchanged: retrieved, content
      normalized.
- [ ] `--file ../../../outside.json` → rejected, `retrieved: false`, reason names the containment
      failure, distinct wording from "not found".
- [ ] `--file /tmp/outside.json` (absolute, outside project) → rejected, same as above.
- [ ] A symlink inside the project pointing outside it, passed as `--file` → rejected, same as
      above.
- [ ] A `--file` value using `../` segments that still resolves back inside the project root →
      accepted, not falsely rejected.
- [ ] `--file requirements/jira/missing.json` (inside project, does not exist) → unchanged
      "no local Jira export found" behavior, not the new containment-rejection path.
- [ ] `node cli/bin/aief.js verify` and `git diff --check` both pass.
