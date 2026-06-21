# Design bridge — UI/UX subroutine for in-app transfer

A **subroutine** invoked **inside Build (phase 4) and Verify (phase 7)** — **not a new phase**.
It runs **only** when a UI gap is **architectural/visual** and a design tool is connected.
Build's bridge **constructs** the surface from the deliverable shape; Verify's bridge **proves**
the rendered surface shows the cited answer. The purpose is **IN-APP TRANSFER**: the benchmark
task must be triggerable and watchable in the **live** app, not just a private script. A design
MCP / Figma is an **artifact generator + validator, NOT the source of product truth.**

## Runtime

UI gap detected →
1. **Design Brief** (structured): the user job; the missing surface; required components;
   design-system **tokens**; layout / motion / accessibility constraints; **screenshots of the
   current UI**; the **exact code surfaces to change**.
2. **Inspect / generate** via a design MCP **if connected** — Figma MCP gives structured access
   to files/components/variables/layout and can generate code from selected frames and write back
   to canvas; OpenAI Codex has an equivalent "Implement designs" skill that fetches Figma
   context/assets/screenshots for visual parity.
3. **Component Contract** — the explicit named states the implementation must satisfy.
4. **Implement from the contract**, **REUSING existing components** (avoid one-off CSS drift).
5. **Browser-verify** — Playwright screenshot, **DOM signal**, visual diff, interaction path,
   **mobile breakpoint**, **design-token usage**.

## The strict order (guardrail)

**Structured brief FIRST → design output SECOND → implementation THIRD → browser-verify LAST.**
Never reorder.

## Guardrails

| Avoid | Prefer |
|---|---|
| "make it pretty" | a compact, contract-driven prompt |
| "redesign the whole app" | name the **one** missing surface + its states |
| "random glassmorphism" | use the **existing design tokens** |
| "one giant Figma prompt" | small prompts that name explicit component states |

Figma MCP quality depends heavily on **structured files + components + auto-layout**; some seat
tiers have very **limited tool-call rate limits** — budget calls.

## Figma / OpenDesign-MCP notes

- **Figma MCP** — structured read of files/components/variables/layout; generate code from
  selected frames; write back to canvas. The design tool is a **validator + generator**, never
  product truth.
- **OpenAI Codex "Implement designs"** — equivalent: fetches Figma context/assets/screenshots
  for visual parity.

## Cost gate: GUIDE → GENERATE → GATE

Before burning many design calls or **writing back to Figma**, run the same discipline as the
setup-phase install/approval gate: **GUIDE** (state the plan + cost) → **GENERATE** (produce the
artifact) → **GATE** (human approves before spend / write-back).

## Templates

Copyable templates live at `skills/solo-founder-nodes/templates/design/`
(`design-brief.md`, `component-contract.md`, `visual-regression-checklist.md`).
