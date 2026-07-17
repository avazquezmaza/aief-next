# Design — Governance Signal Integrity (F1–F3)

> Design notes for a Change whose whole purpose is **repair**, not growth. Every choice
> below is biased toward *not* inventing a concept, because the finding that motivated
> this Change is that AIEF's existing concepts were already enough — they just answered
> wrongly, or nobody ran them.

## The shared root cause

F1 and F3 are the same mistake wearing different clothes:

| | F1 — status | F3 — evidence |
|---|---|---|
| What it measures | the exact string `aief close` writes | the count of `Pending.` lines |
| What it should measure | what the document **declares** | whether the document has **real content** |
| Failure mode | silent `false` → "open" | silent `true` → "placeholder" |

Both are **proxies mistaken for the thing itself**, and both fail *quietly and
confidently*. So both fixes share one principle:

> **Judge the document, and when the document cannot be judged, say so out loud.**

That third state — "I cannot tell" — is what the current code lacks. It only has yes/no,
so an unreadable file becomes "no", which is indistinguishable from a real "no". This is
the same defect the same migration found in OpenSpec (`validate --all` → `4 passed`
while skipping a whole change). **Absence of a signal was rendered as a healthy signal.**

## F1 — Status parsing

### Model

`parseChangeStatus(changeMd) → { state, token, raw, declarations }` with
`state ∈ "closed" | "open" | "unknown"`.

`unknown` is the new, load-bearing value: *a status was declared and could not be
interpreted*. It is an **error**, not a fallback.

### Why a declaration model instead of a bigger regex

The tempting fix is to loosen the regex (`\*{0,2}closed`). Rejected: it would still be a
pattern hunt over the whole file, and Flux Portal proves how many near-misses a real
`change.md` contains — `Status (orig): PASS`, `Status confirmed by the governance
reconciliation`, `*Status field added during…*`, and prose sentences containing the word
"Closed". A looser regex gets **more** wrong, more confidently.

Instead: find **declarations** (a label that means "here is the status"), then read their
value. Two forms, both taken verbatim from real repositories:

- `## Status` heading → value is the next non-empty line (AIEF's own format, and Flux
  0004–0007);
- an unqualified `Status:` label, optionally inside emphasis/blockquote (Flux 0001–0003,
  0008–0013).

### The qualification rule (the subtle part)

The label must be `Status` immediately followed by `:` (emphasis may wrap it). This one
rule rejects every decoy Flux contains, without a denylist:

| Real line | Declaration? | Why |
|---|---|---|
| `> **Status: CLOSED (reconciled 2026-07-16).**` | ✅ yes | `Status` + `:` |
| `> **Status (orig): PASS (2026-07-14).**` | ❌ no | `(orig)` interrupts → **qualified**, historical |
| `> **Status confirmed by the governance…**` | ❌ no | no `:` after `Status` |
| `> *Status field added during governance…*` | ❌ no | no `:` after `Status` |

`Status (orig):` is the important one: Flux uses it to preserve the *original* status
next to the reconciled one. A parser that merged both would see `CLOSED` and
`IN PROGRESS` and — correctly by R1.4 — call it a contradiction, turning a well-formed,
honest file into an error. So the qualification rule is what keeps R1.4 from
back-firing.

### Normalisation

Strip blockquote markers and emphasis, take the leading token up to the first delimiter
(space, `·`, `—`, `-`, `(`, `.`, `,`, `:`), uppercase. `**CLOSED** (2026-07-11; label
normalized)` → `CLOSED`. `CLOSED · ARCHIVED (reconciled…)` → `CLOSED`.

### Vocabulary — deliberately small

- **closed**: `CLOSED`
- **open**: `OPEN`, `PROPOSED`, `DRAFT`, `IN PROGRESS`, `IN-PROGRESS`, `WIP`, `PENDING`,
  `ACTIVE`, `TODO`
- anything else → **unknown** → loud error

`COMPLETE` and `PASS` are deliberately **absent** from both lists. Flux wrote
`Status: COMPLETE` and `Status: PASS` meaning *done*, and AIEF silently read them as
*open*. Mapping them to `closed` would be guessing at intent; leaving them silent is the
bug. **`unknown` + an explicit error is the honest answer**: it tells the author "you
declared something I do not understand — say `CLOSED` or use `aief close`", which is
exactly the loud failure the criterion asks for.

`ARCHIVED`/`SUPERSEDED` alone also land in `unknown` — correct for this Change, since F5
(making them real states) is deferred. `CLOSED · ARCHIVED` reads as closed because the
**leading** token is `CLOSED`.

### Ambiguity

Two or more unqualified declarations that disagree → `unknown`. Agreeing duplicates are
fine (a file may restate its status). Never "first wins": the migration's whole lesson is
that a confident wrong answer is worse than a refusal.

### Absence stays `open`

No declaration → `open`, **no error**. AIEF's own Changes 0001–0012 carry no `## Status`;
making absence an error would break the tool's own repository on day one and punish the
common case. Only a *declared* status can be wrong.

## F2 — The gate

### What is missing is not capability

`aief verify` already exits `1` on FAIL (verified: exit code 1 against Flux Portal). AIEF
already gates **itself** in `.github/workflows/ci.yml`. The gap is that
`runAdoption()` delivers *structure* (`AGENTS.md`, `changes/`, `knowledge/`, `profiles/`,
standards, skills) and **no enforcement**, so an adopted project inherits governance it
must remember to run — and Flux Portal proves what that yields: a correct FAIL that sat
unseen from Change 0008 through the cutover.

So the fix is a **workflow file plus documentation**, and explicitly *no* new core
capability (R2.3).

### Placement: adoption, not a new command

Written by `runAdoption()` (used by both `adopt` and `init`), listed in the adoption
artifacts and therefore in the generated `evidence.md`. It obeys the two existing
adoption guarantees: **visible** (no hidden `.aief/`, ADR-009) and **never overwrites**.

### GitHub Actions, honestly labelled

A workflow file is GitHub-specific, which sits awkwardly with an assistant-agnostic,
CI-agnostic tool. Resolution: the workflow is a **convenience for the common case**, and
the documentation states plainly that **the gate is one command** —
`npx aief verify` — that any CI can run. We ship the ergonomic default and document the
principle, rather than inventing a CI abstraction AIEF has no evidence it needs.

## F3 — Evidence classification

### Model

`classifyEvidence(evidenceMd) → "placeholder" | "partial" | "complete"`.

Measure **substantive lines**: non-blank lines that are not headings, not blockquotes and
not the literal `Pending.`. Then:

- `substantive === 0 && pending >= 1` → **placeholder** (the untouched template is exactly
  this: nine headings, nine `Pending.` lines, nothing else);
- `pending > 0 && substantive < pending * 2` → **partial** (placeholders still dominate);
- otherwise → **complete**.

### Why a ratio, not a count

The old rule (`pending >= 3`) asked *"are there placeholders?"*. The right question is
*"do placeholders dominate?"*. Flux 0003 answers it decisively: **3 `Pending.` lines in
688 lines** of real evidence. Any absolute threshold is wrong at some document size; a
ratio scales. The `* 2` margin is deliberately generous toward "not yet done" — the
conservative direction, since the safety property we must not lose is *don't let someone
close on an empty template*.

### What this changes for `close`

Readiness blocks when evidence is **not `complete`** — so `placeholder` and `partial`
still block (safety preserved), while a finished document with residual pendings no
longer does (false positive removed). Flux 0003/0005 go from *blocked* to *closable*,
which is the correct outcome: their evidence is 688 and 496 lines of real, cited results.

### The hint

`verify`'s "Next:" now follows the classification: `complete` → `aief close --yes`,
otherwise → `aief prompt`. Today it tells a user with finished evidence to go do the
work — the tool actively points away from the correct action.

## What this design refuses to do

- **No new Change state** (F5 deferred) — `unknown` is a *parse* outcome, not a lifecycle
  state; it never appears in a `change.md`.
- **No staleness inference** (F6 deferred) — nothing here compares a status against
  evidence or successors.
- **No mandatory fields** (F4 → design only).
- **No hidden state, no new entity, no new command** — ADR-009 holds.
- **No OpenSpec/SpecBoot changes.**

> The restraint is the point. The evidence says AIEF's capabilities were **ahead of its
> adoption**; the correct first move is to make what exists **unavoidable and
> unfalsifiable**, not to build more.
