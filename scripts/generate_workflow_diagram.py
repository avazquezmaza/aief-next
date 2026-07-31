#!/usr/bin/env python3
"""Canonical source for docs/images/workflow.svg (AIEF Core 3.1).

Regeneration: `python3 scripts/generate_workflow_diagram.py`, then re-render the PNG from the
SVG (see docs/maintainer.md "Regenerating the workflow diagram"). Never hand-edit the SVG —
edit this script and regenerate.
"""
import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1360 980" width="1360" height="980" style="background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.06"/>
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.04"/>
    </filter>
    <filter id="badge-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.1"/>
    </filter>

    <linearGradient id="l1-card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>

    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a"/>
    </marker>
    <marker id="arrow-indigo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5"/>
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
    </marker>
  </defs>

  <rect width="1360" height="980" fill="#ffffff"/>

  <!-- Header Banner -->
  <g transform="translate(40, 20)">
    <text x="0" y="20" font-size="19" font-weight="800" fill="#0f172a" letter-spacing="-0.5px">AIEF CORE 3.1 WORKFLOW LIFECYCLE</text>
    <text x="0" y="38" font-size="12.5" font-weight="500" fill="#64748b">Canonical Architecture &amp; Governance Model — assistant-agnostic, opt-in capabilities non-blocking unless noted</text>
  </g>

  <!-- Legend Bar / Area Mapping -->
  <g transform="translate(560, 14)">
    <rect x="0" y="0" width="760" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="14" y="24" font-size="10.5" font-weight="700" fill="#475569" letter-spacing="0.5px">MAJOR AREAS:</text>

    <g transform="translate(110, 9)">
      <rect x="0" y="0" width="56" height="20" rx="10" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#4f46e5"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#3730a3">User</text>
    </g>

    <g transform="translate(176, 9)">
      <rect x="0" y="0" width="50" height="20" rx="10" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#0f172a"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#0f172a">CLI</text>
    </g>

    <g transform="translate(236, 9)">
      <rect x="0" y="0" width="85" height="20" rx="10" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#2563eb"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#1e40af">AIEF Core</text>
    </g>

    <g transform="translate(331, 9)">
      <rect x="0" y="0" width="100" height="20" rx="10" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#7c3aed"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#6b21a8">AI Providers</text>
    </g>

    <g transform="translate(441, 9)">
      <rect x="0" y="0" width="135" height="20" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#16a34a"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#166534">Project Repository</text>
    </g>

    <g transform="translate(586, 9)">
      <rect x="0" y="0" width="75" height="20" rx="10" fill="#fff7ed" stroke="#fed7aa" stroke-width="1"/>
      <circle cx="10" cy="10" r="3.5" fill="#ea580c"/>
      <text x="19" y="14" font-size="10.5" font-weight="600" fill="#9a3412">Outputs</text>
    </g>
  </g>

  <!-- ==================== LEVEL 1: CONTEXT & SETUP ==================== -->
  <g transform="translate(40, 115)">
    <rect width="390" height="600" rx="14" fill="url(#l1-card-grad)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>

    <path d="M 0 14 A 14 14 0 0 1 14 0 L 376 0 A 14 14 0 0 1 390 0 L 390 50 L 0 50 Z" fill="#f1f5f9"/>
    <line x1="0" y1="50" x2="390" y2="50" stroke="#cbd5e1" stroke-width="1"/>
    <text x="20" y="32" font-size="14" font-weight="700" fill="#0f172a" letter-spacing="0.2px">Level 1: Context &amp; Setup</text>
    <rect x="280" y="14" width="92" height="22" rx="11" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
    <text x="326" y="29" font-size="10" font-weight="700" fill="#1d4ed8" text-anchor="middle">AIEF CONTEXT</text>

    <g transform="translate(20, 68)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="14" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="36" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">aief doctor</text>

      <g transform="translate(215, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="75" height="18" rx="9" fill="#1e40af"/>
        <text x="84.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">AIEF Core</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Environment &amp; stack check</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Validates Node environment, CLI tools, and</text>
      <text x="16" y="110" font-size="12" fill="#64748b">repository readiness prior to bootstrap.</text>
    </g>

    <path d="M 195 210 L 195 242" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

    <g transform="translate(20, 244)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="14" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="36" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">aief bootstrap</text>

      <g transform="translate(200, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="95" height="18" rx="9" fill="#166534"/>
        <text x="94.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">Project Repo</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Adopt project without code edits</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Creates AGENTS.md (the universal contract),</text>
      <text x="16" y="110" font-size="12" fill="#64748b">changes/, knowledge/ — never overwrites.</text>
    </g>

    <path d="M 195 386 L 195 418" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

    <g transform="translate(20, 420)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="12" y="24" font-family="monospace" font-size="12" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="28" y="24" font-family="monospace" font-size="12" font-weight="bold" fill="#ffffff">aief new-change / enrich</text>

      <g transform="translate(200, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="95" height="18" rx="9" fill="#166534"/>
        <text x="94.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">Project Repo</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Create Change &amp; specs</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Generates change.md, spec.md, tasks.md,</text>
      <text x="16" y="110" font-size="12" fill="#64748b">and seeds evidence tracking directory.</text>
    </g>
  </g>

  <g transform="translate(430, 606)">
    <path d="M 0 0 L 50 0" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  </g>

  <!-- ==================== LEVEL 2: AI IMPLEMENTATION ==================== -->
  <g transform="translate(485, 115)">
    <rect width="390" height="600" rx="14" fill="url(#l1-card-grad)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>

    <path d="M 0 14 A 14 14 0 0 1 14 0 L 376 0 A 14 14 0 0 1 390 0 L 390 50 L 0 50 Z" fill="#f1f5f9"/>
    <line x1="0" y1="50" x2="390" y2="50" stroke="#cbd5e1" stroke-width="1"/>
    <text x="20" y="32" font-size="14" font-weight="700" fill="#0f172a" letter-spacing="0.2px">Level 2: AI Implementation</text>
    <rect x="255" y="14" width="117" height="22" rx="11" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1"/>
    <text x="313.5" y="29" font-size="10" font-weight="700" fill="#7c3aed" text-anchor="middle">AI ASSISTANT WORK</text>

    <g transform="translate(20, 68)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="14" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="36" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">aief prompt</text>

      <g transform="translate(215, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="75" height="18" rx="9" fill="#1e40af"/>
        <text x="84.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">AIEF Core</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Compose context-complete prompt</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Resolves LIDR Discovery, Skills and Standards</text>
      <text x="16" y="110" font-size="12" fill="#64748b">(project overrides built-in) — writes nothing.</text>
    </g>

    <path d="M 195 210 L 195 242" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

    <g transform="translate(20, 244)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#7c3aed" stroke-width="2" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#4f46e5"/>

      <path d="M 22 13 L 24 19 L 30 21 L 24 23 L 22 29 L 20 23 L 14 21 L 20 19 Z" fill="#fef08a"/>
      <text x="36" y="24" font-size="14" font-weight="bold" fill="#ffffff">AI Assistant (any)</text>

      <g transform="translate(200, 9)">
        <rect x="0" y="0" width="45" height="18" rx="9" fill="#3730a3"/>
        <text x="22.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">User</text>
        <rect x="50" y="0" width="92" height="18" rx="9" fill="#6b21a8"/>
        <text x="96" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">AI Providers</text>
      </g>

      <text x="16" y="66" font-size="12.5" font-weight="700" fill="#0f172a">Claude Code, Gemini CLI, Codex CLI,</text>
      <text x="16" y="86" font-size="12.5" font-weight="700" fill="#0f172a">Cursor, OpenCode, others via portable prompt</text>
      <text x="16" y="108" font-size="11.5" fill="#64748b">Same engineering contract for every assistant —</text>
      <text x="16" y="126" font-size="11.5" fill="#64748b">only the instruction-file name adapts (see below).</text>
    </g>

    <path d="M 195 386 L 195 418" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

    <g transform="translate(20, 420)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f766e"/>

      <path d="M 16 14 L 26 14 L 30 18 L 30 28 L 16 28 Z" fill="none" stroke="#ffffff" stroke-width="1.5"/>
      <text x="36" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">Write evidence.md</text>

      <g transform="translate(200, 9)">
        <rect x="0" y="0" width="80" height="18" rx="9" fill="#6b21a8"/>
        <text x="40" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">AI Providers</text>
        <rect x="85" y="0" width="58" height="18" rx="9" fill="#166534"/>
        <text x="114" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">Outputs</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Document verification evidence</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Records completed tasks, test logs, manual</text>
      <text x="16" y="110" font-size="12" fill="#64748b">verification proof, and design changes.</text>
    </g>
  </g>

  <g transform="translate(875, 255)">
    <path d="M 0 326 L 28 326 L 28 0 L 50 0" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  </g>

  <!-- ==================== LEVEL 3: GOVERNANCE & CLOSING ==================== -->
  <g transform="translate(930, 115)">
    <rect width="390" height="600" rx="14" fill="url(#l1-card-grad)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>

    <path d="M 0 14 A 14 14 0 0 1 14 0 L 376 0 A 14 14 0 0 1 390 0 L 390 50 L 0 50 Z" fill="#f1f5f9"/>
    <line x1="0" y1="50" x2="390" y2="50" stroke="#cbd5e1" stroke-width="1"/>
    <text x="20" y="32" font-size="14" font-weight="700" fill="#0f172a" letter-spacing="0.2px">Level 3: Governance &amp; Closing</text>
    <rect x="270" y="14" width="102" height="22" rx="11" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
    <text x="321" y="29" font-size="10" font-weight="700" fill="#166534" text-anchor="middle">GOVERNANCE</text>

    <g transform="translate(20, 68)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#1e40af"/>

      <text x="14" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="36" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">aief verify</text>

      <g transform="translate(215, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="75" height="18" rx="9" fill="#1e3a8a"/>
        <text x="84.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">AIEF Core</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Structural &amp; requirement checks</text>
      <text x="16" y="90" font-size="11.5" fill="#64748b">Runs verification rules; if opted in, appends</text>
      <text x="16" y="108" font-size="11.5" fill="#64748b">visible Harness/Hooks and Loop logs — neither</text>
      <text x="16" y="124" font-size="11.5" fill="#64748b">ever blocks the PASS/FAIL result (see sidebar).</text>
    </g>

    <path d="M 195 210 L 195 242" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>
    <g transform="translate(208, 217)">
      <rect width="46" height="18" rx="9" fill="#dcfce7" stroke="#86efac" stroke-width="1"/>
      <text x="23" y="13" font-size="10" font-weight="800" fill="#15803d" text-anchor="middle">pass</text>
    </g>

    <g transform="translate(20, 244)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="14" y="24" font-family="monospace" font-size="13" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="34" y="24" font-family="monospace" font-size="13" font-weight="bold" fill="#ffffff">aief close --yes</text>

      <g transform="translate(200, 9)">
        <rect x="0" y="0" width="42" height="18" rx="9" fill="#334155"/>
        <text x="21" y="13" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">CLI</text>
        <rect x="47" y="0" width="95" height="18" rx="9" fill="#9a3412"/>
        <text x="94.5" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">Outputs</text>
      </g>

      <text x="16" y="66" font-size="13.5" font-weight="700" fill="#0f172a">Mark Change Closed</text>
      <text x="16" y="90" font-size="12" fill="#64748b">Finalizes Change state, archives evidence,</text>
      <text x="16" y="110" font-size="12" fill="#64748b">and locks change record with timestamp.</text>
    </g>

    <path d="M 195 386 L 195 418" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

    <g transform="translate(20, 420)">
      <rect width="350" height="142" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
      <path d="M 0 10 A 10 10 0 0 1 10 0 L 340 0 A 10 10 0 0 1 350 0 L 350 38 L 0 38 Z" fill="#0f172a"/>

      <text x="14" y="24" font-family="monospace" font-size="10.5" font-weight="bold" fill="#38bdf8">&gt;_</text>
      <text x="28" y="24" font-family="monospace" font-size="10.5" font-weight="bold" fill="#ffffff">aief status --graph/--next</text>

      <g transform="translate(228, 9)">
        <rect x="0" y="0" width="38" height="18" rx="9" fill="#3730a3"/>
        <text x="19" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">User</text>
        <rect x="42" y="0" width="70" height="18" rx="9" fill="#9a3412"/>
        <text x="77" y="13" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">Outputs</text>
      </g>

      <text x="16" y="66" font-size="13" font-weight="700" fill="#0f172a">Inspect the Graph; get a recommendation</text>
      <text x="16" y="90" font-size="11.5" fill="#64748b">`--graph`: read-only Change dependency view.</text>
      <text x="16" y="110" font-size="11.5" fill="#64748b">`--next`: prints one suggested Change — it never</text>
      <text x="16" y="126" font-size="11.5" fill="#64748b">runs anything; the human still invokes it.</text>
    </g>
  </g>

  <!-- Fail Loopback: verify fail -> aief prompt (always a manual re-invocation) -->
  <g>
    <path d="M 1125 183 C 1125 78, 680 78, 680 180" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrow-red)"/>
    <g transform="translate(792, 63)">
      <rect width="220" height="22" rx="11" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" filter="url(#badge-shadow)"/>
      <text x="110" y="15" font-size="10.5" font-weight="800" fill="#991b1b" text-anchor="middle">fail — human fixes, re-prompts</text>
    </g>
  </g>

  <!-- Next Change Loopback: status next (recommendation only) -> aief new-change / enrich -->
  <g>
    <path d="M 1125 677 C 1125 790, 235 790, 235 685" fill="none" stroke="#4f46e5" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrow-indigo)"/>
    <g transform="translate(575, 778)">
      <rect width="210" height="24" rx="12" fill="#eef2ff" stroke="#a5b4fc" stroke-width="1.5" filter="url(#badge-shadow)"/>
      <text x="105" y="16" font-size="10.5" font-weight="800" fill="#3730a3" text-anchor="middle">recommends next (not automatic)</text>
    </g>
  </g>

  <!-- ==================== CROSS-CUTTING CAPABILITIES SIDEBAR ==================== -->
  <g transform="translate(40, 830)">
    <rect width="1280" height="130" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="20" y="26" font-size="13" font-weight="800" fill="#0f172a" letter-spacing="0.2px">Cross-cutting capabilities — all opt-in per Change, all non-blocking unless the badge says otherwise</text>

    <g transform="translate(20, 40)">
      <rect width="192" height="72" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#3730a3">LIDR Discovery</text>
      <text x="12" y="37" font-size="10" fill="#64748b">ai-specs/ presence detected;</text>
      <text x="12" y="51" font-size="10" fill="#64748b">resolved independently of</text>
      <text x="12" y="65" font-size="10" fill="#64748b">which AI assistant is used.</text>
    </g>

    <g transform="translate(228, 40)">
      <rect width="192" height="72" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#3730a3">Skills &amp; Standards</text>
      <text x="12" y="37" font-size="10" fill="#64748b">ai-specs/skills, ai-specs/</text>
      <text x="12" y="51" font-size="10" fill="#64748b">standards — project always</text>
      <text x="12" y="65" font-size="10" fill="#64748b">wins over built-in on id clash.</text>
    </g>

    <g transform="translate(436, 40)">
      <rect width="192" height="72" rx="8" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#9a3412">Harness / Hooks</text>
      <text x="12" y="37" font-size="10" fill="#64748b">manifest.harness.log opts in;</text>
      <text x="12" y="51" font-size="10" fill="#64748b">visible hooks.md; never gates</text>
      <text x="12" y="65" font-size="10" fill="#64748b">verify/close on its own.</text>
    </g>

    <g transform="translate(644, 40)">
      <rect width="192" height="72" rx="8" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#9a3412">Loop (verify feedback)</text>
      <text x="12" y="37" font-size="10" fill="#64748b">manifest.loop.verify tracks</text>
      <text x="12" y="51" font-size="10" fill="#64748b">attempts in loop.md; retry is</text>
      <text x="12" y="65" font-size="10" fill="#64748b">always a manual re-run.</text>
    </g>

    <g transform="translate(852, 40)">
      <rect width="192" height="72" rx="8" fill="#ffffff" stroke="#bbf7d0" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#166534">Change Graph</text>
      <text x="12" y="37" font-size="10" fill="#64748b">manifest.dependsOn; derived,</text>
      <text x="12" y="51" font-size="10" fill="#64748b">pure, read-only. status --graph</text>
      <text x="12" y="65" font-size="10" fill="#64748b">shows nodes/edges/cycles.</text>
    </g>

    <g transform="translate(1060, 40)">
      <rect width="200" height="72" rx="8" fill="#ffffff" stroke="#bbf7d0" stroke-width="1.5"/>
      <text x="12" y="20" font-size="11.5" font-weight="700" fill="#166534">Smart Workflow</text>
      <text x="12" y="37" font-size="10" fill="#64748b">status --next recommends one</text>
      <text x="12" y="51" font-size="10" fill="#64748b">eligible Change deterministically</text>
      <text x="12" y="65" font-size="10" fill="#64748b">— prints only, never executes.</text>
    </g>
  </g>
</svg>
"""

os.makedirs("docs/images", exist_ok=True)
with open("docs/images/workflow.svg", "w") as f:
    f.write(svg_content)

print("Generated docs/images/workflow.svg successfully.")
