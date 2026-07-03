# Change

## ID

`0015-public-readiness-and-ci`

## Type

General

## Objective

Make the repository clear, usable and presentable for first-time users: rewrite the README as the entry point for the AI Engineering Workflow Engine, add CI, close documentation and hygiene pendings from Change 0014 honestly.

## Scope

### In scope

- Rewrite `README.md` for new users (what AIEF is, separation of responsibilities, main flow, guarantees, install, tests, status, roadmap, links).
- Add `--assistant` option to `aief prompt` so the recommended flow in the README is real.
- Add GitHub Actions workflow: CLI tests, todo-app tests, `aief verify`.
- Complete `changes/0013` evidence honestly (retroactive capture, clearly labeled).
- Complete the MIT license text (MIT is already declared in README, LICENSE header and cli/package.json).
- Align `CHANGELOG.md` with `releases/` and the roadmap phase.
- Align `docs/cli.md` and `cli/README.md` with the README.

### Out of scope

- Changing the AIEF workflow, Change lifecycle or detection engine.
- New dependencies.
- Windows-specific hardening (`shell: true`), tracked separately.

## Success Criteria

- README serves a first-time user: clear flow, copyable commands, no internal jargon.
- CI runs both test suites and `aief verify` on Node >= 18.
- No evidence file remains a silent placeholder: completed or honestly annotated.
- No contradictions between README, docs/cli.md, cli/README.md and CLI help.
- All tests pass; `aief verify` passes.
