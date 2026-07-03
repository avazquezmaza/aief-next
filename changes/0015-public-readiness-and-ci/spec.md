# Specification

## Goal

A newcomer can understand what AIEF is, adopt it on an existing project in minutes, and trust that the repository's claims (tests, guarantees, integration status) are verified by CI.

## Requirements

- README presents AIEF as an AI Engineering Workflow Engine and covers: problem, responsibilities split (AIEF / OpenSpec / Specboot / assistants / Skills), main flow (`doctor → adopt → verify → analyze → prompt`), per-command summary, adoption example, guarantees, CLI install/usage, testing, validation, status, short roadmap and doc links.
- `aief prompt --assistant <claude|gemini|codex|cursor>` includes the matching assistant instruction file in the generated prompt; invalid or absent values keep current behavior.
- `.github/workflows/ci.yml` runs on push/PR: `npm test` in `cli/`, `npm test` in `examples/todo-app`, `node cli/bin/aief.js verify` at repo root, on Node 18 and 22.
- `changes/0013-analyze-current-architecture/evidence.md` records the analysis that was actually performed, labeled as retroactive capture; no invented results.
- `LICENSE` contains the full MIT text (license choice already declared in the repo).
- `CHANGELOG.md` reflects real history including unreleased work.
- `docs/cli.md` and `cli/README.md` match README and CLI help (including `--assistant`).

## Acceptance Criteria

- [ ] README rewritten; commands shown match real CLI behavior.
- [ ] `aief prompt --assistant gemini` lists GEMINI.md when present (covered by a test).
- [ ] CI workflow present and simple (single file, no dependencies).
- [ ] 0013 evidence completed with retroactive-capture note.
- [ ] LICENSE is a complete MIT license.
- [ ] `cd cli && npm test` passes; todo-app tests pass; `aief verify` passes.
- [ ] Evidence updated.
