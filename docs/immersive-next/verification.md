# Immersive Next — verification and compatibility

Candidate `0.5.0-rc.1`, built from `main` `6e1a41b13e04bc3910d72d2eab1abdd015150ee1`. Checks were author-run on 2026-10-28 with Node 24.22.1 and Chromium 153.0.8010.0. Physical Quest 3, Touch, actual XR compositor, haptic feel, spatial listening and human comfort remain **unverified**. The 72 FPS goal is a hardware acceptance target, not an achieved or inferred result.

## Required checks

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run check` | Pass, 56 top-level JS modules | `check.txt` |
| `npm test` | Pass, **194/194**, no skipped tests | `node-tests.txt` |
| `npm run playtest` | Pass, all twelve Classic sectors and live death/retry recovery | `playthrough.json` |
| `npm run playtest:immersive` | Pass, all twelve sectors and death/retry through synthetic tracked adapter | `immersive-playthrough.json` |
| `npm run build` | Pass, local assets/source ZIP/content-hashed worker | `build.txt`, `docs/integrity.json` |
| `node scripts/verify-build.mjs` | Pass, 116 asset/import/cache references under a repository subpath | `build-check.txt` |
| `node scripts/verify-offline.mjs` | Pass, 42 cached resources with disconnected fetch, fallback and cache cleanup | `offline-check.json` |

All **178 baseline Node tests** remain and pass; sixteen new tests exercise presentation bounds, every sector/preset, projectile stress, safe glove/muzzle transforms, complete wrist capture and neutral rearming, current-pose pointer testing, comfort settings, hidden/locked interaction focus, reduced motion and CODE BROWN isolation. Test sources were added, not weakened. The campaign drivers know the maps and aim accurately; these are automated regressions, not human playtesting.

[Preservation](preservation.json) compares **37 original files** byte-for-byte against the baseline: authoritative simulation, collisions, maps, weapon definitions, dialogue, original assets/audio, Classic renderer, Xbox input, XR lifecycle/Touch mapping, Arcade renderer, all ΦWAD/hosted-mission code and every original test/fixture. XR rig/adapter and world presentation are intentionally changed and covered by the new regressions. Existing v1 save/settings keys remain. Optional new settings do not alter checkpoint schema, gameplay balance, resources or mission gates.

## Genuine browser evidence

The optional development verifier drives the **built production app in real Chromium**, using software WebGL/ANGLE. Software rendering exercises actual browser API/shader/texture/state behavior; it does not measure Quest GPU speed. Synthetic poses use the production rig and per-eye transforms.

| Browser group | Result |
| --- | --- |
| New logic / actual Canvas / wrist ray | 17/17 |
| Production WebGL sector/preset pairs | 39/39: 12 campaign sectors plus CODE BROWN, each at 3 presets |
| Tracked WebGL allocation/deletion balance | Pass; 0 live tracked buffers, textures, programs or shaders after disposal |
| Existing immersive logic/Canvas | 36/36 |
| Existing responsive production UI | 19/19 across 1920×1080, 1280×720, 960×640 and 390×844 |
| Arcade logic + actual WebGL/stereo | 22/22 |
| Xbox/DOM synthetic input | 27/27 |
| Original browser smoke | 10/10 |
| Actual service-worker offline reload | Pass, app controlled offline; cached CODE BROWN starts and displays objective |
| Browser page exceptions | 0 |

Full data: [browser-results.json](browser-results.json). Each of the 39 WebGL cases has finite dynamic geometry, no GL error/overflow, nonempty world pixels and distinct left/right image hashes. WebGL counters track deletion calls; they are not long-session memory/thermal measurements. Full physical XR entry/exit remains pending; synthetic lifecycle/reentry/interruptions continue to pass in the original suite.

## Performance observations and limits

At the synthetic spawn views, **world-only** counts range from **10–24 draw submissions** and **3,040–7,576 triangles across both eyes**. Maximum dynamic upload is **5,604 vertices**, with **zero dropped primitives**. These counts include new decoration; UI, captions and comfort overlays submit separately and are not included in the world draw diagnostic. The cases are reproducible spawn scenes, not worst-case Quest combat profiles.

| Preset | Next-entry scale | World fog / chunk distance | Visible fixture cap | Ring segments | Particles | Projectile trail cap |
| --- | --- | --- | --- | --- | --- | --- |
| Performance | .65 | 19m | 12 | 8 | 24 | 6 |
| Balanced | .85 | 27m | 28 | 12 | 48 | 12 |
| High | 1.0 | 36m | 48 | 16 | 96 | 24 |

Existing static 8×8-tile chunk buffers, one 1024² atlas, frustum rejection and one dynamic world batch per eye remain. New AABB distance rejection skips fully fogged chunks. Decorative meshes share that batch. Fixed effect/beam/volley caps and scratch-line reuse bound costs. No postprocessing, bloom, shadows, remote texture downloads or runtime packages were added. CPU submission timing remains available in the wrist diagnostics; recorded first submissions can include atlas/geometry creation and software-driver costs. No GPU/compositor timing, allocation-spike profile, real frame rate, thermal or comfort result is claimed.

## Preserved failure and repair

[Initial browser run](failures/entry-fade-browser.txt) records passing logic/Canvas tests but failed visibility/stereo-pixel checks: the viewer sampled the intentional opaque XR entry fade immediately after calibration. The QA viewer now advances the normal production rig through sixteen stationary .014s steps, with the shared simulation updating Ori, before sampling pixels. The production fade and comfort behavior were not disabled to pass the test. The final 39 visible stereo cases and cleanup check pass.

The cloud browser could not reach the isolated local server. The standard Playwright Chromium download was truncated. A development-only Chromium binary from the `@sparticuz/chromium@153.0.0` npm package enabled local checks instead; it is outside the repository and not included in the game or source ZIP. No development browser/package is a runtime requirement.

## Captures / reproduce

Actual production WebGL captures, using synthetic stereo poses after the entry fade:

- [Wake signal](screenshots/wake-stereo.png)
- [Blackout sector](screenshots/blackout-stereo.png)
- [Impossible frequency](screenshots/frequency-stereo.png)
- [Wrist instrument](screenshots/wrist.png)

Run the seven required commands above. For optional browser checks, provide an external Playwright install and Chromium executable, then run:

```sh
BTM_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
BTM_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
BTM_SOFTWARE_WEBGL=1 node scripts/verify-immersive-browser.mjs
```

The verifier starts/stops its own local build server. `/immersive-next-qa.html`, `/immersive-qa.html`, `/ui-qa.html` and `/qa.html` remain available for manual browser checks. The first is a developer viewer, not a replacement game flow. See [implemented/deferred scope](implementation.md), [Quest controls](../QUEST_CONTROLS.md) and [pending physical acceptance](quest3-acceptance.md).

Release-readiness object: **candidate for human review; hardware acceptance pending**. There was no independent reviewing agent or certification. Merge/public release remains Michael's decision.
