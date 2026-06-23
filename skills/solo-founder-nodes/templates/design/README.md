# Design Skill Bridge

The design bridge is agent-agnostic. It can consume Claude-origin skills, shadcn skills, GSAP skills,
Expo skills, or plain `DESIGN.md` files, but the solo-founder loop treats them as portable design
instructions with explicit runtime metadata.

Use from `templates/`:

```bash
npm run sfn -- design registry
npm run sfn -- design recommend --surface dashboard --stack "Next.js shadcn" --runtime codex
npm run sfn -- design recommend --surface mobile-app --stack "Expo React Native" --runtime codex
npm run sfn -- design recommend --surface marketing-site --style premium --visuals --animation --runtime codex
npm run sfn -- design recommend --surface mobile-app --platform ios --stack SwiftUI --runtime codex
npm run sfn -- design flow --surface 3d-app --category "3D asset generation" --style premium --visuals --animation --shadcn-mcp --runtime codex
npm run sfn -- design flow --surface dashboard --category analytics --stack "Next.js shadcn" --shadcn-mcp --runtime codex
```

The short recommendation order remains:

`design-brief -> design-skill-selection -> component-contract -> implementation -> browser-verify`

The full transcript flow is stricter:

`surface-classification -> break-default-direction/function-system -> component-registry -> dashboard-information-architecture -> industry-fit-engine -> taste-preset -> motion-plan -> visual-content -> mobile-native-rules -> implementation-proof`

No design skill is allowed to replace product truth, user evidence, app code inspection, or in-app
verification.

Selection rules:

- `--style minimalist|industrial-brutalist|all-rounder|premium` picks one taste lane.
- `--visuals` adds Higgsfield-style image/video generation and requires auth/spend/proof gates.
- `--shadcn-mcp` means use registry/MCP lookup, then verify components exist in the project.
- `--platform ios|android|cross-platform|web` selects SwiftUI, Material 3, or Expo lanes when needed.
- `--category <industry>` makes UI UX Pro Max-style palette/font/layout decisions industry-fit before code.
