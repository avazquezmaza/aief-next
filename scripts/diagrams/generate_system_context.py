#!/usr/bin/env python3
"""Canonical source for docs/images/system-context.svg (AIEF, docs/architecture.md).

Answers: Where does AIEF sit in the engineering system? Regenerate with
`python3 scripts/diagrams/generate_system_context.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import PALETTE, arrow, assemble, group_box, heading, write_svg, xml_escape  # noqa: E402

WIDTH, HEIGHT = 1300, 600
SVG_PATH = "docs/images/system-context.svg"
PNG_PATH = "docs/images/system-context.png"

COL_W = 330
COL_GAP = 115
ROW1_Y = 76
ROW1_H = 300


def item_chip(x, y, w, text, color="slate"):
    c = PALETTE[color]
    return (
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="34" rx="8" fill="{bg}" stroke="{border}" stroke-width="1"/>\n'
        '    <text x="12" y="21" font-size="12" font-weight="600" fill="{text}">{label}</text>\n'
        "  </g>"
    ).format(x=x, y=y, w=w, bg=c["bg"], border=c["border"], text=c["text"], label=xml_escape(text))


def zone(x, title, subtitle, items, color):
    body = [group_box(x, ROW1_Y, COL_W, ROW1_H, title, color)]
    body.append(
        '  <text x="{x}" y="{y}" font-size="11" fill="#64748b">{s}</text>'.format(
            x=x + 16, y=ROW1_Y + 42, s=xml_escape(subtitle)
        )
    )
    iy = ROW1_Y + 56
    for it in items:
        body.append(item_chip(x + 16, iy, COL_W - 32, it, color=color))
        iy += 42
    return body, x + COL_W


def build():
    body = []
    body.append(heading(40, 38, "AIEF — System Context", "Where AIEF sits among humans, tools, and the repository"))

    x1 = 40
    ext_body, x1_end = zone(
        x1,
        "External inputs",
        "Outside AIEF's control",
        ["Humans", "Requirement sources", "Optional specification providers"],
        "gray",
    )
    body.extend(ext_body)

    x2 = x1_end + COL_GAP
    core_body, x2_end = zone(
        x2,
        "AIEF Core",
        "Reads and writes only the repository below",
        [
            "Bootstrap and discovery",
            "Change management",
            "Prompt composition",
            "Verification",
            "Graph and next recommendation",
        ],
        "blue",
    )
    body.extend(core_body)

    x3 = x2_end + COL_GAP
    exec_body, x3_end = zone(
        x3,
        "Execution environment",
        "Outside AIEF — humans control it",
        ["AI assistants", "Project tools", "Tests and CI", "Git and release tools"],
        "violet",
    )
    body.extend(exec_body)

    gap1_mid = (x1_end + x2) / 2
    gap2_mid = (x2_end + x3) / 2
    mid_y = ROW1_Y + 130
    body.append(arrow(x1_end, mid_y, x2, mid_y, color="slate"))
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#64748b" text-anchor="middle">requirements,</text>'.format(
            x=gap1_mid, y=mid_y - 20
        )
    )
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#64748b" text-anchor="middle">decisions</text>'.format(
            x=gap1_mid, y=mid_y - 8
        )
    )
    body.append(arrow(x2_end, mid_y, x3, mid_y, color="blue"))
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#1d4ed8" text-anchor="middle">generates</text>'.format(
            x=gap2_mid, y=mid_y - 20
        )
    )
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#1d4ed8" text-anchor="middle">prompt for</text>'.format(
            x=gap2_mid, y=mid_y - 8
        )
    )
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#991b1b" text-anchor="middle">never</text>'.format(
            x=gap2_mid, y=mid_y + 22
        )
    )
    body.append(
        '  <text x="{x}" y="{y}" font-size="10" fill="#991b1b" text-anchor="middle">executes</text>'.format(
            x=gap2_mid, y=mid_y + 34
        )
    )

    # Repository band.
    band_y = ROW1_Y + ROW1_H + 60
    band_h = 130
    body.append(group_box(40, band_y, WIDTH - 80, band_h, "Visible repository state — the only place AIEF reads or writes", "green"))
    repo_items = ["AGENTS.md", "changes/", "knowledge/", "ai-specs/", "evidence"]
    ix = 60
    iy = band_y + 48
    for it in repo_items:
        w = max(120, len(it) * 9 + 32)
        body.append(item_chip(ix, iy, w, it, color="green"))
        ix += w + 14

    # Vertical connectors down into the repository band.
    body.append(arrow(x2 + COL_W / 2 - 14, ROW1_Y + ROW1_H, x2 + COL_W / 2 - 14, band_y, color="blue"))
    body.append(arrow(x2 + COL_W / 2 + 14, band_y, x2 + COL_W / 2 + 14, ROW1_Y + ROW1_H, color="blue"))
    body.append(
        '  <text x="{x}" y="{y}" font-size="10.5" fill="#1d4ed8" text-anchor="middle">reads / writes</text>'.format(
            x=x2 + COL_W / 2, y=ROW1_Y + ROW1_H + 34
        )
    )
    body.append(arrow(x3 + COL_W / 2, ROW1_Y + ROW1_H, x3 + COL_W / 2, band_y, color="violet"))
    body.append(
        '  <text x="{x}" y="{y}" font-size="10.5" fill="#6b21a8" text-anchor="middle">assistants + tools/CI write evidence</text>'.format(
            x=x3 + COL_W / 2, y=ROW1_Y + ROW1_H + 34
        )
    )

    body.append(
        '  <text x="40" y="{y}" font-size="12" fill="#64748b">Humans retain scope, merge, release, and publication authority throughout the Execution environment. AIEF keeps no hidden state — nothing exists outside the files shown above.</text>'.format(
            y=band_y + band_h + 30
        )
    )

    return body


def main():
    body = build()
    svg = assemble(
        WIDTH,
        HEIGHT,
        "sc-title",
        "AIEF system context",
        "sc-desc",
        "Four zones: external inputs (humans, requirement sources, optional specification "
        "providers) feed AIEF Core (bootstrap, Change management, prompt composition, "
        "verification, Graph and next recommendation), which reads and writes only the visible "
        "repository state (AGENTS.md, changes/, knowledge/, ai-specs/, evidence) and generates a "
        "prompt for the execution environment (AI assistants, project tools, tests, CI, Git and "
        "release tools) without ever executing it itself. Assistants and project tools write "
        "evidence back into the repository. Humans retain scope, merge, release, and publication "
        "authority throughout.",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
