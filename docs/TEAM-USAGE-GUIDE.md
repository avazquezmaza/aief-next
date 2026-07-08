# AIEF Team Usage Guide

A practical guide for developers using AIEF on real projects. Direct and operational — for the why behind it, see [docs/VISION.md](VISION.md) and [docs/principles.md](principles.md).

**Status:** AIEF is in **pre-1.0 internal pilot**. Approved for guided internal use, brownfield discovery, greenfield validation and developer-team pilots. **Not** approved for unsupervised delegated implementation or as a stable external 1.0. See [docs/AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md).

---

## What AIEF is

A **workflow engine** for AI-assisted software engineering: a dependency-free Node.js CLI (`aief`) plus visible conventions (`AGENTS.md`, `changes/`, `knowledge/`). It prepares context, composes the prompt for your assistant, and governs the evidence — so the same discipline survives across assistants, sessions and teammates.

AIEF owns **workflow, context, evidence, verification and governance**.

## What AIEF is not

- It does **not** write specs, tasks or proposals — OpenSpec (or you) does.
- It does **not** implement, refactor, test or review code — your AI assistant does.
- It does **not** replace OpenSpec, SpecBoot or your assistant.
- It does **not** keep hidden state — the Change files are the only source of truth ([ADR-009](../knowledge/decisions.md)).
- It does **not** commit, push, open PRs or approve releases — **humans decide**.

## When to use it

- Adopting AIEF into an existing ("brownfield") project.
- Discovering the architecture of an unfamiliar codebase.
- Starting a scoped unit of work (a Change) that an assistant will implement under review.
- Greenfield validation projects and team pilots.

## When not to use it

- **Do not** let an assistant run a Change end-to-end without human review — AIEF is not yet approved for unsupervised delegated implementation.
- **Do not** treat a generated prompt or assistant output as approved. AI assists; humans decide.
- **Do not** use it as your spec generator — bring OpenSpec or write `spec.md` yourself.
- **Do not** rely on it for external/production 1.0 guarantees — it is a pre-1.0 pilot.

## Required tools

| Tool | Requirement |
|---|---|
| Node.js >= 18, npm, git | **Required** (Core) |
| OpenSpec | Recommended — spec/proposal generation |
| SpecBoot | Recommended — standards/assistant setup |
| An AI assistant (Claude, Gemini, Codex, Cursor, …) | Required to implement |
| Java / Maven / Gradle / Docker | Optional — only if your stack needs them |

Run `aief doctor` to see what is present. Missing **optional** tools never block you.

---

## First-time setup

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # no dependencies; validates the package
npm link        # installs a global `aief` command
aief --help
```

Prefer not to link? Run `node cli/bin/aief.js <command>`. Full options: [docs/bootstrap.md](bootstrap.md).

Verify the install:

```bash
aief doctor     # environment + readiness; writes nothing
```

---

## How to adopt an existing project

From your project's root:

```bash
aief doctor      # environment + project readiness — writes nothing
aief init        # initialize the current directory — visible structure only, never touches app code
aief verify      # check the AIEF structure
aief analyze     # create an Analysis Change seeded with what doctor detected
```

`aief init` (reusing `adopt` logic) creates `AGENTS.md` if missing, `changes/`, `knowledge/` with starter standards matched to your stack, and an adoption Change. It is idempotent, never overwrites app code, and tells you where OpenSpec and SpecBoot fit.

**Human review point:** edit `knowledge/standards/` so the `(adapt)` lines match how this project is actually built, before working real Changes.

**Known pilot limitation:** context detected by `analyze` does not yet flow automatically into later Changes or prompts, and duplicate Changes can be created silently. Confirm the active Change with `aief status` before you start. Fixes are tracked in [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md).

---

## How to start a Change from a requirement source (Jira, Notion, GitHub Issues, or manual)

Real work usually starts in a ticket, not in `aief new-change`. Use `aief enrich` instead when you have a source:

```bash
aief enrich manual TEST-001                            # human-provided requirement
aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json   # Jira, read-only, local export
```

`aief enrich <provider> <source-id>` creates a Change seeded with the requirement, read-only (AIEF never writes back to the source), classified as Fact `[H]` / Inference `[I]` / Assumption `[S]`, with Open Questions and a **Requires Human Review** status. It never suggests implementing directly.

**Required human review point:** review `spec.md`, answer or defer the Open Questions, approve or adjust the scope in `change.md`, then continue with `aief propose --change <the-change-id>` (adds `proposal.md` to the **same** Change — never a new one, never touching what `enrich` already recorded) or straight to `aief prompt`. `aief close --yes` refuses this Change while its Human Review tasks are unchecked — that gate is not optional.

Only `manual` and `jira` (via a local export file, no network, no credentials) are implemented today; Notion, GitHub Issues and Azure DevOps are planned. Full model and provider table: [docs/requirement-sources.md](requirement-sources.md); full flow: [docs/enrichment-workflow.md](enrichment-workflow.md).

---

## How to start a new Change

```bash
aief new-change add-login        # creates changes/<next-id>-add-login/
aief status                      # confirm the active Change and ID
```

Use this when you already have a scoped idea and no external requirement source to enrich from. Then fill in the skeleton **before** any implementation:

- `change.md` — why and what (objective, scope, out of scope).
- `spec.md` — requirements and acceptance criteria.
- `tasks.md` — implementation checklist.
- `evidence.md` — left for after the work; completed with what actually happened.

With OpenSpec available, use `aief propose` to delegate proposal/spec/tasks generation; AIEF falls back loudly to a local skeleton when OpenSpec is absent.

---

## How to generate a prompt

```bash
aief prompt claude       # or: gemini | codex | cursor
```

`aief prompt <assistant>` composes AGENTS.md, the assistant file, the selected profile, project standards, Skills and the active Change into one ready-to-paste briefing. It **writes nothing** and runs nothing — you paste it into your assistant yourself.

- Add `--profile <name>` to steer the reasoning role (e.g. architect).
- Unknown assistant values fail with guidance — no silent fallback.

**Known pilot limitation:** the prompt can reference files (like `AGENTS.md`) even when `doctor` reports them missing, and there is no automated hand-off into the assistant. Read the prompt before pasting it. Tracked in [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md).

---

## How to work with Claude / Gemini / Codex / Cursor manually

1. `aief prompt <assistant>` and copy the output.
2. Paste it into your assistant session.
3. Let the assistant read the referenced files (`change.md`, `spec.md`, `tasks.md`, `AGENTS.md`, standards, Skills).
4. Have it implement **only** the scope in `change.md`, respecting the acceptance criteria in `spec.md`.
5. **Review every diff yourself.** The assistant implements; you decide.

For **Analysis** Changes the prompt tells the assistant not to modify source code — it completes or amends `evidence.md` only, and reports which tasks appear complete rather than checking them off itself.

There is no assistant-specific business logic in AIEF and no autonomous execution: the same prompt files drive every assistant, and a human is always in the loop.

---

## How to capture evidence

Fill in `changes/<id>/evidence.md` with what actually happened:

- **Summary** — what was done and when.
- **Activities Performed** — the concrete edits.
- **Verification** — the commands you ran and their real output (`npm test`, `aief verify`, link checks, etc.).
- **Findings / Risks / Recommendations** — what you learned.
- **Artifacts Produced** — files created or changed.

Evidence must reflect reality: if tests failed or a step was skipped, say so. Re-running `aief prompt` on a Change that already has real evidence instructs the assistant to **amend, not overwrite**.

---

## How to verify

```bash
aief verify
```

Checks that required files (`README.md`, `AGENTS.md`, `changes/`) exist and that every Change has non-empty `change.md`, `spec.md`, `tasks.md`, `evidence.md`. Open Changes show as *in progress*; it warns only when a **closed** Change has incomplete evidence. Result is `PASS` or `FAIL`. It writes nothing.

Run it before you close and before you commit.

---

## How to close

```bash
aief close            # dry run: reports readiness, writes nothing
aief close --yes      # marks the Change Closed in change.md — only when all checks pass
```

`close` checks files, tasks and evidence for the latest open (or `--change`-selected) Change. With `--yes` it writes a `## Status` → `Closed` section into `change.md`. No hidden state file — the Change files remain the only source of truth.

**Human review point:** closing is a decision, not a formality. Confirm the acceptance criteria are genuinely met before `--yes`.

---

## Common mistakes

- **Skipping the spec.** Assistants invent requirements when `spec.md` is thin. Write acceptance criteria first.
- **Not confirming the active Change.** In this pilot, duplicate Changes can be created silently and detected context does not auto-flow. Run `aief status` before working.
- **Trusting the prompt blindly.** The prompt may reference files that are missing; read it before pasting.
- **Treating assistant output as approved.** Review every diff. AI assists; humans decide.
- **Marking tasks done for an Analysis Change.** Tasks stay human-owned unless explicitly delegated.
- **Closing without real evidence.** `evidence.md` must record actual command output, not intentions.
- **Committing without verify.** Always `aief verify` (and your test suite) before commit.

## Required human review points

A human **must** review and decide at each of these:

1. **After adopt/analyze** — edit `knowledge/standards/` to match the real project; confirm the active Change.
2. **After enrich** — review the Normalized Requirement and Open Questions; a requirement source Change stays `Requires Human Review` until you clear it.
3. **Before implementation** — approve `change.md` scope and `spec.md` acceptance criteria.
4. **On every assistant diff** — review the actual code changes.
5. **Before close** — confirm acceptance criteria are met and evidence is honest.
6. **Before commit / push** — humans create commits and pushes; AIEF never does.

See [docs/DEVELOPER-CHECKLIST.md](DEVELOPER-CHECKLIST.md) for the one-page version.
