#!/usr/bin/env python3
"""Canonical source for docs/images/adoption-workflow.svg (AIEF Core 3.1, docs/getting-started.md).

Answers: How is AIEF adopted into an existing repository? Regenerate with
`python3 scripts/diagrams/generate_adoption_workflow.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import PALETTE, arrow, assemble, group_box, heading, write_svg, xml_escape  # noqa: E402

WIDTH, HEIGHT = 1300, 620
SVG_PATH = "docs/images/adoption-workflow.svg"
PNG_PATH = "docs/images/adoption-workflow.png"

PIPELINE = [
    ("Existing\nrepository", "gray"),
    ("doctor\ninspect only", "slate"),
    ("bootstrap\nadd visible\ngovernance structure", "blue"),
    ("verify\nvalidate adoption", "green"),
    ("analyze\nrecord existing-project\nunderstanding", "blue"),
    ("first delivery\nChange", "green"),
]

CARD_W, CARD_H = 180, 92
GAP = 14
PIPE_Y = 84


def pipe_card(x, title, color):
    c = PALETTE[color]
    lines = title.split("\n")
    out = ['  <g transform="translate({x},{y})">'.format(x=x, y=PIPE_Y)]
    out.append(
        '    <rect width="{w}" height="{h}" rx="10" fill="{bg}" stroke="{border}" stroke-width="1.5" '
        'filter="url(#card-shadow)"/>'.format(w=CARD_W, h=CARD_H, bg=c["bg"], border=c["border"])
    )
    ty = CARD_H / 2 - (len(lines) - 1) * 9 + 5
    for i, line in enumerate(lines):
        weight = "800" if i == 0 else "600"
        size = 13 if i == 0 else 11.5
        out.append(
            '    <text x="{cx}" y="{ty}" font-size="{sz}" font-weight="{w}" fill="{text}" '
            'text-anchor="middle">{l}</text>'.format(
                cx=CARD_W / 2, ty=ty, sz=size, w=weight, text=c["text"], l=xml_escape(line)
            )
        )
        ty += 18
    out.append("  </g>")
    return "\n".join(out)


def side_box(x, y, w, h, label, color, items):
    body = [group_box(x, y, w, h, label, color)]
    c = PALETTE[color]
    for i, item in enumerate(items):
        body.append(
            '  <text x="{x}" y="{y}" font-size="12" fill="{t}">- {i}</text>'.format(
                x=x + 16, y=y + 46 + i * 21, t=c["text"], i=xml_escape(item)
            )
        )
    return body


def build():
    body = []
    body.append(
        heading(
            40,
            38,
            "AIEF Core 3.1 — Adopting AIEF into an existing repository",
            "doctor inspects, bootstrap adds visible structure, verify validates, analyze records understanding",
        )
    )

    total_w = len(PIPELINE) * CARD_W + (len(PIPELINE) - 1) * GAP
    start_x = (WIDTH - total_w) / 2
    xs = [start_x + i * (CARD_W + GAP) for i in range(len(PIPELINE))]
    for x, (title, color) in zip(xs, PIPELINE):
        body.append(pipe_card(x, title, color))
    for i in range(len(PIPELINE) - 1):
        cy = PIPE_Y + CARD_H / 2
        body.append(arrow(xs[i] + CARD_W, cy, xs[i + 1], cy, color="slate"))

    # Preserved / Added side-by-side boxes below the pipeline.
    box_y = PIPE_Y + CARD_H + 60
    box_h = 190
    box_w = (WIDTH - 80 - 32) / 2
    body.extend(
        side_box(
            40,
            box_y,
            box_w,
            box_h,
            "Preserved (never modified by bootstrap)",
            "green",
            ["application code", "tests", "CI configuration", "Git history", "existing tools (OpenSpec, SpecBoot, ...)"],
        )
    )
    body.extend(
        side_box(
            40 + box_w + 32,
            box_y,
            box_w,
            box_h,
            "Added or reused (created only when missing)",
            "blue",
            ["AGENTS.md", "changes/", "knowledge/ (standards, skills.md)", "adoption records (Adoption Change)", "Analysis Change (from analyze)"],
        )
    )

    # Down-arrows from bootstrap/verify area into the side boxes, showing the split.
    mid_x = xs[2] + CARD_W / 2
    body.append(arrow(mid_x, PIPE_Y + CARD_H, 40 + box_w * 0.75, box_y, color="green", dashed=True))
    body.append(arrow(mid_x, PIPE_Y + CARD_H, 40 + box_w + 32 + box_w * 0.25, box_y, color="blue", dashed=True))

    notes_y = box_y + box_h + 34
    notes = [
        "doctor never writes to the project — every write happens in bootstrap, analyze, or a later delivery Change.",
        "bootstrap never overwrites an existing file (AGENTS.md, knowledge/standards/, CI gate) and is idempotent.",
        "After adoption there are typically two open Changes: the Adoption Change and the Analysis Change.",
        "The Adoption Change records that AIEF was added; the Analysis Change captures architecture, stack, risks and gaps.",
        "Delivery Changes (new-change / enrich) come after — they are the first real feature, fix or refactor.",
    ]
    for i, n in enumerate(notes):
        body.append('  <text x="40" y="{y}" font-size="12" fill="#64748b">- {t}</text>'.format(y=notes_y + i * 20, t=xml_escape(n)))

    return body, notes_y + len(notes) * 20 + 10


def main():
    body, end_y = build()
    height = max(HEIGHT, int(end_y) + 20)
    svg = assemble(
        WIDTH,
        height,
        "aw-title",
        "AIEF adoption workflow for an existing repository",
        "aw-desc",
        "An existing repository flows through doctor (inspect only, no writes), bootstrap (adds "
        "visible governance structure such as AGENTS.md, changes/, and knowledge/, never touching "
        "application code, never overwriting existing files), verify (validates the resulting "
        "structure), and analyze (records an Analysis Change capturing the existing project's "
        "architecture, stack and risks), before the first delivery Change begins. Application code, "
        "tests, CI configuration, Git history and existing tools like OpenSpec or SpecBoot are "
        "preserved throughout; AGENTS.md, changes/, knowledge/, and the Adoption and Analysis "
        "Changes are added or reused. Two Changes are typically open after adoption: the Adoption "
        "Change and the Analysis Change.",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
