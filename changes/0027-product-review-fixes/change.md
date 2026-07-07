# Change

## ID

`0027-product-review-fixes`

## Type

Documentation (one isolated help-text entry in the CLI)

## Objective

Resolve the findings of the independent Product Architecture Review performed after Change 0026 (release readiness review): two Major and five trivial Minor findings, all in documentation the 0026 consolidation did not reach.

## Scope

### In scope

- **Major 1** — Rewrite the OS install guides (`docs/navigator/install/{linux,macos,windows}.md`) to the canonical Bootstrap Experience (`npm install && npm link`, `aief doctor`), removing the maintainer-personal filesystem path leaked in linux.md.
- **Major 2** — Rewrite `docs/migration-guide.md` from manual pre-CLI adoption to `aief init`/`adopt`.
- **Minor** — Normalize "SpecBoot" capitalization across current-facing docs (`docs/`, `adapters/`, README); accepted ADRs, `changes/` history, `releases/` and historical CHANGELOG entries left as written.
- **Minor** — `SECURITY.md` scope updated to reflect AIEF as a CLI product.
- **Minor** — `docs/navigator/ai-assistants.md` rewritten around `aief prompt` (the Prompt Engine) instead of handwritten prompts.
- **Minor** — `docs/navigator/README.md` pre-CLI phrasing ("What do I copy?" → "What do I run?").
- **Minor** — `aief help explain`: added the missing `explain` entry to `COMMAND_HELP` (help-text data only; `explain` was already listed in `--help` usage and already worked as a command) and covered it in the help-coverage test.

### Out of scope

- Review Suggestions (onboarding consolidation, CONTRIBUTING depth, CI bootstrap job, product naming harmonization) — deferred, tracked in the 0027 evidence.
- Any CLI behavior change beyond the help-text entry above.
- Accepted ADRs.

## Success Criteria

- No install or adoption document contradicts `docs/bootstrap.md`.
- No personal paths anywhere in documentation.
- One spelling — "SpecBoot" — in all current-facing docs; historical records untouched.
- `aief help explain` works; help coverage test includes it.
- All relative links resolve; test suite green; `aief verify` PASS.

## Status

Closed (2026-07-07)
