# Change

## ID

`0072-skill-recommendation-confidence`

## Type

General

## Objective

`detect.js`'s detectors already carry a `signal` field (`strong` — a real dependency in
`package.json` — or `weak` — a keyword match in a doc file like `README.md`), and each recommended
Skill's `because` reasons already end with that word as text (e.g. "... — weak signal"). But
`aief prompt`'s Skill context — the content actually sent to an assistant — never includes
`because` at all, so a Skill recommended purely from a speculative README keyword match (e.g.
`multitenant`, `rbac`, `aiRoadmap`) reaches the assistant with **exactly the same confident framing**
as one triggered by a real dependency (e.g. `react`, `postgres`). This is the concrete gap behind
"Skills detection is keyword-based, not smart": the information to tell the two apart already
exists and is computed — it just never reaches the one place that matters most.

## Scope

### In scope

- `recommendSkills()` (`detect.js`): each recommendation gains a `confidence` field —
  `"strong"` if any of its triggering signals is `strong`, `"weak"` if every trigger is `weak`,
  `null` for the no-signals fallback recommendation (an honest fallback statement, not a guess, so
  it is not tagged as uncertain the way a real weak-signal-only match is).
- Recommendations are sorted `strong` before `weak` (stable — catalog order preserved within each
  group) — a deterministic reordering of already-computed data, not a new heuristic.
- `prompt()`'s Skill context (`skillsBlock`): a builtin-sourced recommendation with
  `confidence === "weak"` gets a short, honest tag (` (weak signal — confirm before relying on
  this)`) next to its name. Strong or fallback (`null`) recommendations are untagged — byte-identical
  to today for the common case (a project with only strong signals, or none at all).
- Project-sourced (`ai-specs/skills/`) entries are unaffected — they already carry their own
  `[project]`/`[project override]` tag (Change 0069) and have no detector-driven confidence concept.

### Out of scope

- `aief doctor`'s Skills report (`printSkills()`) — unchanged code, though its *output order* now
  reflects the new sort (confirmed no existing test locks in the prior order). Its `because` lines
  already say "strong"/"weak" per reason today; no new tag is added there in this Change.
- `aief bootstrap`'s adoption-time Skill seeding, `aief analyze`'s context seeding — both call
  `recommendSkills()` too and will see the new sort order and `confidence` field on each item, but
  neither renders `because`/`confidence` visibly beyond what they already show (Findings section
  already lists Skills without per-item ordering guarantees) — no behavior change worth calling out
  beyond the sort.
- Any change to the detector model itself (`evaluateDetector()`, `containsKeyword()`,
  `dependencySubstrings`/`dependencyPrefixes` matching) — those are separately sound (word-boundary
  matching already prevents the "ai" vs "maintainability" false-positive class of bug) and not
  touched here.
- A numeric confidence score, ML-based classification, or any AI involvement — this stays a
  deterministic reflection of the `strong`/`weak` field the catalog already declares.

## Success Criteria

- A Skill recommended only from a `weak` signal is visibly tagged as such in the prompt an
  assistant actually receives.
- A project with only `strong` signals (or none) produces `aief prompt` output byte-identical to
  before this Change.
- Recommendations are deterministically ordered strong-before-weak; no existing test (none locks
  in a specific order today, confirmed by inspection) breaks.

## Status

Closed (2026-08-08)
