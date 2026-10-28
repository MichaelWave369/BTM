# Cybernetic equipment — verification and compatibility

Candidate `0.6.0-rc.1` extends merged PR #3 (`43a6be45c1b6cba8081ba94beac7b8edb4d679ab`). Author-run checks on 2026-10-28 used Node 24.22.1 and real Chromium 153.0.8010.0 with software WebGL/ANGLE. Synthetic headset/Touch poses exercise production code. **Physical Quest 3, Touch fit, human comfort, haptic feel and sustained 72 FPS remain unverified.**

## Required checks

| Command | Result | Receipt |
| --- | --- | --- |
| `npm run check` | Pass, 61 JavaScript modules | [check.txt](check.txt) |
| `npm test` | Pass, **219/219**, no skips | [node-tests.txt](node-tests.txt) |
| `npm run playtest` | Pass, all twelve Classic sectors and live death/retry | [playthrough.json](playthrough.json) |
| `npm run playtest:immersive` | Pass, all twelve sectors and death/retry through tracked adapter | [immersive-playthrough.json](immersive-playthrough.json) |
| `npm run build` | Pass, relative paths, portable source/build ZIP and hashed worker | [build.txt](build.txt), [integrity](../integrity.json) |
| `node scripts/verify-build.mjs` | Pass, 126 asset/import/cache references under a repository subpath | [build-check.txt](build-check.txt) |
| `node scripts/verify-offline.mjs` | Pass, 44 cached resources with disconnected fetch and navigation/cache cleanup | [offline-check.json](offline-check.json) |

All 194 baseline Node cases remain; 25 new cases cover cached hand proportions/mirroring, atlas UV precision, six weapon silhouettes, bounded settings, activation/dismissal/manual pinning, near-face/tracking rejection, seated/standing panel bases, both-eye corner fit, grip/muzzle alignment, safe reach, capture/rearm and caption placement. Old wrist fixtures explicitly raise the controller, wait through deliberate dwell and use the new dimensions/pin target. Existing protection assertions remain.

[Preservation](preservation.json) verifies **44 files byte-for-byte** against merged PR #3: unchanged runtime modules, tests/fixtures and hosted CODE BROWN. This includes `core.js` (AI, weapon rules and dialogue), campaign maps, collision/spatial logic, original assets/audio/Classic rendering, Xbox, Touch mappings, XR lifecycle, Arcade, ΦWAD and `immersive-play.js` capture/neutral latch. The receipt lists intentionally changed rig/presentation/settings and test adapters separately. V1 checkpoint schema and the existing settings key remain compatible. Campaign drivers know the maps and aim accurately; they are regressions rather than human balance tests.

## Genuine browser checks

| Group | Result |
| --- | --- |
| Equipment math + actual Canvas/targets | **32/32** (25 shared + 7 browser cases) |
| Actual settings save/reload | Pass, finish/width/subtitle mode persist |
| Combat / intentional wrist | Pass, full panel absent during combat; active 320×213mm display |
| Matched production captures | 21/21, finite geometry, distinct eye hashes, nonempty pixels, no GL errors/dropped primitives |
| Equipment resource disposal | 0 live tracked resources after each capture |
| Existing signal / wrist logic | 17/17 |
| World WebGL | 39/39 sector/preset pairs (12 sectors + CODE BROWN × 3), plus cleanup; 40 checks |
| Existing immersive math / Canvas | 36/36 |
| Responsive production UI | 19/19 at four desktop/mobile viewports |
| Arcade | 22/22, including actual WebGL/stereo |
| Xbox / DOM | 27/27, simulated standard controller input |
| Original browser smoke | 10/10 |
| Actual service-worker offline reload | Pass, controlled app reloads offline and cached CODE BROWN starts |
| Browser page exceptions | 0 |

Full receipts: [equipment](browser-equipment.json), [existing regressions](browser-regressions.json). Long subtitle pages preserve every word; Ori Spatial is tested in a clear positive case and behind/near/occluded fallback cases. Hiding the wrist preserves communication. Panel whitespace and hardware remain current-pose ray targets. Both renderers dispose tracked buffers, textures, programs and shaders. Resource API accounting does not measure long-session thermal or memory behavior.

## Performance observations

The twelve candidate equipment capture scenes submit **14 world draws per stereo frame**, the same as the matched baseline. More detailed gloves/weapons increase triangle count: **9,824–11,360 across both eyes** in these candidate scenes versus **4,864–5,008** in the matched baseline equipment scenes. Maximum candidate dynamic upload is **13,344 vertices**, with **zero dropped primitives**. These are spawn/detail/wrist views, not worst-case combat profiles. UI, captions and comfort overlays submit separately and are excluded from the world draw diagnostic.

Meshes are constructed once per hand/finish/pose/detail or weapon/detail and appended to the shared dynamic batch. Composite, metal, rubber and emission use the existing atlas; flat surfaces sample the white tile's center to avoid precision-edge holes. No extra world material pass, postprocessing, bloom, shadow or remote asset is added. Existing chunk culling, effect limits and Performance/Balanced/High budgets remain. The compact status Canvas updates at most 8Hz, active full panel roughly 10Hz, and caption texture only on content/page or bounded waveform updates. UI hit transforms still use current tracked poses.

One extra small status Canvas texture/renderer is included in cleanup. Interface motion can be disabled independently or through existing reduced motion. Cached geometry avoids rebuilding meshes per frame; layout/settings/Canvas work still has CPU cost. Recorded CPU submission time in software WebGL is not GPU/compositor timing, an allocation profile or a Quest frame-rate estimate. Actual ≥72 FPS, thermal stability and comfortable optical presentation require the [physical checklist](quest3-acceptance.md).

## Failures preserved and repaired

- [Initial geometry/layout checks](failures/first-equipment.txt) exposed an overly strict default facing threshold and an offset Unplugger barrel; the default is .4 and its muzzle is axial. [Atlas artifact capture](failures/uv-edge-hands.png) exposed precision holes from sampling a tile edge; interior sampling plus a regression removes them.
- [Stereo corner failure](failures/first-stereo-corner.txt) exposed one-eye clipping at the old projection. The display now has ≥0.6m center clearance and a conservative binocular corner fit. The final tests cover seated/standing panel bases and default corner clearance in both eyes. [Dismissal fixture failure](failures/frustum-dismissal-fixture.txt) recorded an invalid expectation that a severely lowered, out-of-view panel must stay visible; the fixture now tests brief attention loss followed by sustained lowering.
- [First browser failure](failures/first-browser.json) recorded an obsolete target fixture and numeric-string comparison; the fixture now raises/dwells and compares numeric settings. [Second browser failure](failures/second-browser.json) recorded an inactive fixture that the helper itself raised; it now explicitly samples the inactive pose.
- [Legacy browser failure](failures/legacy-browser.json) recorded a late-frame caption-upload expectation after deliberate dwell. The fixture checks initial content upload and then advances monotonic time. Production rendering was not disabled to pass checks.

Earlier passing intermediate receipts remain alongside the first failures. There was no independent reviewing agent or hardware certification.

## Captures

All images use **actual production WebGL/Canvas**, comparing PR #3 and this candidate with identical synthetic poses. Each image contains left/right stereo views; these are not concept mockups. Hand/weapon detail poses hide UI on both builds to reveal geometry. Ordinary combat, active wrist and dialogue use their normal UI behavior.

- [Hands / Wake-Up Slap comparison](screenshots/hands-comparison.jpg)
- [Other five weapons comparison](screenshots/weapons-comparison.jpg)
- [Inactive wrist, active wrist and Ori comparison](screenshots/wrist-dialogue-comparison.jpg)
- [Both-eye ordinary combat](screenshots/stereo-gameplay.png)
- [Both-eye active wrist](screenshots/wrist-active.png)
- [Full-resolution wrist Canvas](screenshots/wrist-panel.png)
- [Full-resolution Ori communication Canvas](screenshots/ori-comms.png)

## Reproduce and review

Run the seven required commands above. Optional browser verification requires an external development-only Playwright/Chromium installation; neither is a game dependency:

```sh
BTM_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
BTM_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
BTM_SOFTWARE_WEBGL=1 node scripts/verify-equipment-browser.mjs

BTM_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
BTM_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
BTM_SOFTWARE_WEBGL=1 BTM_BROWSER_OUTPUT=docs/equipment/ci/legacy \
node scripts/verify-immersive-browser.mjs
```

The equipment verifier creates a detached baseline worktree, builds both versions, copies the same viewer, starts/stops local servers, captures both versions and checks disposal. CI has full history and installs isolated browser tooling, runs both verifiers and uploads `vr-equipment-evidence`. Raw CI output is excluded from source archives; curated evidence is committed. The local browser binary was supplied outside the repository after the normal download was truncated, as recorded in the previous milestone. `/equipment-qa.html` is a developer viewer, not the game entry flow.

Review disposition: **candidate for human review; hardware acceptance pending**. Merge/public release remains Michael's decision. See [implemented requirements](implementation.md) and [controls](../QUEST_CONTROLS.md).
