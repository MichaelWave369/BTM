# Neon Signal Edition — v0.4.1 verification

UI-only release from published v0.4.0 source `9baa3d8d3a15de98d474860b4c927b05a55f0868`. The attached concept informed the palette, chrome type, skyline, angular instruments and character treatment. Original HTML/CSS/SVG/Canvas components implement the result; no concept screenshot is shipped or used as a UI. All code, SVG and Canvas illustrations are original MIT work. Unmodified Oxanium and Racing Sans One files and their actual OFL 1.1 license texts are bundled, locally loaded and cached. No runtime dependency, account, paid service or CDN was added.

## Current verified results

- **170/170 Node tests pass, 0 skipped**: all 162 existing cases plus eight UI regressions. Existing full twelve-sector Classic and synthetic tracked campaign/recovery tests pass. The scripted drivers know maps and aim precisely; they are not human playtesting.
- **49 modules** pass syntax checks. **99 asset/import/cache references** resolve under a repository subpath. The production build includes a valid downloadable source/build ZIP.
- **34 cached resources**, including both fonts, their licenses, interface module and SVG scene, return bytes with disconnected fetch in the generated-worker VM. Navigation fallback, POST exclusion, old-cache cleanup and unrelated-cache retention pass. This is not an actual browser airplane-mode reload.
- **19 browser UI checks** pass in production-document iframes at **1920×1080, 1280×720, 960×640 and 390×844**. Checks cover local font loading, title navigation, every existing setting, live resolution adjustment, return navigation, real gameplay HUD layout/essential font sizes, six weapon controls and locks, nonblank portraits/radar, full map open/close, pause/settings/manual/resume, actual Canvas art and both VR interface hit targets. Arcade title labels stay separate from HTML subtitles/icons.
- Fresh existing browser checks: **10 Classic smoke**, **27 simulated Xbox/DOM**, **36 immersive math/lifecycle/Canvas**, **20 Arcade logic** pass. The **two actual browser WebGL checks remain unavailable**, not passed.
- Normal browser keyboard play moved through the first door, fired the blaster, liberated a host, spent Ori energy and showed assistance, took actual enemy damage, opened pause/settings, died naturally, displayed the redesigned result screen, and retried to 100 health / 25 armor at the checkpoint. No coordinates, health, enemy HP or objective flags were assigned for this manual check.
- `preservation.json` verifies **18 engine/input/audio/XR files** and **15 existing test files** are byte-identical to v0.4.0. World art factories before `drawPortrait` are identical; only the interface portrait's palette changed. All twelve maps, six weapon definitions, AI, costs/damage/cooldowns, progression and v1 save/settings keys/formats are preserved. The old snapshot release tag remains unchanged for compatibility.

## Design and usability choices

Cyan, pink, gold, violet, warning and primary/muted text tokens meet **4.5:1** contrast against the instrument background. Live health/armor numbers, separate meters and labels remain visible at narrow sizes. Locked weapons retain disabled controls and visible labels; selected weapons expose `aria-pressed`. There is no repeated screen-reader live announcement of rapidly changing vitals. Keyboard/controller focus has a gold outline. Reduced motion suppresses menu transitions and portrait time motion without changing game state.

The desktop radar zooms the same discovered rooms, with clipping; Tab still opens the full-sector map. Objective/route/secret knowledge follows the existing visibility rules. The minimap regression confirms unseen cells/objectives are not revealed and rendering does not mutate game snapshots. HUD Canvas draws remain throttled by the existing ~12.5 Hz update. Weapon illustrations repaint only when unlock state changes. No gameplay geometry/shaders, simulation tick, audio scheduling or input adapter was replaced.

## Failure preservation and repairs

`ui-initial-checks.json` preserves the first 14/19 run. The narrow Field Manual target was too short and now has a 36px minimum. Four map close failures came from the new QA harness dispatching keyboard events on Document, whose target has no `matches()`; real keyboard events target an element. The harness now dispatches bubbling events on the actual game Canvas. The production input policy was not changed to hide the harness error. The final 19/19 run includes the repair and clean Arcade menu-label handling. Native browser smoke/controller click calls occasionally timed out after completing; the rendered reports confirmed all cases passed, and they were saved without repeating the actions.

## Screenshots

`screenshots/title.jpg` and `screenshots/gameplay-hud.jpg` are actual browser captures of the production UI. Additional captures show live combat damage, pause, settings and natural death/retry. No screenshot is used as an interface asset. The output screenshots reflect the cloud viewport; the 1080p and other layout measurements were made in real-sized iframes. The screenshots do not prove hardware frame rate or real headset readability.

## Explicit limits

No physical Quest 3, Touch or Xbox/Bluetooth controller was available. Real XR session/compositor/stereo presentation, haptics/spatial listening, human headset readability/comfort, human campaign balance, GPU/compositor timing, 72 FPS, thermal/long-session behavior and actual HTTPS airplane-mode reload remain unverified. Browser WebGL contexts are unavailable in this environment. VR evidence here is Canvas rendering and synthetic input/session logic. The retained v0.4.0 hardware checklist remains applicable.

## Reproduce

Run `npm run check`, `npm test`, `npm run build`, `node scripts/verify-build.mjs`, and `node scripts/verify-offline.mjs`. Serve `dist/` with `npm run dev`. In a browser, use `/ui-qa.html`, `/qa.html`, and `/immersive-qa.html`. The full ZIP includes prebuilt `dist/`, source, tests, evidence, screenshots, licenses and its source download. The original and updated releases remain recoverable in source history.
