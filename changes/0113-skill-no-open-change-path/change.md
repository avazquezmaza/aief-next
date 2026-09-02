# Change

## ID

`0113-skill-no-open-change-path`

## Type

General

## Objective

Make `.kiro/skills/aief-change/SKILL.md` unambiguous about what to do when step 1's
`aief status --next` finds **no** open Change.

Today the Skill's `## Procedure` is written as a linear 1→7 sequence that assumes step 1 selected a
Change. The "no open Change" outcome is handled only in the separate `## When something doesn't fit`
section further down, and that section's bullet offers `aief new-change <name>` **or**
`aief status --next` as the remedy — but `aief status --next` is the command step 1 already ran to
discover there was nothing open, so re-running it resolves nothing. An assistant reading the
procedure in order gets no in-place signal that step 1 has a second legitimate outcome, or where to
go for it.

This is a wording/navigation defect, not a contradiction: both statements are individually correct,
and `aief new-change <name>` is the correct real signature (`docs/cli.md` §"Create a Change"). It
was found during Change 0112's own live-Kiro validation (recorded in
`changes/0112-kiro-native-assistant-target/evidence.md`, "Live Kiro validation" point 2, where it
was flagged as a minor wording nit rather than a defect) and confirmed again while running this
repository's own workflow end to end.

## Scope

### In scope

- `.kiro/skills/aief-change/SKILL.md` — step 1 of `## Procedure`: name both outcomes of
  `aief status --next` explicitly (a Change was selected → continue to step 2; nothing open → stop
  and go to `## When something doesn't fit`), so the branch is visible where the reader actually is.
- `.kiro/skills/aief-change/SKILL.md` — the "No open Change matches the request" bullet in
  `## When something doesn't fit`: drop the circular `aief status --next` re-suggestion and keep
  the proposal semantics explicit (propose `aief new-change <name>`; the human decides whether it
  is opened), per `AGENTS.md`'s Prime Directive.

### Out of scope

- Any other step of the Skill's procedure, its YAML frontmatter, and its `metadata.version` — the
  behavior the Skill describes does not change, only the clarity of one branch.
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`, `docs/`, `README.md` — none of
  them states the ambiguous sequence; nothing there needs to change for this fix to be complete.
- CLI code and tests. No command, flag, signature, or output changes here; `aief new-change <name>`
  and `aief status --next` already behave exactly as the corrected wording describes.
- `changes/0112-kiro-native-assistant-target/evidence.md`. Its `## Findings Status` table has no row
  for this nit — 0112 recorded it as prose explicitly qualified as "not a defect", not as a
  `## Findings` entry. Governance conventions §9 has later Changes update *existing* rows; adding a
  row retroactively for something never listed as a finding would invent structure and rewrite a
  closed Change's evidence, so 0112 is left untouched and cited instead.

## Success Criteria

- Reading `## Procedure` step 1 alone tells you what to do in both outcomes, without needing to
  have already read `## When something doesn't fit`.
- No instruction in the Skill suggests `aief status --next` as the remedy for `aief status --next`
  having found nothing.
- Every command name and signature the Skill mentions still matches `docs/cli.md`.
- The Skill still never self-approves opening a Change: creating one stays a human decision.
- `npm test` and `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path --strict`
  both pass; `git diff --check` is clean.
