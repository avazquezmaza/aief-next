// Command handler: enrich (modularization, third slice). Zero dependency
// on any other command handler — only the shared kernel plus Requirement
// Source providers.
import path from "node:path";
import { PROVIDERS, providerList } from "../requirement.js";
import { retrieveRequirement, hasAdapter, implementedProviders } from "../requirement-providers/index.js";
import { getChangeDirs, slugify, cwd, writeFile, nextChangeId, parseArgs, section, printNext } from "./shared.js";

// Requirement Sources / Enrichment: real work starts in Jira, Notion, GitHub
// Issues or a document, not in `aief new-change`. Every provider is read-only
// and produces the same Normalized Requirement; enrichment output always lands
// in visible Change artifacts (no hidden state) and always requires human
// review before implementation — enforced by the same close/verify gates
// every other Change already uses (unchecked Human Review tasks refuse close).
//
// cli.js never branches on a provider name: `retrieveRequirement` (imported
// from requirement-providers/) is the one contract every provider implements,
// so adding notion/github/azure-devops/markdown means adding an adapter file
// there, never touching the functions below.
function findChangeBySlugSuffix(slug) {
  return getChangeDirs().find((dir) => path.basename(dir).endsWith(`-${slug}`));
}
function requirementFactsAndAssumptions(requirement) {
  const fields = [
    ["Title", requirement.title],
    ["Description", requirement.description],
    ["Status (source)", requirement.status],
    ["Priority", requirement.priority],
    ["Reporter", requirement.reporter],
    ["Assignee", requirement.assignee],
    ["Labels", requirement.labels.length ? requirement.labels.join(", ") : ""],
    ["Comments", requirement.comments.length ? `${requirement.comments.length} comment(s) retrieved` : ""],
    ["Attachments", requirement.attachments.length ? requirement.attachments.join(", ") : ""],
    ["Links", requirement.links.length ? requirement.links.join(", ") : ""]
  ];
  const facts = fields.filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`);
  const assumptions = fields.filter(([, v]) => !v).map(([k]) => `- **${k}:** not provided by the source — treat as unknown until a human confirms it.`);
  return { facts, assumptions };
}
function enrichmentChangeFiles(id, slug, provider, sourceId, requirement, retrieved, notes) {
  const today = new Date().toISOString().slice(0, 10);
  const { facts, assumptions } = requirementFactsAndAssumptions(requirement);
  const openQuestions = [...notes.openQuestions];
  if (!requirement.title || requirement.title === sourceId) openQuestions.push("- What is the actual title/summary of this requirement? (currently a placeholder)");
  if (!requirement.description) openQuestions.push("- What is the full description / acceptance intent behind this requirement?");
  if (!openQuestions.length) openQuestions.push("- None identified yet. If new information emerges before Human Review, add it here.");
  const changeMd = `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nEnrichment\n\n## Objective\n\nNormalize the requirement from ${provider}:${sourceId} into AIEF Change artifacts, without modifying the source or implementing application code.\n\n## Scope\n\n### In scope\n\n- Retrieve the requirement from ${provider} (read-only).\n- Normalize it into a common Requirement shape.\n- Classify information as Fact [H], Inference [I] or Assumption [S].\n- Raise open questions.\n- Require human review before any implementation.\n\n### Out of scope\n\n- Implementing application code.\n- Modifying the external source (${provider}) in any way — it is read-only.\n- Approving scope or acceptance criteria — that is a human decision, not this Change's job.\n\n## Requirement Source\n\n- **Provider:** ${provider}\n- **Source ID:** ${sourceId}\n- **Source URL:** ${requirement.sourceUrl || "(not available)"}\n- **Retrieved at:** ${requirement.retrievedAt}\n- **Read-only:** yes — AIEF never writes back to ${provider}.\n\n## Success Criteria\n\n- Requirement normalized into spec.md with [H]/[I]/[S] classification.\n- Open questions recorded.\n- Human review completed before implementation begins.\n\n## Review Status\n\nRequires Human Review\n`;
  const specMd = `# Specification\n\n## Goal\n\n${requirement.title || "(unknown — see Open Questions)"}\n\n## Normalized Requirement\n\n- **Provider:** ${provider}\n- **Source ID:** ${sourceId}\n- **Title:** ${requirement.title || "(unknown)"}\n- **Description:** ${requirement.description || "(unknown)"}\n\n## Facts, Inferences, Assumptions\n\n### [H] Facts (directly from the source)\n\n${facts.length ? facts.join("\n") : "- None retrieved yet."}\n\n### [I] Inferences (derived, not stated by the source)\n\n- None recorded yet. Add any inference here during Human Review, with its reasoning.\n\n### [S] Assumptions (missing data, treated as unknown)\n\n${assumptions.length ? assumptions.join("\n") : "- None — every field was retrieved from the source."}\n\n## Open Questions\n\n${openQuestions.join("\n")}\n\n## Acceptance Criteria\n\n- [ ] A human has reviewed this spec and the Normalized Requirement above.\n- [ ] Every open question is answered or explicitly deferred with a reason.\n- [ ] Scope in change.md is approved or adjusted by a human.\n`;
  const tasksMd = `# Tasks\n\n## Human Review (required before implementation)\n\n- [ ] Review spec.md and the Normalized Requirement.\n- [ ] Answer or explicitly defer each Open Question.\n- [ ] Approve or adjust the scope in change.md.\n- [ ] Decide whether to proceed (\`aief propose\` / \`aief prompt\`) or close this Change as not actionable.\n\n## Enrichment (done automatically by \`aief enrich\`)\n\n- [x] Retrieve the requirement from ${provider}:${sourceId} (read-only).\n- [x] Normalize into Facts [H] / Inferences [I] / Assumptions [S].\n- [x] Record source metadata and mark it read-only.\n\n## Evidence\n\n- [ ] Update evidence.md\n`;
  const evidenceMd = `# Evidence\n\n> Generated by AIEF during enrichment.\n\n## Summary\n\nRequirement ${provider}:${sourceId} retrieved (read-only) and normalized into this Change on ${today}.\n\n## Activities Performed\n\n- Retrieved requirement metadata from ${provider} (${sourceId})${retrieved ? "" : " — no local data found; placeholder only"}.\n- Normalized into Facts [H] / Inferences [I] / Assumptions [S] in spec.md.\n- Recorded the source as read-only; no writes were made against ${provider}.\n\n## Verification\n\n- Source read-only: confirmed — no code path in this Change writes back to ${provider}.\n- No application code modified.\n- No credentials read, stored or required.\n\n## Findings\n\n${facts.length ? facts.join("\n") : "- No fields retrieved yet — see Open Questions in spec.md."}\n\n## Risks\n\n- Fields marked [S] in spec.md are assumptions — confirm during Human Review before implementation.\n${notes.riskNotes.length ? `${notes.riskNotes.join("\n")}\n` : ""}\n## Recommendations\n\n- Complete Human Review (tasks.md) before running \`aief propose\` or \`aief prompt\`.\n\n## Artifacts Produced\n\n- changes/${id}-${slug}/ (this Change)\n\n## Lessons Learned\n\n- Pending — add after Human Review.\n\n## Next Change\n\nComplete Human Review, then \`aief propose\` or \`aief prompt\` to continue toward implementation.\n`;
  return { "change.md": changeMd, "spec.md": specMd, "tasks.md": tasksMd, "evidence.md": evidenceMd };
}
export function enrich(args) {
  const parsed = parseArgs("enrich", args);
  if (!parsed) return;
  const provider = (parsed._[0] || "").toLowerCase();
  const sourceId = parsed._[1] || "";
  section("AIEF Enrich");
  console.log("Purpose: normalize a requirement from an external source (read-only) into a new or existing Change. Never modifies the source; never implements code.\n");
  if (!provider || !PROVIDERS[provider]) {
    console.error(`Unknown or missing provider${provider ? ` "${provider}"` : ""}.\n\nKnown providers:\n\n${providerList(hasAdapter)}\n\nExample:\n  aief enrich manual TEST-001`);
    process.exitCode = 1;
    return;
  }
  if (!hasAdapter(provider)) {
    console.error(`Provider "${provider}" is not implemented yet. It is planned — see docs/configuration.md, "Requirement Source providers".\n\nImplemented now: ${implementedProviders().join(", ")}.`);
    process.exitCode = 1;
    return;
  }
  if (!sourceId) { console.error(`Source ID is required.\n\nExample:\n  aief enrich ${provider} <source-id>`); process.exitCode = 1; return; }
  const slug = slugify(`${provider}-${sourceId}`);
  const existing = findChangeBySlugSuffix(slug);
  if (existing) {
    console.log(`A Change for ${provider}:${sourceId} already exists: ${path.relative(process.cwd(), existing)}`);
    console.log("Not creating a duplicate. Re-run enrich under a different source-id if this is genuinely a new requirement.");
    printNext(`review ${path.relative(process.cwd(), existing)}/spec.md`, "aief prompt");
    return;
  }
  const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement(provider, sourceId, parsed);
  for (const note of consoleNotes) console.log(note);
  const id = nextChangeId();
  const changeDir = cwd("changes", `${id}-${slug}`);
  const files = enrichmentChangeFiles(id, slug, provider, sourceId, requirement, retrieved, { openQuestions, riskNotes });
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  const name = path.relative(process.cwd(), changeDir);
  console.log(`Created Change: ${name}`);
  console.log(`Source: ${provider}:${sourceId} (read-only; nothing was written back to ${provider}).`);
  console.log("\nThis Change requires human review before any implementation.");
  printNext(`review ${name}/spec.md and answer its Open Questions`, `approve or adjust scope in ${name}/change.md`, `then: aief propose --change ${path.basename(changeDir)} (or aief prompt --change ${path.basename(changeDir)})`);
}
