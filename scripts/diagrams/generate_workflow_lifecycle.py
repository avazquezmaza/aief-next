#!/usr/bin/env python3
"""Canonical source for docs/images/workflow-lifecycle.svg (AIEF Core 3.1, docs/workflow.md).

Answers: What is the detailed lifecycle of an AIEF Change? Regenerate with
`python3 scripts/diagrams/generate_workflow_lifecycle.py` — never hand-edit the SVG. This is also
the source `scripts/generate_workflow_diagram.py` wraps to keep docs/images/workflow.svg/.png
(the standalone illustrated export) reproducible without a second, drifting diagram.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import arrow, assemble, badge, card, group_box, heading, write_svg  # noqa: E402

WIDTH, HEIGHT = 1300, 720
SVG_PATH = "docs/images/workflow-lifecycle.svg"
PNG_PATH = "docs/images/workflow-lifecycle.png"

COL_W = 380
COL_GAP = 40
COL_Y = 140
CARD_H = 86
CARD_GAP = 16

LEVELS = [
    (
        "Level 1 — Context & Change preparation",
        "blue",
        [
            ("aief doctor", ["Environment + project readiness check."]),
            ("aief bootstrap", ["Adopts a project — creates AGENTS.md,", "changes/, knowledge/. Never overwrites."]),
            ("analyze / new-change / enrich", ["Creates the Change: change.md,", "spec.md, tasks.md."]),
            ("aief prompt", ["Composes the context-complete prompt.", "AIEF does not call the assistant."]),
        ],
    ),
    (
        "Level 2 — Assistant implementation",
        "violet",
        [
            ("AI assistant (any)", ["Implements from the pasted prompt.", "OpenSpec is an optional structuring path."]),
            ("Write evidence.md", ["Records what was actually done and", "verified — not a template."]),
        ],
    ),
    (
        "Level 3 — Verification & closing",
        "green",
        [
            ("aief verify", ["Structural check, optional requirement", "check. Never AI-judged."]),
            ("aief close --yes", ["Marks the Change Closed once ready."]),
            ("status --graph / --next", ["Read-only graph view; recommends one", "Change — never executes it."]),
        ],
    ),
]


def build():
    body = []
    body.append(
        heading(40, 38, "AIEF Core 3.1 — Workflow Lifecycle", "The detailed path of a single Change, level by level")
    )

    xs = [40, 40 + COL_W + COL_GAP, 40 + 2 * (COL_W + COL_GAP)]
    max_cards = max(len(steps) for _, _, steps in LEVELS)
    col_h = max_cards * CARD_H + (max_cards - 1) * CARD_GAP + 56
    col_heights = [len(steps) * CARD_H + (len(steps) - 1) * CARD_GAP + 56 for _, _, steps in LEVELS]

    prompt_top = None
    prompt_left = None
    analyze_right = None
    verify_top = None
    verify_left = None
    status_right = None
    first_card_mid = {}
    last_card_mid = {}

    for col_idx, (x, (title, color, steps)) in enumerate(zip(xs, LEVELS)):
        body.append(group_box(x, COL_Y, COL_W, col_heights[col_idx], title, color))
        cy = COL_Y + 44
        for step_idx, (step_title, lines) in enumerate(steps):
            body.append(card(x + 16, cy, COL_W - 32, CARD_H, step_title, lines, color=color))
            if step_idx == 0:
                first_card_mid[col_idx] = (x + 16, cy + CARD_H / 2)
            if step_idx == len(steps) - 1:
                last_card_mid[col_idx] = (x + 16 + COL_W - 32, cy + CARD_H / 2)
            if step_title == "aief prompt":
                prompt_top = (x + 16 + (COL_W - 32) / 2, cy)
                prompt_left = (x + 16, cy + CARD_H / 2)
            if step_title == "analyze / new-change / enrich":
                analyze_right = (x + 16 + COL_W - 32, cy + CARD_H / 2)
            if step_title == "aief verify":
                verify_top = (x + 16 + (COL_W - 32) / 2, cy)
                verify_left = (x + 16, cy + CARD_H / 2)
            if step_title == "status --graph / --next":
                status_right = (x + 16 + COL_W - 32, cy + CARD_H / 2)
            cy += CARD_H + CARD_GAP

    # Sequential arrows within each column.
    for x, (_, color, steps) in zip(xs, LEVELS):
        cy = COL_Y + 44
        for i in range(len(steps) - 1):
            top = cy + CARD_H
            body.append(arrow(x + COL_W / 2, top, x + COL_W / 2, top + CARD_GAP, color=color))
            cy += CARD_H + CARD_GAP

    # Between-column arrows: last card of one level into first card of the next.
    for i in range(2):
        y1 = last_card_mid[i][1]
        y2 = first_card_mid[i + 1][1]
        body.append(
            arrow(
                last_card_mid[i][0],
                y1,
                first_card_mid[i + 1][0],
                y2,
                color="slate",
                width=2.5,
                path="M {x1} {y1} C {mx} {y1}, {mx} {y2}, {x2} {y2}".format(
                    x1=last_card_mid[i][0], y1=y1, x2=first_card_mid[i + 1][0], y2=y2, mx=(last_card_mid[i][0] + first_card_mid[i + 1][0]) / 2
                ),
            )
        )

    # Verify fail -> aief prompt (manual re-prompt). Routed entirely in the top/left margins so
    # it never crosses a card.
    fail_y = COL_Y - 34
    margin_x = 16
    body.append(
        arrow(
            verify_top[0],
            verify_top[1],
            prompt_left[0],
            prompt_left[1],
            color="red",
            dashed=True,
            path="M {vx} {vy} L {vx} {fy} L {mx} {fy} L {mx} {py} L {px} {py}".format(
                vx=verify_top[0], vy=verify_top[1], fy=fail_y, mx=margin_x, py=prompt_left[1], px=prompt_left[0]
            ),
        )
    )
    body.append(badge(xs[0] + COL_W / 2 - 100, fail_y - 26, "fail -> human fixes, re-prompts", color="red", w=280))

    # status --next -> analyze/new-change (recommendation only). Routed below the columns.
    next_y = COL_Y + col_h + 30
    body.append(
        arrow(
            status_right[0],
            status_right[1],
            analyze_right[0],
            analyze_right[1],
            color="amber",
            dashed=True,
            path="M {sx} {sy} C {sx} {ny}, {ax} {ny}, {ax} {ay}".format(
                sx=status_right[0], sy=status_right[1] + 10, ny=next_y, ax=analyze_right[0], ay=analyze_right[1] + 10
            ),
        )
    )
    body.append(badge(xs[0] + 60, next_y - 12, "recommends next (not automatic)", color="amber", w=240))

    # Observation & feedback band.
    band_y = COL_Y + col_h + 70
    band_h = 96
    body.append(group_box(40, band_y, WIDTH - 80, band_h, "Harness / Hooks / Loop — observation & feedback, never executors or gates", "amber"))
    caps = [
        ("Harness / Hooks", "Append visible, non-blocking notes to prompt/verify output."),
        ("Loop", "Tracks verify attempts in loop.md; retry is always a manual re-run."),
    ]
    cx = 60
    for label, desc in caps:
        w = 560
        body.append(
            '  <g transform="translate({x},{y})">\n'
            '    <text x="0" y="18" font-size="12" font-weight="700" fill="#92400e">{l}</text>\n'
            '    <text x="0" y="36" font-size="11" fill="#92400e">{d}</text>\n'
            "  </g>".format(x=cx, y=band_y + 40, l=label, d=desc, w=w)
        )
        cx += w + 40

    return body, band_y + band_h + 20


def generate(svg_path=SVG_PATH):
    """Builds the diagram and writes it to svg_path — used directly, and by the
    generate_workflow_diagram.py compatibility wrapper to keep docs/images/workflow.svg
    reproducible from this same source instead of a second, independently-drifting diagram."""
    body, end_y = build()
    height = max(HEIGHT, int(end_y) + 10)
    svg = assemble(
        WIDTH,
        height,
        "wl-title",
        "AIEF Change lifecycle",
        "wl-desc",
        "Three levels: Level 1, Context and Change preparation (doctor, bootstrap, "
        "analyze/new-change/enrich, prompt); Level 2, Assistant implementation (any AI assistant, "
        "optionally structured by OpenSpec, writes evidence.md); Level 3, Verification and closing "
        "(verify, close --yes, status --graph/--next). A failed verify is fixed and re-prompted "
        "manually, never automatically. status --next only recommends the following Change. "
        "Harness, Hooks, and Loop are opt-in observation and feedback capabilities that append "
        "notes and track retry counts — none of them executes a command or blocks verify or close.",
        body,
    )
    write_svg(svg_path, svg)
    print("Generated {}".format(svg_path))


def main():
    generate(SVG_PATH)


if __name__ == "__main__":
    main()
