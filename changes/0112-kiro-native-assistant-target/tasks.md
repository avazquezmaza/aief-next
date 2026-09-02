# Tasks

## Implementation

- [x] Add `kiro` to `ASSISTANT_FILES` in `assistant-resolver.js`.
- [x] Remove the `CLAUDE.md` fallback in `prompt.js` (lines ~92 and ~130); adjust the warning
      message accordingly.
- [x] Derive `doctor.js`'s Assistants group from `assistantIds()`.
- [x] Update `misc.js` help text to list `kiro`.
- [x] Write `.kiro/skills/aief-change/SKILL.md`.

## Documentation

- [x] Update `docs/cli.md` §Assistants (table + fallback description).
- [x] Update `README.md` assistant compatibility table.

## Verification

- [x] Extend `cli/tests/assistant-resolver.test.js`: `kiro` recognized, passive detection,
      resolver precedence unchanged for the existing four.
- [x] Add/extend a CLI-level test: an assistant with no native file present does not include
      `CLAUDE.md` even when it exists in the fixture project.
- [x] `npm test`
- [x] `node cli/bin/aief.js verify --change 0112-kiro-native-assistant-target --strict`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
