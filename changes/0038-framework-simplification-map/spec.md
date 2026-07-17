# Specification — The classification map

## Goal

Every AIEF document, command and concept carries exactly one verdict — **KEEP / MERGE / ARCHIVE / DELETE** — with its replacement and capability check recorded, so that removal becomes a mechanical, reviewable act rather than a judgement call made later under time pressure.

**This Change removes nothing.**

## What the four verdicts mean

| Verdict | Meaning | Reversible? |
|---|---|---|
| **KEEP** | Stays on the active path. | — |
| **MERGE** | Content folds into a named target; the file stops existing; **no information is lost**. | Via git |
| **ARCHIVE** | Moves to `docs/archive/`. Out of the index and the main path; still browsable and citable. For evidentiary or historical value. | Trivially |
| **DELETE** | Removed from the working tree. Only when the content is duplicated elsewhere, dead, or self-declared superseded. | Via git history |

**On DELETE vs ARCHIVE.** Everything is in git, so neither verdict destroys anything — the real difference is **findability**. ARCHIVE is for content someone may legitimately need to cite (evidence, historical evaluations). DELETE is for content whose continued existence is a liability (duplicates that drift, corpses that mislead).

## Rules the map obeys

1. **Nothing is executed here.** The map is the spec; removal is a later, separately approved Change.
2. **Closed Changes are never rewritten.** `changes/0001`–`0035` cite `starter-project/`, `templates/change/` and `docs/navigator/`. Those citations are **historical records of what was true then**, not live dependencies. A closed Change pointing at a removed file is correct and must not be "fixed".
3. **Active citations must be re-pointed before removal.** Per [F5](../../docs/dogfooding-findings.md) — Flux Portal's Change 0002 was cited normatively by three ADRs, and archiving it would have broken them. Every removal candidate below lists its live inbound references.
4. **Removals requiring a code change are flagged** ⚙.
5. **No new files.** Every MERGE target already exists, except `docs/archive/` (a location, not a document).

---

# 1 · Documents

## 1.1 Root (12 items)

| Item | Lines | Verdict | Replacement / destination | Capability check |
|---|--:|:-:|---|---|
| `AGENTS.md` | 170 | **KEEP** | — | **Becomes the single canonical version** and is delivered to adopted projects. Today ADR-004 is violated in practice: 4 divergent copies exist and adopters receive the 14-line stub. |
| `README.md` | 208 | **KEEP** | — | **Becomes the one entry point.** Absorbs the onboarding cluster (§1.2). |
| `CLAUDE.md` / `GEMINI.md` / `CODEX.md` / `CURSOR.md` | 44 | **KEEP** | — | Thin pointers, 11 lines each. ADR-004 requires exactly this shape. Nothing to gain by touching them. |
| `CHANGELOG.md` | 25 | **KEEP** | — | Release history. ADR-009 (`progress/history.md` ≈ git log + CHANGELOG). |
| `NAVIGATOR.md` | 16 | **DELETE** ⚙ | `README.md` | A 16-line pointer to `docs/navigator/` (deleted, §1.4). Duplicate entry point #2 of 7. Live refs: `README.md`, **`cli/src/cli.js:692`** (`status` reports Navigator as an adoption artifact). |
| `CONTRIBUTING.md` | 2 | **MERGE** → `README.md` | `README.md` | A 2-line stub. Two lines do not need a file. *(Note: GitHub surfaces `CONTRIBUTING.md` in the PR UI — if that affordance is wanted, this becomes KEEP. Low stakes either way.)* |
| `CODE_OF_CONDUCT.md` · `SECURITY.md` · `SUPPORT.md` | 58 | **KEEP** | — | GitHub community-health files. Standard, expected locations; not part of AIEF's surface. |
| `LICENSE` | — | **KEEP** | — | — |

## 1.2 The onboarding cluster — 7 doors become 1

**This is where the 15-minute criterion is won or lost.** Every file below teaches the same first hour, differently.

| Item | Lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `docs/Getting-Started.md` | 55 | **MERGE** | `README.md` | Install → init → first Change → prompt → verify → close. This *is* the main flow; it belongs at the entry, not one click away. |
| `docs/first-30-minutes.md` | 32 | **MERGE** | `README.md` | Same content, numbered 1–10. Its own title contradicts the 15-minute goal. |
| `docs/learning-path.md` | 57 | **MERGE** | `README.md` | Same content again, framed as a curriculum. Step 1 is "Read the README" — a document whose first instruction is to read the entry point is not an entry point. |
| `docs/index.md` | 54 | **DELETE** | `README.md` | An index for a doc set shrinking 56 → 10. Its "Start Here" heading offers **five** starts — the maze, in one screen. Sole live ref to `specs/` (§2.4). |
| `docs/mental-model.md` | 78 | **MERGE** | `docs/Workflow.md` | "What do I read/run/edit/avoid" — the workflow, from the user's side. Workflow.md is canonical (ADR-011). |
| `docs/choosing-your-workflow.md` | 54 | **MERGE** | Tracks ([06-profiles](../../docs/aief-2.0/06-profiles.md)) | **This is the ancestor of Tracks.** Small / medium / larger project = Basic / Standard / Migration, without the risk framing. Merging it *is* the design rule working: Tracks must absorb it, not sit beside it. |
| `docs/FAQ.md` | 25 | **MERGE** | `README.md` | 6 questions, all answered by README + Workflow. |
| `docs/DEVELOPER-CHECKLIST.md` | 43 | **MERGE** | `AGENTS.md` | AGENTS.md already has "Required Completion Checklist". Two checklists, one job. |
| `docs/TEAM-USAGE-GUIDE.md` | 214 | **MERGE** | `README.md` (what/when) + `docs/cli.md` (how-to) | The largest doc in the repo, and a near-complete restatement of README + cli.md + Workflow. |
| `docs/bootstrap.md` | 85 | **MERGE** | `docs/cli.md` | Install / `doctor` / `init` detail = command reference. |
| `docs/migration-guide.md` | 60 | **MERGE** | `docs/cli.md` | **Naming collision:** this is about *adopting an existing project*, not the Migration Track. Merging kills the collision the Track vocabulary would otherwise inherit. |
| `cli/README.md` | 79 | **MERGE** | `docs/cli.md` | Third copy of the command reference (after `docs/cli.md` and `aief help`). |
| **`docs/cli.md`** | 88 | **KEEP** | — | **The one command reference.** Absorbs the six above. |

**Result: 11 documents (872 lines) → 2 destinations.** No capability lost: every command, step and guarantee survives in `README.md` (what/when) or `docs/cli.md` (how).

## 1.3 The product cluster

| Item | Lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `docs/VISION.md` | 47 | **KEEP** | — | At execution, `docs/aief-2.0/01-vision.md` **merges into it** — the study replaces it rather than sitting beside it (ADR-013). |
| `docs/architecture.md` | 146 | **KEEP** | — | The implemented architecture. Absorbs the three below. |
| `docs/principles.md` | 57 | **MERGE** | `docs/architecture.md` | 9 principles, each a rendered view of an ADR. `knowledge/decisions.md` is the source; this is a projection that can drift from it. |
| `docs/domain-model.md` | 189 | **MERGE** | `docs/architecture.md` | Keep §1 Ubiquitous Language **verbatim** — it is the glossary that adjudicates Role vs Track and it becomes *more* load-bearing, not less. §§2–7 restate architecture.md and ADRs. |
| `docs/ecosystem.md` | 69 | **MERGE** | `docs/architecture.md` | The responsibility matrix exists **three times**: here, `Workflow.md §Responsibilities`, and `architecture.md`. One copy survives. |
| `docs/Vision-and-Principles.md` | 8 | **DELETE** | `VISION.md` + `principles.md` | Self-declared tombstone: *"Do not add content here."* |

## 1.4 Workflow, navigator, governance

| Item | Lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `docs/Workflow.md` | 159 | **KEEP** | — | Canonical flow (ADR-011). Absorbs `lifecycle.md` + `mental-model.md`. **Open decision:** whether the 6-step flow supersedes the 3 levels ([03 §5.2](../../docs/aief-2.0/03-proposed-map.md)). |
| `docs/lifecycle.md` | 93 | **MERGE** | `docs/Workflow.md` | Stages with responsible component + the knowledge loop. Same flow, second telling. |
| `docs/project-lifecycle.md` | 5 | **DELETE** | `lifecycle.md` | Self-declared tombstone. |
| `docs/tooling.md` | 5 | **DELETE** | `ecosystem.md` | Self-declared tombstone. |
| **`docs/navigator/` (22 files)** | **931** | **DELETE** ⚙ | `README.md` + `docs/cli.md` | **The single largest removal.** 2 × 3 × 3 × 5 = **90 documented paths before writing code**; the design's direct contradiction. Its content: install-by-OS (3 files — `npm install` is the same everywhere and `doctor` already reports the environment), tooling combos (5 — replaced by "OpenSpec appears when a contract exists"), assistant paths (1 — `aief prompt <assistant>`), diagrams (7 — Workflow.md carries the canonical mermaid). Live refs: `NAVIGATOR.md`, `docs/index.md`, **`cli/src/cli.js:692`**. |
| `docs/governance-conventions.md` | 154 | **KEEP** | — | ADVANCED conventions (gates, `[-]`, increments, checkpoints). Evidence-backed, post-dates Flux, unvalidated in use — but it is the only home for what Flux hand-built. |
| `docs/ci-gate.md` | 75 | **MERGE** | `docs/cli.md` | F2's mechanism. CORE behavior (Law 3), but it is command documentation. |
| `docs/requirement-sources.md` | 73 | **KEEP** | — | ADVANCED. Absorbs `enrichment-workflow.md`. |
| `docs/enrichment-workflow.md` | 79 | **MERGE** | `docs/requirement-sources.md` | Two documents for one ADVANCED feature with 0 observed uses. |

## 1.5 Evidence and status

| Item | Lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `docs/dogfooding-findings.md` | 130 | **KEEP** | — | The findings ledger. The most valuable document in the repo. |
| `docs/VALIDATION-SUMMARY.md` | 97 | **MERGE** | `docs/dogfooding-findings.md` | **Two evidence ledgers is one too many.** Its findings ("the parts are strong; the seams are weak") are load-bearing and must survive verbatim as ledger rows. |
| `docs/AIEF-1.0-READINESS.md` | 62 | **KEEP** | — | **Load-bearing.** It withholds approval for autonomous execution — cited by `external-harness-patterns.md` as the reason to reject agent runtimes. Do not touch. |
| `docs/roadmap.md` | 42 | **MERGE** | single roadmap | **Three roadmap documents is itself a finding.** |
| `docs/ROADMAP-TO-1.0.md` | 49 | **MERGE** | single roadmap | Workstreams gating 1.0. Reconcile with `docs/aief-2.0/11-roadmap.md`; keep whichever survives the redesign decision. |
| `docs/external-harness-patterns.md` | 107 | **ARCHIVE** | `docs/archive/` | A one-time evaluation with a decision table. Its verdicts are recorded; the evaluation itself is not on anyone's path. **Cites AIEF-1.0-READINESS — check before moving.** |
| `docs/runtime-governance-open-questions.md` | 115 | **ARCHIVE** | `docs/archive/` | 3 open questions; Q2 (Tasks vs Gates) was **answered** by Change 0035. Partially superseded, historically useful. |
| `docs/proposals/f4-adr-openspec-declaration.md` | 115 | **KEEP** | — | **Active proposal** — Stage 4 of the roadmap. |
| `docs/aief-2.0/` (12 files) | 1347 | **KEEP → ARCHIVE** | `docs/archive/` once executed | The design study. Archive when its roadmap is executed or rejected; a study that outlives its decision becomes a competing account of the product. |

**docs/ result: 56 files → 10 active** (+ ~3 archived, + the 2.0 study until executed).

---

# 2 · Templates, examples, scaffolds

## 2.1 The dead templates — a divergence, not just clutter

**The CLI generates every Change file from hardcoded strings inside `cli.js`** (`genericChangeFiles()`, `analysisChangeFiles()`). It reads templates from disk **only** for `standards/` and `ci/`.

```bash
grep -n readFileSync cli/src/cli.js   # -> standards, CI, package.json. Nothing else.
```

So the templates the documentation points people to are **not** the templates the tool produces. Follow the docs and you get a different Change shape than the tool creates. This is F1's failure class at the template layer: two accounts of reality, one silently wrong.

| Item | Files / lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `templates/change/*.md` | 4 / 120 | **MERGE** ⚙ | `cli/templates/change/` | **The merge inverts the divergence**: move the documented shape into `cli/templates/change/` and have the CLI read it, killing both the root duplicate *and* the inline strings. One source. Live refs: `choosing-your-workflow.md`, `Getting-Started.md`, `mental-model.md`, `navigator/paths/aief-only.md` — all merged or deleted anyway. |
| `cli/templates/change/change.md` | 1 / 3 | **DELETE** | above | Contains `"# Change\n\nGenerated by AIEF CLI."`. Never read. |
| `cli/templates/project/README.md` | 1 / 3 | **DELETE** | — | Never read. |
| `templates/project/*` | 2 / 31 | **MERGE** | canonical `AGENTS.md` + adoption | `AGENTS.md` copy #3 of 4 (10 lines). Feeds the ADR-004 violation. |
| `templates/specboot/*` | 2 / 24 | **MERGE** | `adapters/specboot/README.md` | Concept mapping belongs with the adapter that explains it. |
| `templates/openspec/change/*` | 3 / 29 | **DELETE** | OpenSpec itself | **0 inbound references.** AIEF shipping copies of OpenSpec's templates violates the rule that AIEF never duplicates a contract artifact ([08-openspec](../../docs/aief-2.0/08-openspec.md)) and creates a fork to maintain (ADR-003). |
| `templates/change-types/analysis/evidence.md` | 1 / 37 | **DELETE** | `analysisChangeFiles()` in `cli.js` | **0 inbound references.** The CLI generates analysis evidence inline. Dead. |
| `cli/templates/standards/*.md` | 6 / 143 | **KEEP** | — | **Live** — the only templates read from disk. [09-specboot](../../docs/aief-2.0/09-specboot.md) proposes delegating to SpecBoot; gate = a second adoption leaving them unedited. **Untouched until then.** |
| `cli/templates/ci/aief-verify.yml` | 1 / 35 | **KEEP** | — | CORE. Law 3: without it, `verify` does not exist. |

## 2.2 Starter surfaces — 4 become 1

| Item | Files / lines | Verdict | Destination | Capability check |
|---|--:|:-:|---|---|
| `starter-project/` | 20 / 392 | **DELETE** ⚙ | `aief init` + `examples/todo-app` | **It is a static snapshot of what `aief init` generates — and it has already drifted.** Its `AGENTS.md` is 35 lines; `adopt` writes 14; the canonical is 170. The snapshot *is* the drift. `aief init` produces the structure live and correct. Live refs: `CHANGELOG.md`, `docs/navigator/new-project.md` (deleted). Closed Change 0002 references it — **historical, do not rewrite**. |
| `reference-implementation/` | 1 / 1 | **DELETE** | — | The file reads: `"Reference implementation placeholder."` **Zero inbound references** outside the 2.0 study. Dead since creation. |
| `examples/todo-app/` | 8 / 211 | **KEEP** | — | The one runnable example. 9 inbound refs. Real code, real tests, a real Change. |
| `examples/openspec-mapping/` | 5 / 101 | **MERGE** | `adapters/openspec/` | Duplicates `adapters/openspec/mapping.md`. Co-locate the example with the adapter that explains it. |

## 2.3 Adapters — 6 files become 2

| Item | Verdict | Destination | Capability check |
|---|:-:|---|---|
| `adapters/openspec/README.md` (79) | **KEEP** | — | Absorbs `mapping.md` + `workflow.md` + the mapping example. |
| `adapters/openspec/mapping.md` (59) | **MERGE** | `adapters/openspec/README.md` | — |
| `adapters/openspec/workflow.md` (47) | **MERGE** | `adapters/openspec/README.md` | Duplicates `Workflow.md` Level 2, which is canonical (ADR-011). |
| `adapters/specboot/README.md` (39) | **KEEP** | — | Absorbs the two below + `templates/specboot/`. |
| `adapters/specboot/mapping.md` (28) | **MERGE** | `adapters/specboot/README.md` | — |
| `adapters/specboot/workflow.md` (26) | **MERGE** | `adapters/specboot/README.md` | — |

## 2.4 Roles, knowledge, releases, specs

| Item | Verdict | Capability check |
|---|:-:|---|
| `profiles/` (11 files, 342) | **KEEP** | **Per instruction: Roles stay, and stay separate from Tracks.** The finding stands and is a *delivery* defect, not a content defect: adopted projects receive a README pointing at "the source AIEF repository", so the Roles never arrive. Fix delivery, not the files. ADR-012 implementation remains an open human decision. |
| `knowledge/decisions.md` (169) | **KEEP** | CORE. The ADR log. Gains ADR-013. |
| `knowledge/backlog.md` (7) | **KEEP** | Deferred items with their evidence gates. |
| `cli/src/skills-catalog.json` (160) | **KEEP** | ADR-007/010. Data, not engine. |
| `releases/` (3 files, 81) | **KEEP** | Release notes in the conventional location. |
| `specs/` (4 files, 147) | **ARCHIVE** | `docs/index.md` itself labels them *"Historical Reference (v1 conceptual specs) — Superseded as product description by architecture.md"*. Sole live ref is `docs/index.md` (deleted). Archived, not deleted: they are the record of what AIEF thought it was. |

---

# 3 · Commands — 15 become 10

| Command | Uses on Flux | Verdict | Replacement | Capability check |
|---|:-:|:-:|---|---|
| `doctor` | 1× | **KEEP** | — | Cheap, ran, worked. Absorbs the navigator's OS questions. |
| `adopt` | 1× | **KEEP** | — | The entry point (ADR-005). |
| `init` | 0× | **MERGE** → `adopt` | `aief adopt` | **Two names, one behavior.** `Workflow.md` says it outright: *"`aief init` without arguments — same guarantees, same logic"*. `init <name>` (new directory) survives as `adopt`'s argument. Nothing lost. |
| `analyze` | 1× | **KEEP** | — | Produced value once; brownfield discovery is a validated capability. |
| `new-change` | 0× after 0002 | **KEEP** | — | INTAKE. The remaining door. |
| `enrich` | 0× | **KEEP** | — | ADVANCED. Off the main path, reachable. Real capability (Jira/manual), no evidence to remove it. |
| `propose` | 0× | **DELETE** | `OpenSpec:` declaration + the assistant's slash commands | **The only DELETE that removes behavior, so it is argued in full.** `propose` does two things: (a) delegate to OpenSpec, (b) fall back to a local skeleton. (b) *is* `new-change`. (a) contradicts [08-openspec](../../docs/aief-2.0/08-openspec.md): AIEF references contracts, it does not wrap OpenSpec's CLI. Flux drove OpenSpec through assistant slash commands — ADR-011 Level 2 working as designed — and never touched `propose`. **What is genuinely lost:** the runtime contract check (`openspec --help` → does it support `propose`?) and its loud fallback. That check has never fired for a real user. **Gate: confirm no adopter uses it before removal.** |
| `prompt` | few | **KEEP** | — | Composes the brief. Highest-complexity component; the harness is its future shape. |
| `verify` | **0×** | **KEEP** | — | The validated differentiator. Never used, always right. |
| `close` | **0×** | **KEEP** | — | AIEF's second question. |
| `status` | 0× | **MERGE** → `aief` | `aief` (no args) | `status` answers *"what is the state?"*; the next-step engine answers *"what is the state, and what now?"*. The second strictly contains the first. ⚙ Its Navigator check (`cli.js:692`) dies with `docs/navigator/`. |
| `use-profile` | 0× | **DELETE** | `aief prompt --profile <role>` | Already exists and already works. `use-profile` is a second way to say it. Zero capability lost. |
| `release` | 0× | **DELETE** | `releases/` written by hand | 0 uses. `releases/` holds 3 hand-written files — the evidence says humans already do this. **Gate: confirm nobody's release process calls it.** |
| `help` | ? | **KEEP** | — | ADR-006. **Needs the ADR-006 amendment** (progressive teaching) — the goal is right; "explain everything every time" is what makes 15 commands feel like 15 commands. |
| `explain` | ? | **MERGE** → `help` | `aief help <command>` | `case "explain": help(rest[0])` — literally the same function. Two names, one behavior, in the source. |
| **`aief` (no args)** | — | **NEW** | — | **ADR-013 check — what it removes:** `status` (merged), the "what next?" hints scattered across every command's output, and the 7 entry points' job. It is the fix for the audit's central finding: *the CLI ran once because nothing ever told anyone to run it again.* **Net commands: 15 → 10.** |

**Result: `doctor · adopt · analyze · new-change · enrich · prompt · verify · close · help · aief`.**

---

# 4 · Concepts

| Concept | Verdict | Capability check |
|---|:-:|---|
| **Change** | **KEEP** | The one abstraction that survived contact with reality (13×). |
| **Evidence** | **KEEP** | The validated differentiator (3,655 hand-written lines). |
| **Track** (Basic/Standard/Migration) | **NEW — approved** | **ADR-013 check:** absorbs `choosing-your-workflow.md` (small/medium/large) **and `## Type`** (below). Does not enter beside them. **Still gated by Stage 1** ([06-profiles §4](../../docs/aief-2.0/06-profiles.md)) — approved conceptually ≠ built. |
| **`## Type`** (General / Analysis / Enrichment) | **MERGE** → Track ⚙ | **The design rule forces this into the open, and it is the map's most consequential finding.** A Change would otherwise carry *two* classification axes: `Type` (provenance) and `Track` (risk). Per ADR-013, Track may not enter beside Type. Resolution: `General` → the default Track; `Analysis` → a Track plus a stated purpose; `Enrichment` → the `Requirement Source:` line, **which already exists and already declares it**. ⚙ Real code depends on `changeType()` (prompt composition, enrichment's human-review gate on `close`) — **this merge needs its own design before execution and must not be done casually.** |
| **Role / Profile** | **KEEP** | Per instruction. Separate from Track, permanently. |
| **Skill** | **KEEP** | ADR-010/012. 0 observed reads; clean design; no evidence to remove. |
| **Standard** | **KEEP** | Gate for delegation to SpecBoot = n=2. Untouched. |
| **ADR** | **KEEP** | F4 promotes it to a declared line. Flux hand-built 7 and lost one. |
| **The 3 levels** (ADR-011) | **MERGE** → 6-step flow | Levels = *who owns*; steps = *when*. Compatible, but two canonical models recreate exactly the problem ADR-011 solved. **Needs an ADR.** |
| **`Understand → Plan → Build → Verify → Document`** | **DELETE** | In `AGENTS.md` + `starter-project/AGENTS.md`. A 5th workflow phrasing that contradicts ADR-011 — sitting in the file adopted projects actually read. |
| **Requirement Source** | **KEEP** | Absorbs Enrichment's provenance role (see `## Type`). |
| **Human / review gates** · **`[-]` deferred** · **Increments** · **Checkpoints** | **KEEP** | Change 0035. Exactly what Flux hand-built under deadline. |
| **Harness declaration** (0035 §4) | **KEEP** | Filed as an experiment; still labelled as one. |
| **The 11 harness slots** | **design only** | Not in core. Diagnostic, not backlog ([07-harness](../../docs/aief-2.0/07-harness.md)). |
| **Initiative · Parent/Child · contract hashes · traceability parser** | **out of scope** | Deferred, n=1. |

---

# 5 · Tally

| Verdict | Documents | Commands | Concepts |
|---|--:|--:|--:|
| **KEEP** | 21 | 8 | 11 |
| **MERGE** | 26 | 3 | 3 |
| **ARCHIVE** | 4 areas | 0 | 0 |
| **DELETE** | 53 files (incl. `navigator/` 22, `starter-project/` 20) | 3 | 1 |

**Documents: ~150 files → ~45 active.** `docs/`: **56 → 10**. Commands: **15 → 10**. Markdown:code ratio: **8:1 → ~3:1** — without deleting a single validated capability.

# 6 · What this map does not decide

Six decisions remain human, and three are newly forced by ADR-013:

1. **`## Type` → Track** — the merge the design rule forces. ⚙ Touches real behavior. **Highest-risk item on this map.**
2. **3 levels → 6 steps** — needs an ADR, or the flow stays a study artifact.
3. **ADR-006 amendment** — progressive teaching, or `help` stays verbose by decision.
4. **ADR-010** — do standards survive? Gate: n=2.
5. **ADR-012** — is the Role model implemented, or reconsidered? 0 uses.
6. **`propose` / `release` removal** — confirm no adopter depends on them.

## Acceptance Criteria

- [x] Every document, command and concept carries exactly one verdict.
- [x] Every MERGE names an existing destination.
- [x] Every ARCHIVE and DELETE states what replaces it, where the information lives, and why no capability is lost.
- [x] Every removal candidate lists its live inbound references.
- [x] Items requiring a code change are flagged ⚙.
- [x] Closed Changes are excluded from re-pointing, and the rule is stated.
- [x] Collisions forced by ADR-013 (`## Type` vs Track) are surfaced, not resolved silently.
- [x] Nothing is removed by this Change.
- [ ] (human) Approve the map, or amend verdicts.
- [ ] (human) Decide the six items in §6 — starting with `## Type` → Track.
- [ ] (review) Independent review of the DELETE column by someone other than its author.
