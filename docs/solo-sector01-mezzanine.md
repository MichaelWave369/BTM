# Solo Sector 01 two-story Quest preview

**Experimental, opt-in, never auto-merged or auto-saved to your normal slot.**

This is the first playable vertical research slice for issue #75. The original Sector 01 layout, colored doors, gold key, relays, enemies, and exits remain in place. A real 4×4-tile elevated platform and five-tile ascending ramp are placed over the open southeast/center sector room, with a genuine optional energy cache upstairs.

## How to launch on a branch preview

Serve this branch's web build using HTTPS (WebXR requires a secure context). Add `?solo2f=1` to the game URL, choose **New Campaign**, then move into Sector 01. The ramp runs from **x=9..14, y=21..23**, climbing east; the upstairs deck covers **x=14..18, y=19..23**. Use **J** on desktop, or the **JUMP** command on Gen.E.Wrist in immersive mode. Right grip still interacts; left grip still summons Ori. Standard campaign without the query parameter remains flat.

This slice uses the same `btm.vertical-prototype/1` geometry/physics as BBS Stackyard, with solo-only opt-in. Collision, lower/upper pickup separation, enemy sightlines, projectile/deck collision and stereo geometry share the existing runtime. The two-floor map is not yet populated with upstairs enemies or mandatory objectives.

## Save and verification boundaries

- Normal canonical v1 campaign saves are never overwritten while inside preview Sector 01. Retry checkpoint is available in memory only; leaving the page discards preview progress.
- Existing `version:1` saves restore as flat maps. Preview snapshots validate their authored geometry and vertical physics fields; no migration from an existing checkpoint.
- Co-op, Pit, competitive BBS and their server-side snapshots do not enable this preview.
- CI Node tests and production build are prerequisites, but real Quest 3 seated and standing headset tests are still required before expanding to the other eleven sectors.
- Test upper-deck pickup from both stories, ramp ascend/descend, falling, strafing near the deck edge, aiming from above, Ori, Gen.E.Wrist placement, headroom, offline cache and load/retry.

**Status is one experimental Sector 01 preview, not all twelve fully converted levels.**
