# Issue #19 · Stackyard Rung B: bots understand the second floor

This is the next isolated step after merged [PR #65](https://github.com/MichaelWave369/BTM/pull/65), which delivered the original two-story Stackyard and host-owned jumping. It deliberately does not modify the twelve-sector campaign, the twelve Pit trials, offline progression/saves or the six-style material work in issue #20.

## Problem

The existing sovereign BBS Bot Pilot uses `findRoute` over the original 2D x/y grid. That grid lets two actors share the same horizontal location on separate floors, but has no concept of a higher platform or the single authored west ramp. A bot chasing someone directly beneath its position can therefore wander into the deck wall or try to chase through solid floor geometry.

## Rung B behavior

The BBS bot planner continues to emit **only the normal validated input packet** (direction, sprint, fire, reload, etc.). The Node host still owns all movement, collision, vertical velocity, bullets, damage, respawns and snapshots.

- On the optional Stackyard arena alone, an opponent on the opposite floor causes two stable navigation waypoints: the **lower west ramp entrance** at (3.5, 10), and the **upper west crest** at (10.5, 10).
- A lower-floor Bot Pilot approaches the entrance, crosses the full ramp and enters the upper deck. An upper-floor Bot Pilot takes the reverse route down rather than jumping through the solid platform. While already on the ramp, it continues toward the appropriate exit.
- Other BBS arenas and the original 24-stage campaign retain their existing 2D bot navigation. Normal horizontal walls still route through BTM's own `findRoute`; this is not a new navigation engine or pathfinding dependency.
- Detection and firing use the same **height-aware `verticalSight`** test as the server's competitive hit filtering. A bot cannot attack an opponent directly below a solid deck, but can use a truly exposed ledge to attack between floors.
- Nearby-combat retreat no longer overrides a required ramp transition.
- Bot intentions never include forged height, velocity, support surface, teleports or hit claims. Physical movement is performed by the shared `Room.step` simulation.

## Evidence

Focused tests check flat-map invariance, correct ramp entrance/crest choice, cross-floor target occlusion, exposed edge firing, real host-driven upper-to-lower travel, continuous height changes without teleportation, no campaign credit and one actual WebSocket client observing a genuinely server-run bot descending the ramp.

Required CI: `npm run check`, `npm test`, `npm run test:network`, `npm run playtest`, `npm run playtest:immersive`, `npm run build`, offline validation, browser/stereo and equipment checks. CI evidence should remain distinct from **physical Quest 3/3S test evidence**, which is not complete.

## Still open

- Real Quest two-player headset comfort, floor height, controllers and aiming tests.
- Additional jumping/collision edge cases, moving targets, full 3D NPC and projectile navigation outside BBS.
- Separate authored upper floors for selected campaign and Pit stages, then larger per-board conversions after safe pathfinding and consistent combat checks.
- Issue #20's HD art verification and device measurements remain separate and unaffected.
