# Evidence

## Summary

Defined how AIEF ships a native `aief-change` skill and splits `AGENTS.md` into policy and
procedure. The owner approved D1–D5 as recommended on 2026-10-04 (Q1: all three assistants when
none is configured; Q2: overwrite only unmodified files). ADR-039 records it.

## Activities Performed

1. Checked how the procedure reaches assistants today: `bootstrap` writes only `AGENTS.md`;
   `docs/assistant-workflow.md` asks adopting projects to add skills by hand.
2. Surveyed the 11 local projects: 1 has an `aief-change` skill (`THINGS/neto`, Kiro, a copy that
   differs from this repository's); 9 have hand-written `CLAUDE.md` files (39–383 lines).
3. Read this repository's skills: 13 lines pointing to `docs/assistant-workflow.md`, which only
   exists here.
4. Wrote D1–D5 with options and recommendations; recorded the owner's decision; added ADR-039.

## Verification

- `aief verify --change 0158-define-assistant-native-skill --strict`: only this Change's own
  `(human)` tasks remain before the owner checks them.
- No code, test or user-facing doc changed.

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | This repository's skills only work inside this repository | To fix in 0159 (D1) |
| F2 | Skill paths and format per assistant are assumed (A1) | To confirm in 0159 |

## Risks

- A1 may not hold for every assistant; 0159 confirms it before writing files.

## Recommendations

- Implement in 0159, then release 4.1.0.

## Artifacts Produced

- This Change; ADR-039 in `knowledge/decisions.md`.

## Lessons Learned

- A file that only exists in AIEF's own repository is invisible to every adopting project; check
  references from the adopter's point of view.

## Next Change

0159: implement ADR-039.
