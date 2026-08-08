# Evidence

## Summary

Extracted `run()`/`commandExists()` (shell-spawning, binary-detection helpers) into a new
`cli/src/process-utils.js`, imported by both `cli.js` and `sdd-providers/openspec.js`. This is the
consolidation `sdd-providers/openspec.js`'s own header comment named as a deliberately deferred
obligation since Change 0045/ADR-017 — the provider carried a private copy only because that
Change's commissioning instruction forbade touching `cli.js` at the time. Zero behavior change
anywhere: `npm test` passes at the exact same count (770/770) with no test file needing a single
edit, confirming the extraction is truly behavior-preserving.

## Activities Performed

- Read `sdd-providers/openspec.js`'s header comment (which names the exact duplication and cites
  ADR-017) and `cli.js`'s `run()`/`commandExists()`/`openspecInfo()`/`propose()` before touching
  anything, to confirm the duplication was real and scope the fix to exactly what the comment
  named — not a broader refactor.
- Confirmed `openspecInfo()` (propose()'s OpenSpec-CLI-contract probe: version + propose-support
  check) is a genuinely different concern from the provider's `detect()` (project/CLI presence for
  SDD Provider resolution) — deliberately left both functions as-is; only their shared low-level
  `run()`/`commandExists()` primitives were duplicated, and only those were consolidated.
- Verified every existing call site of `run()`/`commandExists()` in `cli.js` (`doctorEnvironment()`,
  `bootstrapHere()`, `openspecInfo()`, `propose()`) already defensively handles `stdout`/`stderr`
  as possibly-empty strings (`result.stdout || ""` patterns already present at every call site) —
  confirming the shared implementation's stricter (always-string) return shape introduces no
  behavior change for any existing caller.
- Created `cli/src/process-utils.js`; updated `cli.js`'s imports (dropped the now-unused
  `spawnSync` import, added `run`/`commandExists` from the new module) and removed its private
  definitions; updated `sdd-providers/openspec.js` similarly, and rewrote its header comment to
  record the consolidation as done rather than deferred.
- Manually verified: `aief doctor` (OpenSpec CLI present in this sandbox), `aief propose "<idea>"`
  (OpenSpec installed without `propose` support in this sandbox — correctly detected and fell back
  to local Change generation, exact same message as before).
- Confirmed via `node -e "import(...)"` that both edited files still load without error before
  running the full test suite.

## Verification

- `grep -rn "^function run(\|^function commandExists(" cli/src/`: exactly one of each, both in
  `cli/src/process-utils.js` — the duplication is verifiably gone.
- `npm test` (root, full suite): 770/770 passing — **identical count to before this Change**, with
  zero test file edits, the strongest available confirmation that this was truly behavior-preserving
  (had any OpenSpec-provider or `propose`/`doctor`/`bootstrap` test relied on the old shape, it
  would have failed here).
- `node cli/bin/aief.js verify` (full repo) and `--change
  0070-shared-process-utils-openspec-consolidation`: PASS.
- `git diff --check`: clean.
- Manual `aief doctor`/`aief propose` runs in a throwaway sandbox project: output matched the
  expected pre-existing messages exactly.

## Findings

- The duplication was exactly as small and bounded as `openspec.js`'s own comment described — no
  hidden extra copies elsewhere in the codebase for this specific pair of functions (confirmed by
  the `grep` acceptance criterion).
- `openspecInfo()` (propose()'s own OpenSpec-CLI-contract probe) is correctly a separate concern
  from the provider's `detect()`, and was correctly left untouched — conflating the two would have
  been the wrong move; only the shared shell-spawning primitives were the actual duplication.

## Risks

- None identified — zero test edits were needed to keep the suite green, which is strong evidence
  of no behavior change. The only new file (`process-utils.js`) has no side effects beyond spawning
  a process, identical to what both call sites already did independently.

## Artifacts Produced

- `cli/src/process-utils.js` (new)
- `cli/src/cli.js` (import change, private `run()`/`commandExists()` removed)
- `cli/src/sdd-providers/openspec.js` (import change, private copies removed, header comment
  updated)

## Lessons Learned

- Confirming every real call site's existing defensiveness (`|| ""` patterns) before unifying two
  slightly different-shaped implementations avoided introducing a subtle behavior change — worth
  checking explicitly whenever consolidating two organically-diverged copies of the same helper,
  rather than assuming "nearly identical" means safe to merge as-is.

## Next Change

ADR-017's other, larger obligation — routing `propose()`'s actual OpenSpec delegation through the
SDD Provider boundary's capability model — is deliberately not done here (see this Change's "Scope
note"): the provider's `CAPABILITIES.create` is `false` and `createChange()` is unimplemented,
making that a real capability-model decision, not a helper deduplication. That is #17b in the
agreed roadmap and would need its own explicitly-scoped Change (and likely its own ADR, matching
the precedent ADR-019/020/021 set for Skills/Hooks/Verification Rules).
