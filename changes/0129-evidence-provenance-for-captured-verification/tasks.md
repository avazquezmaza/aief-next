# Tasks

## Implementation

- [x] Create `cli/src/core/domain/evidence-provenance.js`: `sha256Of`, `gitCommitAt`,
      `buildProvenance`, `renderProvenance` (R1, R2, R5).
- [x] Extend `junit-report.js`'s `renderCapturedVerification()` with the optional third
      argument (R3).
- [x] Wire `close.js`'s `--evidence-from` handler to build and pass provenance (R4).

## Documentation

- [x] Header comments in the new module and the extended function explain the additive,
      repository-native design (no second store, backward-compatible signature).

## Verification

- [x] `cli/tests/evidence-provenance.test.js`: `sha256Of`, `gitCommitAt` (inside/outside a git
      repo), `buildProvenance`, `renderProvenance` (including the null-gitCommit case).
- [x] `cli/tests/junit-report.test.js`: byte-identical-with-no-provenance regression test, and
      a provenance-appended test.
- [x] `cli/tests/cli-close-evidence.test.js`: end-to-end test that a real `--evidence-from` run
      writes the provenance block, plus a dedicated real-git-repo-vs-not test for `gitCommit`.
- [x] Run `npm test` (1089/1089), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0129-evidence-provenance-for-captured-verification --strict`.

## Evidence

- [x] Update evidence.md
