# Change

## ID

`0165-define-guardrail-parity-across-assistants`

## Type

Definition

## Objective

Define how the approval guard (ADR-041, Change 0162) reaches assistants other than Claude Code:
which of Gemini CLI, Codex and Cursor get a hook that refuses an edit checking, abandoning or
deleting a `(human)`/`(review)` item, in what shape, through which command, and what stays a known
gap. No application code in this Change.

## Scope

### In scope

- Verified capability matrix (hooks, blocking, input format, trust model) for Claude Code, Gemini
  CLI, Codex and Cursor, with sources and versions.
- Options, trade-offs and a recommendation for the approval guard across assistants.
- Decisions for the owner, and the follow-up implementation Change(s).

### Out of scope

- Implementing any hook, adapter or CLI flag (follow-up Change after approval).
- Credential deny-rule parity beyond recording the gap (see Decisions Required, D4).
- Identity verification of who checked an approval (accepted residual risk, Analysis 0149).
- Kiro (no hook mechanism evaluated).

## Context

- `aief close` already refuses while any `(human)`/`(review)` item is unchecked or `[-]`, for every
  assistant: the engine enforces it, and `assistant-parity.test.js` covers it per assistant.
- What differs is preventing the assistant from checking the box itself. ADR-041 added an opt-in
  Claude Code PreToolUse hook (`aief guardrails install --approval-hook`) that blocks Edit/Write/
  MultiEdit doing so; a shell command can still bypass it (mitigation, not a guarantee).
- Change 0163 found Gemini CLI 0.64.0 supports skills and hooks, contrary to ADR-039's premise.
- Feasibility assessment (2026-10-21), initiative I2, rated parity "partially viable" and asked for
  this Definition first.

## Business / Product Constraints

- ADR-038: the AIEF engine has no blocking authority; hooks live in the project, opt-in.
- ADR-038 rule: a feature must be used in two real projects within six weeks of shipping, or it is
  removed.
- Zero runtime dependencies; Node only; never overwrite an edited shipped file (ADR-040).
- ADR-008: build only what traces to an observed need or verified capability.

## Known Requirements

- The guard must refuse the same three transitions in every assistant it supports: `[ ]` → `[x]`,
  `[ ]` → `[-]`, and removal of an unchecked item, in `changes/**/tasks.md` and `spec.md`.
- Ordinary edits, including to other lines of the same file, must pass.
- Installing must only add to an assistant's settings, never remove or rewrite existing entries.

## Assumptions

- Each assistant's documented hook protocol matches its behavior for the versions named in
  Options Considered. Verified locally only for Claude Code 2.1.304 and Gemini CLI 0.64.0. (ambiguous)
- Owners who use Gemini, Codex or Cursor will accept those tools' trust prompts for project hooks.

## Open Questions

- Cursor `preToolUse` with matcher `Write`: which `tool_input` fields carry the path and the new
  content? Not documented; needs a real Cursor installation. (deferred)
- Codex `apply_patch`: is the patch format in `tool_input.command` stable enough to parse removed
  and added lines per file? Needs a real Codex installation. (deferred)
- Does `aief guardrails install` without `--assistant` keep meaning Claude Code? Yes — decided as D3.

## Decisions Required

- D1: Which assistants get the approval guard now.
- D2: One script with per-assistant input adapters, or one script per assistant.
- D3: CLI surface and default assistant for `aief guardrails install`.
- D4: Credential deny-rule parity: in scope or recorded gap.
- D5: Record as a new ADR-042 extending ADR-041, or amend ADR-041.

## Options Considered

Capability matrix (sources in `evidence.md`):

| | Claude Code 2.1.304 | Gemini CLI 0.64.0 | Codex (docs; not installed) | Cursor (docs; not installed) |
| --- | --- | --- | --- | --- |
| Pre-edit blocking hook | PreToolUse `Edit\|Write\|MultiEdit` | BeforeTool `write_file\|replace` | PreToolUse `apply_patch` | preToolUse `Write` (no `beforeFileEdit`; `afterFileEdit` cannot block) |
| Edit input | `file_path`, `content` / `old_string`, `new_string`, `replace_all` | `file_path`, `content` / `old_string`, `new_string`, `allow_multiple` | patch text in `tool_input.command` | not documented |
| Block signal | exit 2 + stderr | exit 2 + stderr, or `{"decision":"deny"}` | exit 2 + stderr, or `permissionDecision: "deny"` | exit 2, or `{"permission":"deny"}` |
| Project config | `.claude/settings.json` | `.gemini/settings.json` (`$GEMINI_PROJECT_DIR`) | `.codex/hooks.json` or `[hooks]` in `.codex/config.toml` | `.cursor/hooks.json` |
| Trust gate | workspace trust | trusted folder + per-hook warning, re-warned when the command changes | trusted `.codex/` layer + per-hook trust by hash (`/hooks`) | none documented |
| Shell bypass | yes | yes | yes ("a useful guardrail, not a complete enforcement boundary") | yes |
| Project credential deny | `permissions.deny` | none: workspace policies non-functional (issue #18186); `.geminiignore` only for tools that honor it | none found | `beforeReadFile` hook |

Options for D1:

- A. Documentation only: record the matrix and gaps in `docs/security-model.md`. Cheapest; no
  parity gained.
- B. Gemini now, Codex and Cursor later: Gemini's protocol is verified and almost identical to
  Claude's (only tool names and `allow_multiple` differ). Codex and Cursor wait for a real
  installation to verify their input formats.
- C. All three now from documentation: Codex needs a patch parser and Cursor's input fields are
  undocumented, so the result would ship untested against real tools (against ADR-008).

Options for D2:

- A. One `aief-approval-guard.mjs` that recognizes each assistant's tool names and normalizes the
  input to "file before / file after" — one shipped file, one hash history, one test suite.
- B. One script per assistant — simpler per file, but duplicated approval logic to keep in sync.

Options for D3:

- A. `aief guardrails install [--assistant <id>] [--approval-hook]`, default Claude Code (today's
  behavior unchanged); `--assistant gemini` writes `.gemini/settings.json` and installs the same
  script under `.gemini/hooks/`.
- B. Default to the configured assistant (`knowledge/assistant.json`) — changes today's behavior
  for projects configured for Gemini.

Options for D4:

- A. Recorded gap: only Claude Code has a project-level declarative deny list; Cursor could use a
  `beforeReadFile` hook, Gemini a BeforeTool hook on `read_file`, Codex nothing equivalent found.
- B. Build read-deny hooks per assistant — a second guard with its own pattern list and tests.

## Recommendation

- D1: B — Gemini now; Codex and Cursor each in their own Change once verified on a real
  installation (their Open Questions above).
- D2: A — one script with per-assistant adapters; the approval comparison stays shared.
- D3: A — `--assistant <id>`, default Claude Code, so existing usage and docs stay valid.
- D4: A — record the gap in `docs/security-model.md`; revisit only with a real need (ADR-008).
- D5: new ADR-042 that extends ADR-041 (accepted ADRs are not rewritten).

## Decision (human)

The owner chose on 2026-10-21, in the session that produced this Definition, every Recommendation
above (transcribed by the assistant; the owner confirms by checking the `(human)` tasks):

- D1: Gemini CLI gets the approval guard now; Codex and Cursor each in a later Change, after a real
  installation confirms their edit-event format.
- D2: One `aief-approval-guard.mjs` with per-assistant input adapters.
- D3: `aief guardrails install [--assistant <id>]`, default Claude Code (today's behavior unchanged).
- D4: Credential deny-rule parity stays a recorded gap in `docs/security-model.md`.
- D5: Recorded as ADR-042, extending ADR-041.

Recorded in `knowledge/decisions.md` as ADR-042.

## Rationale

- Gemini is the only option verified end to end today (Change 0163) and costs a small adapter.
- One script keeps the three approval transitions defined in one place, as ADR-041 intended.
- Waiting on Codex/Cursor avoids shipping guards whose input format was never observed.

## Consequences

- If approved: Gemini users get the same mitigation as Claude Code users, in trusted folders.
- Codex and Cursor remain covered only by the engine (`aief close`) and platform controls
  (branch protection, CODEOWNERS on `changes/**`, review from another account).
- The two-projects-in-six-weeks rule applies to the Gemini guard from its release.

## Non-Functional Requirements

- Hook runs in well under the assistants' default timeouts (Gemini example: 5000 ms); no network.
- Fails open on unparseable input, as the Claude hook does today.

## Security & Compliance

- Mitigation, not enforcement: shell commands bypass every assistant's edit hooks.
- Project hooks are code the assistant runs; Gemini and Codex make the user trust them explicitly.

## Data & Domain

- Same approval-line grammar as `parseApprovalLines()` / the Claude hook: `- [ ] (human|review) text`.

## Integrations

- Gemini CLI settings (`.gemini/settings.json`, `hooks.BeforeTool`); later Codex and Cursor.

## Deployment & Operations

- Shipped as a project file; `aief doctor` reports install state; `aief update` refreshes an
  unmodified older copy (ADR-040).

## Implementation Prerequisites

- Owner decisions D1–D5 recorded here and in `knowledge/decisions.md`.
- For Codex/Cursor follow-ups: a real installation to capture one edit event each.

## Follow-up Changes

- `feature`: Gemini approval guard — adapter in `aief-approval-guard.mjs`, `--assistant gemini` in
  `aief guardrails install`, `aief doctor`, tests, docs, ADR-042.
- `feature` (later): Codex approval guard, after capturing a real `apply_patch` PreToolUse event.
- `feature` (later): Cursor approval guard, after capturing a real `preToolUse` `Write` event.

## Success Criteria

- Open Questions are resolved or explicitly deferred.
- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.
- Implementation Prerequisites and Follow-up Changes are identified.

## Status

Closed (2026-10-22)
