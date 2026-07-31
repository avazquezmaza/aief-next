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

## Next

- [Concepts](concepts.md) — the vocabulary (Change, Track, Gate, Skill, Hook, Verification Rule).
- [Workflow](workflow.md) — the full lifecycle, tracks, and verification model.
- [CLI Reference](cli.md) — every command and flag.
- [Examples](examples.md) — a worked example project.
