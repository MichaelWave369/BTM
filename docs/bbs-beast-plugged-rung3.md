# BBS LAN CLAN · Beast Inversion Rung 3: The Plugged

## New server-owned archetype

**PLUGGED / CHAIN ARC + GROUNDING** is the third original playable form in **THE INVERSION / HUNTERS VS BEAST**. The SYSOP chooses it before creating a private BBS room; room validation accepts `beastType: 'plugged'` only in Beast mode. Existing clients that omit `beastType` still get the Crawler. No mid-match transformation, free abilities, score injection or new custom client action types.

### Plugged vs the first two forms

| Form | Base HP | Extra HP per Hunter | Primary | Secondary action | Sprint |
| --- | ---: | ---: | --- | --- | ---: |
| Crawler | 360 | 100 | 42-damage claw / 1s | 1.3-unit lunge / 3.5s | 4.7 |
| Repeater | 260 | 75 | 18-damage narrow 8-unit pulse / 1.35s | .85-unit evade / 4.5s | 3.7 |
| **Plugged** | **410** | **85** | **28-damage short arc with 14-damage second fork / 1.6s** | **2.4s stationary grounding stance, half Hunter damage / 8s** | **3.2** |

**Plugged attacks:** FIRE sends a short electric arc in a 3.4-unit, limited frontal cone. The nearest visible living Hunter receives 28 damage. If a *second* Hunter is independently in range, in front, visible to the Plugged through arena geometry, and within 2.4 units of the first, they receive a weaker 14-damage fork. There is never a third target, through-wall fork or client-picked victim. Neither the Beast nor its client can manufacture additional energy, ammunition or damage.

**Grounding:** the existing DASH control instead triggers an 8-second-cooldown, 2.4-second stationary stance. While grounded, the Plugged can turn/attack but cannot navigate through keyboard, controller or room-movement simulation. Hunter-origin hits during that window are halved by the authoritative Room. The stance does not grant invulnerability, does not affect map hazards, and cannot be repeatedly stacked or extended by resending packets.

**Shared rules:** one Beast versus one to four Hunters, normal Hunter firearms, existing arena maps, 150-second host-owned clock and no respawns. Alive Hunters win by killing the Beast or lasting 150 seconds. The Beast wins by defeating all Hunters. Abandoned-role results are voided; no invented online match receipts or campaign progression.

### Presentation and VR

The lobby selector lists Crawler, Repeater and Plugged. The connected HUD shows ARC/GROUND cooldowns and a grounding timer; the alternate action label is **SPACE / B GROUND**. A new original pixel Beast sprite has a dark, bulky capacitor torso, copper coils and yellow arc cores. The native immersive scene draws its own low-tech body and electric grounding halo rather than reusing the human weapon meshes. Beast first-person tracked-hand visuals are distinct from the human weapon model; all actual hit/damage logic remains server-owned.

### Preservation and checks

This rung is additive to [PR #61](../src/net/beast-inversion.js) and the merged Repeater Rung 2. The solo 12-sector campaign, twelve Pit trials, offline saves, six weapons, Ori, ΦWAD, Trophy Room, Shooting Gallery, existing PvP modes, Control Zones, Witness Extraction, co-op, Final Frequency, and offline Solo Bot Arena remain separate.

Required CI: `npm run check`, `npm test`, `npm run playtest`, `npm run playtest:immersive`, `npm run test:network`, `npm run build`, offline checks, browser arena/co-op/campaign and stereo equipment. Unit and real-wire regression tests cover target filtering, chain bounds, LOS, behind-the-Beast safety, input rejection, cooldowns, guarding, movement, outcome and all existing Beast profiles.

**Field acceptance still open:** real Quest 3/3S tests of stereo and body scale, grounding comfort (room-scale physical movement must not cause discomfort), tracked hands, left Gen.E.Wrist position, action hints, charge/pulse visual effects and performance. Real internet-hosted WSS tests and gameplay balancing also remain outstanding. This PR does **not** close issue #38.
