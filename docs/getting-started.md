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

After adoption you'll typically have two open Changes (`adopt-aief` and the Analysis) — that's
expected. With more than one Change open, commands that act on one require an explicit
`--change <id>` instead of guessing.

### Starting a new project

`aief bootstrap <name>` is a different command from plain `aief bootstrap` — it never touches the
current directory. It creates `<name>/` from scratch with only engineering governance structure:
`README.md`, a minimal `AGENTS.md`, and empty `changes/`, `knowledge/`, `src/`, `tests/`
directories. **AIEF is not an application framework** — no `package.json`, no dependencies, no
starter code. Fails with an error if `<name>/` already exists, so you only run it once per project.

```bash
aief bootstrap sample-app          # 1. create the skeleton — run from the parent directory
cd sample-app                      # 2. enter the new project
ls -la                             # 3. inspect what was generated: README.md, AGENTS.md,
                                    #    changes/, knowledge/, src/, tests/ (all empty)
aief doctor                        # 4. confirm the local toolchain is ready
aief verify                        # 5. confirm the skeleton is structurally valid
```

There's no existing architecture to capture here, so `analyze` adds little value in a fresh
skeleton — it's optional, not part of this path. Once the skeleton is in place:

```bash
# 6. add or initialize your chosen application stack yourself (npm init, a framework
#    CLI, etc.) — this step is entirely yours; AIEF has no opinion on which stack you use

aief new-change initial-setup            # 7. create the first Delivery Change
# edit change.md and spec.md             #    define what "initial setup" means for your stack
aief prompt claude --profile developer   # 8. generate a context-complete prompt
# paste into your assistant              #    the assistant implements inside the Change
# add evidence to evidence.md            #    record what actually happened
aief verify                              # 9. check structure and evidence
aief close --yes                         # 10. readiness checks pass -> Change marked Closed
```

The same six-step "first Change" loop (`new-change` -> `prompt` -> implement -> evidence -> `verify`
-> `close`) applies to every Change after this one, in both the new-project and existing-project
paths — see [Your first Change](#your-first-change) below.

### Adopting an existing project

![AIEF adoption workflow: an existing repository flows through doctor (inspect only), bootstrap (adds visible governance structure), verify (validates the structure), and analyze (records an Analysis Change), before the first delivery Change begins; application code, tests, CI, Git history and existing tools are preserved throughout](images/adoption-workflow.svg)

**Where do I run the commands?** From the root of the existing project's own repository — the same
directory as its `package.json`/`README.md`. `aief bootstrap` (no argument) always targets the
current directory; only `aief bootstrap <name>` creates a new project elsewhere.

**What does `doctor` inspect?** Your local toolchain (Node, npm, git, and optional tools like
OpenSpec/SpecBoot) plus the current project's files — `package.json`, `README.md`, `AGENTS.md`,
`changes/`, `knowledge/`, `profiles/`, `adapters/`, `ai-specs/`. It never writes anything, in this
project or any other.

**What does `bootstrap` create?** `AGENTS.md` (only if missing), `changes/`, `knowledge/`,
`profiles/`, `knowledge/standards/` starter standards matched to your detected stack,
`knowledge/skills.md`, a CI gate (`.github/workflows/aief-verify.yml`), and one Adoption Change
(`changes/<id>-adopt-aief/`). It also writes `knowledge/sdd-provider.json`, but only when the SDD
Provider choice is genuinely ambiguous and you're prompted for it interactively.

**What does `bootstrap` preserve?** Everything else — application source, tests, package files, CI
configuration, Git history, and any file that already exists at a path `bootstrap` would otherwise
create. It never overwrites; a pre-existing `AGENTS.md` or `knowledge/standards/base-standards.md`
is left byte-for-byte untouched, reported as already present instead.

**What does `analyze` create?** Exactly one Change — `changes/<next-id>-analyze-current-architecture/`
(or the name you pass) — seeded with the same signals, Skills, and Standards `doctor` already
detects, under a "Detected Context" section marked as inference to confirm or discard.

**Why are there normally two open Changes?** `bootstrap` creates the Adoption Change (evidence that
AIEF was added, with no functional code changed); `analyze` creates a separate Analysis Change
(architecture, stack, standards gaps, and risks of the existing repository). They record different
things, so they stay separate Changes rather than merging into one. Full definitions, plus the
Delivery Change that follows them: [Concepts — Change](concepts.md#change).

**Which Change should I work on first?** Either order works — closing the Adoption Change only
requires `aief verify` to pass and its own checklist done; the Analysis Change is typically worked
on afterward, since it produces the roadmap for what to build next. With both open, name the target
explicitly: `aief close --yes --change adopt-aief` or `aief prompt --change <analysis-id>`.

**What happens if `AGENTS.md` already exists?** `bootstrap` detects it, prints "AGENTS.md already
exists," and does not touch it. This is the most common case for a project that already uses AIEF
or a similar assistant-instruction convention.

**What happens if `changes/` or `knowledge/` already exists?** The directories are reused
as-is (created only if missing); files inside them are individually checked — an existing
`knowledge/standards/*.md` is reused untouched, a missing one is created from the matching
template, and an existing `changes/*-adopt-aief/` means bootstrap is idempotent and reports nothing
new to create.

**What happens when OpenSpec or SpecBoot is already present?** Both are detected but not modified.
`bootstrap` reports what it found (OpenSpec CLI/project structure, SpecBoot markers) and resolves
the SDD Provider accordingly — asking only when both are present and the choice is ambiguous.
Neither tool's own files are ever written or changed by AIEF.

**Does AIEF modify application code?** No. No command under `bootstrap`, `analyze`, `doctor`, or
`verify` writes to source, test, or build files — read only there, in every case.

**Does AIEF create assistant-specific files?** No. `bootstrap` never creates `CLAUDE.md`,
`GEMINI.md`, `CODEX.md`, or `CURSOR.md` — those are optional, hand-authored adaptations you add
yourself. `AGENTS.md` is the one universal instruction file AIEF creates and every `aief prompt`
output points an assistant to first.

**How do I inspect the resulting diff?** `git status` and `git diff --stat` after `bootstrap` show
exactly the new, visible files listed above — nothing under a hidden directory, nothing outside the
project root.

**How do I stop before proceeding further?** `doctor` alone is fully safe to run and re-run — it
never writes. After `bootstrap`, if you decide not to continue, the new files are ordinary tracked
files: `git restore --staged` and remove them, or simply don't commit, exactly like undoing any
other local change.

| Existing project asset | AIEF behavior |
|---|---|
| Application source | read only |
| Tests | read only |
| Package files (`package.json`, lockfiles) | read only |
| CI configuration | detected but not modified |
| Git history | not touched |
| `AGENTS.md` | created only when missing |
| `changes/` | created only when missing; reused |
| `knowledge/` | created only when missing; reused |
| `ai-specs/` | detected but not modified |
| `CLAUDE.md` / `GEMINI.md` / `CODEX.md` / `CURSOR.md` | not created by bootstrap |
| OpenSpec (`openspec/`, CLI) | detected but not modified |
| SpecBoot | detected but not modified |

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

## Multiple open Changes

It's normal to have several open Changes at once — most commonly the Adoption Change and the
Analysis Change right after adopting an existing project, or several Delivery Changes in flight on
a larger project. List them with:

```bash
aief status
```

Each row shows the Change's id and slug, e.g. `0001-adopt-aief`, `0002-analyze-current-architecture`.
`prompt`, `close`, and `status --change` all act on **exactly one** Change: with zero open Changes
they error; with exactly one open Change they select it automatically; with two or more, they
require an explicit `--change <id>` and otherwise fail with an error listing every open Change
instead of guessing.

```bash
aief status --change 0001-adopt-aief
aief prompt claude --change 0002-analyze-current-architecture
aief close --yes --change 0001-adopt-aief
```

`--change` accepts the full slug, just the numeric id, or any unambiguous substring of the
basename. `aief status --next` is the exception — with several open Changes it recommends one
eligible Change instead of erroring, but it only ever recommends; it never acts on your behalf.

## Safe stopping points

You can pause at any of these points without losing anything or leaving the project in a bad
state:

- **After `doctor`** — it never writes, so stopping here leaves the project untouched.
- **After `bootstrap` and reviewing the diff** — `git status`/`git diff --stat` show exactly the
  new files; if you don't like them, `git restore --staged` and delete them, or simply don't
  commit.
- **After `verify`** — a read-only structural check; passing or failing, nothing changes.
- **Before `analyze`** — it's optional; skip it and come back later, or never run it at all.
- **Before generating a prompt** — `new-change`/`enrich` only create Markdown files; there's no
  commitment to implement until you actually paste a prompt into an assistant.

## Next

- [Concepts](concepts.md) — the vocabulary (Change, Track, Gate, Skill, Hook, Verification Rule).
- [Workflow](workflow.md) — the full lifecycle, tracks, and verification model.
- [CLI Reference](cli.md) — every command and flag.
- [Examples](examples.md) — a worked example project.
