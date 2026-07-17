# Specification

## Goal

One canonical `AGENTS.md`. Every adoption path generates it byte-for-byte. A test fails if anything drifts. The adopted project receives 100% of the rules — including the human gates it has never received.

## 1. The rule matrix — what an adopted project actually gets

Canonical = root `AGENTS.md` (170 lines). Delivered = the inline string in `runAdoption()` (14 lines) — **the only variant that ships**.

| Canonical rule / section | Root (1) | starter (2) | templates (3) | **adopt (4)** |
|---|:-:|:-:|:-:|:-:|
| **Prime Directive** — AI assists, humans decide | ✓ | ✓ | ✗ | partial — the sentence, not the rule |
| *…never treat AI output as automatically approved* | ✓ | ✗ | ✗ | **✗** |
| *…the human owner is responsible for final decisions* | ✓ | ✗ | ✗ | **✗** |
| R1 Read the relevant Change before editing | ✓ | ✓ | ✓ | ✓ |
| R2 Read `spec.md` before implementation | ✓ | ✓ | ≈ | ✓ |
| R3 Read `tasks.md` before changing files | ✓ | ✓ | ✗ | ✓ |
| R4 Do not invent requirements | ✓ | ✓ | ✗ | **✗** |
| R5 Ask when requirements are ambiguous | ✓ | ✓ | ✗ | **✗** |
| R6 Keep changes small and reviewable | ✓ | ✓ | ✓ | ✓ |
| R7 Do not modify unrelated files | ✓ | ✓ | ✗ | ✓ |
| R8 Update documentation when behavior changes | ✓ | ✓ | ✗ | **✗** |
| R9 Generate evidence before work is complete | ✓ | ✓ | ✓ | ✓ |
| R10 Prefer simple solutions over clever ones | ✓ | ✗ | ✗ | **✗** |
| **AIEF Workflow** (5 phases + detail) | ✓ | partial | ✗ | **✗** |
| **Working with Changes** (change/spec/tasks/evidence) | ✓ | ✗ | ✗ | **✗** |
| **Tasks and gates — `(human)` / `(review)` labels** | ✓ | ✗ | ✗ | **✗** |
| *…both stay blocking for `aief close`* | ✓ | ✗ | ✗ | **✗** |
| *…pointer to governance-conventions* | ✓ | ✗ | ✗ | **✗** |
| **Required Completion Checklist** (7 items) | ✓ | partial (5) | ✗ | **✗** |
| **Coding Guidance** (6 rules) | ✓ | ✗ | ✗ | **✗** |
| **Documentation Guidance** | ✓ | ✗ | ✗ | **✗** |
| **Evidence Guidance** (the 4 questions) | ✓ | ✗ | ✗ | **✗** |
| **Human Responsibilities** (approve scope, trade-offs, architecture, release) | ✓ | ✗ | ✗ | **✗** |
| *Assistant-file pointer (CLAUDE/GEMINI/CODEX/CURSOR)* | **✗** | ✗ | ✗ | **✓ — only here** |

**Result: an adopted project receives 7 of ~40 normative statements (~18%).**

Two findings the matrix makes unarguable:

1. **The human-gate governance never reaches an adopted project.** `(human)` / `(review)` labels — Change 0035's entire contribution, and the mechanism that makes closure meaningful — exist only in AIEF's own repo. Flux Portal's `AGENTS.md` says nothing about them. So does every future adopter's.
2. **The canonical is not a superset.** The assistant-file pointer exists *only* in the 14-line stub. Merging "from the most complete variant down" would silently delete a live rule. The merge must go **both ways**.

## Requirements

- **R1** — Exactly one canonical source of `AGENTS.md` content.
- **R2** — It must be distributable with the CLI package. `cli/src/cli.js` cannot read `../AGENTS.md` once installed from npm; the canonical must live under `cli/`.
- **R3** — `runAdoption()` reads the canonical instead of holding an inline string.
- **R4** — Every rule in force today survives, including the assistant-file pointer.
- **R5** — Adopted projects receive the human-gate governance (`(human)` / `(review)` + the `aief close` consequence).
- **R6** — A test fails if any copy or generator drifts from canonical.
- **R7** — `aief adopt` validated on a temporary project; output compared byte-for-byte.
- **R8** — `adopt` remains idempotent and never overwrites an existing `AGENTS.md` (current guarantee, ADR-005).
- **R9** — No onboarding change beyond `AGENTS.md`.

## 2. Design

**Canonical location: `cli/templates/agents/AGENTS.md`** — beside `cli/templates/standards/` and `cli/templates/ci/`, the only two template directories the CLI actually reads. `cli/package.json` declares no `files` field, so everything under `cli/` ships.

**Root `AGENTS.md` becomes a byte-identical copy, enforced by a test.**

> **The honest trade-off.** This leaves *two* physical copies. The alternative — the CLI reading `../AGENTS.md` — breaks npm distribution (R2). A generated-at-pack-time copy adds a build step to a repo that has none. **Two copies with a test that fails on drift is not the same as four copies with nothing**: drift becomes impossible rather than merely undesirable. The alternatives are recorded so a reviewer can overrule this.

**Variants 2 and 3 become inert**, not deleted: after R3, neither is read by any adoption path. Their removal belongs to Change 0041 and the cluster work — deleting them here would fold the general simplification into a bug fix, which the approved order forbids.

## Acceptance Criteria

- [ ] `cli/templates/agents/AGENTS.md` exists and is the only canonical source.
- [ ] The inline `AGENTS.md` string in `runAdoption()` is gone.
- [ ] `runAdoption()` reads the canonical template.
- [ ] Root `AGENTS.md` is byte-identical to the canonical.
- [ ] Test: `readFile('AGENTS.md') === readFile('cli/templates/agents/AGENTS.md')` — fails on drift.
- [ ] Test: `aief adopt` in a temp dir produces `AGENTS.md` byte-identical to the canonical.
- [ ] Test: the generated file contains the `(human)` and `(review)` labels and the `aief close` consequence.
- [ ] Test: the generated file contains the assistant-file pointer (the rule that exists only in variant 4).
- [ ] Test: every one of the ~40 matrix rows is present in the generated output.
- [ ] Test: `adopt` on a directory with an existing `AGENTS.md` still does not overwrite it.
- [ ] Manual: `aief adopt` on a temporary project; diff generated vs canonical = empty.
- [ ] Demonstrated: an adopted project receives 100% of canonical rules (was ~18%).
- [ ] `git diff --stat` touches only: `cli/src/cli.js`, `cli/templates/agents/AGENTS.md`, `cli/tests/*`, and `AGENTS.md` if it changes.
- [ ] No file deleted or renamed.
- [ ] `Understand -> Plan -> Build` is **still present** — its removal is Change 0038's concept cluster, not this Change.
- [ ] (human) Approve execution — this edits `runAdoption()`, a core adoption path.
- [ ] (review) Independent review of the merged canonical content before it ships to adopters.
