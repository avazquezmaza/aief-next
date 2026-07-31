#!/usr/bin/env python3
"""Compatibility wrapper for docs/images/workflow.svg (AIEF Core 3.1).

This is the same "Workflow Lifecycle" diagram as docs/images/workflow-lifecycle.svg — kept as a
standalone illustrated export (decks, blog posts, non-GitHub contexts) under its original,
documented path and command (`python3 scripts/generate_workflow_diagram.py`), per
knowledge/decisions.md ADR-030. The canonical source is
scripts/diagrams/generate_workflow_lifecycle.py; never hand-edit either SVG.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "diagrams"))
from generate_workflow_lifecycle import generate  # noqa: E402

SVG_PATH = "docs/images/workflow.svg"


def main():
    generate(SVG_PATH)


if __name__ == "__main__":
    main()
