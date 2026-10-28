# GEN.E.WRIST → BTM bridge v0.7.0-rc.1

The shared project's canonical design resides at https://github.com/MichaelWave369/GenEWrist. This change pins GenEWrist v0.2.0, main commit a18911806f2aba6aa0076282d2e2ce77f4f45287.

These are **locally bundled, immutable dependency snapshots**, not a separately maintained canonical catalog:
- src/genewrist/catalog.js (upstream blob 016e8f87fbda736e69f2d0188fec90750a5e9f1f)
- src/genewrist/worlds.js (upstream blob d848448638ca8b6e06962a917500911bd17d6eb1)

Future updates should synchronize from an explicitly reviewed upstream revision. The authoritative module and world directory remains in GenEWrist. This pin keeps BTM fully offline and avoids CDN dependencies.

## Responsibilities

- BTM owns its existing WristComputer, guarded pointer hit targets and neutral re-arm, hand transforms, weapons, gameplay, checkpointing and XR lifecycle.
- src/genewrist-bridge.js contains only BTM-specific, pure FieldNavigator view state and world launch validation.
- src/genewrist-ui.js renders the published canonical ring/app metadata using BTM's existing Canvas and WorldUI.button() interaction.
- src/main.js is the sole BTM authority for exit/travel. Neither the wrist UI nor the shared catalog automatically navigates or transfers game state.
- Health/armor/energy are drawn from the actual in-memory BTM game player. They are never transmitted to the next site.

## Safe travel

Travel requires selecting a world, reading a separate warning, and pressing CONFIRM EXIT / TRAVEL. Known destinations are the GenEWrist console, Domistika XR, and LENZ. All other records remain unavailable, with no guessed URLs. The BTM self-entry is hidden.

Campaign travel invokes the existing game checkpoint/save routine, then requests an orderly VR session end before changing websites. A custom ΦWAD mission cannot save current mission progress; the warning must be visible before travel.

Cross-origin websites cannot share the same active immersive WebXR session or automatically read each other's saved progress. Browser navigation or external origins may still fail; these are not disguised as working portals.

## Physical Quest 3 / Touch acceptance — pending

1. In a live campaign sector, raise the wrist and select GEN.E; check health, armor and energy are live.
2. Explore the identity/tools/refuge rings and confirm exact counts 3/6/9.
3. Return to combat and test all six weapons, original map, Ori, dodge, recenter, pin, locomotion, and vision settings.
4. Confirm pointer, trigger activation, neutral re-arm, controller loss and dangerous automatic firing are still guarded.
5. Select and then cancel external travel; ensure the game remains intact.
6. Confirm a campaign checkpoint is saved, XR stops, and the external site opens on a confirmed handoff.
7. Test a custom ΦWAD mission and ensure the unsaved-progress warning is legible.
8. Confirm headset comfort, stereo legibility, seated/standing posture, session cleanup and sustained performance.

Automated tests and synthetic renderer/browser checks do not validate real hardware.
