# Specification

## Goal

The owner can decide, with clear trade-offs, how far AIEF should go in verifying that approval
tasks were checked by a human.

## Requirements

### R1: Threat model

- Actors: the human owner; an assistant acting on owner instructions; an assistant overstepping (by
  mistake or via prompt injection from repository content); a malicious local actor with the owner's
  credentials.
- For each actor: whether AIEF can, should, or cannot address it locally and offline.

### R2: Current mechanism

- Where and how approval labels are parsed and enforced, with file and function references.
- What `AGENTS.md`, the assistant entrypoints and ADR-037 promise, and what is only convention.

### R3: Options

For each of the five options in `change.md`: how it works, which R1 actors it stops, which it does
not, failure scenarios, invariant fit (no network, zero dependencies, repository as truth, no
execution), cost to implement, and friction for a solo owner and for a team.

### R4: Recommendation

- One recommended option or combination, with the reasons for preferring it over the others.
- The decision requested from the owner, stated as a question.
- If the recommendation would change ADR-037, a short ADR draft in `evidence.md` (not added to
  `knowledge/decisions.md`).

### R5: Findings

- A `## Findings Status` table with IDs, severities and statuses.

## Acceptance Criteria

- [x] R1: Threat model documented.
- [x] R2: Current mechanism documented with code references.
- [x] R3: Five options compared on the same criteria.
- [x] R4: Recommendation and owner question recorded.
- [x] R5: Findings Status table present.
- [x] (human) Review the analysis and decide on the recommendation.
