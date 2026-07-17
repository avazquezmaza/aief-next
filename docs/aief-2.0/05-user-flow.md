# 5 · User flow

> Deliverable 6, plus the usability validation (§4). Designed from the experience, not the architecture.

## 1. The person this is designed for

Someone who has **never** heard of ADR, OpenSpec, SpecBoot, governance, dogfooding or Flux Portal. They have a repository and a task. They have 15 minutes and no patience for a decision tree.

**Design constraint:** they must never be asked a question they cannot answer from what they already know about their own work. "Do you want AIEF + OpenSpec + SpecBoot?" fails this test. "Are you fixing a bug or migrating a system?" passes.

## 2. The first 15 minutes

```console
$ npx aief

AIEF · trk-orchestrator-portal
Next.js · TypeScript · Postgres — detected from package.json

AIEF governs your work: one folder per change, one file of evidence.
Nothing else is created unless your work needs it.

  What are you about to do?    [describe it in one line]
> fix the tenant filter on the executions list

  Is this a bug fix, a new capability, or a system migration?
> bug fix

✓ changes/0014-tenant-filter-executions/change.md   (basic — 1 file)
✓ .github/workflows/aief-verify.yml                 (governance runs on every push)

Next:
  aief prompt          → a brief for your assistant
  aief                 → whenever you're unsure

$ aief prompt | pbcopy      # paste into Claude, Gemini, Codex or Cursor
...work happens...

$ aief
  Change 0014 (basic) — evidence is empty.
  Write what you changed and how you checked it: changes/0014-.../change.md

$ aief
  Change 0014 (basic) — ready.
Next:
  aief close --change 0014-tenant-filter-executions
```

**Elapsed: under 5 minutes. Two questions. One file. Zero documentation.**

Compare to today: clone, `npm install && npm link`, read a 12,145-character README, run a Todo example, pick one of 90 documented paths, fill three empty scaffolds.

### The four things that make this work

1. **`npx`, not clone + link.** Installation is not onboarding. ([02 §5](02-current-map.md#5-the-onboarding-maze) counts 5 minutes lost before AIEF has said anything useful.)
2. **Detection replaces interrogation.** AIEF already detects the stack ([ADR-007](../../knowledge/decisions.md)) — it must stop asking what it can see. The OS question and the assistant question in today's decision tree are both answerable from the environment.
3. **Two questions, both about the work.** Not about tooling, not about roles, not about spec formats.
4. **The gate is installed before it is needed, and never mentioned again.** Law 3. The user does not learn what CI governance is; they experience it when they break something.

## 3. The six steps, mapped to today's commands

The brief's flow, with every step's owner. This mapping is what makes the flow compatible with [ADR-011](../../knowledge/decisions.md)'s three levels rather than a fifth competing phrasing — see the reconciliation requirement in [03 §5.2](03-proposed-map.md#52-adr-011-three-level-workflow--needs-superseding-or-the-6-step-flow-must-not-ship).

| Step | Question it answers | Owner | Today | Track: basic |
|---|---|---|---|---|
| **INTAKE** | What are we doing? | Human | `new-change` / `analyze` / `enrich` / `propose` | 1 question |
| **CONTEXT** | What's true here? | AIEF | `doctor` / `adopt` / `analyze` | Automatic (detected) |
| **PLAN** | How will we do it? | Assistant | `prompt` (+ OpenSpec) | **Skipped** |
| **IMPLEMENT** | Do it | Assistant + human | *(AIEF absent — correctly)* | The work |
| **VERIFY** | Is it right? | AIEF + human | `verify` | Evidence non-empty |
| **CLOSE** | Is it done? | Human | `close` | 1 command |

Two observations the mapping makes visible:

- **INTAKE has four commands today.** `new-change`, `analyze`, `enrich`, `propose` are four doors into the same step, three of which had zero observed use. This is [02 §6](02-current-map.md#6-duplication)'s duplication, at the exact moment a new user meets AIEF.
- **PLAN is optional and 1.x doesn't know it.** For a bug fix there is nothing to plan, yet `spec.md` and `tasks.md` are created unconditionally. Flux Portal's authors discovered this on their own and stopped writing specs at Change 0008.

## 4. Usability validation

The brief is explicit: do not measure whether the framework *works* — Flux Portal already proved it does. Measure whether it can be **used**.

### 4.1 The metrics

| # | Metric | How to measure | 1.x (derived) | 2.0 target |
|---|---|---|---|---|
| M1 | **Time to first useful action** | Stopwatch: shell open → first Change exists | ~45–60 min | **< 5 min** |
| M2 | **Time to first governed close** | Stopwatch: shell open → `close` succeeds | unmeasured | **< 15 min** |
| M3 | **Mandatory artifacts** | Count files the tool requires | 4 | **1** (basic) |
| M4 | **Decisions before code** | Count questions with no default | ~90 paths | **2** |
| M5 | **Doc consultation points** | Count times the user must leave the terminal | ≥ 3 (README, navigator, workflow) | **0** |
| M6 | **Flow clarity** | Unprompted, can they name the next step? | unmeasured | **> 80%** |
| M7 | **Vocabulary tax** | Concepts needed before first close | 8+ | **2** |
| M8 | **Governance survival** | Is the tool still running at day 14? | **No — day 0** | **Yes** |

**M8 is the only metric that would have caught the real failure.** Every other measure would have scored AIEF 1.x as a success on Flux Portal: adoption worked, detection was correct, the workflow completed, the migration shipped. And the tool was dead within a day.

### 4.2 The test

Five developers who have never seen AIEF. A real repository. One instruction: *"Make this change, governed by AIEF."* No help, no reading, observers silent.

Record: M1, M2, every question asked aloud, every doc opened, every abandonment. A question asked aloud is a design defect — the tool should have answered it.

### 4.3 The honest gap

**None of these have been measured, including the 1.x column.** ~45–60 min is derived from counting the documented steps, not from watching anyone. Publishing derived numbers as if they were observations would be exactly the failure this study accuses AIEF of — [Law 5](01-vision.md#law-5--when-the-truth-cannot-be-determined-fail-loudly), applied to itself.

The first roadmap stage that touches UX should run §4.2 against **1.x first**, to get a real baseline. Otherwise 2.0 will be measured against a number this document invented.
