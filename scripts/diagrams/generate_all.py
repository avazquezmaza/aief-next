#!/usr/bin/env python3
"""Canonical entry point: regenerates every AIEF diagram SVG and its PNG.

    python3 scripts/diagrams/generate_all.py

Runs every generate_*.py module in this package, verifies each SVG was written, then renders a
PNG next to it using whichever local SVG renderer is available (rsvg-convert, ImageMagick with
its librsvg delegate, Inkscape CLI, or the cairosvg Python package — tried in that order, no
network, no mixing tools across a single run). Fails loudly if none is available or if a file a
generator promised doesn't show up. Never touches a path outside docs/images/.
"""
import glob
import importlib
import os
import shutil
import subprocess
import sys

DIAGRAMS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(DIAGRAMS_DIR))
IMAGES_DIR = os.path.join(REPO_ROOT, "docs", "images")

sys.path.insert(0, DIAGRAMS_DIR)

GENERATORS = [
    "generate_product_workflow",
    "generate_system_context",
    "generate_core_runtime",
    "generate_prompt_composition",
    "generate_graph_engineering",
    "generate_workflow_lifecycle",
    "generate_adoption_workflow",
]


def find_renderer():
    if shutil.which("rsvg-convert"):
        return "rsvg-convert"
    if shutil.which("magick") or shutil.which("convert"):
        return "imagemagick"
    if shutil.which("inkscape"):
        return "inkscape"
    try:
        import cairosvg  # noqa: F401

        return "cairosvg"
    except ImportError:
        pass
    return None


def render_png(renderer, svg_path, png_path):
    if renderer == "rsvg-convert":
        subprocess.run(["rsvg-convert", "--dpi-x", "150", "--dpi-y", "150", "-o", png_path, svg_path], check=True)
    elif renderer == "imagemagick":
        tool = "magick" if shutil.which("magick") else "convert"
        args = [tool] if tool == "magick" else []
        args += [
            "-background", "white", "-density", "150", svg_path, "-flatten", "-strip",
            "-define", "png:compression-filter=0",
            "-define", "png:compression-level=9",
            "-define", "png:compression-strategy=0",
            png_path,
        ]
        subprocess.run(args, check=True)
    elif renderer == "inkscape":
        subprocess.run(["inkscape", svg_path, "--export-type=png", "--export-filename=" + png_path, "--export-dpi=150"], check=True)
    elif renderer == "cairosvg":
        import cairosvg

        cairosvg.svg2png(url=svg_path, write_to=png_path, scale=2)
    else:
        raise RuntimeError("no SVG renderer available")


def main():
    os.chdir(REPO_ROOT)

    generated_svgs = []
    for name in GENERATORS:
        mod = importlib.import_module(name)
        mod.main()
        svg_path = mod.SVG_PATH
        if not os.path.isfile(svg_path):
            print("ERROR: {} did not produce {}".format(name, svg_path), file=sys.stderr)
            sys.exit(1)
        generated_svgs.append((svg_path, mod.PNG_PATH))

    # The workflow.svg wrapper mirrors workflow-lifecycle's generator but isn't its own module
    # in GENERATORS (it shares the same source) — regenerate it explicitly so `generate_all.py`
    # stays the single command that produces every tracked asset under docs/images/.
    wrapper_path = os.path.join(REPO_ROOT, "scripts", "generate_workflow_diagram.py")
    subprocess.run([sys.executable, wrapper_path], check=True, cwd=REPO_ROOT)
    generated_svgs.append(("docs/images/workflow.svg", "docs/images/workflow.png"))

    renderer = find_renderer()
    if renderer is None:
        print(
            "ERROR: no local SVG renderer found. Install one of: librsvg (rsvg-convert), "
            "ImageMagick with its librsvg SVG delegate, Inkscape, or the cairosvg Python package.",
            file=sys.stderr,
        )
        sys.exit(1)
    print("Using renderer: {}".format(renderer))

    for svg_path, png_path in generated_svgs:
        render_png(renderer, svg_path, png_path)
        if not os.path.isfile(png_path):
            print("ERROR: renderer did not produce {}".format(png_path), file=sys.stderr)
            sys.exit(1)

    outside = [
        f
        for f in glob.glob(os.path.join(IMAGES_DIR, "**"), recursive=True)
        if os.path.isfile(f) and not f.endswith((".svg", ".png"))
    ]
    if outside:
        print("ERROR: unexpected non-SVG/PNG files under docs/images/: {}".format(outside), file=sys.stderr)
        sys.exit(1)

    print("\nGenerated files:")
    for svg_path, png_path in generated_svgs:
        print("  {}".format(svg_path))
        print("  {}".format(png_path))


if __name__ == "__main__":
    main()
