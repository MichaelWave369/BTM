# BBS LAN CLAN · Beast Inversion Rung 2: Repeater Pulse

## New host-selected Beast form

In **THE INVERSION**, the private room SYSOP may choose **Crawler** or **Repeater** from the BEAST FORM control before creating a BBS lobby. The optional `beastType` create field accepts only `crawler` or `repeater`, and defaults to `crawler` for previous BBS clients. This selection is locked in the Node host's room configuration, not a mid-match player transformation. No other playlists may send `beastType`.

- **Crawler (unchanged rules):** 360 base HP +100 for each additional Hunter, 42-damage short-range claws, 1-second strike cooldown, 1.3-unit wall-safe lunge at 3.5-second cooldown, sprint at 4.7 units/s.
- **Repeater (new):** 260 base HP +75 for each additional Hunter, 18-damage 8-unit pulse with a narrow frontal cone and real server LOS, 1.35-second strike cooldown, .85-unit collision-safe evade at 4.5-second cooldown, sprint at 3.7 units/s.
- Both remain **one Beast vs 1–4 Hunters**, no respawns, with 150-second host clock, no weapons/loot for Beast, server-owned hit/damage/score/time and bounded neutral results on abandoned roles. Human Hunters retain their usual six weapons and controls. Server Bot Pilots remain clearly labeled Hunter participants.
- A distinct tall, cyan, antenna-crowned Repeater appears in Classic Canvas and native immersive VR. The local Beast sees two pulse emitters instead of Crawler's claws. HUD, roster and objective describe the chosen form and cooldowns. No external assets, new rendering framework or third-party API.
- The local Beast prediction bug from Rung 1 is fixed: frame-time integration now applies to both archetypes rather than a full second of movement per frame. All movement remains collision-checked and reconciles to the 30 Hz server.

## Technical boundaries

`src/net/beast-inversion.js` defines immutable profiles and actor-filtered targets; the host's `Room` alone accepts `beastType` at construction, assigns the role once, advances the cooldown, checks LOS and applies damage. The client submits only existing validated `fire` and `dash` intent; forged role/archetype/HP/position packets are still rejected. Repeater pulse uses a deliberate hitscan geometry with a narrow forward cone and walls, **not** client-targeted bullets or independent client damage.

Nothing in campaign saves, the Pit, ΦWAD, co-op stages, extraction, arena scoring, offline Bot Arena, or the Final Frequency is changed.

## Verification

`npm run check && npm test && npm run playtest && npm run playtest:immersive && npm run build` plus `npm run test:network` and existing authoritative multi-browser / stereo CI. Targeted tests cover invalid create and forged input packets, Crawler defaults, Repeater balance, directional LOS, cover, cooldown, collision-safe evade, actual two-WebSocket combat and win, and bounded client prediction.

**Physical Quest 3/3S validation still required:** stereo legibility, comfortable first-person emitters and thumb controls, no occluded wrist UI, accurate hand tracking and aiming, collision/perception near a Hunter, correct two-browser/Quest network combat. CI success does not establish real headset acceptance. Continue issue #38 with Plugged/Warden variants, richer animations, offline Beast trial, and balancing after this small rung.
