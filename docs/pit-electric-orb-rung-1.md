# Pit pressure plate / electric wall orb · Rung 1

**Scope:** Iron Lung (Pit trial 04) in the existing solo BTM simulation. This is a working first hazard rung, **not** the complete issue #18 feature set and not a claim that LAN/co-op servers already own traps.

## Player behavior

- The floor plate in Iron Lung's lower-left chamber is marked in both Classic and immersive worlds. The wall-mounted emitter faces the plate.
- Enter the small pressure plate to start a **0.9-second audible/visible charge warning**. Simply standing on the plate does not repeatedly fire.
- A slow cyan electric orb launches from the wall, aimed at the player position captured on **entry**, not a homing headset or moving target. You can bait it, strafe out of its lane or use the existing Dash Bash shield.
- Solid level walls and doors block the real projectile; the existing player damage and shield logic resolve impacts. Projectile counts share the existing bounded boss/projectile budget.
- A 5.5-second cooldown and a fresh exit/re-entry are both necessary to trigger the plate again.
- Stage transitions, retry and new runs reset the trap. The existing Pit v2 checkpoint format captures optional trap state; older checkpoints without any traps remain valid.

## Verification

Automated:
- Plate and wall geometry exist in a reachable room without trapping the spawn.
- Single entry arm; warning time; saved target and non-homing launch; no retrigger while occupied; safe re-entry after cooldown.
- Wall blocking, real shield mitigation, single-impact disposal, 96-projectile budget.
- Existing Classic/immersive 12-trial Pit playthrough, saves/retries, offline rendering, multiplayer regression checks.

Pending human playtest:
- Walk into Pit trial 04 and confirm that the plate and wall head are visible at human scale in Quest 3 and in Classic mode.
- Listen for warning, move after charge begins, verify the orb continues toward where you stepped, test shielding and nearby cover.
- Confirm no uncomfortable flashes, excessive particle effects or unexplained damage.

**Future rungs:** Different floor trap mechanisms, double/crossfire wall launchers, a dedicated optional practice chamber, and server-owned PvE trap state for real two-client co-op. These are deliberately **not** claimed here.
