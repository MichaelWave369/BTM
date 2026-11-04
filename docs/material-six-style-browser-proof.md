# Issue #20 / #23 · six-style production visual proof

The six BTM material styles and their original authored texture families were already implemented by earlier merged PRs. This rung adds the **missing reproducible visual comparison** without changing art assets, game physics, collisions, mission saves, player stats, or any network-authoritative rule.

## Open the real material viewer

Start the usual static BTM preview and open `/immersive-next-qa.html`. The **Material** selector shows all six styles:

1. Retro (original fallback)
2. Gritty Industrial
3. Neon Cyberpunk
4. Dark Sci-Fi Horror
5. Clean Corporate Simulation
6. Matrix Control Facility

Choose a sector and world quality, then click **RENDER STEREO PREVIEW**. The same native WebGL renderer displays that style under the test stereo head/hand pose. For the five enhanced styles, the viewer explicitly waits for all local first-party PNG textures to load before measuring the image, instead of capturing an asynchronous procedural fallback.

## Automatic browser evidence

The equipment GitHub Actions workflow now runs `node scripts/verify-materials-browser.mjs` using the same independently installed Playwright/Chromium test tooling as other BTM browser regressions.

The test visits the **actual published QA page** from the local production build, selects each material using the page's own viewer, uses sector 1 and the identical high-quality synthetic stereo pose, waits for eight authored images in each enhanced family, and captures all six production WebGL stereo images. It verifies nonempty PNGs, GPU error = 0, nonempty/non-identical stereo eyes, renderer's no-drop diagnostic, unique screenshot SHA-256s and zero runtime page errors. The workflow saves:

- `docs/equipment/ci/materials/screenshots/<style>-stereo.png` for each of the six styles
- `docs/equipment/ci/materials/material-six-style-comparison.png`, a contact sheet assembled from those **real captured frames**
- `docs/equipment/ci/materials/material-proof.json`, with pixel hashes, loaded-image counts, image digests, diagnostics, and an explicit method statement

These become part of the normal `vr-equipment-evidence` GitHub Actions artifact. No generated images, stock art, runtime dependencies, model content or remote texture URLs are introduced.

## Acceptance boundaries

This provides software evidence for **issue #23**, and advances parent **#20**, but it is **not** permission to close those tasks yet. A human must inspect the generated screenshots for objective/door/hazard readability in each style and perform physical Quest 3/3S measurements for **issue #24**, including:
- per-style/per-quality actual FPS/frame pacing and loading/switch times
- real-world stereoscopic comfort, visual legibility, door and pickup contrast, and accessibility
- offline style caching after restart and eviction under headset storage pressure
- any environmental change introduced by the separate vertical prototype #19

All old levels remain playable with Retro fallback. Quest 3 measured data must not be inferred from headless Chromium or the quality string.
