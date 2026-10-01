# Change

## ID

`0149-human-approval-identity`

## Type

Analysis

## Objective

Analyze the Known Gap in `docs/security-model.md`: `(human)`, `(review)` and `(gate:<id>)` task
labels are not identity-verified. `aief close` checks that a box is checked, not who checked it, so
nothing technical distinguishes a human approval from an assistant checking the box against
`AGENTS.md`. Evaluate options and recommend one for the owner to decide. No implementation.

Motivating observation: during the Laya and 3.4.0 work (Changes 0143–0147), several assistant
reports said "I checked the (human) box". When the owner directed it, that is legitimate, but AIEF
cannot tell that case from an assistant acting on its own.

## Scope

### In scope

- Threat model: which actor and failure mode the control addresses (an assistant overstepping by
  mistake or under prompt injection, versus a deliberately malicious local actor), and what
  "verified human approval" can mean for a local, offline CLI.
- Current mechanism: how `change-verifier.js`, `gate-evaluator.js` and `close` read these labels;
  ADR-037 and `AGENTS.md` rules.
- Options, each evaluated against AIEF's invariants (repository as source of truth, no network,
  zero runtime dependencies, recommendation never execution) and for strength, cost and friction:
  1. Accept and document (status quo, sharper wording).
  2. Git provenance: report which commit checked each approval line (author, committer, AI
     trailers, whether the same commit also changed implementation files) as a notice or under
     `verify --strict`. Note the tension with this repository's "no AI `Co-Authored-By`" rule.
  3. Signed approvals: require a signed commit (GPG/SSH) from an allow-listed key for approval
     lines; consider assistants running with access to the same signing agent.
  4. Platform controls outside AIEF: PR review by a separate account, CODEOWNERS, branch
     protection. AIEF documents them but cannot read them (no network).
  5. An `aief approve` command that records approver and time. Note that an assistant can run it too.
- Recommendation, with the decision left to the owner; an ADR draft only if the recommendation
  changes ADR-037.
- A Findings Status table in `evidence.md`.

### Out of scope

- Implementing any option.
- Changing `close`, `verify`, ADR-037 or `AGENTS.md` in this Change.

## Success Criteria

- The threat model states clearly which threat is in and out of scope.
- Every option has strength, cost, friction and invariant fit, with concrete failure scenarios.
- One recommendation, plus the decision requested from the owner.
- `node cli/bin/aief.js verify --change 0149-human-approval-identity --strict` passes after the
  owner's `(human)` review.

## Status

Closed (2026-10-01)
