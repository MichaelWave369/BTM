# BBS LAN CLAN · Beast Inversion Rung 4: The Warden

This rung completes the **initial four-form original Beast roster** in The Inversion, an optional 150-second BBS LAN CLAN arena mode. The Warden is the *playable multiplayer Beast form*, not the campaign Warden boss or an unlock of the 24-stage co-op raid.

## Warden: slow titan with fair area control

The SYSOP selects **WARDEN / CRUSH + FIELD** before creating a private BBS Beast room. Only that host may choose the form at room creation. The existing `beastType` create field now accepts `crawler`, `repeater`, `plugged`, and `warden`; it still defaults to `crawler` when omitted. No new client action, AI service, target specification, movement authority or gameplay save format.

| Beast | Base HP | Per extra Hunter | FIRE | DASH | Sprint speed |
| --- | ---: | ---: | --- | --- | ---: |
| Crawler | 360 | +100 | 42 claw, 1s | wall-safe lunge, 3.5s | 4.7 |
| Repeater | 260 | +75 | 18 narrow LOS pulse, 1.35s | .85-unit evade, 4.5s | 3.7 |
| Plugged | 410 | +85 | 28+14 forked arc, 1.6s | 2.4s grounded half-damage stance, 8s | 3.2 |
| **Warden** | **520** | **+110** | **34 crushing melee, 2.1-unit frontal LOS range, 1.5s** | **fixed suppression field, 12s** | **2.85** |

### How the field works

- Press **DASH** as the Warden to place *one* field at the Beast's **host-known position**. It is a physical fixed point in the current arena, not something that tracks a Hunter or moves a VR player.
- The entire party sees a **1.0-second amber warning** over its **2.6-unit radius** before damage begins. Hunters can retreat or take cover; the field never teleports, pushes, stuns or moves them.
- During the next **4 seconds**, at most one fixed-step **11-damage pulse each second** applies to each living connected Hunter in radius **and actual line of sight** from the field origin. A wall blocks a pulse even if a target is within radius. Hunters who leave are safe from subsequent pulses.
- No burst of damage is accumulated to catch up after a stalled host frame. Cooldown is 12 seconds and a second field cannot be placed until cooldown. A dead or disconnected Warden loses its field.
- All parameters, field placement, warning/pulse times, target lists and damage are controlled by the Node host. The network sends only the existing validated FIRE and DASH intent.
- Reused Beast rules apply: one Warden vs 1–4 human/bot Hunters, no respawns, Hunter win on time or kill, Beast win on eliminating all Hunters, abandonment result void, and **no false campaign credit**.

### Presentation

The BBS form selector, roster, on-screen HUD, controller hint and remaining field timer now describe the Warden. A tall original armored silhouette with a bright furnace core appears in Classic and native immersive VR. The field warning/pulse is rendered in both scenes from the same authoritative snapshot: orange before arming, red while active, with a visible boundary. The Warden first-person view renders heavy fists; no human weapon mesh or unrelated 3D engine is introduced.

### Verification and remaining acceptance

Automated coverage: pre-room validation and spoof rejection, all four inherited archetype stats, directional melee, no weapons or loot, field wind-up, timed pulses, wall blocking, escape by moving, cooldown, death/disconnect cleanup, client movement prediction, original visuals, and **three live WebSocket participants** observing the same server-backed outcomes.

Required CI: `npm run check`, `npm test`, `npm run test:network`, `npm run playtest`, `npm run playtest:immersive`, `npm run build`, offline validation, browser arena/co-op/campaign and stereo/VR equipment.

**Open human/field work:** physical Quest 3/3S pose, hand scale and wrist UI acceptance; field warning legibility, dizziness and color contrast in stereoscopic native VR; head and hand collisions; real hosted WSS clients; fair 1v1 and 1v4 balancing; solo/offline Beast trial; moving/hidden shooting gallery targets; verified LAN multiplayer match receipts. CI and simulated VR do not prove real-headset acceptance. **Keep parent issue #38 open.**
