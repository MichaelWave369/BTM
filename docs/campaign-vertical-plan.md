# Two-story regular campaign in VR and desktop

**Status: staged engineering plan, not yet shipped.** Stackyard BBS already proves actual upper deck, ramp, buffered jump, ledge collision, occlusion and WebXR geometry. Those mechanics currently belong to competitive maps, not the twelve original solo sectors.

1. Extract floor support, jump and swept ledge collision into a shared solo/BBS layer without changing host-authoritative BBS messages, checkpoints or input safety.
2. Author a versioned **unique upper footprint, safe ramp and traversable connectors for each sector**. Validate walkable geometry, headroom, doors, objectives and spawn; never overlay Stackyard's fixed rectangle across unrelated maps.
3. Make solo character, enemy paths/line-of-sight, projectiles, pickups, relays, colored keys, rescues and extraction height-aware. Enemy fire must not pass through an upper slab, and neither enemies nor players may teleport between floors.
4. Render both floors with native WebXR stereo world meshes; retain readable desktop raycaster floor preview and the Gen.E.Wrist floor-aware map. Expose jump without breaking Quest grip/trigger, BBS controller or wrist input.
5. Preserve old flat v1 campaign saves as their original levels. Validate or version new vertical snapshots explicitly. No silent migration of an in-progress save to new collision geometry.
6. Roll out an isolated sector first, then all twelve after automated reachability/softlock checks and real Quest 3 seated/standing comfort testing.

Regression gates: gold door/extraction, Pit, Stackyard bots, 24-level co-op, offline cache, aiming, saved progress, and VR wrist walking must all survive. **A roadmap does not constitute a completed VR campaign conversion.**
