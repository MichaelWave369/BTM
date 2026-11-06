# Issue #19 · The Stackyard: first two-story arena and independent jump

## Goal and scope

The Stackyard is a **separate selectable BBS arena** that begins the height-aware architecture requested in #19. It demonstrates an overlapping lower and upper battlefield in the same x/y grid, a continuous connecting ramp, a genuine jump arc, falling off upper edges, solid deck/underside collision, elevation-aware aiming and real 3D immersive geometry. It does **not** silently mutate twelve campaign sectors, twelve Pit trials, saves, or ranked game modes.

### Two floors, real extra area

- The 29×25 BBS grid keeps the existing traversable lower story. The new upper deck covers x=10..25, y=4..20, adding **272 elevated map tiles** in the *same horizontal footprint*. The west ramp covers x=4..9, y=9..10 and continuously rises from height 0 to **1.85 game units**.
- Players can enter from the lower floor using the ramp or jump near the edge. The old 2D map still blocks walls; an additional authoritative vertical state distinguishes actors on two floors with identical x/y. The 3D render path creates deck tops, undersides, seams and the ramp from that same layout. Classic draws an approximate perspective deck/ramp, with full true geometry in native immersive VR.
- Spawns alternate lower/upper floor for Deathmatch and Team Deathmatch. Floor-specific supplies cannot be grabbed from the other floor. The mode is available locally against Bot Pilots and over the existing BBS Node server; other arenas retain their old ground-floor collision.
- **Only Deathmatch / Team Deathmatch** may select Stackyard initially. Co-op, Control Zones, Extraction and Beast are deliberately gated until AI and objective geometry can be ported reliably.

### Jump rules

- Press **J** on keyboard, **R3** on Xbox, or select **JUMP** in Quest Fieldlink. Quest right-stick click opens Pause. **Space / B** activates Dash Bash. All jump controls send the same intent to the host.
- Host-owned `player.height`, `vz`, `grounded`, `supportSurface`, bounded jump buffer and coyote time. A deterministic 120 Hz substep integrates jumps at the game's 30 Hz server tick; the client predicts and reconciles to snapshots. Gravity = 13.4, impulse = 7.2 game units/s; the arena ceiling is 3.9 units to safely fit a real upper storey.
- You cannot jump up through the deck underside or enter a platform edge halfway through it. Falling off a platform produces a real descending arc, not a floor-number teleport. The west ramp permits grounded ascent. The first beta deliberately lands safely without fall damage pending physical VR comfort validation.

### Combat and display

- Tracked height and head origin account for the current simulated floor. Both the host and `traceEnvironment` check the solid platform plane for top/underside ray intersection, so a Hunter beneath a floor cannot be shot straight through it.
- Server competitive targets are filtered by height-aware LOS; the nearest exposed upper edge still permits attacks downward onto visible opponents. Projectiles carry absolute heights, test top/bottom slab intersections and respect target feet height.
- Classic and immersive scenes show the vertical geometry. Native immersive remote avatars and items render using elevation; tracking offsets the world instead of moving the user's physical head. Field HUD and status show **FLOOR 1/2** or **FLOOR 2/2**.
- The PWA offline shell explicitly caches the new vertical module.

## Verification and non-goals

Tests exercise jump physics, underside and edge collision, ramp ascent, real falling, upper/lower LOS and tracked shooting, disallowed spoofed elevation/velocity inputs, different-floor spawns, native geometry growth, controller routing, two actual BBS WebSocket peers and initial network snapshot authority. Required CI remains check, unit tests, network test, desktop/immersive playtest, build, offline, browser/stereo and equipment.

**This is a first architectural rung, not a claim that every board is now twice its area.** Expanding the complete 24-stage campaign to two floors requires authoring each level, all-height AI navigation and NPC elevation, pickup/objective placement, properly vertical hit registration for every weapon and trap, dynamic floors/doors, expanded collision and clipping, and real Quest stereo testing. Nor does a software suite prove headset comfort or physical tracked-hand aiming.

**Next #19 rungs:** (1) Quest comfort and real 2-client field tests; (2) true NPC vertical navigation, precise fall-damage/recovery policy and more stair/ramp connectors; (3) authored second levels for chosen campaign/Pit stages; (4) eventually wider per-board expansion when the 3D core holds up. **Issue #20 remains a separate texture/material road map** (#23/#24); do not mix material changes into physics/aim PRs.
