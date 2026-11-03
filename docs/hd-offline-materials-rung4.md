# BTM HD Material Rung 4: explicitly saved offline tiles

## What is delivered

The existing five enhanced image families are **optional on-demand assets**, not part of the essential PWA offline shell. `Settings → Picture → OFFLINE HD TEXTURES` lets a player select Industrial, Matrix Facility, Cyberpunk, Sci-Fi Horror or Corporate Simulation and explicitly:

1. **Save Selected Style Offline**: download only that style's eight first-party 256×256 PNG images, validate exact dimensions, and store them in an isolated versioned browser CacheStorage bucket.
2. **Inspect Status**: show whether that particular style is ready (8/8), partly stored, or not saved. Checking a style does not download its images.
3. **Remove Saved Style**: delete those eight optional cached images, without touching another art style, the game shell, original/Pit/co-op saves, or unrelated browsing caches.

`AUTO` and `RETRO` are not downloadable packs. Change the style selector to an individual enhanced family before saving. HD assets still load on demand for connected players; this control only pins assets for future offline sessions.

## Implementation and bounds

- `scripts/build.mjs` retains its content-hashed mandatory `wave-ori-...` shell and generates an `btm-hd-materials-<10-char SHA>` cache version from the **actual packaged image bytes** of all five styles. Rebuilding without artwork changes keeps pinned HD caches. Editing a texture invalidates only the optional versioned material cache.
- `scripts/optional-texture-worker.mjs` appends a narrowly scoped same-origin message handler to the generated PWA service worker. Image URLs are assembled exclusively from five hardcoded styles and eight hardcoded material names. No arbitrary user URL, cross-origin request, opaque redirect, script, SVG, or extra runtime package is used.
- The worker rejects anything not a 256×256 PNG or larger than 1 MiB per image. Each explicit Save downloads no more than eight files, then reports actual cache contents. Interrupted downloads or browser quota exhaustion remove newly written files for that attempted style while preserving previously saved styles.
- A separate `btm-hd-materials-...` cache is read by the existing same-origin service-worker fetch handler. Installation does **not** fetch or pin the optional PNG files and the service worker can still install with no HD assets.
- `scripts/verify-offline.mjs` executes the **generated** service worker in an isolated VM: prove the required 84-ish shell assets work after disconnect, that 40 PNGs aren't in the shell, status performs no download, opt-in Save uses real generated PNG bytes, later offline GETs succeed, Remove leaves core/unrelated cache untouched, and invalid URL attempts are rejected.
- `tests/optional-hd-offline.test.mjs` tests the generated handler source independently for path confinement, rollback, isolated styles and message validation; normal unit and CI browser tests must remain green.

## Limitations and Quest acceptance

This does not automatically pin all five packs or try to silently fill storage. CacheStorage is browser-managed: **clearing browser/site data, the browser evicting caches under quota pressure, or switching origins/devices removes the saved images**. The Save button only reports success after all eight images are verified in the cache; it is not a guarantee against later eviction. Reopen Settings to check status before going offline.

The first PWA visit must complete while online to register/cache the core game. In offline mode the entire game, including Retro/procedural fallback, remains usable whether or not HD tiles were saved.

Physical **Quest 3 / Quest 3S validation is still open**. Check offline boots from the installed PWA, enhanced material appearance after flight mode, storage quota/eviction behavior, controller selection of Save/Remove buttons, low-memory image switching, frame pacing and headset comfort across Performance/Balanced/High. Software browser emulation is not evidence of headset refresh rate.

License provenance: Industrial and Matrix Facility artwork are first-party repo PNGs; Cyberpunk, Horror and Corporate RGB pixels are generated from the MIT-owned `scripts/author-texture-tiles.mjs` source. Bundling third-party commercial textures is prohibited without suitable redistribution rights.

## Backlog scope

This delivers **issue #24's optional cache architecture and offline proof**, but does not claim measured physical Quest FPS/performance approval. Keep #24 open for real device measurements and any visual/performance corrections. Issue #23's authored image implementation was already delivered in merged PR #55.
