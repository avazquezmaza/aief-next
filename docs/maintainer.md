# Maintainer Guide

For anyone extending AIEF itself — adding a Skill, Hook, Verification Rule, or provider — or
contributing a change to the CLI.

## AIEF is built using AIEF

This repository runs its own workflow: every unit of work is a Change under
[changes/](../changes/), each closed Change carries its own evidence, and `npx aief verify` gates
every push and pull request. Before contributing, read [AGENTS.md](../AGENTS.md) — it is the one
file every assistant and every contributor must follow, in this repository as in any adopted one.

## Extending a registry

Every extensible subsystem (Skills, Hooks, Verification Rules, SDD providers, Requirement
providers) follows the same shape: a plain module export, a static registry object, no plugin
loader or dynamic discovery. Adding a new one never requires touching a caller — only the registry
file itself.

| Subsystem | Contract module | Registry | Add a new one by |
|---|---|---|---|
| Skill | `cli/src/core/domain/skill.js` | `cli/src/skills/index.js` | Adding a file under `cli/src/skills/` exporting the descriptor, plus one entry in the registry. |
| Hook | `cli/src/core/domain/hook.js` | `cli/src/hooks/index.js` | Same pattern under `cli/src/hooks/`. New lifecycle events require extending `EVENT_CATALOG` in `hook.js` first — the catalog is closed by design; only add an event with a confirmed emission point and a real consumer. |
| Verification Rule | `cli/src/core/domain/verification-rule.js` | `cli/src/verification-rules/index.js` | Same pattern under `cli/src/verification-rules/`. New Evidence types require extending the vocabulary in `verification-rule.js` first. |
| SDD Provider | `cli/src/core/domain/sdd-model.js` | `cli/src/sdd-providers/index.js` | A file under `cli/src/sdd-providers/` implementing `resolveChange()`/`validate()`, plus one registry entry. |
| Requirement Source provider | `cli/src/requirement.js` | `cli/src/requirement-providers/index.js` | A file under `cli/src/requirement-providers/` producing the Normalized Requirement shape. |

A capability a new entry declares that isn't in the module's `KNOWN_CAPABILITIES`, or that is in
its `FORBIDDEN_CAPABILITIES` (currently `writeFiles`/`executeCommands`/`network`, plus
`assistantRequired` for Verification Rules), fails registration outright — this is enforced, not a
convention to remember.

## Contributing a Change

1. `aief new-change <name>` (or `aief enrich`/`aief propose` if the work starts from a ticket or an
   idea that needs a spec).
2. Fill `change.md` and `spec.md` before implementing.
3. Implement, then run `npm test` (from the repo root) and `node cli/bin/aief.js verify`.
4. Update `evidence.md` with what was actually done and verified — not a template.
5. `aief close --yes` once every readiness check passes.

For non-trivial architectural changes, add a `design.md` recording the alternatives considered and
why — the pattern every Core 3.0 Change (`changes/0043-*` through `changes/0049-*`) already
follows. A new architectural boundary or a decision likely to be second-guessed later earns its own
entry in [knowledge/decisions.md](../knowledge/decisions.md) (the ADR log) — see the existing
entries for the expected shape (Decision, Why this needs its own ADR, Alternatives considered).

## Documentation rules

- The docs set is intentionally small (this file and its siblings under `docs/`, plus the README).
  Prefer extending an existing document over creating a new one — a new Markdown file must justify
  its own existence.
- Document the product as it is today. Do not narrate how a feature evolved, cite a Change number
  as the explanation for current behavior, or describe a deprecated shape "for context" — that
  belongs in [changes/](../changes/) and [docs/history/](history/), never in the learning path.
  `knowledge/decisions.md` (the ADR log) is the one exception: it is a decision *log* by nature, not
  a product document, and stays untouched by this rule.
- If two documents would explain the same concept, that is a bug: merge them, and link to the one
  surviving explanation from everywhere else.
- Historical, superseded, or study material goes under `docs/history/` — never in the main set,
  never mixed into a current document "just for context."

## Testing

```bash
npm test                          # from the repo root — full CLI suite, node --test, no dependencies
node cli/bin/aief.js verify       # validate this repository's own AIEF structure
cd examples/todo-app && npm test  # the executable example stays runnable
```

## Releasing

`aief release <version>` scaffolds `releases/v<version>.md`. Fill in the summary and verification
evidence, then tag the release per your usual process — AIEF does not create commits, tags, or
publish releases itself.
