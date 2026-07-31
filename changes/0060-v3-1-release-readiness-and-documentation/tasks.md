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

## Second pass — visual documentation and assistant-agnostic evidence (F5/F6)

- [x] Audit `scripts/generate_workflow_diagram.py` / `docs/images/workflow.svg` / `.png` /
      README's Mermaid against actual AIEF Core 3.1 behavior — found stale "Core 3.0" header,
      `aief init / adopt` residue, and no coverage of Changes 0053–0059.
- [x] Rewrite `scripts/generate_workflow_diagram.py` (three levels + cross-cutting capabilities
      sidebar; assistant-agnostic Level 2; no automatic-execution/blocking framing).
- [x] Regenerate `docs/images/workflow.svg` (`python3 scripts/generate_workflow_diagram.py`) and
      `docs/images/workflow.png` (rendered from the regenerated SVG).
- [x] Fix remaining `init / adopt` residue: `docs/workflow.md`, `docs/architecture.md`.
- [x] Update README's Mermaid source and image alt text for semantic parity with the regenerated
      SVG; add the "Assistant compatibility" section and matrix.
- [x] Expand `docs/cli.md` "Assistants" with the three compatibility categories and a matrix
      pointer.
- [x] Add `docs/maintainer.md` "Regenerating the workflow diagram."
- [x] Live smoke test `aief prompt claude|gemini|codex|cursor|opencode|chatgpt` (plus no-name
      generic) in a from-scratch scratch project; record transcripts in evidence.md.
- [x] Confirm bootstrap creates no assistant-specific file; confirm all four of this repository's
      own assistant files (`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`) are format-only
      adaptations with no contradictory engineering rule.
- [x] Fix `cli.js`'s `aief help prompt` purpose string ("ChatGPT" claim not in `ASSISTANT_FILES`).
- [x] Add ADR-030 (compatibility categories, `AGENTS.md` reconfirmation, canonical diagram source).
- [x] Extend this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md` with F5/F6 and re-close.
- [x] Re-run full validation suite (tests, `aief verify`, `git diff --check`, `doctor`,
      `doctor --verbose`, `status`, `status --graph`, `status --next`, NUL-byte scan, secret scan,
      temp-file scan, full staged diff review) before the final commit.
