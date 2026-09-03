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
   idea that needs a spec). `new-change`, `analyze` and `propose` all scaffold through the shared
   `createChange()`, which switches off `main`/`dev` onto `<type>/<id>-<slug>` automatically
   (`cli/src/core/services/git-branch.js`, Change 0114) — don't reimplement branch creation
   elsewhere; `--no-branch` opts out on any of the four commands when that's actually wanted.
   `enrich` writes its Change files directly rather than through `createChange()`, so it calls
   `ensureChangeBranch()` itself instead (Change 0117) — same contract, different call site.
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

## Regenerating the diagrams

Every diagram in this repository (README, `docs/architecture.md`, `docs/workflow.md`) is a
generated SVG under `docs/images/`, produced by a Python script under `scripts/diagrams/`. There
is no Mermaid anywhere in the docs set — Mermaid required a JS renderer neither GitHub-independent
contexts nor this repository's "no network, no hidden tooling" rule could rely on; a plain,
versioned SVG generator has neither problem. **Never hand-edit an SVG or PNG under
`docs/images/`** — edit the generator script and regenerate, so every asset stays reproducible and
diffable at the source level.

### Generate everything

```bash
python3 scripts/diagrams/generate_all.py
```

This is the one canonical command: it runs every `scripts/diagrams/generate_*.py` module, verifies
each SVG it promised was written, renders every PNG from its SVG, verifies each PNG was written,
and refuses to leave anything outside `docs/images/`. It uses no network. Sample output:

```
Using renderer: imagemagick

Generated files:
  docs/images/product-workflow.svg
  docs/images/product-workflow.png
  ...
```

### Generate one diagram

Each diagram has its own generator, runnable independently for a faster edit-preview loop:

```bash
python3 scripts/diagrams/generate_product_workflow.py    # README — how AIEF works
python3 scripts/diagrams/generate_system_context.py      # architecture.md — system context
python3 scripts/diagrams/generate_core_runtime.py         # architecture.md — core runtime
python3 scripts/diagrams/generate_prompt_composition.py   # architecture.md — prompt composition
python3 scripts/diagrams/generate_graph_engineering.py    # architecture.md — Graph Engineering
python3 scripts/diagrams/generate_workflow_lifecycle.py   # workflow.md — Change lifecycle
```

Each writes only its own SVG (`mod.SVG_PATH`) — running one never touches another diagram's
output. `scripts/diagrams/common.py` centralizes only what every diagram actually shares (palette,
fonts, arrow markers, the card/group-box/badge helpers, XML escaping, and the deterministic file
writer) — it is not a general diagramming framework, and a new diagram is free to lay out its own
cards directly.

### The `workflow.svg` compatibility wrapper

`scripts/generate_workflow_diagram.py` still exists and still writes `docs/images/workflow.svg`/
`.png` under its original, documented command — but it now imports and calls
`scripts/diagrams/generate_workflow_lifecycle.py`'s `generate()` function instead of building a
second, independently-drifting diagram. `docs/images/workflow.svg` is therefore always identical
to `docs/images/workflow-lifecycle.svg`, kept under its original path as a standalone illustrated
export (decks, blog posts, non-GitHub contexts) per `knowledge/decisions.md` ADR-030.

### Rendering PNGs

`generate_all.py` renders PNGs itself, trying local SVG renderers in this order and never mixing
tools within one run: [`rsvg-convert`](https://gitlab.gnome.org/GNOME/librsvg), ImageMagick
(`magick`/`convert`, using its bundled librsvg SVG delegate — verify with `identify -list format |
grep -i svg`; a bare `MSVG` result without an `RSVG`/`SVG` (Librsvg) line means ImageMagick will
render incorrectly and another tool should be installed instead), Inkscape's CLI, or the
`cairosvg` Python package. It fails loudly, with an actionable error, if none is available — it
never silently skips a PNG.

### The no-manual-edit rule

`docs/images/*.svg` and `docs/images/*.png` are generated artifacts, full stop. If a diagram's
content needs to change (a new command, a renamed capability), edit the Python generator and
re-run `generate_all.py` — never touch the SVG/PNG bytes directly. This is what keeps every asset
diffable at the level that actually matters (the Python source) instead of as opaque binary or
XML noise.

## Testing

```bash
npm test                          # from the repo root — full CLI suite, node --test, no dependencies
node cli/bin/aief.js verify       # validate this repository's own AIEF structure
git diff --check                  # no whitespace errors, run before every commit
cd examples/todo-app && npm test  # the executable example stays runnable
python3 scripts/diagrams/generate_all.py  # confirms every diagram generator still runs cleanly
```

## Git discipline

Every contribution, human or assistant, follows the same rules:

- Never `git push`, force-push, `reset --hard`, delete a branch, or run another destructive/
  irreversible Git operation without the person driving the work explicitly confirming that
  specific action first.
- Never delete files or directories outside what a Change's own scope calls for without the same
  confirmation.
- Run the full suite, `aief verify`, and `git diff --check` — all three — before every commit;
  fix failures rather than skipping hooks or gates.
- Prefer opening a PR over pushing directly to `main`/`dev` once a Change is done, unless told
  otherwise.
- Commits in this repository do not carry a `Co-Authored-By` trailer for AI-authored work.

## Releasing

`aief release <version>` scaffolds `releases/v<version>.md`. Fill in the summary and verification
evidence, then tag the release per your usual process — AIEF does not create commits, tags, or
publish releases itself.

Before tagging, grep the docs set for the *previous* version's number (`grep -rn "AIEF <old
version>" README.md docs/`) and update every hit — `package.json`/`cli/package.json` are not the
only place a version is written down. This was missed once (found and fixed in Change 0107):
`README.md`'s own `## Status` section kept saying "AIEF 3.2" through both the 3.3.0 version-bump
Change and the release-readiness Change that immediately preceded it, because neither one's scope
named the README as something to check.
