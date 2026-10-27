# ΦWAD Custom Missions · Neon Signal v0.4.2-rc.1

This is the first **opt-in** PixelForge ΦWAD integration directly in the BTM source repository. It uses BTM's real Game simulation and shared Classic/VR rendering pipeline, not a separate FPS runtime.

## Make and play a custom mission

1. In [PixelForgeStudio](https://github.com/MichaelWave369/parallax-pixelforge), use the ΦWAD Raycaster Workshop to convert a Runtime Composer scene to a `.phiwad`.
2. Open **ΦWAD Missions** in PixelForge to place the two control relays, gold key, extraction portal, and optional enemies, items and captives. Validate reachability and download a mission-bearing `.phiwad` file.
3. In BTM's **Neon Signal** title menu choose **LOAD ΦWAD MISSION**, select your local package, and play.

The file remains on your device. The importer does not upload it, execute scripts within it, or fetch remote assets. BTM accepts only the explicitly versioned `phi369.raycaster-level.v0.1` profile with the `michael-ori.relay-mission.v0.1` mission contract; it rejects unsupported or corrupt packages.

## Campaign and save isolation

The package becomes a temporary **sector 13** while in use. The original twelve `SECTORS` objects are not overwritten or shipped with changed data. Leaving the custom mission removes the temporary sector, resets the game to its original title mode, and enables the regular campaign normally.

**Custom missions have session-only checkpoints.** `saveCheckpoint()` never writes the existing `mwave-ori-checkpoint-v1` localStorage slot during custom play. Death/retry uses the same normal Game checkpoint routine in memory. Finishing the relays/key/exit objective shows a separate custom-victory screen and returns to the title rather than advancing to an impossible sector 14.

Imported world geometry is rendered through the existing 2D raycaster and the shared immersive WebXR 3D world-geometry code. Controller, mouse/keyboard, pause, Ori, weapons and game combat all use the existing game logic.

## Qualification

Run these from the repository root:

~~~sh
npm run check
npm test
npm run build
node scripts/verify-build.mjs
node scripts/verify-offline.mjs
~~~

The new regression test covers successful import, 29×25 map layout, player spawn, 2 relays, generated immersive geometry, normal retry, original-sector restoration, game-complete objective state, invalid packages and double import. The imported modules are included in the generated offline service-worker cache.

### Important limits

- This is a v0.4.2 **release candidate**. Passing automated tests verifies integration contracts and build integrity, not that every community-authored level or Quest 3 session has been manually qualified.
- Static binary walls and existing entity types only. New procedural door logic, custom scripts, multi-map campaigns and external textures are not imported.
- The shared world renderer uses the new level's map and theme; in-headset geometry, collision, controller interactions, comfort and perf still require Quest 3 hardware verification.
- Enemy placement/AI balance and objective reachability are validated statically in PixelForge but are not a guarantee that every mission is beatable.
- Original Neon Signal UI, twelve-sector campaign, user checkpoint and visual assets remain unchanged except for additive custom-mission UI and relevant labels.

**Design principle:** community level data never gets to replace BTM's engine, permission boundaries or canonical campaign.
