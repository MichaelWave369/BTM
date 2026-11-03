# Pit Hazard Vault · standalone practice · Rung 4

## Scope

A new **HAZARD VAULT** choice on the BTM title screen loads a 90-second, offline-first **practice-only** arena. It runs the actual Pit hazard logic and native WebGL/Classic renderers, not a separate demo implementation.

Six spatially separated stations:
- **Single electric orb**: one east-wall turret aimed at the stepped-on plate
- **Staggered double electric orb**: one wall, two scheduled shots
- **Alternating crossfire**: two wall-mounted emitters, switching first side on re-entry
- **Charge tile**: a floor tile cycles through idle, warning and charged phases
- **Arc lane**: an energized five-marker line that can be escaped sideways
- **Pressure pulse**: enter the plate and leave the marked radius before the warning finishes

The arena has clear walkable space, real solid wall mounts for all launchers, a safe central spawn, no enemies and no campaign objectives. Players practice movement, timing, dodging and Dash Bash shielding. Traps still use real line of sight, walls, non-homing aim and core player damage.

## Rules and results

- **90 seconds** to survive, or end the run early if health reaches zero. Retry begins with fresh player and trap state.
- Practice result includes **survived/overrun, elapsed time, plates armed, actual health damage and shield absorption**.
- No medals, high scores, achievements, archive unlocks, campaign completion, leaderboard changes, new resources or multiplayer reward.
- Existing save guards hide the save control while in practice. Both the game checkpoint method and the underlying storage writer refuse saves when in any gallery/practice session.
- The original and Pit save slots remain independent and unchanged.
- The room is not a new Pit stage, and the 12 canonical Pit trials remain untouched.

## Field acceptance checklist

On a desktop/browser, then Quest 3:
1. Open **THE HAZARD VAULT** from title, and confirm the timer/labels say Hazard Vault, not Calibration Vault or Pit Trial 04.
2. Verify all six marked floor mechanisms, actual emitter geometry and warnings, including two opposing heads for crossfire.
3. Walk onto the single, double, crossfire and pressure pads. Test moving away after the cue, staying on a pad, and leaving/re-entering after cooldown.
4. Step onto the timed charge tile and across the arc lane. Check that warning visibly precedes real damage and that exiting the active area avoids damage.
5. Test Dash Bash shield and real hits. Let the round time out and separately test a lethal run, retry, and return to title.
6. Confirm **Continue the Descent** still uses the exact prior Pit checkpoint and original campaign **Continue Transmission** also remains unaffected.
7. Disconnect network after first successful installation and verify offline startup without module-loading failures.

Automated CI establishes software behavior and synthetic stereo, **not physical Quest 3 comfort, controller mapping, performance or player acceptance**. Do not close issue #18 until remaining server-owned co-op trap behavior and physical testing are addressed.
