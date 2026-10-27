# v0.2.1 controller verification

The controller patch adds native browser standard-gamepad input to the existing six-sector game. It preserves the same Site identity and public audience. Testing below was performed on this patch, not copied from the prior release.

| Check | Observed result | Evidence |
| --- | --- | --- |
| All Node tests | **93/93 pass**; preceding 71 tests byte-for-byte unchanged | `test-results.txt`; Git comparison to baseline |
| Syntax | **21 modules** pass | `npm run check` |
| Chrome controller adapter and real DOM menus | **27/27 pass** | `browser-controller-checks.json` |
| Chrome full six-sector traversal | **6/6 clear**, 42 freed minds, 6 secrets, 6 artifacts, both Wardens phases 1/2/3 | `browser-campaign.json` |
| Chrome natural death/retry | Live enemies inflict 107 damage, death, checkpoint recovery, sector-one clear | `browser-recovery.json` |
| Original Chrome smoke suite | **10/10 pass** | `browser-smoke.json` |
| Native browser controls | Title/setup/back/start; Z fire consumes energy; Y-equivalent keyboard Q spends Ori energy; Tab/Escape; controller sliders and vibration checkbox persist after reload, then restored to defaults | Direct UI observation |
| Static subpath asset/import/cache checks | **28 references pass** | `node scripts/verify-build.mjs` |
| Generated service worker with network fetch disconnected | **13 assets served**, including `gamepad.js`; fallback and cache cleanup pass | `offline-check.json` |

The controller checks inject synthetic standard Xbox *data snapshots into the production input class*, then exercise the real game simulation and native DOM menu controls. They do not spoof the browser's navigator object, pair a real controller, or use mouse capture. The campaign driver uses ordinary game inputs, knows the map and aims precisely; it is not a controller or human balance playthrough. The worker check executes the actual generated worker in Node; it is not a browser airplane-mode test.

Native Chrome setup changes verified: aim speed **1.4**, dead zone **26%**, vibration **off** survived reload. Then reset to **1.0 / 18% / on**. No new application console errors were observed on the preview checks.

Unverified: physical Xbox controller/OS Bluetooth pairing, device-specific standard mappings, real rumble, actual controller-only game/menu feel, native fullscreen/pointer lock success, cross-browser/platform compatibility, sustained hardware performance, listening quality, browser network-off operation and a human complete campaign. The API is feature-detected; blocked/unavailable/unmapped states preserve keyboard and mouse play.

## Preserved failures and repairs

- First controller suite: **91/92** passed. The recharge assertion started at full energy, when the existing game correctly refuses a vent. Corrected the fixture to use an expended capacitor; behavior stayed unchanged.
- Review found that controller A could complete a sector before the frame's `playing` block and leave completion events unprocessed. Controller actions now dispatch their event queue immediately. A regression confirms controller extraction emits the real completion event before another simulation tick.
- Existing prior release failures/repairs remain in `../v0.2.0/failures-and-repairs.md`.

The Gamepad API standard and standard control layout were checked against the primary [W3C Gamepad specification](https://www.w3.org/TR/gamepad/). No device compatibility guarantee is inferred from API support.
