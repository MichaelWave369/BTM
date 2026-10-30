---
name: btm-quest3-input
description: Quest Touch, tracked controller, smooth/snap turn, left-wrist pointer capture, neutral rearm, Xbox/desktop regression guidance for BTM native WebXR.
---

# BTM Quest 3 input and interaction

## Read first
- `src/vr-input.js`, `src/immersive-rig.js`, `src/equipment-math.js`, `src/left-hand-pose.js`, wrist UI modules and `tests/quest-comfort.test.mjs`
- `docs/quest3-first-contact.md` is newer than some control tables in `docs/QUEST_CONTROLS.md`.

## Non-negotiable input behavior
- Right-stick horizontal controls turning. Right-stick vertical **must not** cycle weapons in immersive Quest mode, including diagonal motion. Weapons are selected deliberately through the wrist Arsenal. Desktop/Xbox behavior stays separate.
- Smooth turn is the default for new immersive settings; previously saved snap choice remains respected. Snap turn remains available by explicit selection; avoid aggressive visual flashes.
- Maintain `xr-standard` fallback and real Quest profile behavior; never invent unverified button indices.
- Pointer/wrist interactions capture controls until inputs are neutral and re-armed. Tracking loss, focus loss, missing controller or XR session end must not leave held actions firing.
- Calibration of visual left glove and wrist must NOT mutate controller tracking, gameplay physics, right-hand aim, collision or shot ray.
- Hand-only tracking is not currently implemented. Do not claim it is.

## Verification
- Add table-driven tests of diagonal stick axes, release/rearm, wrist combat capture and preference persistence.
- Verify keyboard, Xbox, Arcade, and immersive modes separately. Hardware Touch tests remain an explicit manual Quest 3 checklist.
- See upstream `input-systems` for action/edge/deadzone concepts, not a request to transplant another engine's API.
