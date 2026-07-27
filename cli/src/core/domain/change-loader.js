// Unified Change loader (AIEF Core 3.0, Entrega 1 — Change Foundation).
//
// loadChangeUnified() is the single entry point for both Change formats:
//   - manifest.json present  -> authoritative, no merge with change.md (R1)
//   - manifest.json absent   -> today's loadChange() behavior, byte-for-byte,
//                                wrapped with two extra fields (source, manifest)
//
// This does not replace loadChange() (change.js): it wraps it. verify()/close()
// keep calling loadChange()/checkChangeReadiness() directly — out of scope for
// this Entrega (design.md §9). Only status()/openChangeDirs() are wired to
// loadChangeUnified() (cli.js), so this module's manifest path is dormant
// until a Change actually carries a manifest.json.
import fs from "node:fs";
import path from "node:path";

import { loadChange, readChangeFiles, classifyEvidence, countOpenTasks } from "./change.js";
import { parseManifest, validateManifest } from "./change-manifest.js";

const MANIFEST_FILE = "manifest.json";

// Safe defaults for a Change whose manifest could not be parsed or failed
// validation: "unknown" mirrors parseChangeStatus()'s own posture for a
// legacy Change whose declared status cannot be interpreted (spec.md R5) —
// never guess, never silently fall back to legacy inference. `missing`/
// `empty` are still the real, computed values (Change 0043 review finding
// H1) — a broken manifest does not make the four required files any less
// required.
function manifestErrorShape(changeDir, manifestValue, manifestError, missing, empty) {
  return {
    dir: changeDir,
    basename: path.basename(changeDir),
    source: "manifest",
    manifest: manifestValue,
    manifestError,
    closed: false,
    statusState: "unknown",
    statusRaw: "",
    type: "",
    // track stays unresolved for an invalid manifest — never guessed from a
    // manifest.value that may not even exist (parse failure) or may be
    // untrustworthy (validation failure). See loadManifestChange()'s own
    // track field for the valid-manifest case (Change 0044, design.md §7).
    track: "",
    evidenceState: "placeholder",
    evidencePlaceholder: true,
    openTasksCount: 0,
    missing,
    empty
  };
}

function loadManifestChange(changeDir, manifestPath) {
  // Computed first and reused on every return path (valid manifest or not):
  // a manifest never exempts a Change from carrying its four required files
  // (spec.md R7) — see readChangeFiles() in change.js.
  const { files, missing, empty } = readChangeFiles(changeDir);

  // Entrega 2 (Change 0044) fix for Change 0043's finding L3: manifest.json
  // existing as something readFileSync can't read as a UTF-8 file (a
  // directory, a permission error, ...) used to throw uncaught past this
  // function. WF-R2 requires "never crash, never silently fall back to
  // legacy" — a read error is reported the same way a parse error already
  // is, not treated as a special case.
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, "utf8");
  } catch (err) {
    return manifestErrorShape(changeDir, null, [{ field: "manifest.json", message: `manifest.json could not be read: ${err.message}` }], missing, empty);
  }
  const parsed = parseManifest(raw);
  if (!parsed.ok) return manifestErrorShape(changeDir, null, [{ field: "manifest.json", message: parsed.error }], missing, empty);

  const { valid, errors } = validateManifest(parsed.value);
  if (!valid) return manifestErrorShape(changeDir, parsed.value, errors, missing, empty);

  const evidenceState = classifyEvidence(files["evidence.md"]);

  return {
    dir: changeDir,
    basename: path.basename(changeDir),
    source: "manifest",
    manifest: parsed.value,
    manifestError: null,
    closed: parsed.value.status === "closed",
    statusState: parsed.value.status,
    statusRaw: parsed.value.status,
    // `.type` is the legacy `## Type` slot (Analysis/Enrichment/General free
    // text) — a manifest has no such heading to read, so this stays "",
    // exactly like a legacy Change with no ## Type (Change 0043 behavior,
    // unchanged). `.track` is its own field (Change 0044, design.md §7):
    // conflating the two would recreate, in code, the exact "two
    // classification axes" collision ADR-013 already flags for Track vs.
    // ## Type at the product level.
    type: "",
    track: typeof parsed.value.track === "string" ? parsed.value.track.toLowerCase() : "",
    evidenceState,
    evidencePlaceholder: evidenceState === "placeholder",
    openTasksCount: countOpenTasks(files["tasks.md"]),
    missing,
    empty
  };
}

function mapLegacyChange(changeDir) {
  // track: "" — a legacy Change has no manifest, hence no track. Present for
  // shape parity with the manifest branch (Change 0044).
  return { ...loadChange(changeDir), source: "legacy", manifest: null, manifestError: null, track: "" };
}

// loadChangeUnified(changeDir) -> Change
// Manifest presence is the only precedence signal (spec.md R1) — a Change
// with both manifest.json and a change.md whose ## Status disagrees resolves
// to the manifest's value; change.md's status is not consulted.
export function loadChangeUnified(changeDir) {
  const manifestPath = path.join(changeDir, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) return loadManifestChange(changeDir, manifestPath);
  return mapLegacyChange(changeDir);
}
