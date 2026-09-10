# Evidence

## Summary

`aief close --evidence-from <path>`'s JUnit capture now records machine-verifiable provenance
(SHA-256 digest of the exact bytes read, git commit at capture time, capture timestamp,
producer, verification type) alongside — never instead of — its existing human-readable
summary in `evidence.md`. No new store: it's additive Markdown in the same section, the same
way the summary itself already is.

## Activities Performed

- New `cli/src/core/domain/evidence-provenance.js`: `sha256Of()` (`node:crypto`, no new
  dependency), `gitCommitAt()` (reuses `process-utils.js`'s shared `run()` — the exact pattern
  `core/services/git-branch.js`'s `currentBranch()` already established for a read-only git
  call, null on any failure, never a throw), `buildProvenance()`, `renderProvenance()`.
- `junit-report.js`'s `renderCapturedVerification()` gained an optional third `provenance`
  argument, imported from the new module (no duplicated rendering logic) — omitting it
  reproduces the exact pre-0129 output.
- `close.js`'s `--evidence-from` handler now calls `buildProvenance()` with the exact
  `reportContent` string already read for parsing (never a second read — no TOCTOU gap between
  what was hashed and what was parsed), then passes the result through.
- Tests: `evidence-provenance.test.js` (8 tests: digest determinism, git-commit inside/outside
  a real repo via a temp git init, provenance record shape, rendering including the null-commit
  case), two new tests in `junit-report.test.js` (byte-identical-without-provenance regression;
  provenance-appended shape), two additions to `cli-close-evidence.test.js` (the real captured
  evidence.md carries a real digest/producer/verification-type; a dedicated test comparing a
  real git repo's actual HEAD sha against the recorded one, and the "unknown" case without one).

## Verification

- `npm test` (cli/): 1089/1089 passed (10 new).
- `npm run lint`: clean — including Change 0128's architecture-fitness rules (the new domain
  module imports only `node:fs`/`node:path`/`node:crypto`/`node:url` and `../../process-utils.js`
  — no Service or Command import).
- `node cli/bin/aief.js verify --change 0129-evidence-provenance-for-captured-verification --strict`: PASS.
- `git diff --check`: clean.
- Confirmed manually, then pinned by the automated test: inside a real (temp) git repository,
  the recorded `gitCommit` matches `git rev-parse HEAD` exactly; outside one, it renders
  "unknown (not inside a git work tree, or no commits yet)", never a blank or a crash.

## Findings

- None beyond what change.md already named.

## Risks

- None identified. The change is additive at every layer: a new file, an optional function
  argument (regression-tested for the omitted case), and one new call in `close.js` that only
  adds content to what was already being written.

## Recommendations

- If a second evidence-capturing surface is ever added (change.md's own Out of scope notes
  none exists today beyond `--evidence-from`), it should reuse `buildProvenance()`/
  `renderProvenance()` directly rather than reimplementing provenance rendering.
- Consuming/validating a recorded digest later (e.g. `aief verify` flagging a report file that
  no longer matches its recorded digest) is a real possible next step, but only once a concrete
  need is observed — not added speculatively here, matching this project's own "no observed
  need, no abstraction" discipline (applied elsewhere to the Graph and the multi-agent-runtime
  question).

## Artifacts Produced

- `cli/src/core/domain/evidence-provenance.js` (new).
- `cli/src/core/domain/junit-report.js`, `cli/src/commands/close.js` (extended).
- `cli/tests/evidence-provenance.test.js` (new), plus additions to
  `cli/tests/junit-report.test.js` and `cli/tests/cli-close-evidence.test.js`.

## Lessons Learned

- Reusing `git-branch.js`'s exact read-only-git-call pattern (rather than writing a new one)
  kept this Change from introducing a second way to shell out to git in the same codebase —
  worth grepping for an existing precedent before adding a new `spawnSync` call anywhere in
  this project.

## Next Change

- None required now. See Recommendations for natural follow-ups if a real need for them
  appears later.
