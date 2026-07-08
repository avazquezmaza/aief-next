// Provider adapter contract: retrieve(sourceId, options) -> {
//   requirement,               // Normalized Requirement (cli/src/requirement.js)
//   retrieved,                 // true if real data was found (false: honest placeholder)
//   openQuestions: string[],   // provider-specific "- ..." bullet lines for spec.md
//   riskNotes: string[],       // provider-specific "- ..." bullet lines for evidence.md
//   consoleNotes: string[]     // provider-specific lines to print during `aief enrich`
// }
// Every field beyond `requirement`/`retrieved` may be empty — cli.js never
// branches on `provider` itself, only on this uniform shape.
import { emptyRequirement } from "../requirement.js";

export function retrieve(sourceId) {
  const requirement = emptyRequirement("manual", sourceId);
  requirement.title = sourceId;
  return { requirement, retrieved: true, openQuestions: [], riskNotes: [], consoleNotes: [] };
}
