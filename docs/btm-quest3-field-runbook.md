# Break the Matrix Quest 3 / 3S field runbook

Use two independent devices and sessions. Player A starts on Quest 3 and Player B joins on another Quest 3 or 3S. Record each device separately. A desktop player can help isolate a problem before the two-headset pass.

## Match the build before playing

| Build | Exact revision | URL or build receipt |
| --- | --- | --- |
| Live comparison build on November 5, 2026 | `66d7686dcd7e4ca2798e5c8e5e3a9bbd37cd3dd6` | [BTM Pages](https://michaelwave369.github.io/BTM/) · [Worker](https://michaelwave369.github.io/BTM/sw.js) contains `wave-ori-0.10.0-rc.1-eb8791fe8d` · [Pages deployment](https://github.com/MichaelWave369/BTM/actions/runs/41790993771) |
| Fieldlink review build | `c4d2eec062aee7cdf0476e9a81eb14809141aad3` | [Immutable source ZIP](https://github.com/MichaelWave369/BTM/archive/c4d2eec062aee7cdf0476e9a81eb14809141aad3.zip) · worker suffix `5a139ee21a`. |
| Aim review build | `80c7f86a7901cb89ac248466221540fc51b53947` | [Immutable source ZIP](https://github.com/MichaelWave369/BTM/archive/80c7f86a7901cb89ac248466221540fc51b53947.zip) · worker suffix `d8c9073742`. |
| Ledger review build | `baaa33cb1825bb88152c1add390cb8719164acc4` | [Immutable source ZIP](https://github.com/MichaelWave369/BTM/archive/baaa33cb1825bb88152c1add390cb8719164acc4.zip) · worker suffix `7ed07cc383`. |
| BBS controller review build | `014d29f973237a34a490877152518115c8bd55ba` | [Immutable source ZIP](https://github.com/MichaelWave369/BTM/archive/014d29f973237a34a490877152518115c8bd55ba.zip) · worker suffix `5ce93e36f4`. |

For a candidate, confirm `git rev-parse HEAD`, run `npm run build`, and serve the resulting `dist/` at the approved HTTPS preview. Record the exact preview URL and worker `CACHE` value for both testers. The live comparison build still pauses when the wrist opens. Use a build containing the Fieldlink fix to evaluate continuous movement. Verify the preview is in control before marking a fix passed.

For multiplayer, record the approved `wss://…/ws` endpoint separately. Connect both browsers through BBS LAN CLAN and verify two different player IDs. The host's `/status` should return `BTM BBS LAN CLAN`. A successful connection and a lobby join are required for the network rows below. Use the same client and host revision for any report on simulation or aiming. [Local and trusted WSS setup](bbs-lan-clan/hosting.md).

## Test matrix

| ID | Steps | Expected evidence |
| --- | --- | --- |
| XR-1 | In a quiet sector, walk forward. Raise and roll the left wrist without pressing anything. Point the right controller at OPEN MENU, press and select an Arsenal item, then press CLOSE MENU. Repeat seated, standing and after recenter. | The initial wrist turn leaves the menu closed. The large panel appears close above the cuff, follows the hand through head turns and shows no tethers. Both eyes can read it. On the candidate, walking continues through the interaction. |
| XR-2 | Hold the closing trigger while moving the right ray off the panel. Release and press again. Repeat with a left-trigger charge, an open-panel ray miss, and an obstructed wrist near a wall. Click the right stick to pause and again to resume. | No leaked shot, charge release or accidental stick turn. Fresh press fires. The right-stick click toggles once. Tracking interruption or controller loss pauses safely and requires input release on recovery. |
| AIM-1 | Turn on VR Diagnostics and use the Calibration Vault. Fire the Blaster at about 1, 5 and 12 tiles (1.6, 8.0 and 19.2 m). Compare center, off-axis and high/low shots in both eyes. Repeat after a smooth turn, a snap turn and recenter. | Barrel, guide and firing beam agree. A separate pale mark identifies an accepted target within spread. Wall, floor and ceiling stop the ray. Record hits/misses at each range and sight alignment in each eye. |
| AIM-2 | Repeat in a mode with all six weapons available. Try Slap at close range, then fire the Pulse Rifle at mid-range. Repeat tracked firing while strafing in BBS. | Slap feedback begins at the palm and obeys melee reach. Pulse travels before it hits. Server-confirmed damage agrees with a clean line of fire. Record any persistent angular offset or missed hit. |
| ORI-1 | Trigger Ori scan, a long dialogue and a critical hazard warning during movement and firing. Open and close the wrist, then disable captions. Try the communication log and optional speech. | Ori is visible at comfortable rightward glances and clears sights. Captions remain readable and clear the wrist, Ori and alert dock. Critical alerts and the communication log remain accessible with captions off. Record side, overlap, legibility and size. |
| PIT-1 | Try the Hazard Vault offline, then repeat with two connected players in Pit trials 4, 5, 7, 8 and 10. Cross a plate together, leave and re-enter, dodge or shield a volley, and restart a saved stage. | Each device sees the same warning and orb. Impact matches clearance, shield and health. Saved trap state recovers. Record video from both sides if timing or collision diverges. |
| LAN-1 | Create a private match, join on B, Ready/Start, fight and collect a cell. Pause/resume A during the match. Disconnect B and reconnect the same identity. | Two independent positions and inventories, one host clock, correct health/score and no resource grant on reconnect. A's local Pause leaves the match active. Capture the two HUDs before/after reconnect. |
| LAN-2 | In co-op, hold right grip/A for a revive or Witness Extraction. Release early, then hold through completion. Test both devices and swap carrier/reviver. Reach shared objectives, save, and reconnect or restart the host on a test slot. | Releasing Use cancels the channel. Full hold completes once under host authority. Shared progress, individual reserves and separate solo campaign/Pit slots survive. |
| LAN-3 | In Stackyard, climb the west ramp, choose Fieldlink JUMP, jump beneath the deck, walk off the upper edge, try shots through the slab and from an exposed edge, then respawn. | Jump and Dash Bash are distinct. Headset and host agree on floor and landing. Solid deck blocks shots. Exposed paths can hit. Bots take the ramp. |
| LAN-4 | Use a test squad that earned all 24 stages. Complete pylons, partition consoles, Ori repair, exposed core and shared escape. Include a deliberate down/rejoin during a paired task. | Both devices see the same phases and results. The raid resumes from an earned checkpoint and records exactly one squad escape. |
| LAN-5 | Rotate Crawler, Repeater, Plugged and Warden through Hunters vs Beast. Test each primary/ability and compare Warden warning timing from both roles. | Cooldowns, damage and victory agree on both HUDs. The Warden warning leaves time to move clear, and cover blocks suppression. Record balance and comfort by role. |
| LEDGER-1 | Recover a plaque and open Human Ledger on desktop and wrist. Search for a recovered name and an unrecovered name. Cycle ALL, FILES, DOSSIERS and INTEL. Revisit after reload and explicitly export from the archive screen. | Only earned text appears. Page/filter controls fit at wrist distance. 3/6/9 milestones and completed witness cases persist. The export contains only recovered stories and solved conclusions. |
| OFF-1 | First load online and wait for OFFLINE READY. Save one enhanced material style, quit and relaunch the browser with networking disabled. Continue both solo campaigns, launch CODE BROWN, then remove the saved style and repeat offline. | Independent saves, CODE BROWN, menu and procedural fallback open offline. The saved eight-tile pack loads before removal. After removal the core stays playable and the optional pack reports missing. Record tile readiness after a browser restart. |
| PERF-1 | Play a combat-heavy 15-minute pass in Performance and Balanced. Repeat in High if comfortable. Switch styles, then test at least one dark room and bright Corporate room. | Record frame pacing against 72 FPS where available, missed frames or visible stalls, load/switch times, headset battery start/end and thermal observations. Note metric source, headset/Quest Browser version and the selected texture and VR presets. The game's CPU submission timer is a separate measurement. |

## Evidence to attach

Keep one row per test and device. Use **Pass**, **Fail**, **Blocked** or **Pending**. For a failure, attach the screenshot or short recording with the timestamp and include the shortest sequence that reproduces it. For multiplayer, record both views plus relevant host log time. Keep reconnect passes and private room credentials out of shared evidence.

```text
Tester / device / Quest Browser version
UTC timestamp / duration / seated or standing
Build URL / full commit SHA / worker cache name
Host build SHA / WSS URL / network type / quality and texture settings
Test ID / result / exact input sequence / expected / observed
Screenshot or recording filename / time in clip
Metrics source / frame pacing / stalls / battery start and end / thermal observations
```

Start with XR-1, XR-2 and AIM-1 before a full combat session. Record each person's result before marking a physical issue accepted. [Issue matrix and release checklist](btm-stabilization-audit.md).
