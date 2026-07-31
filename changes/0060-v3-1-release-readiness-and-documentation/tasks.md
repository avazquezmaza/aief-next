# Tasks

## Audit

- [x] Read every 0052–0059 `change.md`/`spec.md`/ADR pair.
- [x] Exercise the full onboarding path (bootstrap → new-change → prompt → verify → status →
      close) in a from-scratch scratch project outside this repo.
- [x] Exercise every opt-in surface live: LIDR Standards/Skills discovery, Harness (`hooks.md`),
      Loop (`loop.md`), Graph (`status --graph`, `manifest.dependsOn`), `status --next` with 2+
      open Changes.
- [x] Exercise legacy/error paths: manifest-less Change, invalid manifest, zero-configuration
      project.
- [x] Re-verify ADR-024 through ADR-029 against the live output above (spec.md table).
- [x] Grep docs/README/help text for stale command references (`init`/`adopt`) — none found live
      (both already print `commandRemoved` redirects; docs already reflect this).

## Implementation (in-scope fixes only)

- [x] `cli/src/cli.js`: add `--graph` to the top-level `--help` usage banner.
- [x] `cli/src/cli.js`: expand `aief help status` (`COMMAND_HELP.status`) to document `--graph`
      and `--next`'s multi-open-Change behavior.
- [x] `docs/cli.md`: fix the introductory sentence that contradicted its own table's Change/ADR
      citations.

## Documentation

- [x] Confirm `README.md`, `docs/architecture.md`, `docs/cli.md`, `docs/concepts.md`,
      `docs/configuration.md`, `docs/workflow.md`, `docs/getting-started.md`, `docs/examples.md`
      already describe v3.1 accurately (they do — see spec.md "Findings"; only F1/F2 needed a
      fix).
- [x] Confirm `docs/configuration.md` already has a complete reference for every official v3.1
      manifest field (`sdd`, `harness`, `harness.log`, `loop.verify.maxRetries`, `dependsOn`) with
      required/values/default/effects — it does; no gap found.
- [x] Confirm `CLAUDE.md`/`docs/maintainer.md` state this repo's own validation commands, no-push
      rule, and no-destructive-operations rule; add what was genuinely missing (see spec.md "F3").
- [x] Confirm `AGENTS.md` (the project template) intentionally stays generic — no repo-specific
      instruction added to it (spec.md "F3").
- [x] Add the Breaking Changes / migration note (spec.md) — the one deliberate v3.1 behavior
      change, with condition, reason, impact and mitigation.

## Verification

- [x] Full test suite: `npm test` (repo root) — 728/728 before, checked again after all fixes.
- [x] `node cli/bin/aief.js verify` — repository's own AIEF structure.
- [x] `git diff --check` — no whitespace errors.
- [x] Manual `git status`/diff review — no unrelated files touched.
- [x] Scan changed files for NUL bytes and obvious secrets.
- [x] Scratch-project smoke test for every command in "Audit" above (see evidence.md).

## Evidence

- [x] Update evidence.md with reproducible commands and their actual output.
