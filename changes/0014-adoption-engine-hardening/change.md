# Change

## ID

`0014-adoption-engine-hardening`

## Type

General

## Objective

Harden the Adoption Engine (doctor, adopt, analyze, prompt, verify, close) so it is guided, reliable and self-explanatory, and align the CLI with the target architecture: AIEF orchestrates, OpenSpec generates specs, Specboot organizes assistant instructions.

## Scope

### In scope

- Fix Change ID collision in `aief adopt` on projects with existing Changes.
- Move technology detection out of the CLI engine into a data catalog (`cli/src/skills-catalog.json`) consumed by `cli/src/detect.js`.
- Reduce detection false positives (word-boundary matching) and explain why each Skill is recommended.
- Validate the OpenSpec CLI contract at runtime; make the fallback noisy, never silent.
- Complete `help <command>` coverage: purpose, when to use, reads, writes, example, next step.
- Robust Analysis Change detection (CRLF-safe) and a single standard `evidence.md` structure.
- Add a CLI test suite (`node --test`) and a real `test` script.
- Add `knowledge/decisions.md` (architecture decision log).
- Update adapter and CLI documentation.

### Out of scope

- Changing the AIEF workflow or Change lifecycle.
- Adding runtime dependencies.
- Replacing OpenSpec, Specboot or AI assistants.
- Reformatting untouched CLI code.

## Success Criteria

- `aief adopt` never collides with existing Change IDs and never modifies application code.
- Detectors live in a data file; `doctor`/`adopt` explain each recommendation.
- OpenSpec delegation failures print an explicit fallback message.
- `aief help <command>` works for every documented command.
- CLI tests pass with `npm test` in `cli/`.
- `aief verify` still passes on this repository.

## Status

Closed (2026-07-03)
