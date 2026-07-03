# Specification

## Goal

A user opening an adopted project can see which Skills apply, why they were recommended, and how they inform prompts — from one readable file, with the catalog remaining the technical source.

## Requirements

- `skillsDoc()` renders per recommended Skill: `## Name (id)`, Why recommended (because-trail from detection), When to use, Related standards (knowledge/standards paths), Prompt context (or "No operational content yet."), Common risks, Evidence expectations.
- File header states it is generated during adoption and that Skills are contextual knowledge, not commands, never executed.
- `writeFile` non-overwrite semantics; adopt prints `Skills documented: knowledge/skills.md` or `Skills documentation already exists: knowledge/skills.md`; the file joins the adoption evidence artifact list when created.
- Adopt output no longer prints the full signal/skill dump: one compact `Detected: <ids>` line pointing to doctor and skills.md.
- `analyze` Detected Context adds "Full Skill knowledge: knowledge/skills.md" when the file exists; `prompt` lists it under "Read these files first" when it exists.

## Acceptance Criteria

- [ ] adopt creates skills.md with detected Skills, reasons, standards and honesty note (test).
- [ ] adopt does not overwrite an existing skills.md and reports it (test).
- [ ] prompt references knowledge/skills.md and keeps the "included as context, not executed" note; analyze references it in the seeded context (test).
- [ ] Adopt idempotence, additive-only and verify-after-adopt tests still pass.
- [ ] Full suite passes; `aief verify` passes; Change closed via `aief close --yes`.
