#!/usr/bin/env python3
"""Canonical source for docs/images/core-runtime.svg (AIEF Core 3.1, docs/architecture.md).

Answers: How is AIEF implemented internally? Regenerate with
`python3 scripts/diagrams/generate_core_runtime.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import PALETTE, arrow, assemble, heading, write_svg, xml_escape  # noqa: E402

WIDTH, HEIGHT = 1300, 730
SVG_PATH = "docs/images/core-runtime.svg"
PNG_PATH = "docs/images/core-runtime.png"

BAND_X = 40
BAND_W = WIDTH - 80
BAND_H = 90
GAP = 34
LABEL_W = 230

LAYERS = [
    ("CLI Commands", "gray", ["doctor", "bootstrap", "prompt", "verify", "status", "close"]),
    (
        "Application Services",
        "blue",
        ["discovery", "Change lifecycle", "prompt composition", "verification", "workflow", "graph and next"],
    ),
    ("Domain Models", "violet", ["Change", "Manifest", "Requirement", "Skill", "Hook", "Graph"]),
    (
        "Registries and Providers",
        "amber",
        ["workflow tracks", "skills", "standards", "hooks", "verification rules", "requirement providers", "SDD providers"],
    ),
    ("Repository Files", "green", ["AGENTS.md", "changes/", "knowledge/", "ai-specs/", "evidence"]),
]


def band(y, title, color, items):
    c = PALETTE[color]
    out = []
    out.append('  <g transform="translate({x},{y})">'.format(x=BAND_X, y=y))
    out.append(
        '    <rect width="{w}" height="{h}" rx="12" fill="{bg}" stroke="{border}" stroke-width="1.5" '
        'filter="url(#card-shadow)"/>'.format(w=BAND_W, h=BAND_H, bg=c["bg"], border=c["border"])
    )
    out.append(
        '    <rect width="{lw}" height="{h}" rx="12" fill="{accent}"/>'.format(lw=LABEL_W, h=BAND_H, accent=c["accent"])
    )
    out.append('    <rect x="{lw2}" width="20" height="{h}" fill="{accent}"/>'.format(lw2=LABEL_W - 20, h=BAND_H, accent=c["accent"]))
    out.append(
        '    <text x="20" y="{cy}" font-size="15" font-weight="800" fill="#ffffff">{t}</text>'.format(
            cy=BAND_H / 2 + 5, t=xml_escape(title)
        )
    )
    ix = LABEL_W + 24
    iy = BAND_H / 2 - 15
    for it in items:
        w = len(it) * 6.7 + 24
        out.append(
            '    <g transform="translate({x},{y})">\n'
            '      <rect width="{w}" height="30" rx="15" fill="#ffffff" stroke="{border}" stroke-width="1"/>\n'
            '      <text x="{cx}" y="19" font-size="11.5" font-weight="600" fill="{text}" text-anchor="middle">{label}</text>\n'
            "    </g>".format(x=ix, y=iy, w=w, border=c["border"], cx=w / 2, text=c["text"], label=xml_escape(it))
        )
        ix += w + 10
    out.append("  </g>")
    return "\n".join(out)


def build():
    body = []
    body.append(heading(40, 38, "AIEF Core 3.1 — Core Runtime Architecture", "Every subsystem follows the same four-layer split, top to bottom"))

    y = 76
    ys = []
    for title, color, items in LAYERS:
        ys.append(y)
        body.append(band(y, title, color, items))
        y += BAND_H + GAP

    for i in range(len(ys) - 1):
        cx = BAND_X + LABEL_W - 10
        body.append(arrow(cx, ys[i] + BAND_H, cx, ys[i + 1], color="slate", width=2.5))

    footnote_y = ys[-1] + BAND_H + 34
    body.append(
        '  <text x="40" y="{y}" font-size="12" fill="#64748b">Each layer owns one responsibility — CLI parses and renders, Services orchestrate, Domain Models hold shape and validation.</text>'.format(
            y=footnote_y
        )
    )
    body.append(
        '  <text x="40" y="{y}" font-size="12" fill="#64748b">Registries map an id to an implementation, and every read/write ends at the Repository. See the Implementation Map table for exact file paths.</text>'.format(
            y=footnote_y + 18
        )
    )

    return body


def main():
    body = build()
    svg = assemble(
        WIDTH,
        HEIGHT,
        "cr-title",
        "AIEF core runtime architecture",
        "cr-desc",
        "Five layers, top to bottom: CLI Commands (doctor, bootstrap, prompt, verify, status, "
        "close) call Application Services (discovery, Change lifecycle, prompt composition, "
        "verification, workflow, graph and next), which use Domain Models (Change, Manifest, "
        "Requirement, Skill, Hook, Graph) and Registries and Providers (workflow tracks, skills, "
        "standards, hooks, verification rules, requirement providers, SDD providers), all of which "
        "ultimately read and write Repository Files (AGENTS.md, changes/, knowledge/, ai-specs/, "
        "evidence).",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
