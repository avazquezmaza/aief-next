# Change

## ID

`0158-define-assistant-native-skill`

## Type

Definition

## Objective

Define how AIEF ships a native, self-contained `aief-change` skill to the assistants that support
skills (Claude Code, Kiro, Codex), and how much of `AGENTS.md` moves into it. Wave 2 of Analysis
0154 (F6, and F3 from Change 0157). The implementation Change (0159) follows these decisions only.

## Scope

### In scope

- Skill content, location per assistant, and how AIEF installs and updates it.
- Which `AGENTS.md` sections move to the skill, and the target size.
- What `aief prompt` and the docs say once the skill exists.

### Out of scope

- Implementation (Change 0159).
- Guardrails as configuration and private mode (wave 2, separate Changes).

## Context

- `aief bootstrap` writes `AGENTS.md` but no assistant file or skill. `docs/assistant-workflow.md`
  says so: "In another project, add the appropriate entrypoint and procedure together."
- Of 11 local projects, 1 has an `aief-change` skill (`THINGS/neto`, Kiro, an older copy that
  differs from this repository's). 9 have a hand-written `CLAUDE.md` of 39–383 lines.
- This repository's skills (`.kiro/skills/aief-change/SKILL.md`, `.agents/skills/aief-change/SKILL.md`)
  are 13 lines that point to `docs/assistant-workflow.md`. That file exists only here, so the skills
  do not work in another project.
- `AGENTS.md` (template and root) is 208 lines. It mixes policy (Prime Directive, approvals,
  guardrails) with procedure (workflow steps, checklist, evidence guidance) that every assistant
  loads in every session.
- The procedure today reaches an assistant either by `aief prompt` (copy-paste) or by a
  hand-written file.

## Business / Product Constraints

- No runtime dependency; repository as source of truth; never overwrite a user's file (ADR-038
  invariants and bootstrap's existing rule).
- Gemini and Cursor have no skill mechanism; they must keep getting the procedure.

## Known Requirements

- A skill must work in any adopting project without files that only exist in AIEF's repository.
- One canonical source for the skill text; no per-assistant copies to keep in sync by hand.

## Assumptions

- A1: Claude Code reads `.claude/skills/<name>/SKILL.md`, Kiro `.kiro/skills/<name>/SKILL.md`,
  Codex `.agents/skills/<name>/SKILL.md`, all with the same frontmatter shape (`name`,
  `description`). To be confirmed against each tool's current docs in 0159.
- A2: Claude Code loads `AGENTS.md` natively in these projects (observed in this session), so no
  `@AGENTS.md` import is needed.

## Open Questions

- Q1: Which assistants get the skill by default at `bootstrap`? See D2. **Resolved: all three.**
- Q2: What happens when AIEF's skill template changes after a project installed it? See D3.
  **Resolved: D3 as recommended.**

## Decisions Required

- D1: Skill content.
- D2: Installation.
- D3: Updates.
- D4: `AGENTS.md` split.
- D5: `aief prompt` and docs.

## Options Considered

- **D1**: (a) self-contained procedure in `SKILL.md`; (b) a pointer to a doc AIEF also installs.
- **D2**: (a) `bootstrap` writes the skill for the configured assistant
  (`knowledge/assistant.json` or `--assistant <id>`), or for all three when none is configured;
  (b) a new command `aief skill install [assistant]`; (c) both: `bootstrap` installs, and an
  explicit command re-installs.
- **D3**: (a) never overwrite; `aief doctor` reports an installed skill whose `metadata.version` is
  older than AIEF's; (b) overwrite when the installed file is unmodified (hash match); (c) always
  overwrite.
- **D4**: (a) move the procedure (AIEF Workflow, Working with Changes details, Required Completion
  Checklist, Evidence Guidance) into the skill and keep policy in `AGENTS.md` (target ~110 lines);
  (b) leave `AGENTS.md` as is.
- **D5**: (a) keep `aief prompt` for every assistant, and include the procedure in its output for
  assistants without a skill; (b) drop `aief prompt`.

## Recommendation

- **D1**: (a). One template, `cli/templates/skills/aief-change/SKILL.md`, copied verbatim to each
  location; this repository's own skills become copies of it (a test enforces identity, like
  `AGENTS.md`).
- **D2**: (c). `bootstrap` installs for the configured assistant, or all three when none is set;
  `aief skill install [assistant]` installs or re-installs one explicitly. Both never overwrite a
  modified file.
- **D3**: (b) plus (a)'s report: overwrite only when the installed file is byte-identical to a
  previous AIEF version (unmodified); otherwise leave it and let `aief doctor` say it is outdated.
- **D4**: (a), ~110 lines. Policy stays where every assistant reads it; procedure loads only when
  Change work starts.
- **D5**: (a). `aief prompt` stays the path for Gemini, Cursor and generic assistants, and now
  carries the procedure they no longer get from `AGENTS.md`.

## Decision (human)

**Approved by the project owner on 2026-10-04** ("si tal cual"): every Recommendation D1–D5 as
written.

- Q1: with no configured assistant, `bootstrap` installs the skill for all three (Claude Code,
  Kiro, Codex).
- Q2: the D3 update policy stands — overwrite only an unmodified file; `doctor` reports a
  modified, outdated one.

## Rationale

- 10 of 11 projects lack a working skill; copy-paste and hand-written files are the current path.
- Splitting policy from procedure shortens what every session loads without losing the procedure.

## Consequences

- New: `cli/templates/skills/`, `aief skill install`, skill install in `bootstrap`, an outdated
  notice in `doctor`.
- `AGENTS.md` changes for every adopting project on its next bootstrap (template change).

## Non-Functional Requirements

- Idempotent installs; no overwrite of modified files.

## Security & Compliance

- The skill restates the approval rules: an assistant never checks `(human)`/`(review)`.

## Data & Domain

- None.

## Integrations

- Claude Code, Kiro, Codex skill directories (A1).

## Deployment & Operations

- Ships in the next minor version (4.1.0).

## Implementation Prerequisites

- Owner approval of D1–D5 and answers to Q1/Q2.
- Confirm A1 against current docs for each tool.

## Follow-up Changes

- 0159: implement the skill, installation, updates and the `AGENTS.md` split.

## Success Criteria

- Open Questions are resolved or explicitly deferred.
- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.
- Implementation Prerequisites and Follow-up Changes are identified.

## Status

Closed (2026-10-04)
