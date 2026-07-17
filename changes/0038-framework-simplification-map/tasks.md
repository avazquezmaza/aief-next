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

- [ ] (human) Approve the map, or amend verdicts before any removal.
- [ ] (human) Decide `## Type` → Track — the highest-risk item; it changes real CLI behavior.
- [ ] (human) Decide the remaining five items in spec §6.
- [ ] (review) Independent review of the DELETE column by someone other than its author.

## Deferred

- [-] Execution of any removal — a separate Change, blocked on the human gates above.
- [-] Re-pointing active inbound references (`README.md` → NAVIGATOR, `cli.js:692` → Navigator, `docs/index.md` → `specs/`) — belongs to the execution Change.
- [-] Change 0036's F1/F2/F3 work remains **uncommitted** in the working tree (flagged in Change 0037; out of scope by instruction).
