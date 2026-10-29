# First real Quest 3 BTM playtest — comfort and clarity

**Reported physical symptoms:** the game is fun, combat/strafe and Ori work, but the left glove appears rotated, Gen.E.Wrist shows under the hand, right-stick turns cause weapon changes, turning flashes, and Ori often fills the central combat view.

## What the v0.7.1-rc.1 candidate changes
1. Quest Touch **right stick now turns only**. Up/down no longer emits implicit Previous/Next weapon events. Wrist weapon selection stays explicit; desktop/Xbox unaffected.
2. New default **smooth turning**; snap remains optional with reduced snap fade. Existing saved vrTurnMode is respected to avoid silently overriding a deliberate comfort choice.
3. Left glove **visual pose** is independent of the tracked hand and right-hand aim. Calibration pitch/yaw/roll ranges -65..65 / -65..65 / -90..90 degrees. The status/wrist display is based on that same visual transform and has an extra up-to-8cm top clearance setting. The panel is reoriented upright with respect to the headset.
4. Ori's **visual** billboard/rings scale to 65% by default (user-adjustable 40–100%), and are kept outside the central forward view when close. Gameplay position, scan logic, abilities, dialogue timing and hit tests remain untouched.

## Manual Quest 3 acceptance (PENDING)
- [ ] Visit the updated GitHub Pages deployment with Quest Browser and enter immersive play.
- [ ] Turn smoothly in both directions with right stick; no snap flash. If old saved mode persists, explicitly set SMOOTH in Immersive Settings.
- [ ] Push the right stick diagonally while strafing; no unintended previous/next weapon.
- [ ] Open the left wrist; choose weapons deliberately, use GEN.E, cancel/return and continue fighting. No accidental trigger/weapon selection.
- [ ] Confirm the left glove visually follows the actual controller; adjust glove pitch/yaw/roll calibration if needed. Tracking/aiming should remain unchanged.
- [ ] Confirm the wrist screen sits above the visible hand and stays legible and upright at comfortable distances, including seated/standing.
- [ ] Test Ori when moving/turning, and in narrow hallways. Ori should remain recognizable without occupying the center of the view or blocking the aim ray.
- [ ] Test captions together with Ori, sustained frame pacing, tracking loss, recenter, and controller disconnect.
- [ ] Verify the optional snap mode still functions, with adjustable angle and comfort vignette.
- [ ] Confirm desktop keyboard, Xbox, Arcade, offline mode, and all campaign sectors remain unaffected.

**Scope:** no new hardware interactions, no claim of tested Quest 3 performance, no speculative sensor calibration. These adjustments require an actual headset rerun.
