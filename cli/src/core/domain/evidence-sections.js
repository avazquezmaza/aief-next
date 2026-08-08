// Targeted evidence.md section read/replace (Change 0071). Never touches any
// section other than the one named, and never touches anything in it besides
// its own previously-captured sub-block — the same "consume, never silently
// modify" discipline this project applies to evidence.md everywhere else
// (prompt()'s evidence guard, ADR-021's Requirement Verification).
//
// Deliberately index-based, not a single regex with a "next heading or end
// of string" lookahead: a naive `(?=\n## |$)` under the /m flag needed for
// `^` to find the heading also makes `$` match at *every* line ending, not
// just true end-of-string — silently truncating a multi-line body when the
// section happens to be the last one in the file. Caught by testing that
// exact case before writing any caller code.
//
// The capture is always rendered as its own `### <subHeading>` block, even
// when the section body was the untouched "Pending." placeholder — a second
// bug, also caught by manual testing before this shipped: an earlier version
// special-cased the placeholder (replacing the whole body with no
// sub-heading) and only recognized "already captured" by checking whether
// the *entire* body started with the marker — which broke the moment the
// section had prior human prose (the append path added a sub-block, but a
// second capture no longer saw a body starting with the marker, so it kept
// appending a new block instead of replacing the existing one). Always
// using the same sub-block shape makes "is this already my own capture"
// one check, regardless of what else is in the section.

const SUB_HEADING = "Captured Test Report";

function findHeadingStart(evidenceMd, heading) {
  const marker = `## ${heading}\n\n`;
  if (evidenceMd.startsWith(marker)) return 0;
  const withNewline = evidenceMd.indexOf(`\n${marker}`);
  return withNewline === -1 ? -1 : withNewline + 1;
}

// Returns { bodyStart, bodyEnd } (both string indices) for the heading's
// body — from right after "## <heading>\n\n" up to (not including) the next
// "\n## " heading line, or the end of the string if there is none.
function sectionBodySpan(evidenceMd, heading) {
  const headingStart = findHeadingStart(evidenceMd, heading);
  if (headingStart === -1) return null;
  const bodyStart = headingStart + `## ${heading}\n\n`.length;
  const nextHeading = evidenceMd.indexOf("\n## ", bodyStart);
  const bodyEnd = nextHeading === -1 ? evidenceMd.length : nextHeading;
  return { bodyStart, bodyEnd };
}

// replaceOrAppendEvidenceSection(evidenceMd, heading, ownMarkerPrefix, newBody)
//   -> the updated evidence.md string.
//
// The capture always lands as `### Captured Test Report\n\n<newBody>`:
// - Section body is exactly "Pending." -> that sub-block becomes the whole
//   body (nothing human-written is lost — there was nothing there).
// - Section body already contains a `### Captured Test Report` sub-block
//   whose own content starts with `ownMarkerPrefix` (a previous capture) ->
//   that exact sub-block is replaced in place — idempotent, regardless of
//   what else is in the section (placeholder-replaced or human prose alike).
// - Any other existing body (real human/assistant prose, no prior capture)
//   -> left exactly as is; the sub-block is appended below it.
// - Heading not found at all (a non-standard evidence.md) -> a new
//   `## <heading>` section (with the sub-block as its body) is appended at
//   the end of the file.
export function replaceOrAppendEvidenceSection(evidenceMd, heading, ownMarkerPrefix, newBody) {
  const subBlock = `### ${SUB_HEADING}\n\n${newBody}`;
  const span = sectionBodySpan(evidenceMd, heading);
  if (!span) {
    const separator = evidenceMd.endsWith("\n") ? "\n" : "\n\n";
    return `${evidenceMd}${separator}## ${heading}\n\n${subBlock}\n`;
  }
  const { bodyStart, bodyEnd } = span;
  const currentBody = evidenceMd.slice(bodyStart, bodyEnd).replace(/\n+$/, "");
  const before = evidenceMd.slice(0, bodyStart);
  const after = evidenceMd.slice(bodyEnd);

  if (currentBody === "Pending.") {
    return `${before}${subBlock}\n${after}`;
  }

  const subHeadingMarker = `### ${SUB_HEADING}\n\n`;
  const subStart = currentBody.indexOf(subHeadingMarker);
  if (subStart !== -1 && currentBody.slice(subStart + subHeadingMarker.length).startsWith(ownMarkerPrefix)) {
    // Replace only this prior sub-block, preserving everything before it
    // (human prose, or an earlier unrelated "### " sub-section) untouched.
    const beforeSub = currentBody.slice(0, subStart).replace(/\n+$/, "");
    const afterSubStart = currentBody.indexOf("\n### ", subStart + subHeadingMarker.length);
    const restAfterSub = afterSubStart === -1 ? "" : currentBody.slice(afterSubStart).replace(/^\n+/, "\n");
    const rebuilt = beforeSub ? `${beforeSub}\n\n${subBlock}` : subBlock;
    return `${before}${rebuilt}${restAfterSub}\n${after}`;
  }

  return `${before}${currentBody}\n\n${subBlock}\n${after}`;
}
