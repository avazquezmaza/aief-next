#!/usr/bin/env python3
"""Canonical source for docs/images/graph-engineering.svg (AIEF, docs/architecture.md).

Answers: How does Graph Engineering affect work selection? Regenerate with
`python3 scripts/diagrams/generate_graph_engineering.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import PALETTE, arrow, assemble, group_box, heading, write_svg, xml_escape  # noqa: E402

WIDTH, HEIGHT = 1300, 660
SVG_PATH = "docs/images/graph-engineering.svg"
PNG_PATH = "docs/images/graph-engineering.png"

PIPELINE = [
    ("Change manifests\n(dependsOn)", "gray"),
    ("Graph builder", "blue"),
    ("Validation", "red"),
    ("Deterministic\ntopological order", "blue"),
    ("Eligibility\nevaluation", "amber"),
    ("Smart Workflow", "green"),
    ("status --graph\nstatus --next", "green"),
]

CARD_W, CARD_H = 160, 74
GAP = 16
PIPE_Y = 80


def pipe_card(x, title, color):
    c = PALETTE[color]
    lines = title.split("\n")
    out = ['  <g transform="translate({x},{y})">'.format(x=x, y=PIPE_Y)]
    out.append(
        '    <rect width="{w}" height="{h}" rx="10" fill="{bg}" stroke="{border}" stroke-width="1.5" '
        'filter="url(#card-shadow)"/>'.format(w=CARD_W, h=CARD_H, bg=c["bg"], border=c["border"])
    )
    ty = CARD_H / 2 - (len(lines) - 1) * 8 + 4
    for line in lines:
        out.append(
            '    <text x="{cx}" y="{ty}" font-size="12" font-weight="700" fill="{text}" text-anchor="middle">{l}</text>'.format(
                cx=CARD_W / 2, ty=ty, text=c["text"], l=xml_escape(line)
            )
        )
        ty += 17
    out.append("  </g>")
    return "\n".join(out)


def build():
    body = []
    body.append(
        heading(40, 38, "AIEF — Graph Engineering", "How declared dependsOn edges shape eligibility and the next-Change recommendation")
    )

    total_w = len(PIPELINE) * CARD_W + (len(PIPELINE) - 1) * GAP
    start_x = (WIDTH - total_w) / 2
    xs = [start_x + i * (CARD_W + GAP) for i in range(len(PIPELINE))]
    for x, (title, color) in zip(xs, PIPELINE):
        body.append(pipe_card(x, title, color))
    for i in range(len(PIPELINE) - 1):
        cy = PIPE_Y + CARD_H / 2
        body.append(arrow(xs[i] + CARD_W, cy, xs[i + 1], cy, color="slate"))

    # Validation issues branch (under "Validation", index 2).
    branch_y = PIPE_Y + CARD_H + 50
    branch_h = 130
    val_x = xs[2] - 40
    val_w = CARD_W + 80
    body.append(arrow(xs[2] + CARD_W / 2, PIPE_Y + CARD_H, xs[2] + CARD_W / 2, branch_y, color="red"))
    body.append(group_box(val_x, branch_y, val_w, branch_h, "Validation catches", "red"))
    for i, issue in enumerate(["missing dependency", "duplicate dependency", "self dependency", "cycle detection"]):
        body.append(
            '  <text x="{x}" y="{y}" font-size="11" fill="#991b1b">- {t}</text>'.format(
                x=val_x + 16, y=branch_y + 44 + i * 20, t=xml_escape(issue)
            )
        )

    # Eligibility factors branch (under "Eligibility evaluation", index 4).
    elig_x = xs[4] - 45
    elig_w = CARD_W + 90
    body.append(arrow(xs[4] + CARD_W / 2, PIPE_Y + CARD_H, xs[4] + CARD_W / 2, branch_y, color="amber"))
    body.append(group_box(elig_x, branch_y, elig_w, branch_h, "Eligibility needs", "amber"))
    for i, factor in enumerate(["open (not closed)", "dependencies completed", "no workflow blocker", "deterministic order"]):
        body.append(
            '  <text x="{x}" y="{y}" font-size="11" fill="#92400e">- {t}</text>'.format(
                x=elig_x + 16, y=branch_y + 44 + i * 20, t=xml_escape(factor)
            )
        )

    # A/B example.
    ex_y = branch_y + branch_h + 50
    ex_h = 150
    body.append(group_box(40, ex_y, WIDTH - 80, ex_h, 'Example — Change B declares "dependsOn": ["Change A"]', "slate"))

    def state_card(x, w, label, items, color):
        c = PALETTE[color]
        out = ['  <g transform="translate({x},{y})">'.format(x=x, y=ex_y + 44)]
        out.append(
            '    <rect width="{w}" height="88" rx="10" fill="#ffffff" stroke="{border}" stroke-width="1.5"/>'.format(
                w=w, border=c["border"]
            )
        )
        out.append(
            '    <text x="14" y="22" font-size="12" font-weight="800" fill="{t}">{l}</text>'.format(t=c["text"], l=xml_escape(label))
        )
        yy = 42
        for it in items:
            out.append('    <text x="14" y="{y}" font-size="11" fill="{t}">{i}</text>'.format(y=yy, t=c["text"], i=xml_escape(it)))
            yy += 18
        out.append("  </g>")
        return "\n".join(out)

    state_w = (WIDTH - 80 - 32 - 60) / 2
    body.append(
        state_card(
            60,
            state_w,
            "State 1 — A open",
            ["A: open -> eligible", "B: waiting on A"],
            "amber",
        )
    )
    body.append(arrow(60 + state_w + 10, ex_y + 44 + 44, 60 + state_w + 50, ex_y + 44 + 44, color="slate"))
    body.append(
        state_card(
            60 + state_w + 60,
            state_w,
            "State 2 — A closed",
            ["A: closed", "B: dependency satisfied -> eligible"],
            "green",
        )
    )

    # Clarifications.
    notes_y = ex_y + ex_h + 34
    notes = [
        "Only an explicit dependsOn entry creates an edge — the Graph never infers one.",
        "Zero declared edges means every open Change is independent and immediately eligible.",
        "The Graph is rebuilt from changes/*/manifest.json on every command — nothing is persisted separately.",
        "The Graph never writes a Change or a manifest — building it has no side effects.",
        "status --graph is read-only; status --next recommends one Change by id and never executes it.",
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
        "ge-title",
        "AIEF Graph Engineering",
        "ge-desc",
        "Change manifests declaring dependsOn feed a Graph builder, which validates (missing, "
        "duplicate, or self dependencies, and cycles) and computes a deterministic topological "
        "order; eligibility evaluation combines that with open/closed state and Workflow blockers "
        "to feed Smart Workflow, surfaced by status --graph and status --next. Example: Change B "
        "depends on Change A — while A is open, A is eligible and B waits; once A is closed, B "
        "becomes eligible. Only explicit dependsOn entries create edges, the Graph is rebuilt from "
        "disk on every command with no separate persisted state, it never modifies a Change, "
        "status --graph is read-only, and status --next only recommends — it never executes a "
        "Change.",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
