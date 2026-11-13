# All 12 solo-sector two-story research preview

**Experimental WebXR and desktop feature.** A playable mezzanine now appears in each of the twelve original single-player sectors when launched with `?solo2f=1` and a **New Campaign**. The standard campaign URL remains flat until human Quest 3 testing completes.

## Gameplay

- Every sector receives an actual double-sided elevated floor, supporting ramp, deck collision and jump, rather than an unsupported raised decorative texture.
- Sector 01 keeps its original manually located mezzanine. Sectors 02–12 choose the largest accessible upper-room footprint from a bounded deterministic search. The planner checks solid cells, doors and the original ground approach, and rejects ramps intersecting essential objectives or locked doors. No stage may silently omit the upper floor.
- Sector 02 onward moves one **optional colored access card** onto the upper story. It opens an optional colored supply alcove on the ground level. **Gold keys, relay, rescues and extraction stay on the original ground floor**, so none of the main campaign completion conditions requires upstairs access. Additional armor/energy supplies wait upstairs.
- Ceiling and supporting platforms are shared by native VR stereo geometry, desktop preview, vertical collision, tracked weapons, and shot/deck occlusion.
- Each preview sector has one **optional enforcer upstairs**. Its feet, VR/desktop sprite, hit volume, and AI path are elevated with the deck; when chasing a player between floors it uses the authored ramp instead of teleporting. These guards do not add a mandatory boss condition or change the original host-liberation count. Wrist and classic automaps mark the elevated deck and ramp.
- Quest 3: open Gen.E.Wrist and select **JUMP**. The headset's right-grip USE, left-grip ORI, trigger, stick turn, weapon selection, Dash Bash, seated/standing calibration and normal controls remain unchanged. Desktop: **J** jumps; familiar **Space** still performs Dash Bash.

## Protecting your existing game

- Enable solely via the URL query parameter and starting a fresh campaign. Original saves load as original flat geometry, even if opened on the experimental URL.
- The preview uses its own in-memory checkpoint/retry, and is barred from writing the persistent original v1 save. Leaving the browser tab discards that preview checkpoint.
- BBS multiplayer, Stackyard and Pit never receive the solo vertical flag.
- No automatic live rollout or physical Quest 3 pass is claimed until the complete CI and a headset walkthrough are recorded.

## Validation checklist

- Twelve sector layouts and a continuous ramp ascent to deck; assert original cells, doors, gold keys, relays and exits remain unchanged.
- All colored cards remain accessible from the original spawn, on either floor; all floors are reachable without needing an optional color card.
- Ground pickups cannot be collected upstairs and upper-floor pickups cannot be collected through the slab.
- Up/down projectile occlusion, underside jump collision, stage-to-stage transitions, old-flat-save restoration and malformed vertical snapshot rejection.
- Production build, offline shell, multiplayer regression, immersive browser smoke, and actual headset (seated and standing) comfort and aim.

This builds toward issue #75. Full 2-level enemy navigation, upper-level tactical combat, and multistory mandatory mission layouts are future tasks, not implied by this preview.
