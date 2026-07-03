# OpenSpec Adapter

This adapter explains how to use AIEF with OpenSpec.

OpenSpec is optional.

AIEF defines the lightweight engineering workflow:

```text
Idea -> Spec -> Tasks -> Build -> Verify -> Evidence
```

OpenSpec can be used as a more formal specification engine for teams that want structured change proposals, design notes, and spec deltas.

## When to use this adapter

Use this adapter when:

- your team already uses OpenSpec,
- you want stricter change proposals,
- you need clearer spec deltas,
- you want a formal review process before implementation.

Do not use it when:

- you are starting with AIEF for the first time,
- your change is very small,
- the extra structure does not add value.

## Relationship

```text
AIEF
  └── Change lifecycle and AI collaboration

OpenSpec
  └── Optional specification format for changes
```

AIEF remains the project workflow. OpenSpec can implement the Specification part of that workflow.
