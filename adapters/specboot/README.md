# SpecBoot Adapter

> **Conceptual reference, not supported in AIEF 4.0** (ADR-038). AIEF no longer integrates with
> SpecBoot or `ai-specs/`: no provider, no detection, no configuration file. This page describes how the two can be
> used side by side by hand.

This adapter explains how AIEF can work with SpecBoot-style agent instructions.

SpecBoot is optional.

AIEF provides the project workflow and Change structure.

SpecBoot-style files can help different AI tools understand how to work in the repository.

## Relationship

```text
AIEF
  └── Change workflow, evidence, project structure

SpecBoot
  └── Agent instruction files and tool-specific guidance
```

## Recommended Usage

Start with AIEF files:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
CODEX.md
CURSOR.md
```

Add SpecBoot-style conventions only when they improve your team's workflow.

## Rule

Do not let tool-specific files become the source of truth.

`AGENTS.md` remains the primary instruction file.
