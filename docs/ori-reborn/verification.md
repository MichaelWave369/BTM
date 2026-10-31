# Ori Reborn / Survival candidate — verification

Date: 2026-10-31. Baseline: `4ada148` (merged PR #7). Candidate: 0.8.0-rc.1. Addresses Issue #8 **P0 + P1**. [Pit of Despair is explicitly follow-up Issue #9](https://github.com/MichaelWave369/BTM/issues/9); no extra campaign or placeholder levels are claimed here.

## Results

| Verification | Observed result | Evidence |
| --- | --- | --- |
| Agent router / syntax | All seven installed skills validate; 77 JavaScript modules pass syntax checks | `check.txt`; repository router run for Quest/comfort/performance and shooter/combat |
| Node | **256 / 256 pass** | `node-tests.txt` |
| Original Classic campaign | Twelve sectors, live traversal/combat, secrets, bosses, act transitions and natural death/retry pass under Legacy rules | `legacy-playthrough.json`, `playtest.txt` |
| Original synthetic immersive campaign | Twelve sectors and natural death/retry pass through production rig/adapter under Legacy rules | `legacy-immersive-playthrough.json`, `playtest-immersive.txt` |
| Survival opening act | Three sectors clear through ordinary movement, finite reload/cells, secrets and all Warden phases in Classic and synthetic immersive | `survival-opening-act.json`; two Node campaign tests |
| Production equipment browser | **38 / 38 checks**, 23 real before/after stereo captures; no GL errors/overflow, different left/right eye hashes; all tracked GL resources released | `equipment/report.json`, `equipment.txt` |
| Existing browser regressions | Signal 17, world WebGL 40, immersive 36, UI 19, Arcade 22, Xbox 27 and smoke 10 pass; no page errors | `browser-results.json`, `browser.txt` |
| Live Survival browser | Real DOM/keyboard fire, no passive refill, reserve-consuming reload, first-door traversal/combat, dash, caption opt-out, speech opt-in fallback, log and saved Survival fields pass | `survival-browser.json` |
| Production build | Build and 145 subpath asset/import/cache references pass | `build.txt`, `build-check.txt` |
| Offline | Generated worker retrieves all 51 shell entries with disconnected fetch; actual disconnected Chromium reload and cached CODE BROWN are playable | `offline-check.json`, `offline-check.txt`, `browser-results.json` |
| Source archive | Source ZIP includes `AGENTS.md`, the pinned `.agents/skills` files and router in addition to game source/build | `source-archive-check.txt` |
| Physical Quest 3 | **PENDING** | [Headset checklist](quest3-acceptance.md) |

All browser checks use production `dist/` in Chromium 151.0.7922.34, headless shell, software ANGLE/SwiftShader, Node v24.22.1. Stereo uses synthetic 64mm binocular poses and BTM's actual native renderer. They do not validate Touch hardware, voice audibility, compositor FPS, thermal behavior, human comfort or legibility. Captures are real Canvas/WebGL output, never generated imagery.

The equipment captures measured up to 15,258 dynamic vertices with no dropped batch entries. Recorded CPU submission times are tooling measurements, **not headset GPU/compositor frame pacing**. Physical sustained-performance acceptance remains pending.

## Real captures

- [Desktop Survival combat](screenshots/desktop-survival-combat.png)
- [Communication log with captions off](screenshots/communication-log.png)
- [Wrist / default seated](equipment/screenshots/after-wrist.png)
- [Wrist / standing](equipment/screenshots/after-wrist-standing.png)
- [Wrist / inverted controller](equipment/screenshots/after-wrist-inverted.png)
- [Wrist / tilted controller](equipment/screenshots/after-wrist-tilted.png)
- [Right-side Ori and peripheral dialogue](equipment/screenshots/after-dialogue.png)
- [Before/after comparison](equipment/wrist-dialogue-comparison.jpg)
- The equipment folder also contains all six weapon/hand comparisons and the original baseline captures. Baseline for these comparisons is PR #7 (`4ada148`).

## Limits and preserved failures

- Physical Quest testing is still required before accepting wrist pose, size, stereo usability, controller feel, speech, smooth turning or sustained performance.
- This is **not a successful twelve-sector Survival balance claim**. An exploratory exact-aim Survival bot cleared nine sectors and exhausted its retry budget in sector ten. The trace is retained in `failures/exploratory-survival-twelve.json`. Opening-act automated clears pass; late-sector human balance and broader Survival strategies remain pending. The preserved original twelve-sector regression is separately run in Legacy mode.
- Speech requires an unlocked browser session and a local-service voice. None is assumed available on Quest or offline. API errors, missing/remote-only voices, asynchronous failures, missing completion callbacks, pause/mode/mute and rapid repeats are tested as nonblocking log fallbacks. Audible Quest output is pending.
- Log history is bounded session memory (100 entries; desktop shows the latest 30), not a permanent archive. Captions/alerts and Ori can temporarily hide when every safe peripheral position is blocked.
- `failures/first-node.txt` preserves the initial failed pass: old full-charge/vent expectations, changed caption placement, naive finite-ammo driver behavior and a late immersive trajectory change. Original v0.1 test files remain byte-for-byte unchanged. Legacy's original dodge is preserved to keep old saved-run behavior; new Survival shield tests assert its 18-damage bound.
- `failures/first-browser.json` retains the initial stale wrist-target-count failures. The new COMMS control requires a target-count update; a separate regression now rejects overlapping map/comms pointer rectangles.
- Local full Chrome could not start because the environment disallows its singleton socket. The official matching headless shell ran the suites successfully. No physical headset was available.

## Reproduction

Run the normal required commands from the repository root:

```sh
node scripts/route-agent-skills.mjs --validate
npm run check
npm test
npm run playtest
npm run playtest:immersive
npm run build
node scripts/verify-build.mjs
node scripts/verify-offline.mjs
```

With external Playwright/Chromium test tooling available (as in the existing equipment CI), set `BTM_PLAYWRIGHT_MODULE` and optionally `BTM_CHROMIUM_EXECUTABLE`, then run:

```sh
BTM_SOFTWARE_WEBGL=1 BTM_BROWSER_OUTPUT=docs/ori-reborn node scripts/verify-immersive-browser.mjs
BTM_SOFTWARE_WEBGL=1 BTM_EQUIPMENT_BASELINE=4ada148 BTM_EQUIPMENT_OUTPUT=docs/ori-reborn/equipment node scripts/verify-equipment-browser.mjs
BTM_SOFTWARE_WEBGL=1 BTM_BROWSER_OUTPUT=docs/ori-reborn node scripts/verify-survival-browser.mjs
```

The candidate was not merged or deployed. Work is limited to BTM; owner review and physical acceptance remain pending.
