# Evidence

## Summary

Clarified one branch in `.kiro/skills/aief-change/SKILL.md`: what to do when step 1's
`aief status --next` finds no open Change. The Skill's `## Procedure` reads as a linear 1→7 sequence
that assumed a Change had been selected; the "nothing open" case lived only in the later
`## When something doesn't fit` section, whose bullet offered `aief status --next` as a remedy for
`aief status --next` having found nothing. Step 1 now names both outcomes in place, and the bullet
drops the circular re-suggestion while making explicit that opening a Change is the human's call.

No behavior the Skill describes changed, and no CLI code was touched — this is a wording fix.

## Activities Performed

- Ran `aief status --next` before doing anything: "No open Change found" (exit 0), confirming there
  was nothing open to work and that a new Change was the right move.
- Created `changes/0113-skill-no-open-change-path/` with `aief new-change skill-no-open-change-path`
  (the CLI's own scaffold, not a hand-made directory), on branch
  `docs/0113-skill-no-open-change-path` cut from a clean `main`.
- Wrote `change.md` and `spec.md` with real scope and checkable acceptance criteria before editing
  anything, per `AGENTS.md` rule 2.
- Edited `.kiro/skills/aief-change/SKILL.md` in exactly two places:
  - `## Procedure` step 1 — appended the two-outcome branch (a Change is selected → step 2; no open
    Change → stop and go to "When something doesn't fit"), keeping the existing guidance (`aief
    status` for the full list, never guess or pick the most recently modified directory, ask when
    several are open) unchanged.
  - `## When something doesn't fit` — the "no open Change" bullet now covers step 1 finding nothing,
    proposes `aief new-change <name>` only, keeps "don't invent scope", and states that opening the
    Change is the human's decision.
- Confirmed the Documentation task's premise by grepping the repo for `status --next` outside
  `changes/`: hits are in `README.md`, `knowledge/decisions.md`, `cli/src/commands/status.js` and
  CLI tests, none of which present the linear procedure that carried the ambiguity. The Skill was
  the only place needing a change, so no other document was touched.

## Verification

- Acceptance criteria checked individually against the edited file, not assumed:
  - Step 1 names the "no open Change" outcome and points to "When something doesn't fit" — present.
  - Step 1 still carries `aief status`, "most recently modified", and "ask which one" — all present.
  - `aief status --next` no longer appears anywhere in the `## When something doesn't fit` section
    (occurrence count: 0).
  - That bullet still names `aief new-change <name>`, still says "don't invent scope", and now says
    the decision is the human's.
  - Every `aief` command the Skill mentions is real and correctly signed: `aief status`,
    `aief status --next`, `aief new-change <name>` (checked against `docs/cli.md` §"Create a
    Change"), plus the untouched `node cli/bin/aief.js verify --change <id> --strict` in step 5.
  - `git diff --stat`: 8 insertions, 3 deletions in two hunks. YAML frontmatter shows zero changed
    lines; steps 2–7 and the other two "doesn't fit" bullets are byte-identical.
  - `git diff --name-only` lists only `.kiro/skills/aief-change/SKILL.md`; the sole untracked path
    is this Change's own directory. Nothing outside scope was modified.
- `npm test`: **PASS** — 1026/1026, 0 failures (unchanged from the count Change 0112 recorded; this
  Change adds no tests because it adds no behavior).
- `git diff --check`: **clean**, exit 0.
- `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path` (default): **PASS**, exit 0.
- `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path --strict`: **FAIL**, exit 1,
  with exactly one problem reported — `unresolved required human decision: Approve the final wording
  of step 1 and the "no open Change" bullet`. This is the intended outcome, not a defect and not an
  incomplete implementation: `change-verifier.js` deliberately turns every unchecked
  `- [ ] (human)` line into a strict problem, so `--strict` cannot pass while this Change's human
  approval gate is open. Making it pass would have required checking that gate, which is precisely
  what step 3 of the Skill and `AGENTS.md`'s Prime Directive forbid. The gate was left unchecked and
  the failure is reported as-is.

## Findings

- `verify --strict` and the `(human)` gate are mutually exclusive by design: any Change carrying an
  open `(human)` task fails `--strict`. A green `--strict` on a Change with a human gate therefore
  means the gate was checked, not that the gate was satisfied — worth knowing before treating
  `--strict` as a pre-commit gate for gated Changes.
- `--strict` inspects `(human)` lines only. An open `- [ ] (review)` line is not reported as a
  strict problem (`change-verifier.js`'s loop matches `\(human\)` alone), though it does still block
  `aief close` as an ordinary open `- [ ]`. Recorded as an observation, not addressed here — changing
  it would be CLI behavior, outside this Change's scope.
- `## Status` in `change.md` is written exclusively by `aief close` (every one of the 112 pre-existing
  Changes reads `Closed (<date>)`; `close.js` is the only writer). This Change's `change.md` therefore
  omits the section rather than pre-declaring a status the tooling owns.
- The ambiguity was real but narrow: no other document in the repository restates the procedure, so
  the fix is confined to one file.

## Risks

- Low. The change is editorial: no command, flag, output, or code path is affected, and `npm test`
  covers none of this file's prose.
- The residual risk is wording judgment — whether the two-outcome branch reads more clearly than the
  original for the next assistant that loads this Skill. That is exactly what the `(human)` approval
  task exists to settle, and it is deliberately unresolved.

## Recommendations

- A human should read the final wording of step 1 and the bullet and check the `(human)` task if the
  redaction is acceptable, then re-run
  `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path --strict`, which should then
  pass with no problems.
- An independent reviewer (not the implementer) should check the `(review)` task after reading the
  diff.
- Do not run `aief close` on this Change until both gates are checked.

## Artifacts Produced

- `changes/0113-skill-no-open-change-path/` — this Change (`change.md`, `spec.md`, `tasks.md`,
  `evidence.md`).
- `.kiro/skills/aief-change/SKILL.md` — two-hunk wording fix.
- Branch `docs/0113-skill-no-open-change-path`, committed locally. Not pushed, no PR opened, no
  `aief close` run — all three deliberately left to the human driving this work.

## Lessons Learned

- Running this repository's own workflow end to end surfaced the `--strict`-versus-`(human)`-gate
  interaction that reading either mechanism alone would not have: the instruction "run `--strict`"
  and the instruction "leave `(human)` unchecked" cannot both end in a green result, and the correct
  resolution is to report the red one rather than clear the gate.
- The defect fixed here is the kind only found by *following* the instructions rather than reading
  them: step 1's missing branch is invisible when a Change is already open, and only bites when
  `aief status --next` comes back empty — which is exactly the state this Change started from.
- Origin traceability matters: this nit was already written down in
  `changes/0112-kiro-native-assistant-target/evidence.md` ("Live Kiro validation", point 2) and
  explicitly qualified there as "not a defect". Left at that, it would have stayed a note in a
  closed Change's evidence. It is cited rather than edited into a `## Findings Status` row, since
  0112 never listed it as a finding.

## Next Change

None required. If the `(review)` step judges the `(review)`-versus-`--strict` asymmetry noted under
Findings worth closing, that belongs in its own Change against `change-verifier.js`, with its own
spec — not here.
