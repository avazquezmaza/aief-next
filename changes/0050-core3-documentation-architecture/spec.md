# Specification — Documentation Architecture and System Map (AIEF Core 3.0)

> **Note:** superseded in framing by `design.md`'s Information Architecture rewrite (Deliverables
> 1–10 of the refined commissioning instruction). The requirements below (DOC-R1–R34) reflect the
> original System Map-oriented scope and are preserved as historical context for this Change's own
> evolution; they are not the acceptance criteria for the current `design.md`. Treat `design.md` §16
> (Quality Gate) as the authoritative self-check for this Change's actual deliverables.

## Goal

A newcomer can answer, in under ten minutes, using no more than two or three documents: what AIEF
Core 3.0 is, how the full Change lifecycle flows, what its components are and are not responsible
for, what state the project is in, and which document to read next for their specific goal — without
this Change moving, deleting, or editing any existing file, and without any code, CLI, output, or
exit-code changing.

## Requirements

### Inventory

- **DOC-R1 — Every Markdown file in the repository is inventoried**, with path, approximate line
  count, and a one-line purpose derived from its actual content (title/intro/status marker), not its
  filename alone.
- **DOC-R2 — The inventory reports totals by top-level location** (root, `docs/`, `changes/`,
  `knowledge/`, `profiles/`, `adapters/`, `templates/`, `cli/templates/`, `starter-project/`,
  `examples/`, `specs/`, `releases/`, `reference-implementation/`) and by primary category.

### Classification

- **DOC-R3 — Every file is assigned exactly one primary category** from the ten defined in
  `design.md` §1 (Entry Point, Conceptual, Operational, Architecture Reference, Decision Record,
  Change Specification, Historical Evidence, Duplicate, Obsolete, Generated/Temporary) — a file with
  more than one plausible role is flagged explicitly, not silently assigned the first match.
- **DOC-R4 — A classification claim is falsifiable**: it cites the specific content (a quoted line, a
  grep result, a cross-reference) that justifies it, not an assumption from the file's name or
  location.

### Duplicate and obsolescence detection

- **DOC-R5 — Semantic duplicates are identified**, not only textual ones — two files describing the
  same concept for the same audience, even with different wording, are flagged as competing.
- **DOC-R6 — Obsolescence is determined by comparing content against the real, implemented state
  through Entrega 7** — a file is flagged obsolete only when it asserts something the current CLI/
  architecture contradicts or omits, cited concretely (e.g., a missing flag, a stale status claim),
  never merely "old."
- **DOC-R7 — Every duplicate/obsolete finding recommends one disposition** from the fixed vocabulary
  (`keep as historical`, `mark deprecated`, `merge`, `replace with redirect`, `move to archive`,
  `delete`) — `delete` requires an explicit, stronger justification than the others (DOC-R19).

### Hierarchy and entry point

- **DOC-R8 — A two-layer model is defined**: Orientation (short, stable, onboarding-facing) and
  Detail/Evidence (`changes/`, `knowledge/`, `reference/`, historical material) — every existing file
  is mapped to one layer, without being physically moved by this Change.
- **DOC-R9 — Exactly one document is designated the primary entry point** for a newcomer; every other
  candidate entry point (`README.md`, `NAVIGATOR.md`, `docs/index.md`, `docs/aief-2.0/README.md`) has
  its relationship to it stated explicitly (superseded, complementary, or redirect).
- **DOC-R10 — Every entry-point document has a defined audience** (new integrant, CLI user,
  implementer, architect, reviewer, auditor) stated in the design, not left implicit.

### System Map

- **DOC-R11 — A System Map design is produced**, capped at the ten sections listed in the
  commissioning instruction, that never reproduces a spec's requirement list, an ADR's full text, or
  a contract's field-by-field definition — it summarizes and links to the authoritative source.
- **DOC-R12 — The System Map's name is justified** against at least one alternative, not assumed.
- **DOC-R13 — The System Map includes accurate delivery status** for all seven closed Entregas plus
  Entrega 8 (Review) marked explicitly as future/not started.
- **DOC-R14 — The System Map includes one complete, real, worked Change example** (creation through
  closure), citing an actual Change directory, not a hypothetical one.

### Diagrams

- **DOC-R15 — A workflow diagram** shows the complete lifecycle from request through Change closure,
  including the FAIL/INCOMPLETE → correct → re-verify loop, with Review explicitly labeled as
  Entrega 8 (not yet built).
- **DOC-R16 — A component diagram** lists every Core 3.0 component (CLI, Change, WorkflowService, SDD
  Provider, Skills Runtime, Hooks Runtime, Structural Verification, Requirement Verification, future
  Review) each with one "receives," one "produces," and one "cannot do" statement.
- **DOC-R17 — An authority diagram** distinguishes Workflow's question ("can this advance?"),
  Verification's question ("does verifiable evidence exist?"), Review's question ("what should a
  human know?" — future), and Human Approval/Close's question ("is this accepted, and is closure
  recorded?") as four separate authorities, never conflated.

### Reading map and glossary

- **DOC-R18 — A reading map exists for at least these five intents/audiences**: understand the
  project, use the CLI, understand the workflow, understand the architecture, know a decision,
  implement a Change, verify an Entrega, review history — each resolving to a named, existing (or
  designed) document, not a vague pointer.
- **DOC-R19 — A minimal glossary is defined** covering at minimum: Change, Workflow, Gate, SDD
  Provider, Skill (Catalog and Runtime, distinguished), Hook, Structural Verification, Requirement
  Verification, Review (future), Human Approval, Close.

### Change and ADR treatment

- **DOC-R20 — No Change artifact (`change.md`/`proposal.md`/`spec.md`/`design.md`/`tasks.md`/
  `verification.md`/`evidence.md`) is recommended for deletion, merge, or relocation out of
  `changes/`** — `changes/` remains the auditable historical record, unmoved.
- **DOC-R21 — A summarized Change index is designed** (id, title, Entrega, status, one-line
  objective) distinct from the full per-Change detail — the index is new; the Changes themselves are
  untouched.
- **DOC-R22 — No ADR is recommended for deletion.** A brief ADR index (id, status, title, Entrega,
  supersedes/superseded-by) is designed, without reproducing any ADR's Decision/Context/Consequences
  text.

### Historical preservation

- **DOC-R23 — Every file classified Historical Evidence remains reachable** — via the Change index or
  an explicit archive section — never silently dropped from any generated index.
- **DOC-R24 — A file's historical status is a presentation choice, not a deletion** — "historical"
  means "not part of the onboarding reading path," never "gone."

### Link validation and ownership

- **DOC-R25 — Every internal link inside a file this audit reads is checked for a plausible target**
  (the referenced path exists in the current tree) — broken links found are reported, not silently
  ignored, and no fix is applied in this Change.
- **DOC-R26 — Orphan documents are identified**: files with zero inbound links from any other
  Markdown file found during this audit's own reading.
- **DOC-R27 — Every main (Layer 1) document is assigned a conceptual owner** — the module,
  Entrega, or responsibility area it belongs to — so future changes know which document to update.

### Status markers

- **DOC-R28 — Every main document's designed status is one of**: `Current`, `Historical`, `Draft`,
  `Deprecated`, `Generated` — assigned explicitly in the design, not left to be inferred.

### No behavioral change

- **DOC-R29 — No implementation file is modified.** Zero diff lines in `cli/src/`, `cli/tests/`,
  `cli/bin/`.
- **DOC-R30 — No CLI output or exit code changes.** `aief verify`/every other command's real output
  is unaffected — nothing in this Change is executed by the CLI at all.
- **DOC-R31 — All 534 tests from Entrega 7 continue passing**, unrun and unaffected, since no test
  file is touched.
- **DOC-R32 — The repository remains clean** (`git status --porcelain`) aside from this Change's own
  seven new files.

### Rollback and approval

- **DOC-R33 — Every recommended action in the future implementation plan is independently
  reversible** — a `git revert` or a manual undo restores the prior state for that step alone, without
  requiring the other steps to be undone too.
- **DOC-R34 — Human approval gates are named explicitly** — accept/amend/reject this plan;
  approve each future implementation stage separately before it executes; no stage auto-proceeds to
  the next.

## Acceptance Criteria

- [ ] DOC-R1–R2 (inventory): all 382 files counted, by location and category, with per-file purpose
      derived from real content.
- [ ] DOC-R3–R4 (classification): every file in exactly one primary category, ambiguous cases
      flagged, every claim cited.
- [ ] DOC-R5–R7 (duplicates/obsolescence): semantic duplicates found; obsolescence grounded in a
      concrete contradiction with Entrega-7 reality; every finding has one disposition.
- [ ] DOC-R8–R10 (hierarchy/entry point): two-layer model defined; one designated entry point;
      relationship of every competing candidate stated; audiences defined.
- [ ] DOC-R11–R14 (System Map): capped, non-duplicating design; justified name; accurate Entrega
      status; one real worked example.
- [ ] DOC-R15–R17 (diagrams): workflow (with FAIL/INCOMPLETE loop and Review-as-future), component
      (receives/produces/cannot), authority (Workflow/Verification/Review/Human Approval distinct).
- [ ] DOC-R18–R19 (reading map/glossary): five-plus audience paths resolved to real documents; ten
      concepts defined.
- [ ] DOC-R20–R22 (Change/ADR treatment): zero deletions recommended; Change index and ADR index
      designed without reproducing full content.
- [ ] DOC-R23–R24 (historical preservation): every historical file reachable; historical ≠ deleted.
- [ ] DOC-R25–R27 (links/ownership): links checked; orphans identified; every Layer 1 doc has an
      owner.
- [ ] DOC-R28 (status markers): every main document has one of the five defined statuses.
- [ ] DOC-R29–R32 (no behavioral change): zero code/test diff; zero CLI/output/exit-code change;
      534 tests unaffected; repo clean except this Change's own files.
- [ ] DOC-R33–R34 (rollback/approval): every future stage independently reversible; every approval
      gate named.
- [ ] (human) Approve this plan, or amend/reject it.
- [ ] (human) Approve each future implementation stage separately before execution.
