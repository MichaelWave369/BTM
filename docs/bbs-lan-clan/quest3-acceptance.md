# Physical Quest 3 acceptance — pending

No physical headset or Touch-controller test was performed in this Work session. Software stereo, synthetic poses and bounded tracked-wire tests do not prove comfort, tracking, performance or TLS behavior on a real Quest.

Use two actual devices/browsers, at least one Quest 3, against the same trusted WSS host. Preserve the existing solo calibration first; BBS reads it without rewriting solo saves. Repeat seated and standing.

- Confirm secure WebXR entry, trusted certificate and private-room joining. Configure address/handle in the browser before entering XR if headset text input is inconvenient.
- Verify left glove/wrist alignment, top clearance, deliberate raise/pin, legible maps and Gen.E.Wrist menus. While pointed at any wrist panel or whitespace, held shots/charge/sticks/turn/use must stay captured until neutral; deliberate Reload and other enabled utility clicks must still work.
- Confirm right-stick turn-only, saved snap/smooth turning, movement speed, collision-safe room movement, boundary/recenter behavior, tracking loss and controller disconnect/rearm.
- Check both flat → Quest and Quest → flat movement, all six weapons, right-hand tracked aim/reach/wall clipping, muzzle events, damage feedback and authoritative health. Verify remote head/hand approximations without claiming full-body motion.
- Confirm Ori stays to the right, outside sights, enemies and the left wrist. Compare captions off/on, peripheral critical alerts, Ori corruption/repair and speech unavailable/unsupported behavior. Verify no large central dialogue panel during combat.
- Run death/respawn, team friendly-fire policy, elimination rounds, cell contention and reconnection with ammunition unchanged. Test the raised wrist while a live opponent fires.
- Complete co-op relays/key/captive/extraction, natural down/revive, deliberate disconnect/rejoin, host transfer and server restart. Hold right grip or A for revive and Witness Extraction. Release early and verify the host resets the channel. Compare original and Pit solo saves before/after.
- In Stackyard, select **JUMP** in Fieldlink and verify the host accepts the jump. Click the right stick to pause, release it, and click again to resume while the shared match clock advances.
- Play at least one stage from each original/Pit act and each Pit boss with two humans; assess finite ammunition, HP normalization of Legacy-era encounters and resource fairness. Automated map knowledge/exact aim is not human balance validation.
- Complete all four Demiurge phases with two humans: pylons/waves, end-bridge partition routes and paired consoles, corrupted Ori repair, repeated synchronized core windows, then both-player escape. Test a disconnect/down during each paired task and raid retry.
- Measure sustained headset frame time, resolution, dynamic vertex/bandwidth budgets, Wi-Fi jitter, thermal behavior and battery over a full session in Performance/Balanced quality. Do not infer Quest FPS from the software GPU reports.
- Confirm pause/focus loss does not grant immunity or pause the shared host. Verify explicit confirmed Gen.E.Wrist travel saves co-op, exits XR and leaves solo checkpoints intact.

Record headset/browser versions, host/network setup, participants, comfort observations, measured frame time, failures and actual stage completion before approving hardware acceptance. Release/merge/deployment remains Michael Wave's decision.

## Native same-session Solo Bot Arena (new research candidate)

The **SOLO BOT ARENA** button in an already active BTM VR session now chooses a native in-process quick match rather than exiting XR and opening a second `bbs.html` frame. A top-row **SOLO BOTS** button on Gen.E.Wrist provides the same entry while playing; **RETURN SOLO** returns to the exact paused campaign in the same headset session, with no new WebXR prompt. Default quick match: **NO CARRIER deathmatch, one human plus three clearly labelled local bot pilots, target 10 frags**. This match is unranked and never touches original/Pit saves.

The existing `OfflineBotClient`, `NetworkView`, fixed-step worker, collision/game simulation, Quest controller bindings, VR stereo renderer and wrist map are reused. The worker is put on local hold before the arena setup screen so bots cannot damage the player while entering VR or reading the controls. Press **ENTER BOT ARENA** to unfreeze it; **R3 hold** pauses the local worker and opens RESUME/RETURN SOLO. Match results offer a deliberate REMATCH, also held until the next ENTER. **R3 tap** cycles weapons; right B jumps only in a vertical arena; left Y reloads; A dashes; left X toggles the wrist map; right grip USE; right trigger fires. No server, Apache, WSS, DNS change or second WebXR session is involved.

**Headset acceptance still pending:** Verify starting from BTM's main VR menu and from the wrist mid-campaign, that the 3D view never exits XR, both Touch sticks and tracked aiming respond immediately, kills/respawns and hit detection are visible, and a paused worker does not reduce health. Capture before/after player health while paused. Return to the campaign and confirm its exact sector, keys, checkpoint, music/controls and headset pose are still available. Confirm no duplicate bot worker continues running after exit. Test both Quest 3s and both seated/standing presets.

## Solo Bot Arena: frame-stall fairness and performance field test

Player field feedback on 2026-11-14: the two-story campaign's Quest jump/reload/controls and native in-headset solo-bot handoff work well, but Solo Bot Arena stutters and gives the aggressive bots a practical advantage. The precise bottleneck is **not yet measured** on the physical Quest.

This candidate patch protects **only BTM's same-session VR QuickBotArena**: the 30 Hz local worker is opted into a throttled (~10 Hz) headset-frame heartbeat. When playable XR frames stop arriving for more than 300 ms, bot authority freezes its clock, movement, damage, respawn and scoring instead of replaying old time. On return, the worker resumes from fresh time with no accumulated catch-up ticks. Starting/pausing/rematching still uses explicit local-hold, and headset-frame signals never affect ordinary standalone BBS offline or online LAN co-op.

The native quickplay input sender is paced at the **30 Hz authority rate** rather than the standard BBS transport's 20 Hz; this reduces the local command interval but does not guarantee better Quest rendering performance. WebGL's maximum texture-size capability is cached once per renderer rather than queried every stereo frame. Bot accuracy, weapon damage, movement speed, count, frag limit and aim rules are unchanged.

Physical test sequence:
- Enter native Solo Bot Arena from a previously smooth Quest two-story campaign. Confirm XR remains active with no new browser/server and track *Quest frame times or refresh rate* before/after switching, not the desktop FPS indicator.
- Run 3 bots for at least five minutes while turning, sprinting, aiming, firing, reloading, and opening the left-wrist map; record visible stutter, weapon response, bot animation and actual headset frame time if available.
- Compare **Balanced** and **Performance** visual quality using the same arena and bot count. If Performance is markedly smoother, prioritise scene/GPU work. If bot positions jerk but head movement stays smooth, investigate snapshot/interpolation timing.
- During a genuine XR frame stall or headset visibility interruption, verify local AI stops advancing until rendering resumes. The pause menu must always freeze all bot health, damage and match progress.
- Test from **VR Arcade** as well as immersive World mode: both must deliver an active-frame heartbeat; neither may freeze 300 ms after pressing ENTER.
- Test normal standalone BBS solo bots in `bbs.html` separately: its default worker must not require headset-frame pulses. Test LAN multiplayer host timers to confirm they remain unaffected.
- Confirm RETURN SOLO restores the same campaign checkpoint, two-story jump and reload controls, plus no stray offline worker.

Software tests validate the worker freshness predicate, quickplay opt-in, pause behavior and transport rate. The actual 3D latency and frame pacing remain **unverified** until physical Quest testing.

## Remote bot pose continuity: Quest field check

After frame-stall fairness was merged in PR #96, the next presentation fix preserves the previously **displayed** remote bot pose whenever a 10 Hz local snapshot arrives before its prior 100 ms visual blend finishes. The older renderer restarted each transition from the prior *authoritative snapshot* coordinate, producing a visible backward hop during jitter or early messages. Both Canvas and immersive WebGL now share smoothly interpolated X/Y coordinates, and immersive avatars also blend their heading by the shortest angle. Newly spawned, downed or teleported actors snap immediately; no collision, shot position, bot accuracy or game clock is interpolated.

**Acceptance:** In the same Solo Bot Arena, strafe around three bots and compare their onscreen movement under Balanced/Performance VR quality. Look specifically for abrupt sideways or backward jumps, spinning the long way across a 180° heading, and the correctness of immediate death/respawn. Repeat after opening/closing the wrist, switching back to the two-story campaign, and re-entering the arena. Confirm health, ammunition, head movement and hit confirmation remain responsive. Because this smoothing is renderer-only, measure physical headset frame times separately; perceptual smoothness is not proof of GPU FPS gains.

## Quest native Solo Bot Arena telemetry: diagnostic rung

The merged snapshot-continuity and stall-fairness fixes improve presentation and guard against catch-up damage, but **do not prove the source of actual Quest headset lag**. This diagnostic-only rung uses the existing Settings → **VR Diagnostics** switch and adds a short line on the **open Gen.E.Wrist panel** during the native Solo Bot Arena:

`XR CALLBACK 72Hz / 13.9ms / PEAK 24.0ms | CPU 7.0ms | BOT GAP 100ms / AGE 25ms`

These are illustrative labels, **not observed measurements**. The on-device values mean:
- **XR callback Hz / average / peak**: observed `XRSession.requestAnimationFrame` intervals across a capped rolling window, not GPU execution time or an authoritative display refresh-rate measurement. Large peaks indicate interrupted application callbacks.
- **CPU milliseconds**: the existing synchronous world-renderer call duration. It excludes hidden GPU scheduling and completion time, so a low number does **not** rule out GPU bottlenecks.
- **BOT GAP**: smoothed time between delivered local worker snapshots (10 Hz is nominal, roughly 100 ms); **AGE**: time since the last delivered snapshot. Larger gaps/ages alongside smooth XR callbacks point toward worker scheduling or delivery latency.

**How to test**: In BTM Settings enable VR Diagnostics, enter **IMMERSIVE VR**, launch **SOLO BOTS**, then raise/open Gen.E.Wrist and note the numbers. Play about two minutes in Balanced quality and repeat in Performance quality. Compare while idle, turning, shooting, and standing near all three bots. Also try VR Arcade to check whether stereo world geometry is a contributor. Note if head tracking itself stutters or only the bots move unevenly. The diagnostics are local and ephemeral, make no storage/network requests, add no GPU readback and never adjust combat or frame timing.

No physical Quest frame measurements are claimed here until this feature is merged and actually tested on the headset.

## Static stereo buffer batching (performance candidate)

A new immutable upload path concatenates each level's static floor, wall, ceiling, ramp and cover chunks into **one** WebGL vertex buffer at level load. The renderer keeps each original chunk's bounding box and exact vertex range, so left/right frustum culling, draw order, texture UVs, collision, door animations, dynamic enemies and XR tracking do not change. Each eye binds the static vertex stream once, then draws the visible chunk ranges with a nonzero first-vertex offset. The existing dynamic actor buffer is still separate and updated each frame.

This targets WebGL state-change overhead, not fill rate or headset panel refresh. It does **not** claim a measured Quest FPS improvement. A typed-array copy happens once per map change, not each frame.

Before approving, run native Quest 3 with **VR Diagnostics ON** in both campaign (including the two-story preview) and Solo Bot Arena. Compare CPU world-render time and XR callback peaks across the same camera path in Balanced quality, then in Performance after restarting the XR session if changing framebuffer scale. Inspect doorway, wall texture, upper ramp, occlusion and peripheral stereo edges. Verify head/aim tracking, reloading, jumping, bot kills and return-to-solo checkpoints remain unchanged. Automated checks confirm every static vertex value and per-chunk visibility bound for all 12 maps.

**Multiplayer is intentionally separate for now.** BBS LAN CLAN still uses its independent browser lobby and a genuine Node/WebSocket server, and may need a fresh XR permission after switching documents. That should not be represented as continuous-XR multiplayer until a host-owned integrated network-room UI and transport have passed actual headset checks.
