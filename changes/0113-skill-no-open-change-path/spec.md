# Specification

## Goal

An assistant reading `.kiro/skills/aief-change/SKILL.md`'s `## Procedure` from the top can act
correctly when `aief status --next` reports no open Change — the branch is stated at step 1, where
the reader hits it, instead of only in a separate section further down. No behavior the Skill
describes changes; only its wording.

## Requirements

- R1: Step 1 of `## Procedure` names both outcomes of running `aief status --next`:
  - an open Change was found/selected → continue with step 2;
  - nothing open → do not continue down the procedure; go to `## When something doesn't fit`.
  The existing step-1 guidance stays intact: `aief status` to list every open Change, never guess or
  pick the most recently modified directory, and ask which one when several are open.
- R2: The `## When something doesn't fit` bullet for "no open Change" no longer offers
  `aief status --next` as a remedy. It keeps `aief new-change <name>` as the single suggested
  command and keeps "don't invent scope".
- R3: The bullet states explicitly that opening a Change is proposed, not done unilaterally — the
  human decides. This must not restate `AGENTS.md`'s Prime Directive text; a pointer-level phrasing
  only, consistent with the Skill's own "does not restate `AGENTS.md`" rule.
- R4: Every command mentioned remains a real one with its real signature per `docs/cli.md`:
  `aief status`, `aief status --next`, `aief new-change <name>`,
  `node cli/bin/aief.js verify --change <id> --strict`.
- R5: Steps 2–7, the `## When something doesn't fit` bullets for ambiguity and Analysis/Definition
  Changes, the YAML frontmatter (including `metadata.version`), and the document's structure are
  unchanged. The diff touches only step 1 and the one bullet named in R2.
- R6: No file outside `.kiro/skills/aief-change/SKILL.md` and this Change's own directory is
  modified.

## Acceptance Criteria

- [ ] `## Procedure` step 1 explicitly names the "no open Change" outcome and points to
      `## When something doesn't fit`, readable without having seen that section first.
- [ ] `## Procedure` step 1 still tells the reader to use `aief status` for the full list, to never
      guess or pick the most recently modified directory, and to ask when several Changes are open.
- [ ] The string `aief status --next` no longer appears in the "no open Change" bullet of
      `## When something doesn't fit`.
- [ ] That bullet still names `aief new-change <name>` and still says not to invent scope.
- [ ] That bullet makes clear a human decides whether the Change is opened.
- [ ] `git diff` for `SKILL.md` shows changes confined to step 1 and that one bullet — frontmatter,
      steps 2–7 and the other two bullets byte-identical.
- [ ] `git diff --name-only` lists only `.kiro/skills/aief-change/SKILL.md` plus files under
      `changes/0113-skill-no-open-change-path/`.
- [ ] `npm test` passes.
- [ ] `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path --strict` passes.
- [ ] `git diff --check` reports no whitespace errors.
