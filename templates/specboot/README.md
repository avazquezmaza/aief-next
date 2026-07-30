# SpecBoot templates

Reference material for a project following LIDR/SpecBoot conventions alongside AIEF. These files
are never copied or read automatically by any `aief` command — they are visible templates for a
human to adapt by hand, exactly like `agent-file.md` and `profile-prompt.md` in this same
directory.

## The `ai-specs/` convention

A project may carry:

```text
ai-specs/
├── skills/
│   └── <id>.md
└── standards/
    └── <id>.md
```

Each file's name (without extension) is its id; its content is free-form Markdown. AIEF's
`cli/src/core/domain/ai-specs.js` (`discoverAiSpecs()`/`resolveResources()`, ADR-023) can read
this structure and resolve it against AIEF's own built-in Skills/standards under one rule:

**A project's `ai-specs/` resource always wins over an AIEF built-in sharing the same id.** The
two are never merged — the resolved definition is wholly the project's or wholly AIEF's built-in.
An id only the project defines is added as-is.

**Honest status:** as of this writing, no AIEF command consumes this module yet — a project with
`ai-specs/skills/standards/` today behaves identically to one without. Wiring the resolver into a
real command (which one, and what its output should look like) is deliberately a separate, later
decision — see `changes/0053-lidr-integration/change.md`.

`ai-specs/skills/example-skill.md` and `ai-specs/standards/example-standard.md` in this directory
are minimal, illustrative examples of the expected content — adapt or delete them.
