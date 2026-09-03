# Specification

## Goal

`enrich`, `analyze`, and `propose` all offer the exact same branch-isolation contract
`new-change` already does: auto-branch off `main`/`dev` before writing any Change file, with
`--no-branch` to opt out, and no scaffolding ever left behind if the checkout itself fails.

## Requirements

- `cli/src/commands/enrich.js`: after `nextChangeId()` computes `id` and before any `writeFile`
  call, call `ensureChangeBranch(id, slug, "enrichment", { skip: parsed["no-branch"] })` inside the
  same try/catch pattern `createChange()` uses (catch `ChangeBranchError`, print, set
  `process.exitCode = 1`, return without writing).
- `cli/src/commands/shared.js`'s `KNOWN_FLAGS`:
  - `enrich` gains `"no-branch": { type: "boolean" }`.
  - `analyze` gains `"no-branch": { type: "boolean" }`.
  - `propose` gains `"no-branch": { type: "boolean" }`.
- `cli/src/commands/analyze.js`: both `createChange()` call sites pass
  `noBranch: parsed["no-branch"]`.
- `cli/src/commands/propose.js`: the `createChange(idea)` call site passes
  `{ noBranch: parsed["no-branch"] }`.

## Acceptance Criteria

- [ ] `enrich <provider> <id>` on `main` switches to `enrichment/<id>-<slug>` before writing.
- [ ] `enrich <provider> <id> --no-branch` on `main` is a no-op (stays on `main`), still scaffolds.
- [ ] `enrich <provider> <id>` where the target branch name already exists aborts with no
      `changes/<id>-<slug>/` written and a non-zero exit code (mirrors Change 0114's
      `createChange()` hardening).
- [ ] `analyze --no-branch` and `propose "<idea>" --no-branch` on `main` are no-ops (stay on
      `main`), still scaffold.
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
