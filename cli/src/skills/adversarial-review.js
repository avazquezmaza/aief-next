// Skill: adversarial-review (adapted from LIDR-academy/lidr-specboot's
// ai-specs/skills/adversarial-review/SKILL.md — read as reference, not
// copied: its workflow is OpenSpec/PR-shaped, this is AIEF-shaped). Model A
// only (capabilities.instructions: true, same as change-context.js and
// requirements-analysis-instructions.js) — fills a real gap: "independent
// adversarial review before archiving" was referenced only in this
// project's own governance history (Changes 0032/0042-0049), never
// implemented as a Skill or a workflow step.
//
// This Skill never runs a review itself (no AI, no diff-parsing) — it
// produces instructions for a human or assistant to run one, reusing the
// facts the Skill Context already computed (change.basename) exactly as change-context.js
// and requirements-analysis-instructions.js already do.

export const id = "adversarial-review";
export const version = "1.0.0";
export const title = "Adversarial Review";
export const description = "Instructions for an independent, adversarial code review — hunting failure modes, not confirming happy paths — before a Change is closed.";
export const capabilities = Object.freeze({
  instructions: true,
  deterministicExecution: false,
  writeFiles: false,
  executeCommands: false,
  network: false,
  assistantRequired: false
});

// Applies to any open Change: the review is for before archiving.
export function appliesTo(context) {
  const change = context?.change;
  if (!change) return { applicable: false, status: "not_applicable", reason: "no Change resolved" };
  if (change.closed) return { applicable: false, status: "not_applicable", reason: "Change is already closed — this review is for before archiving" };

  return { applicable: true };
}

const GUARDRAILS = [
  "Try to break the change, not only confirm the happy path — hunt incorrect assumptions about",
  "data shape, timing, ordering, authorization, idempotency and error handling.",
  "Trace cross-boundary risks: pieces that look fine in isolation but fail together.",
  "Treat spec.md/tasks.md as incomplete context — missing tests, missing negative paths, or spec",
  "drift can hide issues just as easily as the code itself.",
  "Do not praise the implementation to \"balance\" criticism unless a strength directly mitigates a",
  "documented risk.",
  "Calibrate depth to risk: auth, payments, PII, privilege boundaries and data mutation deserve",
  "stricter scrutiny than everything else."
].join(" ");

export function buildInstructions(context) {
  const { change } = context;
  const lines = [];
  lines.push(`Act as an independent adversarial reviewer of ${change.basename}.`);
  lines.push("Assume gaps, flaws or unsafe behavior exist until you have argued against them with evidence — do not rubber-stamp.");
  lines.push("");
  lines.push("## 1. Load the specification side");
  lines.push("Read this Change's own spec.md (Acceptance Criteria) and tasks.md. List what must be true for \"done\" and note anything underspecified (ambiguous acceptance, missing error cases, missing security constraints).");
  lines.push("");
  lines.push("## 2. Load the implementation side");
  lines.push("Read the actual diff for this Change (`git diff` against the branch's merge base, or the PR if one exists) — not only the files spec.md/tasks.md mention. Map files changed to spec sections and tasks.");
  lines.push("");
  lines.push("## 3. Adversarial pass — refute, do not confirm");
  lines.push("For each acceptance criterion: state how the implementation could still fail while the author believed it passed (wrong input, partial failure, stale state, wrong role, race, empty state, oversized payload). Check negative/abuse cases where relevant. Check whether tests prove the criterion or only exercise the happy path. Record any spec-vs-code mismatch as a first-class finding.");
  lines.push(GUARDRAILS);
  lines.push("");
  lines.push("## 4. Severity");
  lines.push("Classify every finding as Blocker (incorrect behavior, security/privacy issue, or spec violation — should stop close), Major (likely bug or significant gap — fix or spec update required before close), Minor (clarity/maintainability/low-risk — can follow up), or Question (needs human confirmation). State whether the fix belongs in code, tests, spec.md/tasks.md, or evidence.md.");
  lines.push("");
  lines.push("## 5. Verdict");
  lines.push("End with PASS (no blockers or majors), PASS WITH GAPS (minors only, tracked), or FAIL (at least one blocker or major) — and whether closing this Change is advisable in its current state.");


  return lines.join("\n");
}

export function summarize(result) {
  if (result.status === "ready") return "Adversarial review instructions ready.";
  return `adversarial-review: ${result.status}`;
}
