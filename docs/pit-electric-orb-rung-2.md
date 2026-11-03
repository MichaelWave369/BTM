# Pit pressure-plate electric orbs · Rung 2

Scope: **solo Pit of Despair** only, preserving the original campaign, 12 Pit trials, existing enemy projectiles, save schema and Quest wrist/input code.

## Three authored variants

- **Trial 04 / Iron Lung:** Original **single orb**, 0.9-second warning, 5.5-second cooldown, one east-wall emitter. Rung 1 is preserved.
- **Trial 07 / Shattered Choir:** **alternating crossfire**. A floor pressure plate arms a 1.15-second warning. First wall sends an orb along the saved entry lane, the opposite wall fires 0.65 seconds later. The next activation begins from the opposite side. Two physical wall heads are shown in Classic and immersive.
- **Trial 08 / Bloodless Grid:** **staggered double**. After a 1-second warning, one wall sends two slow electric orbs separated by 0.46 seconds toward the same saved entry position.

## Real gameplay contracts

- A fresh **entry** is required. Continuous standing does not rearm a plate; cooldown and an exit/re-entry are needed for another volley.
- Every volley locks the trigger-time target. It never tracks the player's head or homes on the player.
- Each launched orb is a normal, bounded BTM hostile projectile: existing wall, closed-door, ceiling/floor, player hit and Dash Bash shield logic apply. Volley slots are consumed even if occluded or the 96-projectile budget is full.
- Damage is reduced to nine per projectile on double/crossfire patterns (two separate impacts, which the shield can absorb). All shots have advance cues.
- Pausing game time freezes the warning and inter-shot gap; a pending second shot is preserved in the normal Pit v2 snapshot without a schema bump.
- Other Pit maps and existing classic campaign sectors receive **no** pressure-plate objects.

## Automated checks

- Authored wall mounts, clear muzzle positions, reachable plates and safe spawn distances.
- Telegraph before first shot; pause between shots; exact two-shot cap; non-homing saved target; alternating origin on new activation.
- Real core projectile shield and wall collision, full projectile-budget behavior, and replay of mid-volley snapshots.
- Full existing 12-stage Pit, immersive, browser equipment, offline and LAN checks still run in CI.

## Manual Quest 3 / Classic acceptance (pending)

Try trials 07 and 08, listen for the advance warning, and **move out of the trapped lane** after stepping on the plate. Verify distinct stationary wall heads, staggered launch pacing, physical readability, avoiding collision with walls, and responsive Dash Bash shielding. This is not physical Quest testing.

Separate work still open in #18: more floor-hazard varieties, a standalone trap challenge map, server-owned LAN/co-op authority and field sign-off.
