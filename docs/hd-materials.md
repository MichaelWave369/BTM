# BTM Rung 2 · Original HD world textures

This rung adds **16 original image assets**, authored for Break the Matrix rather than copied from a game, film, marketplace asset, or third-party texture library. The source art was generated specifically for these packs using deterministic layered geometric/noise procedures, baked as distributable PNGs.

## Packs

| Pack | Wall tiles | Floor | Ceiling | Identity |
|---|---:|---:|---:|---|
| Retro | Existing six original classic walls | Original | Original | Fully preserved, unchanged look |
| Gritty Industrial | `wall1.png`–`wall6.png` | `floor.png` | `ceiling.png` | Riveted steel, panel recesses, grime and grates |
| Matrix Control Facility | `wall1.png`–`wall6.png` | `floor.png` | `ceiling.png` | Etched control plating, luminous conduit traces, contained machine structures |

Each PNG is **256×256, 8-bit RGB**, and every tile is meant to be repeated. No external network asset provider, commercial texture, or proprietary UE Marketplace artwork is bundled. Source license: this repository's `LICENSE`.

## Runtime

- Choose **Settings → Picture → World material style** to set `RETRO / ORIGINAL`, `GRITTY INDUSTRIAL`, or `MATRIX CONTROL FACILITY`. `AUTO / PER STAGE` selects from the existing six preview styles.
- Choose **Material detail** for `LIGHT`, `ENHANCED`, or `ULTRA`. The texture material is the same authored image, downsampled appropriately for the target atlas resolution.
- The Quest 3 native WebGL renderer loads local image packs on demand, never stalls a frame waiting for the network, and uses the previous procedural material if an asset is unavailable.
- Browser `Image` decoding requires exact 256×256 image dimensions; failed, incomplete, or malformed images safely revert to the Rung 1 procedural material.
- The Classic 2D raycaster uses the authored **wall** images (downsampled to its original 64px wall strips) and changes floor ambience. It still uses its original horizon-based ceiling/floor presentation; there are **not** perspective-textured flat surfaces in Classic mode yet.
- The material atlas retains the original UV map and 16-column material layout. Only its raster scale changes: 1024² (64px tile), 2048² (128px tile), or 4096² (256px tile). These allocate roughly 4, 16, or 64 MiB of uncompressed RGBA texture memory respectively.
- Ultra 4096² is gated by both VR quality **HIGH** and a supporting GPU texture-size limit; ordinary balanced Quest settings cap the atlas at 2048². Performance mode caps it at 1024². No render geometry rebuild when changing the selected material.
- HD packs remain **optional**: they are not in the required service-worker install list. Offline Retro/procedural fallbacks work. Explicit cache/prefetch of optional HD packs is deferred to #24.

## Quest 3 field test

1. Open the fresh deployed build on the headset after the PR is merged. Select `GRITTY INDUSTRIAL` and `ENHANCED`, then enter **Immersive VR**.
2. Observe industrial wall panels, floors, ceilings, doors and signs across a few rooms; inspect texture repetition, legibility and head movement.
3. Change to `MATRIX CONTROL FACILITY` and repeat; check that clean conduits, floor panels and overhead details appear while the same level geometry remains unchanged.
4. Switch to `RETRO / ORIGINAL` and confirm the classic presentation is still available.
5. Try `AUTO` mode on another stage and `LIGHT / PERFORMANCE` if the headset feels less responsive. Compare comfort and frame pacing, but **do not infer performance solely from a desktop test**.
6. Test weapon hits, Ori, left wrist, navigation, original music, a saved checkpoint and a co-op session. The material choice must not change any result.

**Physical Quest validation is pending user retest.** Browser automation cannot certify headset comfort.

## Follow-on rungs

- #23: Neon Cyberpunk, Dark Sci-Fi Horror, Clean Corporate Simulation authored images and auto per-area styles.
- #24: data-driven offline HD cache/prefetch, quality profiling, GPU memory limit handling, real-device performance receipts and licensing audit.

These are enhancement assets. The stable Retro gameplay and complete original soundtrack are unaffected.
