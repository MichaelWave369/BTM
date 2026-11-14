# ANTIΦ-ATOGEN OUTBREAK

Experimental optional **solo offline endless-round infection survival** in BTM.
This is fictional sci-fi outbreak gameplay, not a medical or bioengineering model.

## Play
1. Launch BTM normally on Quest 3 via **IMMERSIVE VR**, or use Classic / Xbox / VR Arcade.
2. From the in-headset title menu, choose **ANTIΦ-ATOGEN OUTBREAK**.
3. You begin in a containment version of the first sector. The initial **5-second preparation** is safe; doors are open and all six weapons are available.
4. Infected enemies pursue instead of patrolling and only attack at close range. Waves start at **6 infected**, grow by **3 per round**, with a capped **54 per round** and at most **14 active** at once to bound headset cost. The next spawn is delayed and comes from traversable floor away from the player when possible.
5. Defeat all infected in the round to earn **7 seconds of quiet resupply**. Health, armor, reserve, energy and Ori replenish within existing caps. The next round then begins automatically, forever. No final extraction objective.
6. If overwhelmed, the result screen reports your highest round and infected eliminated, and offers a new run. Pausing freezes the entire simulation.

## Limits and save policy
- The first rung is **single-player**, using BTM's own real combat, bullets, Ori and melee pathfinding. It is **not multiplayer zombies** yet; LAN/co-op authority, team revive, spawn ownership and network replication will need a separate verified rung.
- No external packages or servers are necessary. Offline caching includes the Outbreak module.
- **No Outbreak progress is written to campaign or Pit saves**, and an Outbreak snapshot is explicitly rejected by the normal restore validator. Outbreak records last only for that run; death/restart resets them.
- The initial containment layout reuses familiar Sector 01 geometry without the campaign's relays, captives or golden extraction. Doors except the hidden secret are open. Classic and immersive Quest use their usual renderers and controls. Infected use the existing plugged character asset with a green-tinted outbreak marker; there are no new licensed art dependencies.
- Round growth is finite per wave for performance, but the number of waves has **no cap**. Zombies have more HP, speed and attack pressure in later rounds within bounded limits. Dead enemies are removed at each round break.
- This design uses a temporary **single-story** containment map so infected cannot get trapped below a two-story platform. Two-story infested maps and airborne zombie tag are possible future additions only after AI vertical route tests.

## Physical Quest 3 field checklist

- [ ] Launch from BTM's own title screen while already in **IMMERSIVE VR**. Confirm it stays in the same headset session.
- [ ] Read the first five-second safe preparation timer on the HUD/wrist.
- [ ] Run sideways, turn and fire right trigger while infected approach. Verify they are visibly green, move toward you through doorways and actually hit in melee.
- [ ] Reload with **left Y**, switch weapons with **R3 short tap**, and dash with **right A**.
- [ ] Clear Round 1, verify **7-second** calm break, supplies restored and Round 2's growing count.
- [ ] Check the active enemy population remains manageable with both Quest 3 units, including frame comfort in Round 5+.
- [ ] Pause while infected are close: there should be **no health loss** until unpause. Retest using the actual wrist map.
- [ ] Die naturally: confirm highest round and total kills, then restart into a new Round 1.
- [ ] Return to title and check CONTINUE TRANSMISSION, Pit and Solo Bot Arena have not lost or overwritten their checkpoints.
- [ ] Capture screenshots of Round 1 HUD, green infected in close combat, between-wave countdown and the final result.

Automation validates simulation invariants, but physical headset performance and player comfort still require owner field acceptance.
