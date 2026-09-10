# Evidence

## Summary

`aief verify --json` (with or without `--change`) now emits a versioned, machine-readable
envelope on stdout — the first, deliberately small slice of the "stable JSON output" backlog
item. Serializes what `verifyProject()`/`verifyChange()` already compute, plus the existing
manifest-drift and duplicate-ID checks — no new computation, no speculative coverage of every
command.

## Activities Performed

- New `core/domain/result-envelope.js`: `buildResultEnvelope()`, a four-key envelope shape
  (`schema`, `operation`, `change`, `result`) plus additive per-operation fields.
- Wired `--json` into both of `verify.js`'s existing branches (whole-project and `--change`),
  short-circuiting before any human-readable output when set.
- Ran the whole-project envelope against this repository's own real state before writing any
  test: correctly reported the real `0122-*` numeric-ID collision in `duplicateChangeIds`.
- **Found and fixed a real bug via manual verification, before writing any test**: the
  `--change <nonexistent> --json` error path used `console.error(JSON.stringify(...))`,
  sending the JSON envelope to stderr instead of stdout — the opposite of what a `--json`
  consumer needs (pure JSON on stdout, diagnostics on stderr). Caught by piping stdout and
  stderr separately (`2>/dev/null` vs `1>/dev/null`) and noticing the JSON only appeared in the
  stderr-only capture. Fixed to `console.log`.
- Added `docs/cli.md` documentation for both envelope shapes.

## Verification

- `npm test` (cli/): 1110/1110 passed (6 new, in `cli-verify-json.test.js`).
- `npm run lint`: clean.
- `node cli/bin/aief.js verify --change 0138-stable-json-output-for-verify --strict`: PASS.
- `git diff --check`: clean.
- Manually confirmed, before writing the automated tests, that `2>/dev/null` (stdout only) for
  every case (whole-project, `--change` valid, `--change` invalid) yields exactly one
  `JSON.parse()`-able object — the automated tests in `cli-verify-json.test.js` use a dedicated
  `spawnSync`-based helper (the shared `aief()` test helper merges stdout+stderr, unsuitable for
  a test whose entire point is verifying stream separation).

## Findings

- The `console.error`-vs-`console.log` bug above is exactly the kind of mistake that's invisible
  when a human eyeballs merged terminal output (both streams look identical to a person reading
  a terminal) but breaks a real machine consumer immediately — confirms this feature genuinely
  needed the stdout/stderr-split verification step, not just "does it print something JSON-y."

## Risks

- None identified for what shipped. The explicit scope boundary (only `verify`, not
  `status`/`doctor`/`graph`) means the "stable JSON output" backlog item is not fully closed —
  documented as a Recommendation, not silently treated as done.

## Recommendations

- If a real consumer need appears for `status --json`, `doctor --json`, or `graph --json` (per
  the original audit's own framing — CI, IDE, GitHub, dashboards), extend `buildResultEnvelope()`
  to those commands following this Change's exact pattern (compute what the command already
  computes, serialize it, verify stdout purity with a split-stream test before trusting it).
- Consider a `changes/*/manifest.json`-style `schema` version bump policy document once a real
  external consumer exists and a breaking envelope change is actually needed — premature before
  then.

## Artifacts Produced

- `cli/src/core/domain/result-envelope.js` (new).
- `cli/src/commands/verify.js`, `cli/src/commands/shared.js` (extended).
- `cli/tests/cli-verify-json.test.js` (new).
- `docs/cli.md` (documented).

## Lessons Learned

- Verifying a new machine-readable output by actually splitting stdout/stderr — not just
  reading the merged terminal view a human would see — caught a real, easy-to-miss bug before
  it shipped. Worth doing for any future `--json` flag, not assuming "it printed valid JSON
  somewhere in the output" is sufficient.
- Scoping to one command (verify) rather than building a generic envelope for every command
  speculatively kept this Change small and testable — consistent with this project's own
  "no speculative capability without evidence" discipline (ADR-008/013), applied here to a
  contract/interface decision rather than a domain feature.

## Next Change

- None required now. See Recommendations for extending `--json` to other commands if/when a
  real consumer need appears.
