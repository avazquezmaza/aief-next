# Change

## ID

`0129-evidence-provenance-for-captured-verification`

## Type

Fix

## Objective

`aief close --evidence-from <path>` (Change 0071) captures a JUnit XML report's summary
(tests/passed/failed/errors/skipped/duration) into `evidence.md`'s `## Verification` section,
but records nothing about where that report actually came from beyond the literal file path
named on the command line. An external audit recommended adding machine-verifiable provenance
— a source digest, the git commit at capture time, when it was captured, and which tool
produced it — alongside evidence.md, explicitly **not** replacing it: "Evidence" (human
readable) and "Evidence metadata" (machine verifiable) stay two views of the same fact, both
git-native.

## Scope

### In scope

- New domain module `cli/src/core/domain/evidence-provenance.js`: `buildProvenance()` computes
  a SHA-256 digest of the exact report bytes read, the git commit HEAD pointed to at capture
  time (via the same read-only `run("git", ["rev-parse", ...])` pattern `git-branch.js` already
  uses — no new git-invocation code, no dependency), a capture timestamp, the producing
  surface, and the verification type; `renderProvenance()` renders it as a fixed-format
  Markdown bullet list appended to the captured section.
- `cli/src/core/domain/junit-report.js`: `renderCapturedVerification()` gains an optional third
  `provenance` argument — omitting it reproduces the exact pre-existing output, byte for byte.
- `cli/src/commands/close.js`: `--evidence-from` now builds and passes provenance for every
  real capture.
- Tests for the new module, the extended `renderCapturedVerification()`, and an end-to-end
  `aief close --evidence-from` test confirming the real captured evidence.md carries the
  provenance block (including the real git commit sha, inside an actual git repo, and the
  "unknown" case outside one).

### Out of scope

- Any other evidence-writing surface (there is currently only one: `--evidence-from`'s JUnit
  capture) — this Change wires provenance into the one existing capture point; a future capture
  surface can reuse `buildProvenance()`/`renderProvenance()` directly.
- Any new file, database, or state outside `evidence.md` itself — explicitly rejected per the
  audit's own framing: provenance is additive Markdown in the same file, not a second store.
- Verifying the digest/provenance against anything at read time (e.g. a `aief verify` check
  that a captured digest still matches the report file) — this Change only records provenance;
  consuming/validating it later is a separate, future Change if a real need appears.
- A "dirty working tree" flag alongside the git commit — the audit's suggested shape
  (`gitCommit`) is recorded as-is; whether the tree was clean at capture time is a distinct
  question, not added speculatively.

## Success Criteria

- A real `aief close --evidence-from <path>` run writes a `**Provenance:**` block into
  `evidence.md`, with a real SHA-256 digest of the exact report content, the real git commit
  sha when run inside a git repo (and an explicit "unknown" when not), a valid timestamp, the
  producing command, and the verification type.
- `renderCapturedVerification()` called with no third argument is byte-identical to its
  pre-0129 behavior (regression-tested).
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0129-evidence-provenance-for-captured-verification --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-09)
