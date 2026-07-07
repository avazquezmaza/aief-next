# Specification

## Goal

The repository explains the product correctly: a software architect can understand AIEF in under ten minutes, and a new developer can tell what AIEF is, what it is not, why it exists, and where OpenSpec, SpecBoot and AI assistants fit — all from documentation that reflects the implemented product and contradicts no accepted ADR.

## Requirements

- `README.md` answers: what is AIEF, why it exists, what problems it solves, what it does NOT do, relation to OpenSpec / SpecBoot / assistants, project lifecycle, install, bootstrap, executing a Change. Under ten minutes of reading.
- One canonical document per topic:
  - `docs/VISION.md` — vision, long-term goals, non-goals, design philosophy, why AIEF exists.
  - `docs/architecture.md` — implemented architecture with Mermaid diagrams: Workflow Engine, Prompt Engine, context composition, AGENTS, Profiles (honest implementation status), Standards, Skills, Evidence, Verify, Close.
  - `docs/ecosystem.md` — responsibility matrix (AIEF / OpenSpec / SpecBoot / assistant / source code / humans) and how each relationship works.
  - `docs/principles.md` — every architectural principle with its why and the ADRs that embody it.
  - `docs/lifecycle.md` — Bootstrap → Adopt → Analyze → Change → Prompt → Implement → Verify → Close, each stage with responsible component, inputs and outputs.
- Superseded documents become pointers to the canonical ones (no duplicated sources of truth, no broken links).
- All pre-CLI-era documents updated to the implemented CLI flow; command examples consistent with the Bootstrap Experience (root install, `aief init`).
- ADR consistency: no doc contradicts an accepted ADR; ADRs are not modified; found inconsistencies documented in change.md and evidence.md.
- `docs/cli.md` documents `init`, `doctor`, `verify`, `close`, `analyze`, `prompt` consistently (level table includes `init`).
- CHANGELOG updated.
- Zero runtime changes: no CLI source or test file modified.

## Acceptance Criteria

- [x] README presents the product correctly and links every canonical doc.
- [x] Architecture documentation is complete (`docs/architecture.md`).
- [x] Vision is explicit (`docs/VISION.md`).
- [x] Lifecycle is documented with responsible/inputs/outputs per stage (`docs/lifecycle.md`).
- [x] Responsibility boundaries are clear (`docs/ecosystem.md` matrix; consistent with README and Workflow.md).
- [x] No documentation contradicts accepted ADRs; inconsistencies documented instead of hidden.
- [x] The ecosystem is understandable by someone who has never seen AIEF (README + ecosystem.md standalone).
- [x] No new runtime functionality: `cli/` untouched, test suite identical and green.
- [x] Documentation reflects the implemented product (e.g. Profiles marked as accepted-but-not-implemented, ADR-012).
