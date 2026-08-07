# Change

## ID

`0064-graphify-ast-graph-recommendation`

## Type

General

## Objective

Give AIEF a way to recommend a hybrid code-graph understanding approach — Graphify's Gemini-backed
semantic graph when a `GEMINI_API_KEY` is available, degrading to the assistant's own static/AST
reading of the codebase (offline, $0) when it is not — during the Understand/Plan phases of a
Change, following the exact pattern the Skill Catalog already uses for every other
technology-specific recommendation (`n8n`, `multitenant`, `aws`, …).

## Origin and scope reduction

This Change started from a broader requirement asking AIEF's CLI to *execute* a hybrid graph
engine itself: run Graphify, call the Gemini API, fall back to a Tree-sitter/PyCG AST parser,
prompt for `GEMINI_API_KEY` during `aief bootstrap`, and cache graph artifacts under a hidden
`.aief/` directory.

That version was not implemented. It conflicts with several accepted decisions:

- **ADR-015** freezes "New commands" and "Onboarding" until Change 0042's usability study is
  consolidated and a human explicitly thaws them (as ADR-022 did, narrowly, for `bootstrap`
  itself). Prompting for `GEMINI_API_KEY` inside `bootstrap` is an onboarding change with no thaw.
- **ADR-013** requires every new capability to name what it removes or replaces. A CLI-executed
  graph engine adds pure capability and removes nothing.
- **ADR-009** rejected a hidden `.aief/` state/cache directory outright — `docs/architecture.md`
  restates it as a standing invariant ("No `.aief/` directory, no session state, no cache").
- AIEF's documented architecture (`docs/getting-started.md`, `docs/configuration.md`) has no
  network calls and no credential handling anywhere in the CLI — even the Jira Requirement
  provider is local-file-only, explicitly "no network call, no credentials". Adding a live Gemini
  call and an API-key prompt inside `aief` itself breaks that invariant project-wide, not just for
  this feature.
- `aief analyze` already exists with an unrelated, documented meaning (scaffolding an Analysis
  Change) — repurposing it for graph output would silently change a documented command.

What survives, and is implemented here, is the part that fits AIEF's actual model: AIEF
*recommends* Skills as context injected into a prompt, it does not execute them
(`skills-catalog.json`'s own header: "AIEF includes it as context, it does not execute Skills").
Graphify is already exactly such a Skill, invoked by the assistant with its own tools. This
Change adds the Skill Catalog entry that recommends it (with the Gemini/AST hybrid explained as
guidance for the assistant, not code AIEF runs) and a purely informational `aief doctor` line
reporting whether `GEMINI_API_KEY` is present in the environment — a read, never a use.

## Scope

### In scope

- `cli/src/skills-catalog.json`: one new detector (`codeGraphUnderstanding`) and one new Skill
  entry (`graphify-ast-architecture`) following the existing data-only pattern — no execution, no
  network, no new dependency.
- `aief doctor`: one new, always-shown, read-only line reporting which graph engine mode is
  available (`GEMINI_API_KEY` present vs absent) — informational only, no capability activation.
- Tests: `detect.test.js` (new detector), `cli.test.js` (new doctor line, both with and without
  `GEMINI_API_KEY` set).
- `docs/cli.md`: document the new doctor line.

### Out of scope

- Any CLI-executed graph engine, Gemini API client, or Tree-sitter/PyCG dependency.
- `aief bootstrap` changes of any kind (onboarding stays frozen — ADR-015).
- Redefining `aief analyze`.
- A hidden `.aief/` cache (ADR-009).
- `knowledge/architecture-graph.md` generation — that is the Graphify Skill's own output (via the
  assistant, per the Skill's `whenToUse`/`promptContext`), not something `aief` writes.

## Status

In Progress (implementation, tests, docs and evidence complete — pending human review/close per
`AGENTS.md`'s checklist)
