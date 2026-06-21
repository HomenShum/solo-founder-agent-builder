# Visual Regression Checklist (Design Bridge — browser verify)

> Run this LAST in the Design Bridge: brief → design → implement → **verify**. A surface is not done
> until it is proven in a real rendered DOM, not just a build success or a static mock.

For each component state in the contract:

- [ ] **Screenshot** captured at the target breakpoint(s) (desktop + mobile if relevant).
- [ ] **DOM signal** present — the exact selector / testid from the contract is in the rendered DOM (not just a fallback/skeleton).
- [ ] **Visual diff** vs. baseline reviewed — no unintended layout/spacing/color shift.
- [ ] **Interaction path** works — click / keyboard / focus behaves per the contract; the action emits its callback/mutation.
- [ ] **Mobile breakpoint** holds — no overflow, tap targets ≥ 44px, content reflows.
- [ ] **Keyboard navigation** — focus order is correct, focus visible, no traps.
- [ ] **Design tokens** — colors/spacing/typography come from the system; no hardcoded hex/px drift.
- [ ] **No console errors/warnings** during render and interaction.
- [ ] **Transfer proof** — the surface reflects a real backend run / live data, not a static mock. Build success, CLI exit code, or CI-green do **not** count.

Record the proof (screenshot path, DOM signal, run id) to memory as an `in_app_transfer` event.
