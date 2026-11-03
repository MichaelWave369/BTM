# HD World Materials · Rung 3 · original three-pack image art

## Delivered in this rung

The existing five first-party material profiles (plus original Retro) now all have usable image surfaces. Industrial and Matrix Facility keep the prior original PNG images. This rung adds *distinct authored* 256×256 RGB PNG tile families:

| Style | Wall identity | Floor | Ceiling |
|---|---|---|---|
| Cyberpunk | layered dark panels, cyan/magenta rails, neon conduits, CRT vents and high-contrast hazard stripes | luminous orthogonal grid with offset circuit pads | violet conduit ribs and cool white light cores |
| Sci-Fi Horror | corroded plating, broken vents, deep seams, scarred terminal and emergency stripe motifs | scarred tile seams, distress marks, dark grout | contaminated metal ribs and red emergency lighting |
| Corporate Simulation | sterile ivory wall modules, glossy access arrays, spotless electronics, clean caution zones | regular white polished squares and neat blue seams | inset white ceiling lights and airy gridded fixtures |

Every style has six independent wall images plus floor and ceiling, and every tile is authored by deterministic first-party Node raster code in `scripts/author-texture-tiles.mjs`. The repository ships this editable MIT source; `npm run build` writes the 24 actual PNGs into `dist/texture-packs/{cyberpunk,horror,corporate}`, alongside a **three-column, eight-row surface preview sheet** at `dist/texture-packs/rung3-material-matrix.png`.

The sheet is ordered columns **Cyberpunk / Horror / Corporate**, rows **wall1–wall6 / floor / ceiling**. It is a *real pixel-art tile matrix*, not a physical headset screenshot or a measured in-game FPS result.

## Runtime behavior

- The original `btm.texture-pack/1` manifest format is retained, with eight safe same-origin material paths per new style. Remote image URLs, arbitrary paths, HTML/SVG and dynamic scripts remain forbidden.
- Native WebGL/XR uses the same `createWorldAtlas` and GPU-safe atlas detail tiers as previous authored packs. Classic draws authored wall textures and its original fast floor/ceiling treatment.
- The first frame is always rendered with the working procedural fallback. Images load asynchronously; missing/offline images cannot create black surfaces or block game logic.
- Per renderer, in-flight loads are coalesced, and at most **two decoded full-resolution pack families** remain cached at a time. Existing VR atlas resolution caps still apply; no per-frame raw PNG decoding.
- `auto` chooses from an explicit twelve-sector material list, four Pit acts, and named BBS arena identities; the final raid uses Matrix Facility. Player-selected styles **always override** auto. The decisions are client-local and do not enter simulation snapshots, network packets, save versions or map collision.
- A procedural Retro selection remains available even if every image is missing.

## Packaging and QA

- `scripts/verify-build.mjs` verifies all 24 generated original PNG assets are exactly 256×256 RGB, unique, and located under the correct `dist/` paths. The preview sheet must be 768×2048.
- New unit tests validate three distinct image families, per-surface identity, quantized contrast, old saves / auto selection and both renderer fallbacks, without adding runtime dependencies.
- Build and Playwright suites continue to exercise offline boot, immersive scene rendering, sound, campaigns, BBS LAN/co-op and Pit hazard presentation.

### Manual browser and Quest checklist

1. In **Settings → Picture**, choose each five authored style profiles, then `AUTO / PER STAGE` and `RETRO / ORIGINAL`. Switch during gameplay and after a reload. Check that the setting persists.
2. Visit sectors 1–12, Pit acts and the BBS lobby, with auto and manual override. The image families should differ visibly; doors and gold access cues must remain distinct.
3. On Quest 3, inspect both close-range wall details and floor/ceiling materials for aliasing, hazing and readable warning accents at Performance, Balanced and High. Test smooth turn and head movement, seated and standing.
4. Disable network **after initial install**. The procedural fallback must remain readable while uncached enhanced tiles are unavailable; returning online should load local image files without breaking the campaign.
5. Observe real-world tile pack switch time, GPU memory and frame pacing on Quest 3. Automated WebGL simulation alone does **not** certify headroom or comfort.

## Remaining #24 / master #20 scope

This rung delivers authored image identity, all eight surface classes and deterministic auto assignments. Issue #24 remains the separate device-performance and **optional offline on-demand pack caching** rung, plus physical Quest measurement and final license/performance acceptance. No outsourced or third-party art files are introduced by this rung, and no claim is made about measured Quest frame rate.
