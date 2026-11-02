# Quest 3 / 3S: Calibration Vault aim trace (candidate field test)

This is a **software diagnostic**, not a claim that a headset has been tested or that all weapons are calibrated. Enable **VR Diagnostics** in Settings, start **The Calibration Vault** in Immersive VR, and equip the fixed training blaster.

## What the preview shows

- A thin cyan ray from the **collision-safe gameplay origin** along the actual tracked blaster direction.
- A cyan end marker and separate pale target-center marker when the existing hitscan logic finds a valid practice unit. The two may differ because each weapon has an allowed spread.
- An amber end marker for a wall, floor, ceiling or unobstructed range limit when nothing is hittable.
- **No** long-range predicted hits for the Φ Pulse Rifle (weapon 3): it uses simulated projectile travel, so the ordinary short aiming line remains instead.
- Preview is visual only. It doesn't change ray origin, damage, targets, recoil, difficulty, persistent saves, or ordinary aim-line settings. Turning VR Diagnostics off restores the existing short guide.

## Physical acceptance still required

1. Open the newest HTTPS Pages build on Quest 3, verify the actual commit, enable VR Diagnostics and enter Immersive VR → Calibration Vault.
2. Stand and sit: aim the right controller horizontally at a near unit, then a far unit, then up/down and diagonally. Check **both eyes** for mismatch among barrel, cyan ray, target marker and real shots. The marker is a hit prediction, not an automatic correction.
3. Record actual misses and hits, screenshot/video at each range, and note whether headset/controller tracking or hand calibration differs from the visual indicator.
4. Aim across solid walls, door-frame edges, floor and ceiling. Amber must mean obstructed or no eligible target, not a through-wall hit.
5. Open Gen.E.Wrist while holding trigger, release, and resume: the diagnostic must not leak fire or movement through the menu.
6. Disable VR Diagnostics, change weapons, play campaign/Pit, and repeat with both smooth and snap turning. Existing play, settings, offline behavior and multiplayer must remain unchanged.

Synthetic unit tests verify the **same traced hitscan** as gameplay; they cannot establish optical comfort, actual tracked basis, stable FPS or hardware hit registration. Keep [issue #17](https://github.com/MichaelWave369/BTM/issues/17) open until Quest field evidence is recorded.
