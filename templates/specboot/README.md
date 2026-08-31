# SpecBoot templates

Reference material for a project following LIDR/SpecBoot conventions alongside AIEF. The files in
this directory itself are never copied or read automatically by any `aief` command — they are
visible templates for a human to adapt by hand, exactly like `agent-file.md` and
`profile-prompt.md`. The `ai-specs/` *convention* they illustrate, however, is read by AIEF — see
below.

## The `ai-specs/` convention

A project may carry:

```text
ai-specs/
├── skills/
│   ├── <id>.md            (flat file — AIEF's own original convention)
│   └── <id>/
│       └── SKILL.md       (folder-per-skill — the convention real LIDR/specboot
│                            projects actually use, e.g. github.com/LIDR-academy/
│                            lidr-specboot's ai-specs/skills/<name>/SKILL.md)
└── standards/
    └── <id>.md
```

Both Skill shapes are discovered; neither replaces the other, and a same-id collision between them
resolves in favor of the flat `<id>.md` file (see `discoverResourceDir()` in `ai-specs.js`).

**`ai-specs/standards/` is an AIEF-only convention — real LIDR/specboot projects do not have this
directory.** In `github.com/LIDR-academy/lidr-specboot`, standards documents
(`base-standards.md`, `backend-standards.md`, `frontend-standards.md`, `documentation-standards.md`,
etc.) live under `docs/`, at the repository root, not under `ai-specs/`. AIEF does not read `docs/`
as a Standards source (that directory means something different — and is used differently — in
every project). A project that wants AIEF to discover its specboot-authored standards must place
copies (or symlinks) of the relevant `docs/*-standards.md` files under `ai-specs/standards/`
itself; AIEF will not find them under `docs/` on its own.

Each file's name (without extension) is its id; its content is free-form Markdown. AIEF's
`cli/src/core/domain/ai-specs.js` (`discoverAiSpecs()`/`resolveResources()`, ADR-023) can read
this structure and resolve it against AIEF's own built-in Skills/standards under one rule:

**A project's `ai-specs/` resource always wins over an AIEF built-in sharing the same id.** The
two are never merged — the resolved definition is wholly the project's or wholly AIEF's built-in.
An id only the project defines is added as-is.

**Status:** `ai-specs/skills/*.md` is consumed by `aief doctor` (Recommended Skills, tagged
`[project]`/`[project override]` — Change 0054/ADR-024). `ai-specs/standards/*.md` is consumed by
`aief prompt` (the real "Project standards to follow" text sent to your assistant, referencing
your file's own path) and reported by `aief doctor --verbose` (Change 0055/ADR-025). A project
without an `ai-specs/` directory at all is unaffected by either — see `changes/0053-lidr-integration/`,
`changes/0054-lidr-skill-recommendations/` and `changes/0055-lidr-standards-integration/`.
`bootstrap`/`analyze` do not consume `ai-specs/` yet — a future, separately-scoped Change.

`ai-specs/skills/example-skill.md` and `ai-specs/standards/example-standard.md` in this directory
are minimal, illustrative examples of the expected content — adapt or delete them.
