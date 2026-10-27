# v0.4.0 reconstructed candidate — verification

**Fresh reconstruction, newly verified.** The interrupted candidate and its original test artifacts were unavailable. This source is rebuilt from the recovered v0.3.0 baseline (`914ff27305fbecab782d531be7992c91b79e14a6`) and the approved scope preserved in the conversation. The implementing agent performed these checks; no independent certification or physical acceptance is claimed. Public v0.3.0 remains unchanged.

## What is real

Three explicit modes share one authoritative campaign: original Canvas Classic; original VR Arcade screen; and native WebGL stereoscopic 6DoF geometry. The new world derives all twelve maps into floors, ceilings, exposed walls/pillars, animated doors, signage, entities, objectives and extraction. It uses owned sprites/meshes, a texture atlas, static chunks/frustum culling, capped dynamic buffers/effects and quality presets.

Independent head/weapon aim, physical lean/crouch, shared collision-safe head/muzzle motion, snap/smooth/reference/speed/posture/height comfort settings, six common weapons with vertical rays/pulses, world Ori and route/secret/danger feedback, wrist HUD/map/weapons/utilities, anchored subtitles, menus/checkpoints/results, practical positional audio and optional haptics are implemented. A post-movement hook aligns current head pose before enemy/projectile logic; firing uses finalized hand pose. Classic/Arcade use the same original combat branch. No runtime dependency, account, CDN or paid service was added.

## Current observed evidence

| Check | Result | Artifact |
| --- | --- | --- |
| Node tests | **162 pass / 0 fail**; previous 128 unchanged, 34 added | `node-tests.txt` |
| Baseline | All 10 prior test files byte-identical; twelve maps and six weapon definitions unchanged | `baseline-preservation.json` |
| Classic campaign | **12/12 sectors in Node and Chrome**, secrets/artifacts, supplies, objectives, Wardens/transitions | `playthrough.json`, `browser-classic-playthrough.json` |
| Tracked campaign | **12/12 sectors in Node and Chrome**, through synthetic head/hand/stick data and production adapter | `immersive-playthrough.json`, `browser-immersive-playthrough.json` |
| Failure recovery | Both modes: actual enemy attacks → death → checkpoint retry → sector-one clear, Node/Chrome | Campaign reports, `browser-*-recovery.json` |
| Chrome immersive | **36/36**, including actual Canvas atlas/wrist/map/caption and finite twelve-scene batches | `browser-immersive-checks.json` |
| Preserved Chrome checks | **10 smoke / 27 Xbox-DOM / 20 Arcade logic** pass | `browser-original-smoke.json`, `browser-xbox.json`, `browser-arcade.json` |
| Browser graphics | **Unavailable**, WebGL context cannot be created; Arcade's two graphics checks unavailable too | `browser-webgl.json`, `browser-arcade.json` |
| Software GLES | Exact world/comfort/Arcade shaders compile; actual twelve-map meshes/atlases yield distinct eye pixels | `gles-world-check.json`, `gles-arcade-check.json`, `render-evidence/` |
| Static build | Complete `dist/`; **82** relative asset/import/cache references resolve under a repository subpath | Build check |
| Offline logic | **28** resources return bytes with disconnected fetch; fallback/cache cleanup/POST handling pass | `offline-check.json` |

The tracked test player knows the map, aims precisely and selects the fastest exposed speed **1.0**. It does not assign player position/HP, enemy HP, keys, objective flags or door state, and does not directly call damage/completion. The successful Node campaign includes 3 natural deaths/retries, with 1 in sector twelve; the final Warden traverses phases [1, 2, 3]. Action counts can include repeated fights after checkpoint restoration. This is not human balance/default-speed or hardware controller-only testing. Unit fixtures are isolated separately and are not misrepresented as traversal.

## Actual browser interaction

On the internal HTTP preview I clicked unavailable Immersive entry and confirmed Classic remained usable. I changed smooth turn/standing/keyboard controls, reloaded and observed saved values (standing eye height 1.75m), then restored snap/seated defaults. Native held-key input moved, used the first door, fired with Z, called Ori and paused with Escape. The resulting HUD showed live enemy damage (96 health/19 armor), energy use and Ori assisting. No hidden game-state injection was used. The three mode controls are present. HTTP preview does not provide a secure-origin XR session environment.

## Limits / pending acceptance

- No actual Quest 3 session, stereo compositor, physical Touch/Xbox/Bluetooth controls, haptic output, spatial listening or real-device calibration acceptance.
- No human comfort/readability/balance judgment, long-session resource/thermal test or verified **72 FPS**. CPU draw-call diagnostics are not GPU/compositor timing.
- No actual browser WebGL API execution here. Software GLES validates exact shader strings/data/stereo pixels, not browser XR integration or physical performance.
- No actual browser airplane-mode reload on HTTPS. The offline evidence is generated-worker cache logic executed in a Node VM.
- No public deployment or merge. No matching GitHub game repository was identified in searches, so no PR was opened. `pr-description.md` and the isolated branch support later handoff.

Complete `quest3-acceptance.md` on charged hardware before considering public release. Runtime code is functional; hardware acceptance remains explicitly pending as authorized by the mission.

## Reconstruction / known history

The missing candidate's byte hash and historical 161-test claim are not reused. Current reconstruction has 162 passing cases. No current failure was removed or suppressed. Previously discussed dodge-bearing and muzzle-reach issues were implemented with explicit regressions. Source collision was extracted verbatim and re-exported to avoid a circular import. Decorative props retain their original nonblocking behavior. Quality changes detail immediately but framebuffer scale next session. Details: `deviations.md`, `requirements.md`, `level-interface.md` and `recovery.md`.

## Reproduce and recover

Run `npm run check`, `npm test`, `npm run playtest`, `npm run playtest:immersive`, `npm run build`, `node scripts/verify-build.mjs` and `node scripts/verify-offline.mjs`. This run used Node v24.22.1; package targets Node 20+. The ZIP has prebuilt `dist/`, so after extraction `npm run dev` serves it at localhost:5173 without installing packages. Quest needs a secure HTTPS host; do not overwrite public v0.3.0.

Optional installed Linux EGL/GLES/Pillow checks compile the exact shaders; export production mesh/atlas fixtures from `/immersive-qa.html` for software rendering. No such tool is needed to play.

The archive includes source, runtime, its source download, tests, current evidence, controlling-scope receipt, versioned IR example and acceptance checklist. `docs/integrity.json` hashes source/build artifacts. The final ZIP is also retained under `releases/` on the isolated backed-up branch, with an archive receipt. Delivery readback verifies both the candidate and unchanged public source. See `recovery.md` for restoring it after another session reset.

**Release readiness is a separate object:** candidate checks pass where supported; physical acceptance and public release are pending and human-owned.
