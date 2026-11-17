// Approvals that were never unchecked (Change 0172, decision D1).
//
// The approval guard (templates/guardrails/aief-approval-guard.mjs) is a
// Claude Code / Gemini CLI hook: an assistant that runs no hook (Continue, for
// one) is not guarded at all. Change 0171 reached review with a `(human)`
// approval its assistant had committed already checked. This is the
// assistant-independent check: a `(human)`/`(review)` line that is resolved
// now, but never appeared unchecked in any committed version of its file,
// was never waiting for a person.
//
// Read-only (`git log`, `git show`); never fetches. Outside a git repository
// the answer is unknown and nothing is returned. A file git does not track
// yet has no history, so its resolved approvals are all reported. A shallow
// clone can report a false positive, which is why callers make it a notice.
import { run } from "../../process-utils.js";
import { parseApprovalLines, parseSpecApprovalLines } from "../domain/change.js";

const FILES = {
  "tasks.md": (md) => parseApprovalLines(md).filter((line) => line.label === "human" || line.label === "review"),
  "spec.md": parseSpecApprovalLines
};

const key = (line) => `(${line.label}) ${line.text}`;

// approvalsNeverUnchecked(changeDir, files) -> [{ file, item }]
// `files` is the Change's current content ({ "tasks.md": ..., "spec.md": ... }),
// so a working-tree edit that has not been committed yet is judged too.
export function approvalsNeverUnchecked(changeDir, files) {
  if (run("git", ["rev-parse", "--is-inside-work-tree"], { cwd: changeDir }).status !== 0) return [];
  const found = [];
  for (const [file, parse] of Object.entries(FILES)) {
    const resolved = parse(files?.[file]).filter((line) => line.state !== "unchecked");
    if (!resolved.length) continue;
    const everUnchecked = new Set();
    const log = run("git", ["log", "--format=%H", "--", file], { cwd: changeDir });
    if (log.status !== 0) continue;
    for (const sha of log.stdout.split(/\r?\n/).filter(Boolean)) {
      const shown = run("git", ["show", `${sha}:./${file}`], { cwd: changeDir });
      if (shown.status !== 0) continue;
      for (const line of parse(shown.stdout)) if (line.state === "unchecked") everUnchecked.add(key(line));
    }
    for (const line of resolved) if (!everUnchecked.has(key(line))) found.push({ file, item: key(line) });
  }
  return found;
}
