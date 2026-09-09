# Change

## ID

`0121-assistant-parity-and-audit-hardening`

## Type

General

## Objective

Resolve the six findings from the 2026-09-09 AIEF/Codex audit and validate equivalent AIEF behavior with Codex, Claude Code and Gemini CLI, as requested by the owner.

## Scope

### In scope

- Separate lint tooling from the supported runtime test matrix.
- Ignore local environment secrets while preserving example files.
- Correct the documented branch guarantee without changing branch behavior.
- Provide a discoverable Codex skill and one shared Change procedure for assistant entrypoints, including reliable AGENTS imports for Claude and Gemini.
- Make Graphify guidance depend on relevance, tool availability and authorization rather than credential presence.
- Run diagram regeneration tests in an isolated temporary repository layout.
- Add deterministic assistant parity tests and run bounded read-only behavioral probes using installed assistant CLIs against synthetic fixtures.
- Update current documentation and evidence with findings, results and limitations.
- Close the Change, commit, push the feature branch and open a PR, explicitly authorized by the owner on 2026-09-09.

### Out of scope

- Changing runtime Node support, Git branch semantics, models or personal assistant configuration.
- Deploying, publishing a release, deleting historical Changes or claiming statistical model superiority.
- Installing a Graphify integration or sending private repository content to it.

## Success Criteria

All six findings have an implemented resolution and verification. The full suite, lint and strict AIEF validation pass. Assistant parity is measured separately at the CLI contract and actual assistant-response levels; unavailable services or authentication are recorded honestly.

## Status

Closed (2026-09-09)
