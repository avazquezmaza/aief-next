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
// facts the Skill Context already computed (change.basename, workflow
// stage, sdd requirements/tasks where present) exactly as change-context.js
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

// Deliberately widest lifecycle window this Entrega's Skill Context can
// express without inventing a new contract field (SK-R... same discipline
// as requirements-analysis-instructions.js's not_applicable/blocked/
// unsupported split): a closed Change is past the point this review exists
// for — "before archiving" (real specboot skill's own stated window) — so
// `not_applicable` once `change.closed` is true, for every Change shape.
//
// For a Change with a resolved Workflow (track declared, manifest-carrying),
// the "work" stage is excluded: this review is for something implemented
// and ready to be checked, not for something still being built — `blocked`,
// with the current stage named, rather than silently offering a review of
// nothing yet. Every later stage (verify/security_review/review/close) is
// applicable, matching "after implementation, before archiving" precisely
// because those are exactly the stages the Workflow Engine places after
// "work" and up to and including "close" (cli/src/workflows/*.json).
//
// A legacy Change (no track, `workflow` is null) carries no stage signal at
// all in the Skill Context by design (skill-context.js) — this Skill does
// not call evaluateGates()/resolveState() itself to manufacture one (that
// would duplicate workflow-service.js's own resolution, the same
// discipline every other Skill in this registry already follows). It is
// `applicable` whenever such a Change is simply open, an honest widest-safe
// default, not a guess at an unavailable stage.
export function appliesTo(context) {
  const change = context?.change;
  if (!change) return { applicable: false, status: "not_applicable", reason: "no Change resolved" };
  if (change.closed) return { applicable: false, status: "not_applicable", reason: "Change is already closed — this review is for before archiving" };

  const workflow = context?.workflow;
  if (workflow && workflow.kind === "resolved" && workflow.state.stage === "work") {
    return { applicable: false, status: "blocked", reason: `Change is still at the "work" stage — nothing implemented yet to review` };
  }
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
  const { change, sdd } = context;
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

  if (sdd && !sdd.error) {
    const requirements = sdd.requirements || [];
    const tasks = sdd.tasks || [];
    if (requirements.length || tasks.length) {
      lines.push("");
      lines.push(`This Change's SDD provider (${sdd.providerId}) reports ${requirements.length} requirement(s) and ${tasks.length} task(s) — use them as the acceptance-criteria source in step 1 rather than re-deriving your own list.`);
    }
  }

  return lines.join("\n");
}

export function summarize(result) {
  if (result.status === "ready") return "Adversarial review instructions ready.";
  return `adversarial-review: ${result.status}`;
}
