#!/usr/bin/env python3
"""Canonical source for docs/images/prompt-composition.svg (AIEF Core 3.1, docs/architecture.md).

Answers: What goes into an AIEF prompt? Regenerate with
`python3 scripts/diagrams/generate_prompt_composition.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import PALETTE, arrow, assemble, group_box, heading, write_svg, xml_escape  # noqa: E402

WIDTH, HEIGHT = 1300, 640
SVG_PATH = "docs/images/prompt-composition.svg"
PNG_PATH = "docs/images/prompt-composition.png"

GROUP_X = 40
GROUP_W = 540
COMPOSER_X = 660
COMPOSER_W = 230
OUTPUT_X = 990
OUTPUT_W = 270

GROUPS = [
    ("Universal instructions", "slate", ["AGENTS.md — always the base contract", "Assistant adapter (optional)", "Profile"]),
    ("Project intelligence", "blue", ["LIDR", "Standards", "Recommended Skills"]),
    (
        "Change execution context",
        "violet",
        ["Change spec / tasks", "Workflow & SDD", "Requested Skill", "Hook observations"],
    ),
]


def item_line(x, y, w, text, color):
    c = PALETTE[color]
    return (
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="30" rx="8" fill="#ffffff" stroke="{border}" stroke-width="1"/>\n'
        '    <text x="12" y="19" font-size="11.5" font-weight="600" fill="{text}">{label}</text>\n'
        "  </g>"
    ).format(x=x, y=y, w=w, border=c["border"], text=c["text"], label=xml_escape(text))


def build():
    body = []
    body.append(heading(40, 38, "AIEF Core 3.1 — Prompt Composition", "What goes into an AIEF prompt — three groups feed one composer"))

    top_y = 76
    group_gap = 22
    heights = [44 + len(items) * 36 + 10 for _, _, items in GROUPS]
    ys = []
    y = top_y
    for i, (title, color, items) in enumerate(GROUPS):
        h = heights[i]
        ys.append(y)
        body.append(group_box(GROUP_X, y, GROUP_W, h, title, color))
        iy = y + 44
        for it in items:
            body.append(item_line(GROUP_X + 16, iy, GROUP_W - 32, it, color))
            iy += 36
        y += h + group_gap

    total_h = sum(heights) + 2 * group_gap
    composer_h = 140
    composer_y = top_y + total_h / 2 - composer_h / 2
    body.append(
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="{h}" rx="16" fill="#0f172a" filter="url(#card-shadow)"/>\n'
        '    <text x="{cx}" y="58" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">Prompt</text>\n'
        '    <text x="{cx}" y="80" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">Composer</text>\n'
        '    <text x="{cx}" y="106" font-size="10.5" fill="#94a3b8" text-anchor="middle">aief prompt</text>\n'
        "  </g>".format(x=COMPOSER_X, y=composer_y, w=COMPOSER_W, h=composer_h, cx=COMPOSER_W / 2)
    )

    for i, y in enumerate(ys):
        gy = y + heights[i] / 2
        cy = composer_y + composer_h / 2 + (i - 1) * 24
        body.append(
            arrow(
                GROUP_X + GROUP_W,
                gy,
                COMPOSER_X,
                cy,
                color=GROUPS[i][1],
                path="M {x1} {y1} C {mx} {y1}, {mx} {y2}, {x2} {y2}".format(
                    x1=GROUP_X + GROUP_W, y1=gy, x2=COMPOSER_X, y2=cy, mx=(GROUP_X + GROUP_W + COMPOSER_X) / 2
                ),
            )
        )

    out_h = 160
    out_y = composer_y + composer_h / 2 - out_h / 2
    body.append(
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="{h}" rx="14" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" filter="url(#card-shadow)"/>\n'
        '    <text x="20" y="34" font-size="13.5" font-weight="800" fill="#166534">Portable ready-to-paste</text>\n'
        '    <text x="20" y="54" font-size="13.5" font-weight="800" fill="#166534">prompt</text>\n'
        '    <text x="20" y="82" font-size="11" fill="#166534">Opens with "Use AGENTS.md." for</text>\n'
        '    <text x="20" y="99" font-size="11" fill="#166534">every assistant, or for none.</text>\n'
        '    <text x="20" y="124" font-size="11" fill="#166534">AIEF generates this text — it</text>\n'
        '    <text x="20" y="141" font-size="11" fill="#166534" font-weight="700">never invokes an assistant.</text>\n'
        "  </g>".format(x=OUTPUT_X, y=out_y, w=OUTPUT_W, h=out_h)
    )
    body.append(arrow(COMPOSER_X + COMPOSER_W, composer_y + composer_h / 2, OUTPUT_X, out_y + out_h / 2, color="green", width=2.5))

    body.append(
        '  <text x="40" y="{y}" font-size="12" fill="#64748b">A group with nothing to contribute (no adapter, no track, no requested Skill) stays silent — it never renders an empty section.</text>'.format(
            y=top_y + total_h + 24
        )
    )

    return body


def main():
    body = build()
    svg = assemble(
        WIDTH,
        HEIGHT,
        "pc-title",
        "AIEF prompt composition",
        "pc-desc",
        "Three groups feed the Prompt Composer: Universal instructions (AGENTS.md as the always-"
        "present base contract, an optional assistant adapter, and a profile), Project "
        "intelligence (LIDR, Standards, recommended Skills), and Change execution context (Change "
        "spec/tasks, Workflow and SDD, a requested Skill, Hook observations). The composer "
        "produces one portable, ready-to-paste prompt; AIEF generates this text but never invokes "
        "an assistant itself, and a group with nothing to contribute stays silent rather than "
        "rendering an empty section.",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
