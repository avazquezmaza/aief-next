# Evidence

## Summary

Defined AIEF 4.0's removals before any code is touched. The owner approved all eight
recommendations (D1–D8) and resolved both open questions on 2026-10-04: keep the OpenSpec and
SpecBoot adapter docs as conceptual references, and make `close` warn, not block, on an open
dependency. ADR-038 records the decision, and the ADRs it supersedes are marked.

## Activities Performed

1. Built the removal inventory from real `import` statements in `cli/src`, not from file names.
   It found one more unused subsystem: requirement verification (`verify --requirements`, about
   650 lines). It reads `sdd.requirements` from the manifest, and there are 0 manifests.
2. Measured the scope: about 2,600 source lines (29% of `cli/src`) and about 350 of 1,152 tests.
   3 `(gate:*)` lines exist in this repository's history and 0 in the 11 projects.
3. Wrote one decision per component with options and a recommendation (`change.md`).
4. Recorded the owner's decision in `change.md` → Decision (human).
5. Added ADR-038 to `knowledge/decisions.md`, and a "Superseded by ADR-038" line to ADR-016,
   017, 021 (requirement layer), 023 to 028 and 037, and a "framing replaced" line to ADR-001.

## Verification

- `aief verify --change 0156-define-4-0-simplification --strict`: the only open items are this
  Change's two `(human)` tasks.
- No code, test or user-facing doc changed in this Change.

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | Requirement verification is manifest-gated and unused, not listed in Analysis 0154 | Added to D5, approved |
| F2 | `workflow-service.js` is imported by 6 modules. The no-track fallback (`checkChangeReadiness()`) becomes the only path | Prerequisite for 0157 |

## Risks

- The removal touches `prompt`, `status`, `verify` and `close`. Mitigation: 0157 keeps the
  no-track behavior byte-identical and relies on the existing CLI tests for those commands.

## Recommendations

- Implement in 0157 in this order: manifest-gated leaves first (Loop, Harness, `ai-specs`, SDD,
  requirement verification), then the workflow engine, then the manifest, then `## Depends on`.
  Run the suite after each step.

## Artifacts Produced

- This Change.
- ADR-038 and supersession notes in `knowledge/decisions.md`.

## Lessons Learned

- An import-graph inventory finds coupling and dead layers that a file list misses.

## Next Change

0157: implement AIEF 4.0 per ADR-038, plus Analysis 0154's Findings Status for B3/B4.
