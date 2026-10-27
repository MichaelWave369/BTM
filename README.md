# Michael Wave & Ori: Break the Matrix

## v0.4.1 — Neon Signal Edition

**THEY CONTROL THE SIGNAL. WE CONTROL THE FREQUENCY.**

An original offline-capable 1990s Canvas raycasting shooter: twelve sectors, six weapons, Michael/Ori banter and assistance, secrets, local checkpoints, Xbox controls and native WebXR Arcade / immersive world modes. A new 1980s arcade interface wraps the preserved raycasting engine. No package install, paid service or external runtime library is required. The two bundled font families include their SIL Open Font Licenses.

## Play CODE BROWN directly on GitHub Pages

Open **https://michaelwave369.github.io/BTM/** and select **PLAY CODE BROWN** on the Neon Signal title screen. The game downloads only the small first-party level JSON behind the scenes and loads it as a verified ΦWAD mission automatically. No game ZIP, local install, manual .phiwad download, or file chooser is required.

This is the original authored CODE BROWN: Signal Breakout level: 29×25 grid, nine enemies including the Warden, two relays, five pickups and two captives. Custom runs use session-only checkpoints and do **not** modify your original campaign's saved progress. After the first successful site load, the mission is included in the service worker offline cache.

**LOAD ΦWAD MISSION** remains available for other creators' local packs. The hosted mission is static, versioned data, not remotely executed scripts. See [the hosted mission contract](docs/HOSTED_MISSIONS.md).

## Play or run locally

Extract the complete source/build ZIP. The same twelve-sector game now has a chrome wordmark, original vector sunset city, magenta/cyan instruments, illustrated weapon slots, a discovered-room radar, new Ori displays and redesigned menus, wrist HUD and captions. With the prebuilt `dist/`, no dependency install is needed. With **Node.js 20+**:

```sh
npm run build
npm run dev
```

Open **http://localhost:5173/**. The ZIP contains a prebuilt `dist/`, so `npm run dev` works immediately after extraction. Any static HTTP server can serve `dist/`. File double-click through `file://` does not provide the browser module/XR environment. Quest headset entry needs a secure HTTPS origin; ordinary HTTP on another machine's LAN address is not sufficient. Local desktop `localhost` is suitable for regular play.

## Twelve-sector campaign

| Act | Sector | Level | Encounters |
| --- | --- | --- | --- |
| I | 01 | The Wake-Up Call | Original introduction |
| I | 02 | Cathedral of Static | Original broadcast temple |
| I | 03 | The Demiurge Core | Original Warden ending |
| II | 04 | The Memory Foundry | 12 enemies |
| II | 05 | The Blackout Stack | 15 enemies |
| II | 06 | The Null Crown | 18 enemies; Warden |
| III | 07 | The Dead Letter Depot | 20 enemies; HP multiplier 1.60 |
| III | 08 | Meatspace Firewall | 23 enemies; HP multiplier 1.85 |
| III | 09 | The Redundancy Pit | 26 enemies; Warden; HP multiplier 2.10 |
| IV | 10 | The Panopticon | 29 enemies; HP multiplier 2.40 |
| IV | 11 | The God Process | 32 enemies; Warden; HP multiplier 2.75 |
| IV | 12 | The Impossible Frequency | 36 enemies; final Warden; HP multiplier 3.10 |

Each three-sector act retains its ending screen and offers continuation until sector twelve. The original six maps and enemies keep their behavior. **Nightmare Run** jumps directly into the new campaign with all six weapons, full health/energy, and no unearned artifact upgrades. Normal continuation retains earned progress. The actual colossal Demiurge remains future content; all playable bosses are Wardens.

Nightmare difficulty rises through enemy count, health, damage, movement speed, projectile speed and attack cadence. Later programs lead moving targets, shift laterally, resist repeated weapon stun, and fire wider volleys. Ori's strong stun remains available. Break a constant circle-strafe, use cover, vent, find supplies and keep Ori close. The new layouts have four readable archives each, named regions, captives and optional hidden artifacts. Required relays, key and rescues remain accessible without secrets.

Break both relays, collect the gold key, defeat any Warden, and reach extraction. Fire breaks control programs and liberates human hosts. Rescue captives with interact. Every two earned artifacts increase all weapon damage by 15%; liberation charges bass drop. Ordinary enemies are not all mandatory for exit.

## Desktop / Xbox

| Keyboard / mouse | Xbox | Action |
| --- | --- | --- |
| WASD / up-down arrows | Left stick | Move / strafe |
| Mouse / left-right arrows | Right stick | Horizontal aim / turn |
| Left click / Z | RT | Fire / hold to continue |
| Right click hold / release | LT hold / release | Charged alternate shot |
| E | A | Door, relay, rescue, archive, extract |
| Space | B | Directional dodge |
| R | X | Vent / recharge |
| Q | Y | Ori stun / route scan |
| 1–6 / wheel | LB / RB | Select unlocked weapon |
| Shift | Hold L3 | Sprint |
| F | D-pad up | Resonance Vision / secrets |
| B | D-pad down | Bass drop |
| Tab | View | Discovered map |
| H | R3 | Field manual |
| Esc | Menu | Pause / resume |

Pair Xbox in your device's Bluetooth settings or use USB. Click the page once for audio, then press/release A to detect it; press A again to select. Menus: D-pad/left stick selects, left/right adjusts settings, A confirms, B goes back. The setup screen provides detection status, aim speed, dead zone and optional vibration. Unknown mappings are reported rather than guessed. Release inputs after menus, focus loss or reconnect. Losing an active controller pauses play.

Mouse capture remains optional: choose automatic capture, drag aim or keyboard aim. Capture denial leaves fallback controls usable. Touch buttons remain a basic fallback.

## VR arcade / Quest 3

Open the HTTPS game address in your Quest browser and click **VR Arcade**. Accept the browser's immersive-session prompt. The game appears on a large world-anchored virtual arcade screen, rendered separately for each eye. Head motion changes your view of that screen; Michael moves and turns with the sticks. This mode retains the original virtual screen. Choose **Immersive VR** for the true 3D sectors.

| Quest Touch / xr-standard | Action |
| --- | --- |
| Left stick | Move / strafe; menu selection and adjustment |
| Right stick horizontal | Aim / turn |
| Right stick up / down | Cycle weapons |
| Right trigger | Fire; point at a screen button to select it |
| Left trigger hold / release | Charged shot |
| Right grip / A | Interact |
| Left grip | Ori |
| B / X / Y | Dodge / vent / vision (Quest profiles) |
| Hold left stick click | Sprint |
| Right stick click | Pause / resume |
| Screen toolbar | Pause, vent, Ori, dodge, vision, map, bass, recenter |
| Pause / menu tools | Recenter screen; exit VR while preserving the game |

Generic xr-standard controllers use their standard trigger/grip/stick inputs; the toolbar supplies actions whose face buttons are not standardized. An Xbox pad remains an Arcade fallback when Touch input is inactive. The new world mode uses tracked controllers. Hand-only interaction is not implemented.

Screen width and distance are saved in Settings. Recenter anchors it in front of your current head pose. VR rendering suppresses the game's view bob and CSS shake. Tracking loss, hidden headset visibility, controller removal and reference-space reset pause input. Exiting returns to desktop with the game preserved and paused. The desktop and immersive loops share one simulation clock.

## Immersive VR / Enter the Field

The actual twelve maps surround you in native WebGL, with independent per-eye pose/projection, floors, ceilings, walls, animated doors, pillars, owned pixel sprites, world Ori, projectiles and combat effects. **One tile is 1.6m; ceilings are 2.72m.** The original maps, AI, objectives, resources and weapon definitions remain authoritative.

Look, lean, pitch and crouch naturally; head movement does not snap the body or weapon. Aim the **right hand**: right trigger fires, left trigger holds/releases charge, right grip/A interacts along the weapon ray within reach. Left stick moves, right stick snaps 30° by default. Left grip calls Ori; B dodges, X vents and Y reveals secrets. Raise the **left wrist** for vitals, objective, six weapons, discovered map, bass and utilities; point/trigger to select. Right stick click pauses. Point at menu buttons or navigate/adjust with the left stick. Checkpoint, settings, retry, recenter and exit remain available in the headset.

Settings offer snap/smooth turn, 15/30/45° snap, head/left-controller movement, speed .25–1 (default .60), seated/standing eye-height presets and custom height, vignette, aim guide, diagnostics and three quality presets. Detail changes immediately; framebuffer scale applies next session. Diagnostics show world draw calls and CPU submission milliseconds, not GPU/compositor FPS. VR has no camera shake.

Physical head motion is swept through the same wall/door collision. Muzzle reach is clipped before surfaces and capped at .85m from the safe head. Menus freeze gameplay; physical head travel becomes a bounded collision-safe visual proxy discarded on resume. Tracking discontinuity, missing head/right hand, visibility interruption and controller removal pause safely. One XR clock replaces the desktop presentation loop; exit preserves the paused game.

Ori follows in the world, signals danger/assistance, draws assist beams and scanned routes/objectives/secrets, and retains Michael/Ori banter. Practical enemy/Ori/door positional sounds and optional controller pulses augment the original effects. Classic/Arcade retain their existing audio behavior.

**Physical acceptance remains pending.** No real Quest headset/session or controller validation occurred. This cloud browser lacks WebGL. Synthetic poses drive gameplay tests; software GLES separately verifies exact shaders, shared geometry/atlases and stereo pixels. Quest presentation, haptics/audio, comfort, long-session stability and the **72 FPS target** require the [manual checklist](docs/v0.4.0/quest3-acceptance.md). The fastest scripted VR speed is not a human balance-tested preset.

## Saves, offline and ownership

The existing v1 save key and format remain compatible. Map identifiers are now checked against the saved sector to reject mismatched checkpoints. Continue resumes the latest checkpoint. Fresh starts intentionally begin another run. Storage clearing/private storage can remove or prevent checkpoints.

On HTTPS/localhost wait for **OFFLINE READY**. All **34** shell/runtime resources, including every immersive world module, local fonts and the original SVG city, are cached with a content-hashed worker. Browser XR permissions, hardware availability and secure-origin requirements still apply when offline. Refresh once more if an older cached release appears after deployment.

How to Play links the full MIT source/build ZIP, generated on every build. It includes source, prebuilt runtime, tests, docs and the GitHub Pages workflow, without Site identity or credentials. No CDN, telemetry, account, external service or runtime framework is required.

## Verification

```sh
npm run check
npm test
npm run playtest
npm run playtest:immersive
npm run build
node scripts/verify-build.mjs
node scripts/verify-offline.mjs
```

The UI release passes **170/170 Node tests**: all 162 existing cases plus eight UI, license, contrast, icon and minimap regressions. Existing tests include complete twelve-sector Classic and synthetic tracked campaigns, Wardens, live enemy deaths and checkpoint retries. All 15 existing test files and 18 gameplay/input/audio/XR engine files are byte-identical to the published v0.4.0 baseline. World asset factories are unchanged; only the UI portrait palette changed in `assets.js`.

Fresh Chrome checks pass **19 UI checks** at 1920×1080, 1280×720, 960×640 and 390×844; **36 immersive/Canvas**, **27 simulated Xbox/DOM**, **10 original smoke** and **20 Arcade XR logic** checks. The two actual browser WebGL checks are unavailable in this environment. Physical Quest/Touch/Xbox/Bluetooth testing, headset readability/comfort and performance remain unverified. Native browser play exercised movement, the first door, shooting/liberation, Ori, live damage, pause/settings, natural death and retry with the new interface.

`/ui-qa.html` exercises the actual production document at four viewports and paints both VR interfaces. `/qa.html` and `/immersive-qa.html` retain the original harnesses. The game uses the same v1 save keys and formats. UI colors are independent of gameplay weapon definitions. Reduced-motion settings suppress menu transitions and UI portrait motion; all important text uses high-contrast dark instrument backgrounds. The new desktop radar zooms the same discovered data; Tab keeps the full map. No new location knowledge or gameplay rule is introduced.

See [current verification](docs/v0.4.1/verification.md), [baseline preservation](docs/v0.4.1/preservation.json) and screenshots in `docs/v0.4.1/screenshots/`. Historical v0.4.0 evidence and its physical Quest checklist remain intact. The original concept image guided the art direction; the UI is live HTML/CSS/SVG/Canvas, never a flattened screenshot.

## Architecture / deployment

| Source | Purpose |
| --- | --- |
| `src/core.js`, `collision.js`, `spatial.js` | Shared combat, AI, collision, 3D rays, objectives, saves and progression |
| `src/expansion.js` | Act II maps and original theme decoration |
| `src/gauntlet.js` | Six authored nightmare layouts and deterministic encounters |
| `src/renderer.js`, `assets.js`, `audio.js` | Original procedural retro art, raycasting and audio |
| `src/arcade-ui.js`, `style.css`, `public/art/`, `public/fonts/` | Shared UI palette, authored icons/illustrations, responsive instruments and licensed local type |
| `src/controls.js`, `gamepad.js` | Mouse/keyboard policy, Xbox input, menus and rumble |
| `src/vr.js` | WebXR session lifecycle and single-clock integration |
| `src/vr-input.js`, `vr-math.js`, `vr-renderer.js` | Touch mapping, anchored-screen geometry, ray UI, Canvas HUD and WebGL eye views |
| `src/immersive-rig.js`, `immersive-play.js`, `immersive-math.js` | Safe tracked transforms and one simulation adapter |
| `src/level-geometry.js`, `world-atlas.js`, `world-scene.js`, `world-ui.js`, `vr-world-renderer.js` | Derived geometry/IR, owned atlas, world batches, wrist/captions, WebGL stereo |
| `tests/`, `scripts/`, `docs/` | Regressions, traversal, build, portable package and verification receipts |

Native JavaScript ES modules, Canvas and WebGL remain the architecture. The included GitHub Actions workflow checks/tests/builds and deploys `dist/` to Pages on `main`; relative URLs support a repository subpath. GitHub deployment itself is not claimed by this package. The v0.4.0 release was published before this UI pass. Sites source retains the release history and the recoverable v0.4.0 archive. This interface release uses the same Site identity and public audience. No matching GitHub game repository was identified, so no GitHub PR is claimed.

## License

Original code, maps, dialogue, procedural pixel art, SVG illustrations and audio are MIT-licensed. Oxanium by Severin Meyer and Racing Sans One by Impallari Type use the included SIL Open Font License 1.1 texts in `public/fonts/`. No DOOM/Wolfenstein art, maps, samples or music are used. The untouched original brief remains `docs/controlling-spec.md`; current reconstructed scope is `docs/v0.4.0/controlling-brief.md`. Author-run checks are not independent certification.
