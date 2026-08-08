# Evidence

## Summary

`recommendSkills()` now computes a `confidence` field (`"strong"` — real dependency, `"weak"` —
keyword-in-doc-file only, `null` — the honest no-signals fallback) and sorts strong before weak.
`aief prompt`'s Skill context tags weak-confidence builtin Skills (` (weak signal — confirm before
relying on this)`) so the assistant reading the prompt can tell a speculative match from a solid
one — closing the concrete gap behind "Skills detection is keyword-based, not smart": the
information already existed (`detect.js`'s `signal` field) but never reached the one place — the
actual prompt — where it would change how much weight a reader gives a recommendation.

## Activities Performed

- Read `detect.js`, `skills-catalog.json` end to end before proposing anything, rather than
  assuming the original "keyword-based" critique was accurate as stated: found the detector model
  is already reasonably sound (word-boundary keyword matching already prevents the "ai" vs
  "maintainability" false-positive class of bug the critique implied). The real, concrete gap was
  narrower: `signal` (`strong`/`weak`) is computed per detector and even embedded as text inside
  each `because` reason string, but never reaches `aief prompt`'s actual Skill context, and never
  influences recommendation order.
- Confirmed via `python3`/`grep` that `signal` values in the real catalog are exactly `strong` (8
  dependency-driven detectors) and `weak` (5 keyword-in-doc detectors: `n8n`, `multitenant`,
  `rbac`, `aiRoadmap`, `codeGraphUnderstanding`) — not a hypothetical distinction.
- Confirmed no existing test locks in a specific `recommendSkills()` output order before deciding
  sorting was safe (`grep` across `detect.test.js`/`cli.test.js` for order-sensitive Skill
  assertions — all use `.some()`/`.includes()`).
- **Found and fixed a real regression, via manual testing before running the automated suite**: an
  early manual test assumed a fresh `aief bootstrap`ed project (empty README) would hit the
  fallback (no signals). It didn't — AIEF's own generated `AGENTS.md` boilerplate contains "AI
  assistants", which the `aiRoadmap` weak detector's keyword list already matches (`"ai
  assistants"` is explicitly one of its keywords). This means **every bootstrapped AIEF project
  already carries a weak signal from AIEF's own files** — a pre-existing, unrelated dogfooding
  quirk this Change's tagging now makes newly visible (the Skill was always recommended; it now
  also says "confirm before relying on this," which is arguably more honest, not a new problem).
  Adjusted the fallback-related test to use `new-change` on a project with no `AGENTS.md` instead
  of `bootstrap`, since a genuine zero-signal scenario is not reachable post-bootstrap.
- Updated two pre-existing tests (`cli.test.js`) whose exact-match assertions on "AI Workflow
  Governance"'s untagged rendering broke as a direct, correct consequence of this Change (that
  Skill is triggered by the same `aiRoadmap` weak signal) — amended with a comment explaining why,
  not silently changed.
- Added 5 unit tests (`detect.test.js`: strong/weak/fallback confidence, combined strong+weak
  trigger resolves to strong, sort order with real catalog data) and 3 CLI tests (`cli.test.js`:
  weak-signal tag appears, fallback never tagged, project-sourced `ai-specs` tags unaffected).
- Documented the new `confidence` concept and its `aief prompt` surfacing in `docs/concepts.md`'s
  Skill section.

## Verification

- `node --test cli/tests/detect.test.js`: 15/15 passing (10 existing + 5 new).
- `node --test --test-name-pattern="Change 0072|weak signal|not overridden|second file claiming"
  cli/tests/cli.test.js`: 5/5 passing (2 amended, 3 new).
- `npm test` (root, full suite): 778/778 passing (770 baseline — this repo's `main` before Change
  0071's still-unmerged PR — + 8 new/amended-in-place tests across the two files).
- `node cli/bin/aief.js verify` (full repo) and `--change 0072-skill-recommendation-confidence`:
  PASS.
- `git diff --check`: clean.
- Manual verification preceded automated tests: fallback (genuine zero-signal via `new-change`,
  confirmed `confidence: null`, no tag), weak-only signal (tagged), and mixed strong+weak signals
  (strong sorts first, both catalog groups keep their internal order) — all confirmed against the
  real `skills-catalog.json` data, not synthetic fixtures, before locking in with tests.

## Findings

- The original evaluation's "keyword-based, not intelligent" framing was partially right for the
  wrong reason: the detection mechanism itself is fine; the actual gap was that already-computed
  confidence information had no path to the one output (`aief prompt`) that matters most. Worth
  distinguishing "the detector needs to be smarter" from "the detector's own signal needs to
  actually reach downstream consumers" before designing a fix — the second was true here, the
  first was not.
- AIEF's own generated `AGENTS.md` unintentionally self-triggers a weak signal in every
  bootstrapped project. Not a defect this Change needed to fix (the Skill recommendation itself was
  already correct before this Change — Change 0072 only makes its confidence level visible), but
  worth flagging as a minor, pre-existing dogfooding curiosity for a future Change if the project
  wants `aiRoadmap`'s keyword list narrowed.

## Risks

- None identified for a project whose signals are entirely `strong` or entirely absent (byte-identical
  confirmed). For a project with `weak` signals, the only change is additive, visible text — no
  new write path, no new capability, no change to the Skills Runtime or any Skill's own execution.

## Artifacts Produced

- `cli/src/detect.js` (`recommendSkills()`: `confidence` field + sort)
- `cli/src/cli.js` (`prompt()`'s Skill-context mapping: weak-signal `tag`)
- `cli/tests/detect.test.js` (5 tests added)
- `cli/tests/cli.test.js` (2 tests amended in place, 3 added)
- `docs/concepts.md` (Skill section: `confidence` documented)

## Lessons Learned

- Testing the "should be the fallback case" scenario against a real, already-bootstrapped project
  before writing automated tests caught that AIEF's own boilerplate text self-triggers a real
  signal — a fact easy to miss if a test suite is written straight from the spec without first
  reproducing each scenario by hand against real catalog data and real generated files.

## Next Change

This closes the last item of the originally agreed roadmap (Fase 3, #11). No further Change is
queued unless the project wants to act on this evidence's `aiRoadmap` keyword-list finding above.
