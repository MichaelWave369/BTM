# Pit of Despair: three new floor hazard mechanics (Rung 3)

This is an incremental, deterministic **solo Pit** hazard build. It does not replace legacy floor hazards or the wall-mounted electric orb traps. The original campaign, Pit stage count, ΦWAD, headset calibration and multiplayer authority remain unchanged.

## Three real hazard types

- **Trial 05 / False Sanctuary: CHARGE TILE.** A fixed floor tile warns from 1.0s into its 5.6s cycle, charges at 1.9s, then emits until 2.45s. Contact deals 10 damage **at most once per cycle**; Dash Bash shield absorbs the normal damage.
- **Trial 07 / Shattered Choir: ARC LANE.** A marked 4-tile line flashes a warning, then activates for 0.65 seconds. Collision is checked against the *full floor segment*, not merely its center. Damage is 11 at most once per cycle. Stepping to either side avoids it.
- **Trial 10 / Unlit Core: PRESSURE PULSE.** A floor plate arms only when freshly entered. A 0.8-second visible warning precedes a localized radius-1.08 shockwave; leave its area before detonation or use the shield. It has a 5-second cooldown and requires exiting/re-entering before another pulse.

## Truth in presentation

Classic and native stereo rendering use the **same `floorTrapState` function** that drives simulation: idle, warning and active. No client-only damage zone. Visuals are bounded, with five arc-lane segment markers and no new textures, dependencies, game engine or flashes.

## Persistence and acceptance

Floor-trap state lives in optional `level.floorTraps` and is included in existing Pit v2 snapshots. Old Pit v2 saves without floor traps still load. Pinned warnings and once-per-cycle hit bookkeeping survive resume. Retry restores checkpoint state.

CI should check unit tests, twelve-trial Pit and immersive playthroughs, browser/offline/stereo captures, and network regressions. Physical Quest 3 ergonomics, warning visibility, full playability and framerate remain *unverified*.

Issue #18 remains open for a dedicated optional trap challenge map, additional richer trap variants, and true server-owned two-client co-op trap authority.
