# Specification

## Goal

`aief verify --json` (with or without `--change`) emits exactly one versioned, parseable JSON
object on stdout describing the same result the human-readable command already computes —
nothing more, nothing silently different.

## Requirements

- R1: `buildResultEnvelope({ operation, change, result, ...fields })` returns `{ schema:
  "aief.result/v1", operation, change, result, ...fields }`, in that key order.
- R2: `--json` on whole-project `verify` prints
  `buildResultEnvelope({ operation: "verify", change: null, result: report.passed ? "PASS" :
  "FAIL", errors: report.errors, warnings: report.warnings, manifestStatusDrift, duplicateChangeIds
  })` — `manifestStatusDrift` an array of `{ change, manifestStatus, changeMdStatus }`,
  `duplicateChangeIds` the direct output of `detectDuplicateChangeIds()` — and nothing else on
  stdout. Exit code 1 iff `!report.passed`, matching non-`--json` behavior exactly.
- R3: `--json` on `--change <id>` verify prints the same shape with `change` set to the
  resolved basename, `graphIssues` (this Change's own filtered `buildProjectGraph().issues`)
  and `manifestStatusDrift` a single `{ manifestStatus, changeMdStatus }` object or `null`
  (never an array, since there's only one Change).
- R4: A `--change` selector matching no Change, combined with `--json`, prints
  `buildResultEnvelope({ operation: "verify", change: <selector>, result: "ERROR", errors: [...]
  })` to stdout and exits 1; the existing human-readable "No Change found..." diagnostic
  (`resolveExplicitChange()`, unchanged) still prints to stderr — never mixed onto stdout.
- R5: Every other `verify` flag (`--strict`, `--requirements`) and side effect (Hooks, Loop) is
  skipped entirely when `--json` is passed — this Change does not attempt to fold them into the
  envelope.
- R6: `verify` without `--json` is byte-identical to before this Change.

## Acceptance Criteria

- [ ] `aief verify --json`'s stdout, captured separately from stderr, parses as JSON with
      `schema === "aief.result/v1"`.
- [ ] The same, run against this repository's own state, reports the real `0122-*` collision in
      `duplicateChangeIds`.
- [ ] `aief verify --change <id> --json` on a passing Change returns `result: "PASS"`,
      `graphIssues: []`, `manifestStatusDrift: null`.
- [ ] `aief verify --change <nonexistent> --json` returns `result: "ERROR"` on stdout, exit 1,
      with the human diagnostic on stderr only.
- [ ] A regression test confirms `aief verify` (no `--json`) is unaffected.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0138-stable-json-output-for-verify --strict` all
      pass.
