# OpenSpec Workflow with AIEF

This document details level 2 of the [three-level AIEF workflow](../../docs/Workflow.md).

## AIEF-native path (without OpenSpec — normal, fully supported)

```text
aief new-change / propose
  -> edit change.md, spec.md, tasks.md
  -> assistant implements (via aief prompt)
  -> capture AIEF evidence
  -> aief verify -> aief close --yes
```

## OpenSpec-enhanced path

```text
aief adopt / analyze / prompt          (level 1: AIEF context)
  -> Explore   (/opsx:explore)
  -> Propose   (/opsx:propose)         verified official OpenSpec workflow
  -> Apply     (/opsx:apply)
  -> Archive   (/opsx:archive)
  -> capture AIEF evidence
  -> aief verify -> aief close --yes   (level 3: AIEF governance)
```

Profiles and assistants may expose additional commands (e.g. `/opsx:verify`, `/opsx:new`), and teams sometimes extend the cycle with Specboot-style skills such as *enrich-us* or *adversarial review*. Treat those as optional extensions — they are not part of the validated official OpenSpec workflow.

## Human and AI Responsibilities

Human:

- approves scope,
- approves proposal,
- approves release.

AI:

- drafts proposal,
- drafts spec changes,
- creates tasks,
- implements scoped changes,
- updates evidence.

## Important Rule

OpenSpec may help define the change, but AIEF still requires evidence before work is considered complete.
