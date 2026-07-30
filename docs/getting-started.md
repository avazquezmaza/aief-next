# Getting Started

A ~15-minute path from zero to your first verified Change.

## Install

Requires Node.js >= 18. No runtime dependencies.

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # nothing to download; validates the package
npm link        # installs a global `aief` command
aief --help
```

Prefer not to link a global command? Run it directly: `node cli/bin/aief.js <command>`.

## Check your environment

```bash
aief doctor
```

Reports required tools (Node, npm, git), recommended tools (OpenSpec, SpecBoot — both optional),
and your current project's AIEF readiness. Writes nothing.

## Bootstrap a project

**Existing project (the primary use case)** — run from your project's root:

```bash
aief bootstrap   # visible AIEF structure only — never touches application code
aief verify      # confirm the structure
aief analyze     # create an Analysis Change, seeded with everything doctor detected
```

`aief bootstrap` creates `AGENTS.md` if missing, `changes/`, `knowledge/` with starter standards
matched to your stack, and an adoption Change. It also resolves which SDD Provider (OpenSpec or
local) to use — it only asks when that choice is genuinely ambiguous (both OpenSpec and SpecBoot
detected); otherwise it decides and reports silently. It is idempotent and never overwrites an
existing file.

**New project:**

```bash
aief bootstrap my-project
cd my-project
```

After adoption you'll typically have two open Changes (`adopt-aief` and the Analysis) — that's
expected. With more than one Change open, commands that act on one require an explicit
`--change <id>` instead of guessing.

## Your first Change

```bash
aief new-change add-login                # 1. create the Change skeleton
# edit change.md and spec.md             # 2. define the work
aief prompt claude --profile developer   # 3. generate a context-complete prompt
                                          #    (or: gemini, codex, cursor)
# paste into your assistant              # 4. the assistant implements inside the Change
aief verify                              # 5. check structure and evidence
aief close --yes                         # 6. readiness checks pass -> Change marked Closed
```

The generated prompt carries `AGENTS.md`, the assistant file, your profile, your project standards,
and any recommended Skills — the assistant starts with full context, not a blank chat.

Not sure what to do next for a given Change? Ask AIEF:

```bash
aief status --next
```

## Starting from a ticket instead of an idea

```bash
aief enrich manual TEST-001
```

Creates a Change requiring human review before implementation — see
[Workflow — Starting from a Requirement Source](workflow.md#starting-from-a-requirement-source).

## Next

- [Concepts](concepts.md) — the vocabulary (Change, Track, Gate, Skill, Hook, Verification Rule).
- [Workflow](workflow.md) — the full lifecycle, tracks, and verification model.
- [CLI Reference](cli.md) — every command and flag.
- [Examples](examples.md) — a worked example project.
