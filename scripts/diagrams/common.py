"""Shared rendering helpers for AIEF Core 3.1 diagram generators.

Every diagram under scripts/diagrams/ is Python data (cards, groups, arrows) fed through the
helpers here so the six diagrams read as one visual family. Never hand-edit an SVG under
docs/images/ — edit the generator script that produced it and re-run
`python3 scripts/diagrams/generate_all.py`.
"""
import os
import xml.dom.minidom as minidom

FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

# Palette: structure/text, AIEF Core, AI assistants, repository/success, opt-in/advisory, error, external.
PALETTE = {
    "slate": {"text": "#0f172a", "muted": "#64748b", "border": "#cbd5e1", "bg": "#f8fafc", "accent": "#334155"},
    "blue": {"text": "#1e40af", "muted": "#1d4ed8", "border": "#bfdbfe", "bg": "#eff6ff", "accent": "#2563eb"},
    "violet": {"text": "#6b21a8", "muted": "#7c3aed", "border": "#e9d5ff", "bg": "#faf5ff", "accent": "#7c3aed"},
    "green": {"text": "#166534", "muted": "#15803d", "border": "#bbf7d0", "bg": "#f0fdf4", "accent": "#16a34a"},
    "amber": {"text": "#92400e", "muted": "#b45309", "border": "#fde68a", "bg": "#fffbeb", "accent": "#d97706"},
    "red": {"text": "#991b1b", "muted": "#b91c1c", "border": "#fca5a5", "bg": "#fef2f2", "accent": "#dc2626"},
    "gray": {"text": "#334155", "muted": "#64748b", "border": "#cbd5e1", "bg": "#f1f5f9", "accent": "#64748b"},
}


def xml_escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def defs_block():
    markers = "\n".join(
        '    <marker id="arrow-{key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" '
        'markerHeight="7" orient="auto-start-reverse">\n'
        '      <path d="M 0 1 L 10 5 L 0 9 z" fill="{color}"/>\n'
        "    </marker>".format(key=key, color=c["accent"])
        for key, c in PALETTE.items()
    )
    return """  <defs>
    <filter id="card-shadow" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
{markers}
  </defs>""".format(markers=markers)


def svg_open(width, height, title_id, desc_id):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
        'role="img" aria-labelledby="{tid} {did}" '
        'style="background-color:#ffffff;font-family:{font}">'
    ).format(w=width, h=height, tid=title_id, did=desc_id, font=FONT_STACK)


def title_desc(title_id, title, desc_id, desc):
    return '  <title id="{tid}">{t}</title>\n  <desc id="{did}">{d}</desc>'.format(
        tid=title_id, t=xml_escape(title), did=desc_id, d=xml_escape(desc)
    )


def card(x, y, w, h, title, lines, color="gray", header_fill=None, border_width=1.5, mono_title=False):
    """A rounded card with a dark header strip (title) and up to 4 body lines."""
    c = PALETTE[color]
    header = header_fill or "#0f172a"
    font_family = MONO_STACK if mono_title else FONT_STACK
    out = []
    out.append('  <g transform="translate({x},{y})">'.format(x=x, y=y))
    out.append(
        '    <rect width="{w}" height="{h}" rx="10" fill="#ffffff" stroke="{border}" '
        'stroke-width="{bw}" filter="url(#card-shadow)"/>'.format(w=w, h=h, border=c["border"], bw=border_width)
    )
    out.append(
        '    <path d="M 0 10 A 10 10 0 0 1 10 0 L {w1} 0 A 10 10 0 0 1 {w} 10 L {w} 32 L 0 32 Z" '
        'fill="{header}"/>'.format(w1=w - 10, w=w, header=header)
    )
    out.append(
        '    <text x="14" y="21" font-family="{ff}" font-size="13" font-weight="700" fill="#ffffff">{t}</text>'.format(
            ff=font_family, t=xml_escape(title)
        )
    )
    y_cursor = 32 + 22
    for line in lines[:4]:
        out.append(
            '    <text x="14" y="{ly}" font-size="12" fill="{muted}">{line}</text>'.format(
                ly=y_cursor, muted=c["muted"], line=xml_escape(line)
            )
        )
        y_cursor += 19
    out.append("  </g>")
    return "\n".join(out)


def group_box(x, y, w, h, label, color="slate"):
    c = PALETTE[color]
    return (
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="{h}" rx="12" fill="{bg}" stroke="{border}" stroke-width="1.5" '
        'stroke-dasharray="0"/>\n'
        '    <text x="16" y="24" font-size="12.5" font-weight="800" fill="{text}" letter-spacing="0.3px">{label}</text>\n'
        "  </g>"
    ).format(x=x, y=y, w=w, h=h, bg=c["bg"], border=c["border"], text=c["text"], label=xml_escape(label))


def arrow(x1, y1, x2, y2, color="slate", dashed=False, width=2, path=None):
    c = PALETTE[color]
    dash = ' stroke-dasharray="6,4"' if dashed else ""
    d = path or "M {x1} {y1} L {x2} {y2}".format(x1=x1, y1=y1, x2=x2, y2=y2)
    return (
        '  <path d="{d}" fill="none" stroke="{color}" stroke-width="{w}"{dash} '
        'marker-end="url(#arrow-{key})"/>'
    ).format(d=d, color=c["accent"], w=width, dash=dash, key=color)


def badge(x, y, text, color="slate", w=None):
    c = PALETTE[color]
    width = w or (len(text) * 6.4 + 24)
    return (
        '  <g transform="translate({x},{y})">\n'
        '    <rect width="{w}" height="20" rx="10" fill="{bg}" stroke="{border}" stroke-width="1"/>\n'
        '    <text x="{cx}" y="14" font-size="10.5" font-weight="700" fill="{text}" text-anchor="middle">{label}</text>\n'
        "  </g>"
    ).format(x=x, y=y, w=width, bg=c["bg"], border=c["border"], cx=width / 2, text=c["text"], label=xml_escape(text))


def heading(x, y, title, subtitle=None):
    out = [
        '  <text x="{x}" y="{y}" font-size="19" font-weight="800" fill="#0f172a" letter-spacing="-0.3px">{t}</text>'.format(
            x=x, y=y, t=xml_escape(title)
        )
    ]
    if subtitle:
        out.append(
            '  <text x="{x}" y="{y2}" font-size="12" fill="#64748b">{s}</text>'.format(
                x=x, y2=y + 20, s=xml_escape(subtitle)
            )
        )
    return "\n".join(out)


def assemble(width, height, title_id, title, desc_id, desc, body_parts):
    parts = [
        svg_open(width, height, title_id, desc_id),
        title_desc(title_id, title, desc_id, desc),
        defs_block(),
        '  <rect width="{w}" height="{h}" fill="#ffffff"/>'.format(w=width, h=height),
    ]
    parts.extend(body_parts)
    parts.append("</svg>\n")
    return "\n".join(parts)


def validate_svg(svg_text):
    """Parses the SVG as XML to catch malformed markup before it's written to disk."""
    minidom.parseString(svg_text.encode("utf-8"))


def write_svg(path, svg_text):
    validate_svg(svg_text)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg_text)
