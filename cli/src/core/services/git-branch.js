// Auto-branch on new-change (Change 0114). The "one branch per Change"
// convention only ever lived as prose in per-assistant files (CLAUDE.md,
// docs, a memory) — which one assistant (Gemini) simply never read, so it
// kept creating Changes directly on `main`. Prose that only some assistants
// read is not enforcement; every assistant path (Claude/Gemini/Codex/Kiro)
// converges on the same `aief` binary, so the branch switch belongs here,
// not in another *.md file.
//
// Deliberately narrow: never commits, never pushes, never deletes a branch
// — only `checkout -b` from a protected branch, which is trivially
// reversible (AGENTS.md's git-discipline guardrail on destructive/
// irreversible operations does not apply to a plain branch creation).
import { run } from "../../process-utils.js";

export const PROTECTED_BRANCHES = ["main", "dev"];

// A dedicated error type so createChange() can tell "the checkout failed
// while we were still on a protected branch" apart from every no-op case
// below (no git repo, already on a feature branch, --no-branch) — all of
// which return null and are fine to fall through to writing the Change.
// This one case is not: it must abort before any file is written, per this
// module's own contract (see ensureChangeBranch()'s doc comment).
export class ChangeBranchError extends Error {}

export function currentBranch(cwd = process.cwd()) {
  const result = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  return result.status === 0 ? result.stdout.trim() : null;
}

function isInsideWorkTree(cwd) {
  return run("git", ["rev-parse", "--is-inside-work-tree"], { cwd }).status === 0;
}

// Sanitizes a Change id/slug into a git-safe branch name — the id/slug
// pair is already filesystem-safe (slugify()), but git also rejects a few
// characters filesystems allow (e.g. leading dots, "..", "@{").
export function changeBranchName(type, id, slug) {
  const kind = String(type || "general").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
  return `${kind}/${id}-${slug}`;
}

// Called by createChange() before any Change file is written. Returns the
// branch name it switched to, or null if it left the branch untouched (no
// git repo, already on a non-protected branch, or --no-branch was passed).
// Throws ChangeBranchError if it needed to switch (we were on a protected
// branch) but the checkout itself failed — the caller must not proceed to
// write the Change on the protected branch in that case.
export function ensureChangeBranch(id, slug, type, options = {}) {
  const cwd = options.cwd || process.cwd();
  if (options.skip) return null;
  if (!isInsideWorkTree(cwd)) return null;
  const branch = currentBranch(cwd);
  if (!branch || !PROTECTED_BRANCHES.includes(branch)) return null;
  const name = changeBranchName(type, id, slug);
  const result = run("git", ["checkout", "-b", name], { cwd });
  if (result.status !== 0) {
    throw new ChangeBranchError(`Could not create branch ${name} (staying on ${branch}): ${result.stderr.trim()}`);
  }
  console.log(`Created and switched to branch ${name}`);
  return name;
}
