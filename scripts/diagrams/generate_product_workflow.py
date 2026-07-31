#!/usr/bin/env python3
"""Canonical source for docs/images/product-workflow.svg (AIEF Core 3.1, README).

Answers: How does AIEF work? Regenerate with
`python3 scripts/diagrams/generate_product_workflow.py` — never hand-edit the SVG.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import assemble, arrow, badge, card, group_box, heading, write_svg  # noqa: E402

WIDTH, HEIGHT = 1300, 560
SVG_PATH = "docs/images/product-workflow.svg"
PNG_PATH = "docs/images/product-workflow.png"

CARD_W, CARD_H = 272, 108


def build():
    body = []
    body.append(
        heading(40, 38, "AIEF Core 3.1 — Product Workflow", "How a requirement becomes a closed, verified Change")
    )

    row1_y = 76
    row2_y = 240
    gap = 32
    xs = [40, 40 + (CARD_W + gap), 40 + 2 * (CARD_W + gap), 40 + 3 * (CARD_W + gap)]

    body.append(
        card(xs[0], row1_y, CARD_W, CARD_H, "Requirement or idea", ["A ticket, a conversation,", "or a plain idea."], color="gray")
    )
    body.append(
        card(xs[1], row1_y, CARD_W, CARD_H, "AIEF Change", ["change.md + spec.md +", "tasks.md under changes/."], color="blue")
    )
    body.append(
        card(xs[2], row1_y, CARD_W, CARD_H, "Context-complete prompt", ["aief prompt composes it —", "AIEF does not call the assistant."], color="blue")
    )
    body.append(
        card(xs[3], row1_y, CARD_W, CARD_H, "AI assistant implementation", ["Any assistant modifies the", "project from the pasted prompt."], color="violet")
    )
    for i in range(3):
        cx = xs[i] + CARD_W
        cy = row1_y + CARD_H / 2
        body.append(arrow(cx, cy, xs[i + 1], cy, color="blue"))

    # Row 2 continues right-to-left (snake layout) so every connector stays short and uncrossed.
    row2_xs = [xs[3], xs[2], xs[1]]
    body.append(
        card(row2_xs[0], row2_y, CARD_W, CARD_H, "Evidence & verification", ["evidence.md written; aief", "verify checks structure."], color="green")
    )
    body.append(
        card(row2_xs[1], row2_y, CARD_W, CARD_H, "Close", ["aief close --yes —", "humans control merge/release."], color="green")
    )
    body.append(
        card(row2_xs[2], row2_y, CARD_W, CARD_H, "Graph / next recommendation", ["status --graph / --next", "recommends only, never runs."], color="amber")
    )
    for i in range(2):
        cx = row2_xs[i]
        cy = row2_y + CARD_H / 2
        body.append(arrow(cx, cy, row2_xs[i + 1] + CARD_W, cy, color="green"))

    # Row1 "AI assistant implementation" down to row2 "Evidence & verification" (same column).
    down_x = xs[3] + CARD_W / 2
    body.append(arrow(down_x, row1_y + CARD_H, down_x, row2_y, color="violet"))

    # Loop back: Graph/next (row2, under AIEF Change's column) up to AIEF Change (recommendation only).
    loop_x = xs[1] + CARD_W / 2
    body.append(arrow(loop_x, row2_y, loop_x, row1_y + CARD_H, color="amber", dashed=True))
    body.append(badge(loop_x - 115, row2_y - 26, "recommends next (not automatic)", color="amber", w=230))

    # Opt-in capabilities band.
    band_y = 400
    body.append(group_box(40, band_y, WIDTH - 80, 96, "Opt-in capabilities — attach to any Change, never block verify/close", "slate"))
    caps = ["LIDR", "Skills", "Standards", "Workflow tracks", "Harness / Hooks", "Loop", "Change Graph"]
    cx = 60
    cy = band_y + 48
    for cap in caps:
        w = len(cap) * 7 + 28
        body.append(badge(cx, cy, cap, color="amber", w=w))
        cx += w + 14

    # Footnotes.
    notes_y = band_y + 130
    body.append(
        '  <text x="40" y="{y}" font-size="12" fill="#64748b">AIEF composes the prompt and checks evidence — it never calls an assistant, runs tests, or commits. Humans decide scope, merge, and release throughout.</text>'.format(
            y=notes_y
        )
    )

    return body


def main():
    body = build()
    svg = assemble(
        WIDTH,
        HEIGHT,
        "pw-title",
        "AIEF Core 3.1 product workflow",
        "pw-desc",
        "A requirement becomes an AIEF Change, AIEF composes a context-complete prompt, an AI "
        "assistant implements it, evidence and verification follow, the Change is closed, and "
        "status --next recommends the following Change without executing it. Opt-in capabilities "
        "such as LIDR, Skills, Standards, Workflow tracks, Harness/Hooks, Loop, and the Change "
        "Graph attach without changing this shape.",
        body,
    )
    write_svg(SVG_PATH, svg)
    print("Generated {}".format(SVG_PATH))


if __name__ == "__main__":
    main()
