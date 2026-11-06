# Quest 3 / 3S: Calibration Vault aim trace (candidate field test)

This is a **software diagnostic**, not a claim that a headset has been tested or that all weapons are calibrated. Enable **VR Diagnostics** in Settings, start **The Calibration Vault** in Immersive VR, and equip the fixed training blaster.

## What the preview shows

- A thin cyan ray from the **collision-safe gameplay origin** along the actual tracked blaster direction.
- A cyan end marker and separate pale target-center marker when the existing hitscan logic finds a valid practice unit. The two may differ because each weapon has an allowed spread.
- An amber end marker for a wall, floor, ceiling or unobstructed range limit when nothing is hittable.
- **No** long-range predicted hits for the Φ Pulse Rifle (weapon 3): it uses simulated projectile travel, so the ordinary short aiming line remains instead.
- Preview is visual only. It doesn't change ray origin, damage, targets, recoil, difficulty, persistent saves, or ordinary aim-line settings. Turning VR Diagnostics off restores the existing short guide.

The tracked firing beam and preview use the same point on the central ray. The diagnostic result also reports `targetOffsetMeters`, the distance from that point to the accepted target marker. The off-axis regression records 0.72 m of separation with zero displacement between the guide and firing beam. The Wake-Up Slap starts at its palm emitter. BBS derives its transmitted muzzle offset after local movement prediction and the host still applies its own reach and collision checks.

Software calibration fires each of the six weapons from the tracked rig at 1.6, 8.0, and 19.2 m. It checks damage within each weapon's range and verifies that the Φ Pulse Rifle starts at the same muzzle and reaches the target through simulated travel.

## Physical acceptance still required

1. Open the newest HTTPS Pages build on Quest 3, verify the actual commit, enable VR Diagnostics and enter Immersive VR → Calibration Vault.
2. Aim at near, middle and far practice units while seated and standing. Use floor tiles (1.6 m each) to estimate one, five and twelve tiles. Repeat with upward and diagonal angles. In both eyes, compare the barrel, cyan guide, shot beam and target hit feedback. Record off-axis hits separately from center hits.
3. Record actual misses and hits, screenshot/video at each range, and note whether headset/controller tracking or hand calibration differs from the visual indicator.
4. Aim across solid walls, door-frame edges, floor and ceiling. Amber must mean obstructed or no eligible target, not a through-wall hit.
5. Point at the watch, open Gen.E.Wrist, move the right ray off the panel and close it. Confirm the selection press cannot fire and a fresh press after release can fire. Repeat while walking.
6. Disable VR Diagnostics, change weapons, play campaign/Pit, and repeat with both smooth and snap turning. Existing play, settings, offline behavior and multiplayer must remain unchanged.

Synthetic unit tests verify the **same traced hitscan** as gameplay; they cannot establish optical comfort, actual tracked basis, stable FPS or hardware hit registration. Keep [issue #17](https://github.com/MichaelWave369/BTM/issues/17) open until Quest field evidence is recorded.
