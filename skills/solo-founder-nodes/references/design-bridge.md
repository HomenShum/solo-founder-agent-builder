# Design bridge — UI/UX subroutine for in-app transfer

A **subroutine** invoked **inside Build (phase 4) and Verify (phase 7)** — **not a new phase**.
It runs **only** when a UI gap is **architectural/visual** and a design tool is connected.
Build's bridge **constructs** the surface from the deliverable shape; Verify's bridge **proves**
the rendered surface shows the cited answer. The purpose is **IN-APP TRANSFER**: the benchmark
task must be triggerable and watchable in the **live** app, not just a private script. A design
MCP / Figma / design skill is an **artifact generator + validator, NOT the source of product truth.**

## Runtime

UI gap detected →
1. **Design Brief** (structured): the user job; the missing surface; required components;
   design-system **tokens**; layout / motion / accessibility constraints; **screenshots of the
   current UI**; the **exact code surfaces to change**.
2. **Select portable design skills** — use `templates/design/designSkillBridge.ts` or
   `npm run sfn -- design recommend ...` for a short recommendation, or
   `npm run sfn -- design flow ...` for the full transcript-shaped flow: classify surface -> break
   defaults -> choose component/registry lanes -> arrange dashboards -> run industry-fit design
   intelligence -> choose one taste preset -> add motion/visual/mobile lanes only when needed ->
   implement from contract -> browser/device verify. Skills may originate in Claude repositories,
   shadcn docs, GSAP, Expo, or design registries, but the loop consumes them as markdown/tooling
   instructions any coding agent can read.
3. **Inspect / generate** via a design MCP **if connected** — Figma MCP gives structured access
   to files/components/variables/layout and can generate code from selected frames and write back
   to canvas; Codex, Claude Code, Cursor, Windsurf, and other agents can instead use screenshots,
   design files, Open Design, or plain `DESIGN.md`/`SKILL.md` instructions for parity.
4. **Component Contract** — the explicit named states the implementation must satisfy.
5. **Implement from the contract**, **REUSING existing components** (avoid one-off CSS drift).
6. **Browser-verify** — Playwright screenshot, **DOM signal**, visual diff, interaction path,
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

## Portable design-skill notes

- **Frontend direction skills** (for example Anthropic `frontend-design`) are used as brief inputs:
  visual point of view, typography, density, and anti-generic decisions before code.
- **Component-system skills** (for example shadcn/ui) are used when the repo already has that stack
  or should install it behind the normal dependency gate. The skill gives rules; MCP/registry lookup
  gives live components. Both require project-fit proof.
- **Dashboard/data skills** (for example UI UX Pro Max or dashboard registries) are used for dense,
  operational surfaces where scanability beats landing-page composition.
- **Industry-fit design intelligence** (for example UI UX Pro Max) chooses palette, font pairing,
  layout, and interaction rules from the product category before code, instead of generic taste.
- **Animation skills** (for example GSAP skills) are used only when motion is part of the product
  value; they do not replace reduced-motion and performance checks. Motion should favor transform and
  opacity over layout-thrashing changes.
- **Mobile/native skills** (for example Expo, Material 3, or mobile UI skills) are used only when the
  target surface is actually native/mobile.
- **Taste presets** (for example minimalist, industrial/brutalist, all-rounder, or premium frontend skills) are
  selected explicitly from the product audience; do not stack random styles together.
- **Visual-content skills** (for example Higgsfield image/video generation) require auth/spend gates
  and generated-media proof before the asset can count as shipped.
- **iOS/SwiftUI skills** are used only for native Apple surfaces; do not treat mobile as a small web
  dashboard.

Run:

```bash
npm run sfn -- design registry
npm run sfn -- design recommend --surface dashboard --stack "Next.js shadcn" --runtime codex
npm run sfn -- design flow --surface dashboard --category analytics --stack "Next.js shadcn" --shadcn-mcp --runtime codex
npm run sfn -- design recommend --surface marketing-site --style premium --visuals --animation --runtime codex
npm run sfn -- design flow --surface 3d-app --category "3D asset generation" --style premium --visuals --animation --shadcn-mcp --runtime codex
npm run sfn -- design recommend --surface mobile-app --platform ios --stack SwiftUI --runtime codex
npm run sfn -- design flow --surface mobile-app --platform ios --stack SwiftUI --mobile --runtime codex
```

The chosen skill list is a **design input**, not a runtime dependency. If a skill is Claude-labeled,
port the instructions into the Design Brief / Component Contract and keep implementation in the user's
actual coding agent.

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
