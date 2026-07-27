# Evidence

## Summary

Entrega 1 ("Change Foundation") of the AIEF Core 3.0 evolution requested in
`docs/aief-core-3-claude-code-prompt.md` is **implemented, independently reviewed, and closed**. A
Change may now optionally carry a `manifest.json` alongside its four required Markdown files,
resolved through one unified loader (`loadChangeUnified()`) that falls back to today's
Markdown-only inference for every Change that doesn't have one. `aief status` (via `isClosed()` /
`openChangeDirs()`) is the only command whose *behavior* changes; `aief verify`'s rules and
`close`'s readiness gate are untouched. Full design: [design.md](design.md).

Two accepted ADRs (ADR-013, ADR-015) created real tension with the wider Core 3.0 program during
design. This Change was scoped to stay inside both — no new command, purely additive-and-dormant
capability — and the human gates raised were approved before implementation began (see tasks.md).

An independent adversarial review (2026-07-25, requested and performed against this Change's own
implementation before closure) returned `changes_required`: one blocking finding (B1) and two high
findings (H1, H2). B1 and H1 were fixed and re-verified before closing; H2, plus three medium and
three low findings, were accepted as documented non-blocking technical debt per explicit user
decision. See "Independent review and remediation" below and `spec.md`'s "Independent review
findings" table for the full disposition of every finding.

## Activities Performed

### Design phase

1. Read `docs/aief-core-3-claude-code-prompt.md` in full (30 sections).
2. Located and read the real CLI entrypoint (`cli/bin/aief.js` → `cli/src/cli.js`), its command
   dispatch (`main()`'s `switch`, line 858), and every command function it lists.
3. Read the Change domain model in full: `cli/src/core/domain/change.js` (227 lines) and
   `cli/src/core/domain/verification-report.js`.
4. Read the verification/close rule engine: `cli/src/core/services/change-verifier.js`.
5. Read every accepted ADR in `knowledge/decisions.md` (ADR-001 through ADR-015).
6. Read `AGENTS.md` in full for working rules.
7. Checked dependency footprint: `package.json` (root and `cli/`) — zero runtime dependencies.
8. Checked for a real OpenSpec integration in this repository: no `openspec/` or `.openspec/`
   directory exists here; only documentation adapters (`adapters/openspec/`).
9. Inspected `changes/` to confirm the next available Change ID (0043) and to confirm zero
   existing Changes carry any manifest file.
10. Wrote `proposal.md`, `spec.md`, `design.md`, `tasks.md` for Entrega 1.

### Implementation phase (after human approval, 2026-07-25)

11. Ran the existing test suite before touching anything: 128/128 passing (baseline).
12. Wrote `cli/src/core/domain/change-manifest.js` (`parseManifest`, `validateManifest`).
13. Wrote `cli/tests/change-manifest.test.js` (10 tests); ran it standalone — 10/10 passing.
14. Wrote `cli/src/core/domain/change-loader.js` (`loadChangeUnified`, `mapLegacyChange`,
    `loadManifestChange`).
15. Wrote `cli/tests/change-loader.test.js` (7 tests, including a zero-drift regression over
    every real Change under `changes/`); ran it standalone — 7/7 passing.
16. Registered both new test files in `cli/package.json`'s `test` script.
17. Captured `aief status` output for this repository as a pre-change baseline.
18. Wired `cli.js`'s `isClosed()` (the sole implementation behind `openChangeDirs()`/`status`) to
    `loadChangeUnified()`; removed the now-unused `isClosedContent` import.
19. Re-ran `aief status` and diffed against the baseline — zero differences.
20. Added one end-to-end scenario to `cli/tests/cli.test.js` proving manifest precedence through
    the real CLI binary; ran the file standalone — 57/57 passing (56 pre-existing + 1 new).
21. Ran the full suite (`npm test`): 146/146 passing.
22. Diffed every modified file (`cli/src/cli.js`, `cli/tests/cli.test.js`, `cli/package.json`)
    against `git diff` to confirm no pre-existing line was altered, only additions.
23. Added minimal documentation: `docs/architecture.md` (new "Optional Change manifest" section)
    and `docs/domain-model.md` (one-sentence amendment to the Change entity).
24. Updated `spec.md` and `tasks.md` to reflect completed work.

### Independent review and remediation phase (2026-07-25)

25. Performed an independent adversarial review against `docs/aief-core-3-claude-code-prompt.md`,
    `proposal.md`, `spec.md`, `design.md`, `tasks.md`, `git diff`, tests, and documentation —
    re-reading the actual current code rather than trusting the implementation summary above, and
    reproducing every suspected defect live against the real binary. Verdict: `changes_required`
    (B1 blocking; H1, H2 high; M1–M3 medium; L1–L3 low).
26. User selected the disposition: fix B1 and H1 now, defer H1's siblings — H2, M1, L1–L3 — as
    documented non-blocking technical debt, then close.
27. Fixed B1: extracted the write-verification in `markClosed()` (`cli/src/cli.js`) to read
    `change.md` directly (`isClosedContent(read(file))`) instead of the manifest-aware `isClosed()`.
28. Fixed H1: extracted `readChangeFiles()` in `cli/src/core/domain/change.js` (used by both
    `loadChange()` and the new manifest branch in `change-loader.js`), so `missing`/`empty` are
    computed identically and correctly on both branches, including the manifest-invalid path.
29. Reproduced both fixes live against the real binary in throwaway temp directories before writing
    tests, to confirm the fix actually closes the gap (not just "tests pass").
30. Added regression tests: `change-loader.test.js` gained two ("missing Change files are reported
    under the manifest branch too" and "...even when the manifest itself is invalid"); `cli.test.js`
    gained one ("close --yes succeeds and updates change.md even when the Change carries a
    manifest.json").
31. Re-ran the full suite: 149/149 passing.
32. Re-captured and re-diffed `aief status` output before/after the full change set (design +
    fixes) — still byte-identical.
33. **Found and removed a stray artifact**: during live reproduction of B1 (a manual shell
    reproduction, not a test), a `cd`-ordering mistake ran `aief new-change` in the real repository
    root instead of a temp directory, creating an untracked `changes/0044-manifest-closed-test/`.
    Caught via `git status --porcelain` before any other action, confirmed untracked
    (`?? changes/0044-manifest-closed-test/`), and removed with `rm -rf`. Re-diffed `aief status`
    afterward to confirm the repository was back to its exact prior state.
34. Corrected `docs/architecture.md`'s "Optional Change manifest" section, which had understated
    `isClosed()`'s call sites (M2) — the same blind spot that produced B1.
35. Updated `spec.md` (new R10/R11, "Independent review findings" table), `tasks.md` (review gate
    checked, remediation tasks, technical debt itemized under "Deferred"), and this file.
36. Marked `change.md`'s Status as Closed and updated `proposal.md`'s risk table where a risk
    materialized (see "Risks" below).

## Verification

```bash
# Design phase
grep -n '"bin"' package.json cli/package.json
grep -rn "js-yaml\|\"yaml\"" package.json cli/package.json          # -> (no matches)
grep -n "^## ADR-0" knowledge/decisions.md
ls changes | sort | tail -3                                         # -> 0040, 0041, 0042
grep -rl "manifest" changes/*/change.md                             # -> (no matches)

# Implementation phase — commands actually run, in order
cd cli && npm test                              # baseline: 128 pass, 0 fail
node --test tests/change-manifest.test.js        # 10 pass, 0 fail
node --test tests/change-loader.test.js           # 7 pass, 0 fail
cd .. && node cli/bin/aief.js status > /tmp/.../status-before.txt
#  (edit cli.js: isClosed() now calls loadChangeUnified())
node cli/bin/aief.js status > /tmp/.../status-after.txt
diff /tmp/.../status-before.txt /tmp/.../status-after.txt            # -> (no output) IDENTICAL
cd cli && node --test tests/cli.test.js           # 57 pass, 0 fail (56 pre-existing + 1 new)
npm test                                          # 146 pass, 0 fail
git diff cli/src/cli.js                           # import line + isClosed() body only
git diff cli/tests/cli.test.js cli/package.json   # pure additions, no edited lines
node cli/bin/aief.js verify --change 0043-core3-change-foundation   # -> PASS

# Review and remediation phase
node cli/bin/aief.js close --yes                  # (reproduces B1 pre-fix: writes Closed, reports failure, exit 1)
#  (fix markClosed(): isClosedContent(read(file)) instead of isClosed(changeDir))
node cli/bin/aief.js close --yes                  # -> ✓ Closed ..., exit 0
node -e '... loadChangeUnified(onlyManifestDir) ...'   # (reproduces H1 pre-fix: missing: [])
#  (fix: extract readChangeFiles() in change.js, share with change-loader.js)
node -e '... loadChangeUnified(onlyManifestDir) ...'   # -> missing: [change.md, spec.md, tasks.md, evidence.md]
cd cli && npm test                                # 149 pass, 0 fail
cd .. && node cli/bin/aief.js status > status-after-fixes.txt
diff status-before.txt status-after-fixes.txt     # -> (no output) IDENTICAL
git status --porcelain                            # caught + removed stray changes/0044-manifest-closed-test/
node cli/bin/aief.js verify --change 0043-core3-change-foundation   # -> PASS
```

No test could not be run — the full suite executed to completion every time, before and after the
fixes.

## Findings

| # | Finding | Consequence |
|---|---|---|
| **F1** | **ADR-013 requires every core proposal to name a removal.** Core 3.0 as documented is a large net addition. Entrega 1 was scoped to be additive-and-dormant — approved on that basis, 2026-07-25 | Wider-program ADR-013 compliance (Entregas 2–8) remains an open question for whenever that work is proposed |
| **F2** | **ADR-015 freezes "new commands"** until Change 0042 is consolidated | Confirmed compatible: zero commands added in this Change (R8) |
| **F3** | **Zero runtime dependencies existed before this Change; still zero after** | `manifest.json` (not YAML) required no new dependency, as designed |
| **F4** | **The unified loader's manifest path had no real-world fixture** — no existing Change in `changes/` used one | Still true after implementation: the zero-drift regression (42/42 Changes) exercises the legacy path only; the manifest path is proven by test-authored fixtures |
| **F5 (revised)** | **`isClosed()` originally had a call site the design missed** (`markClosed()`, not just `openChangeDirs()`) — the independent review's finding B1 | The "single integration point" claim in the first version of this document was false; fixed by isolating `markClosed()`'s check from `isClosed()` entirely, and by correcting `docs/architecture.md`'s matching overstatement (M2) |
| **F6** | **`aief status` output was byte-identical before/after**, diffed directly, not inferred from "tests pass" — reconfirmed after the B1/H1 fixes | Strongest available evidence of zero regression for the one command this Change changes the behavior of |
| **F7** | **A self-inflicted stray artifact** (`changes/0044-manifest-closed-test/`) was created in the real repository during manual bug reproduction, caught by routine `git status --porcelain` discipline before any further action | No harm done (never committed), but a concrete reminder that live reproduction against the real binary needs the same `cd`-into-tempdir discipline as any destructive command |
| **F8** | **The independent review's own coverage gap analysis was correct**: the pre-existing test named "missing Change files are still reported" only ever exercised the legacy branch, despite its general-sounding name | Renamed to be explicit about which branch it covers, and a same-named manifest-branch test added alongside it — the naming lesson generalizes: a test name that doesn't state its branch invites exactly this gap |

## Risks

See "Risks" in [proposal.md](proposal.md) for the original risk register. One materialized during
implementation, caught by this Change's own independent review before it could reach Entrega 2:

- **Risk 4 ("silent duplication of truth")** as originally written assumed the risk was
  `change.md`/`manifest.json` disagreeing on *read*. The review found a sharper version: they could
  disagree *because of a bug in AIEF's own write path* (`close` writing one and checking the other)
  — worse than a pre-existing external disagreement, because the tool itself created it. Fixed
  (B1). No other risk in the original register materialized: no dependency was added, no existing
  file was renamed, and the manifest path stayed fully inert for every real Change in this
  repository throughout.

## Recommendations

1. When a real Change first adopts `manifest.json` (likely as part of Entrega 4's `aief start`),
   re-run the zero-drift regression concept manually against that Change to confirm the manifest
   path behaves as designed outside of test fixtures.
2. Before or alongside whichever Entrega first writes a `manifest.json` (H2/M1 technical debt,
   `tasks.md` "Deferred"), surface `manifestError` to at least `aief status`, and consider
   validating `id`/`slug` against the Change directory name.
3. Revisit `schemas/change-manifest.schema.json` (deferred, design.md §6) only once a second
   consumer of the schema exists, or a schema-validation library is deliberately adopted.
4. When Entrega 2 (Workflow Engine) starts touching `close`'s gating logic for the first time,
   revisit whether `checkChangeReadiness()` itself should become manifest-aware — today it
   deliberately is not (out of scope), but Entrega 2's gates are exactly the concept that would
   need it.

## Artifacts Produced

| Artifact | Location |
|---|---|
| Proposal | [`proposal.md`](proposal.md) |
| Specification | [`spec.md`](spec.md) |
| Design | [`design.md`](design.md) |
| Tasks | [`tasks.md`](tasks.md) |
| `change-manifest.js` | [`../../cli/src/core/domain/change-manifest.js`](../../cli/src/core/domain/change-manifest.js) |
| `change-loader.js` | [`../../cli/src/core/domain/change-loader.js`](../../cli/src/core/domain/change-loader.js) |
| `change.js` (`readChangeFiles()` extracted) | [`../../cli/src/core/domain/change.js`](../../cli/src/core/domain/change.js) |
| `cli.js` (`isClosed()`, `markClosed()`) | [`../../cli/src/cli.js`](../../cli/src/cli.js) |
| `change-manifest.test.js` | [`../../cli/tests/change-manifest.test.js`](../../cli/tests/change-manifest.test.js) |
| `change-loader.test.js` | [`../../cli/tests/change-loader.test.js`](../../cli/tests/change-loader.test.js) |
| `cli.test.js` (2 new scenarios) | [`../../cli/tests/cli.test.js`](../../cli/tests/cli.test.js) |
| Architecture doc update | [`../../docs/architecture.md`](../../docs/architecture.md) |
| Domain model doc update | [`../../docs/domain-model.md`](../../docs/domain-model.md) |

## Lessons Learned

1. The vision document's own target file tree (`core/change/`, `core/workflow/`, ...) is a
   destination, not a starting instruction — the existing `core/domain/` + `core/services/` split
   already satisfied Entrega 1's needs; no directory was created.
2. Two accepted ADRs (013, 015) constrained this initiative more than the vision document
   anticipates by itself; treating them as inspectable facts made them resolvable as scoping
   decisions rather than open-ended debate.
3. Diffing real command output (`aief status` before/after) caught what "tests still pass" alone
   would not have proven directly — that zero legacy behavior changed, byte for byte. The same
   technique, applied to `close` specifically (not just `status`), would have caught B1 before the
   review did — a gap in verification breadth, not verification rigor.
4. **A shared helper function is a shared behavior contract, not just shared code.** `isClosed()`
   being reused by both `openChangeDirs()` and `markClosed()` looked like simple reuse; it actually
   coupled two commands' semantics (`status`'s "is this Change closed" and `close`'s "did my own
   write succeed") that needed to stay independent. The fix wasn't removing the sharing — it was
   recognizing which caller needed which semantics and giving each its own read path.
5. **A test's name is a claim.** "Missing Change files are still reported" read as a general
   guarantee; it only tested one of two branches. The independent review caught this by asking
   "what does this fixture actually contain," not by trusting the test's title — the same
   discipline that should apply when judging whether *this* evidence file's own claims (like the
   original, wrong F5) are backed by what was actually checked.
6. **Reproduce before fixing, fix before testing, then re-reproduce.** Each defect (B1, H1) was
   confirmed live against the real binary before any code changed, fixed, then re-confirmed live
   before a regression test was written — the test records that the fix works, it doesn't
   substitute for having watched it work first.

## Migration and Compatibility Summary

**For anyone using AIEF on an existing project today: nothing changes.** No action is required.

- **No Change needs to migrate.** `manifest.json` is optional and additive. Every Change in this
  repository (and any adopted project) continues to work exactly as before — proven by the
  zero-drift regression (42/42 real Changes) and the byte-identical `aief status` diff, both
  re-confirmed after the review fixes.
- **No command changed its interface.** No new command, no new flag, no renamed command (R8; ADR-015
  compliant). `status`'s *output* is unchanged for every Change without a manifest; its *internal*
  determination of open/closed now optionally consults a manifest if one exists.
- **No file format changed.** `change.md`/`spec.md`/`tasks.md`/`evidence.md` keep the exact same
  meaning and the exact same requirement (all four still mandatory, manifest or not — this is what
  H1 protects, now correctly).
- **No new dependency was installed.** `manifest.json` uses plain `JSON.parse`, matching the
  project's zero-runtime-dependency footprint.
- **What *is* new, and inert until used:** a Change directory may now contain a `manifest.json`
  with `{schema, id, slug, title, status}` (status: `"open"` or `"closed"`). If present, it
  overrides `change.md`'s own status for `aief status` purposes. If a project or tool starts
  writing `manifest.json` files by hand today, `close` will correctly treat `change.md` as the only
  thing it owns (post B1 fix) — but `manifestError` is not yet surfaced anywhere (H2 debt), so a
  malformed hand-written manifest will not visibly warn its author. Recommendation: don't
  hand-author `manifest.json` in production Changes until H2 is resolved (tracked in `tasks.md`).
- **Rollback**, if ever needed, is a plain code revert: delete `change-manifest.js`,
  `change-loader.js`, the `readChangeFiles()` extraction in `change.js`, and the two-line change to
  `isClosed()`/`markClosed()` in `cli.js`. No data migration exists to undo, because none was
  performed — no Change file anywhere was rewritten to a new format.
- **Path to Entrega 4 (`aief start`)**, whenever proposed: that Entrega is the first one expected to
  *write* `manifest.json` for new Changes. Before it does, H2 (surface manifest errors) and M1
  (validate `id`/`slug` against the directory) should be resolved — both are currently safe to
  defer only because nothing writes manifests yet.

## Next Change

This Change is closed. Next: **Entrega 2 (Workflow Engine)** — proposed as a separate,
explicitly-approved Change, informed by this Entrega's real end state (including the B1/H1 fixes
and the H2/M1/L1–L3 technical debt still open) rather than by the original vision document alone.
