# Change

## ID

`0138-stable-json-output-for-verify`

## Type

General

## Objective

Closes the "JSON output / stable contracts" item from the original external audit: AIEF has no
machine-readable output for any command today. Rather than building a JSON contract for every
command speculatively (`status`, `graph`, `doctor`), this Change ships the smallest, most
defensible slice: `aief verify --json` — the one command with the clearest, already-structured
pass/fail semantic (`verifyProject()`/`verifyChange()` already return a plain `{ lines, errors,
warnings, passed, next }` report object; this Change serializes that, plus the two existing
non-blocking checks (manifest drift, duplicate IDs), rather than computing anything new).

A versioned `schema` field (`"aief.result/v1"`) means a future breaking change to the shape is a
new version string a consumer can detect, never a silent, undetectable change to what it already
parses.

## Scope

### In scope

- New `cli/src/core/domain/result-envelope.js`: `buildResultEnvelope()`, fixing the four keys
  every operation's envelope shares (`schema`, `operation`, `change`, `result`).
- `cli/src/commands/verify.js`: `--json` flag for both the whole-project and `--change` paths.
  Replaces all other output with exactly one JSON object on stdout; the pre-existing
  human-readable diagnostic for a not-found `--change` selector still goes to stderr (never
  mixed into the JSON on stdout).
- `cli/src/commands/shared.js`: `json: { type: "boolean" }` added to `verify`'s known flags.
- `docs/cli.md`: documents the envelope shape for both paths.
- Tests confirming stdout purity (parseable JSON, nothing else) for every case: whole-project
  PASS/FAIL, a real duplicate-ID collision, `--change` PASS, `--change` not-found (ERROR
  envelope, stderr carries the human diagnostic separately), and a regression test confirming
  `verify` without `--json` is unaffected.

### Out of scope

- `--json` for any other command (`status`, `doctor`, `aief status --graph`) — a future,
  separately-scoped Change if a real consumer need appears; not built speculatively here.
- Folding `--strict`/`--requirements`/Hook/Loop output into the JSON envelope — `--json` and
  those flags are not combined in this Change; the envelope covers exactly what
  `verifyProject()`/`verifyChange()` plus the two existing non-blocking checks already compute.
- Any change to the human-readable (non-`--json`) output — confirmed byte-identical.

## Success Criteria

- `aief verify --json` and `aief verify --change <id> --json` each emit exactly one valid JSON
  object on stdout, with a versioned `schema` field, and nothing else on stdout.
- The whole-project envelope reports this repository's own real `0122-*` numeric-ID collision.
- A `--change` selector matching no Change returns an `ERROR` envelope on stdout (exit 1), with
  the human-readable diagnostic on stderr only.
- `aief verify` without `--json` is unaffected (regression-tested).
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0138-stable-json-output-for-verify --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-10)
