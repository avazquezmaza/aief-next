# Change

## ID

`0040-agents-md-canonical-source`

## Type

Implementation

## Objective

**Fix a current bug**, not a redesign step: `AGENTS.md` exists in **four divergent variants**, and the one an adopted project actually receives is the poorest of them — 7 of ~40 canonical normative statements, with **none** of the human-gate governance.

ADR-004 says "`AGENTS.md` holds the universal collaboration rules". Today that is true of AIEF's own repository and false of every project AIEF adopts. **ADR-004 is violated in practice.**

Scope: one canonical source, every adoption path generating it, tests proving it. Nothing else.

## The four variants

| # | Location | Lines | Delivered to an adopted project? |
|---|---|--:|---|
| 1 | `AGENTS.md` (root) | 170 | **No** — never leaves AIEF's repo |
| 2 | `starter-project/AGENTS.md` | 35 | No — static sample |
| 3 | `templates/project/AGENTS.md` | 10 | No — **never read by the CLI** |
| 4 | **inline string in `runAdoption()`** (`cli/src/cli.js:530`) | **14** | **Yes — this is the only one that ships** |

## Scope

### In scope

- Identify the four variants and diff them rule by rule (see [spec.md](spec.md)).
- Define **one canonical source**, distributable with the CLI package.
- Make every adoption path generate that exact content.
- Remove the divergent **inline string** in `runAdoption()`.
- Preserve every rule currently in force.
- Incorporate missing rules from the more complete variants — **and the unique rule that exists only in the poorest one** (the assistant-file pointer).
- Tests comparing generated output against the canonical source.
- Validate `aief adopt` on a temporary project.
- Demonstrate the adopted project receives 100% of the canonical rules.

### Out of scope

- **Any other onboarding change.** README, navigator, Getting-Started: untouched.
- Deleting `starter-project/` or `templates/project/` — their disposition belongs to the DELETE review (Change 0041) and the cluster work. This Change makes them inert, not absent.
- Removing `Understand -> Plan -> Build -> Verify -> Document` from AGENTS.md. It contradicts ADR-011 and is marked DELETE in Change 0038 — **that is a concept change, and folding it in here would smuggle the general simplification into a bug fix.**
- Tracks, Type derivation, the DELETE column.
- Modifying OpenSpec or SpecBoot.

## Success Criteria

- Exactly one canonical `AGENTS.md` source exists.
- `aief adopt` on a clean directory produces content byte-identical to it.
- A test fails if any copy or generator drifts from canonical.
- No rule currently in force is lost — demonstrated by the rule matrix, not asserted.
- The adopted project receives the human-gate governance it has never received.

## Status

Open

Implementation executed 2026-07-17 (human-approved): one canonical source; every adoption path delivers 100% of the approved rules; 128/128 tests pass; `aief verify` global PASS; zero deletions, zero renames. The Change stays **Open** because one `(review)` gate remains — independent review of the merged canonical content. See [evidence.md](evidence.md).
