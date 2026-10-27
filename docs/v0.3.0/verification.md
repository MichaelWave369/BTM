# v0.3.0 verification — Nightmare Frequency + VR Arcade

Baseline v0.2.1: `0f7fb1f9793d77b8ae97462bd22f76b27efa42c2`. The current user asks for six progressively very difficult levels and Quest 3 / VR-browser play. Implementation interpretation: native head-tracked **virtual arcade screen**, with the original raycast shooter, not a room-scale world conversion. This was stated in progress and is explicit in the product/manual.

| Verification | Result | Evidence |
| --- | --- | --- |
| Node suite | **128/128 pass** | `test-results.txt` |
| Original test preservation | Original core + browser smoke files unchanged; prior Xbox files unchanged | Hash regression and Git comparison |
| Syntax | **29 JS modules pass** | `npm run check` |
| Full Node campaign | **12/12 clear**, normal movement/actions, all 12 secrets/artifacts | `playthrough.json` |
| Full Chrome campaign | **12/12 clear**, 121 minds freed, all 12 secrets/artifacts; all five bosses reach phases 1/2/3 | `browser-campaign.json` |
| Death/retry | Live enemy death, 107 damage taken, checkpoint recovery and first-sector clear | `browser-recovery.json`, Node report |
| Original Chrome smoke | **10/10 pass** | `browser-smoke.json` |
| Browser Xbox + native DOM controls | **27/27 pass**, synthetic standard Xbox snapshots | `browser-controller.json` |
| XR math/input/lifecycle | **20/20 pass** in Node and Chrome, simulated input/session | `browser-xr.json`, `test-results.txt` |
| Real browser WebGL presentation | **2 checks unavailable**: browser returned no WebGL context | `browser-xr.json` |
| Shader/GLES software rendering | Exact shipped shaders and vertex buffer compile/link; texture top/bottom orientation and two viewport pixels pass | `gles-check.json`, `scripts/verify-vr-gles.py` |
| Native normal UI | Sector-seven shortcut, Z fire, Q/Ori, Escape pause, unavailable XR recovery; width 3.4m + distance 3.2m survive reload, then reset to 2.8m/2.5m | Direct Chrome UI observations |
| Build subpath | **41 references pass** | `node scripts/verify-build.mjs` |
| Generated worker offline logic | **18 resources served with fetch disconnected**, including all new modules, navigation fallback/cache cleanup | `offline-check.json` |

The traversal driver never teleports, assigns player HP or objective/enemy flags, or directly calls damage/completion. It reads the map, aims precisely, changes strafe rhythm, sprints against Wardens, uses bass knockback in close groups and seeks supplies. Its final run has no deaths; prior failed strategies and death/recovery evidence are preserved separately. Sector eight clears with three optional enemies still alive. The driver exercises game state transitions rather than physically clicking every normal-game result button.

Source-boundary change: the former Act II count assertion now uses `slice(3,6)` to assert the same three Act II maps, rather than interpreting every later map as Act II. No original criterion is dropped. A newly valid sector index exposed a mismatched checkpoint test; restore now also checks that `level.index` matches `levelIndex`, preserving that original rejection test unchanged.

**Unverified:** real Quest 3/browser immersive session, physical Touch controls, browser WebGL graphics/eye presentation, actual VR frame rate/comfort, hand-only input, successful native pointer lock/fullscreen, browser network-off operation, speaker review, human completion/balance of the new campaign, cross-device sustained performance. Hand-only input and room-scale tile-world conversion are outside this arcade-layer milestone. Cached XR code does not guarantee device/browser XR availability offline.

The software graphics test uses surfaceless Mesa llvmpipe GLES, not a browser or headset. It verifies exact shader strings/vertex data and sampled pixels. The cloud browser correctly reports its unsupported XR state and retains desktop play. No physical-device success is inferred from simulated sessions.

Primary references used: [WebXR Device API](https://www.w3.org/TR/webxr/) and [WebXR Gamepads Module](https://www.w3.org/TR/webxr-gamepads-module-1/). Runtime code and assets remain local and dependency-free.

See [failures-and-repairs.md](failures-and-repairs.md) for the preserved discovery trail. Publication uses the same Site identity and existing public audience. Human owns release/hardware acceptance; these are author-run checks.
