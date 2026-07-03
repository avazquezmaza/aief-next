# Changelog

## Unreleased

- Change 0017 — Close cycle and guided UX: `aief close` runs real readiness checks and `--yes` marks the Change Closed in `change.md` (files remain the only source of truth — no state file); the active Change is the latest open one; `verify` reports in-progress Changes calmly and only warns on closed-but-incomplete evidence; unified `Next:` hints across all commands; README reorganized so integrations appear after the core flow.
- Change 0016 — First real-project validation (Flux Portal): full adoption flow succeeded with zero manual fixes; evidence-driven fixes (Drizzle as postgres signal, `aws-saas-platform` on cognito, doctor output dedup, analyze hint).
- Change 0015 — Public readiness: README rewritten for new users, GitHub Actions CI (CLI + example tests + `aief verify`), `aief prompt --assistant`, full MIT license text, honest evidence capture for Change 0013.
- Change 0014 — Adoption Engine hardening: safe Change IDs in `adopt`, data-driven technology detection with explained Skill recommendations, runtime-validated OpenSpec delegation with loud fallback, complete `help <command>` coverage, CRLF-safe Analysis detection, unified evidence template, 21-test CLI suite, `knowledge/decisions.md`.

## v1.0.0

- Initial release: framework, starter project, Navigator, CLI MVP, examples, profiles, adapters.

> Note: release notes in `releases/` predate this changelog structure; `releases/v0.1.0.md` and `releases/v1.0.0.md` describe the same starter milestone. The project is currently in roadmap Phase 2 (Validation) — see `docs/roadmap.md`.
