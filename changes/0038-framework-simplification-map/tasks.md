# Tasks

## Inventory

- [x] Enumerate every file in the repository (~150 artifacts, excluding closed Changes and `node_modules`).
- [x] Correct the initial inventory error: `docs/navigator/` is **22 files / 931 lines**, not 7 — the first glob missed `install/`, `paths/` and `diagrams/`.
- [x] Determine which templates the CLI actually reads (`grep -n readFileSync cli/src/cli.js`) → only `standards/` and `ci/`; all Change files are generated from inline strings.
- [x] Map inbound references for every removal candidate.
- [x] Identify couplings that make a removal a code change (`cli/src/cli.js:692` → Navigator).

## Classification

- [x] Define the four verdicts operationally, including the DELETE-vs-ARCHIVE distinction (findability, not preservation).
- [x] Classify root documents (12).
- [x] Classify `docs/` (56 files).
- [x] Classify templates (25 files across `templates/` and `cli/templates/`).
- [x] Classify starter surfaces, examples, adapters, profiles, knowledge, releases, specs.
- [x] Classify all 15 commands.
- [x] Classify all concepts.
- [x] Record the capability check for every non-KEEP item.
- [x] Surface the collisions ADR-013 forces (`## Type` vs Track; `migration-guide` vs Migration Track).

## Documentation

- [x] Record ADR-013 in `knowledge/decisions.md` (append to an existing file — no new document).
- [x] Keep the map inside this Change rather than adding a twelfth file to `docs/aief-2.0/`.

## Verification

- [x] Every artifact carries exactly one verdict.
- [x] Every MERGE target already exists.
- [x] `aief verify` passes on this Change.
- [x] Nothing removed, moved or renamed — this Change only creates `changes/0038-*/` and appends ADR-013.
- [x] Changes 0036 and 0037 untouched; OpenSpec and SpecBoot untouched.

## Evidence

- [x] Update evidence.md.

## Human gates

- [x] (human) Approve the map, or amend verdicts before any removal. **Ratified as a
  *classification* map, not a delete authorization — ADR-014 (2026-07-17).**
- [x] (human) Decide `## Type` → Track — the highest-risk item; it changes real CLI behavior.
  **Decided by Change 0039 (approved, as amended, 2026-09-01): renamed to Depth, not Track —
  `manifest.track` had independently claimed that word for the Workflow Engine.**
- [x] (human) Decide the remaining five items in spec §6 — all 6 decided as of 2026-09-01:
  - [x] 2. 3 levels → 6 steps — **ADR-033** (2026-09-01): the 6-step flow is now canonical.
  - [x] 3. ADR-006 amendment — **ADR-034** (2026-09-01): narrowed to progressive teaching.
  - [x] 4. ADR-010 (do standards survive?) — **ADR-035** (2026-09-01): reaffirmed, unamended.
  - [x] 5. ADR-012 (Role model, 0 uses) — **ADR-036** (2026-09-01): amended down to what shipped
    (a named role selector); the structured `goal`/`thinkingStyle`/etc. schema is dropped for
    lack of evidence anyone needed it. `profiles/` stays KEEP, `use-profile` corrected to
    **ARCHIVE** (not DELETE as this Change's own map first said — Change 0041's R7 found it not
    equivalent to `prompt --profile` and the only command that surfaces Role at all; ADR-036 was
    fixed to match). A separate, real bug ADR-036 flagged but did not fix: `aief adopt` never
    actually copies `profiles/*.md` into an adopted project (only `profiles/README.md`, pointing
    back at the source repo) — open candidate for a future Change.
  - [x] 6. `propose`/`release` removal — **Ratified by the project owner, 2026-09-01**:
    `propose` **KEEP** (R1, already human-confirmed 2026-07-17 — ADR-002, Change 0030, 9 tests).
    `release` and `use-profile` **ARCHIVE**, not DELETE (R7/R8) — `release`'s evidence is thin
    ("0 uses on one project"), and this project's own rule is doubt → ARCHIVE (ADR-014's
    discipline applied); `use-profile` is the sole Role-facing command while Role stays KEEP
    (ADR-036) — deleting it would be incoherent with that decision. Execution (demoting both from
    the main `help` listing) is separate, gated work — not performed by this ratification.
- [x] (review) Independent review of the DELETE column by someone other than its author.
  **Done by Change 0041**: second independent reader on R1–R6 (0 of 6 deletable) and a second
  reader for R10–R14 (4 of 5 consensus DELETE, R12 → ARCHIVE). Only execution of the approved
  DELETEs remains, and that is explicitly out of scope for this Change (see Deferred).

## Deferred

- [-] Execution of any removal — a separate Change, blocked on the human gates above.
- [-] Re-pointing active inbound references (`README.md` → NAVIGATOR, `cli.js:692` → Navigator, `docs/index.md` → `specs/`) — belongs to the execution Change.
- [-] Change 0036's F1/F2/F3 work remains **uncommitted** in the working tree (flagged in Change 0037; out of scope by instruction).
