# Tasks

## Implementation

- [x] Add `--assistant claude|gemini|codex|cursor` to `aief prompt` (with unknown-value warning and CLAUDE.md fallback).
- [x] Add `.github/workflows/ci.yml` (Node 18 + 22: CLI tests, todo-app tests, `aief verify`).
- [x] Complete the MIT license text in `LICENSE`.

## Documentation

- [x] Rewrite `README.md` for first-time users (workflow engine positioning, responsibilities split, adoption-first flow, guarantees, install, tests, status, roadmap, links, CI badge).
- [x] Align `docs/cli.md` and `cli/README.md` (install section, `--assistant` in flows).
- [x] Update `CHANGELOG.md` (Unreleased section for 0014/0015, honest note about releases/ history).
- [x] Complete `changes/0013` evidence retroactively with an explicit honesty note; mark its tasks done.
- [x] Review `adapters/openspec/README.md` — already compliant since 0014, no changes needed.

## Verification

- [x] `cd cli && npm test` — 21/21 pass.
- [x] `cd examples/todo-app && npm test` — 3/3 pass.
- [x] `node cli/bin/aief.js verify` at repo root — PASS.

## Evidence

- [x] Update evidence.md
