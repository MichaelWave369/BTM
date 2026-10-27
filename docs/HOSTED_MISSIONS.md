# Hosted ΦWAD missions on GitHub Pages

**First hosted mission:** CODE BROWN: Signal Breakout.

The player clicks **PLAY CODE BROWN** on the BTM Neon Signal title screen. BTM fetches the first-party static file `./missions/code-brown-signal-breakout.json`, converts its authored 29×25 binary wall rows into the existing `phi369.raycaster-level.v0.1` object, validates its `michael-ori.relay-mission.v0.1` placements, wraps it in an in-memory ΦPACK ZIP, and starts the original `enterPhiWadMission()` runtime adapter.

**No ZIP download, install, or manual file chooser.** The game itself is served over HTTPS from GitHub Pages. Custom mission data is cached with the site by the existing service worker after the first successful load. No user-created save file or external service is involved.

## Content integrity

The static file preserves the original uploaded `Code-Brown-Signal-Breakout.phiwad` mission, with wall-grid SHA-256 `745a9f41cb2749bcbe33b61b4f0589dc039d0785da1bbdd7261c4b78b809f794` and mission metadata SHA-256 `09725cc6438451c6c2ba90b39f045af01cc381ab84d2e7e744421ef7fede90cb`. These hashes are checked in automated tests to prevent silent changes. They are **build regression pins**, not signatures establishing authorship or authenticity.

The hosted loader only fetches an allowlisted same-origin static URL. It caps downloaded JSON at 64 KiB, rejects unsupported profiles or layout, and executes no remote scripts. It reuses the existing ΦPACK/ΦWAD validation, including reachability for the two relays, key, extraction, enemies and pickups.

## Gameplay boundaries

This is the same temporary community mission mode as a manual ΦWAD import. The original twelve-sector campaign, Neon Signal UI, weapons, Ori, Xbox controls and VR shared simulation remain as before. Custom checkpoints are session-only; the canonical `mwave-ori-checkpoint-v1` campaign save remains untouched.

The built-in sample is qualified by automated Game/import tests, but a real Quest 3 session and complete mission playthrough still require manual verification.

## Adding a future hosted mission

1. Build and validate a mission in PixelForge Studio.
2. Convert its verified content into a reviewed, local first-party `public/missions/<slug>.json` static definition with correct redistribution rights.
3. Add an explicit allowlisted entry and title screen/catalog choice.
4. Add the asset to `scripts/build.mjs` offline cache, with a regression test pinning the authored content.
5. Ship through a pull request so CI and deployment run before publication.

Do **not** automatically execute arbitrary uploaded JavaScript, HTML, or shaders inside mission packages. User-provided .phiwad files remain a separate local-only import path.
