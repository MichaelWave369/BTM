# Quest 3 field acceptance: Palm-up left hand and wristwatch reveal

This focused change responds to three screenshots from a **physical Quest 3 immersive BTM play session**. The reported left hand resembles the forward-oriented gun hand even though the intended interaction is: show an open palm at rest, turn the real forearm like checking a wristwatch, and only then reveal the holographic Fieldlink.

## Shipped candidate behavior

- **Right:** existing tracked aiming gun, weapon mesh and combat rays are unchanged.
- **Left:** new open-palm hand mesh, including near-straight fingers and distinct palm-facing plates. Cosmetic default posture brings the palm toward view. The extra rest pitch fades as the **tracked** controller turns into a watch-check pose. Users can choose **Classic** in VR equipment to restore the previous glove posture. Existing pitch/yaw/roll sliders remain available.
- **Activation:** still uses the real left controller's orientation, proximity, head direction and deliberate dwell; not the cosmetically rotated display glove. Small status remains on the wrist, with a closer floating panel only when watch-ready or pinned.
- **Controls:** the canonical right-ray button selection, movement/fire capture, left-grip Ori access at combat height, manual pin/unpin and reduced-motion preference stay unchanged.

## Physical headset checks (NOT certified by CI)

1. On Quest 3, start immersive BTM. Hold left controller naturally down in front: left fingers should appear **more open and upright** than the right weapon hand. The large menu must remain **closed**.
2. Raise the left hand and rotate the wrist naturally toward your eyes, as though checking a watch. Hold it aligned for about **350 ms**. A full panel should appear near and above the left cuff, comfortably visible in both eyes. It should **not float detached above the head**, intersect the glove, or obscure shooting.
3. Turn the wrist away without pressing buttons. The menu should retract after its grace period. Repeat seated and standing; see if natural palm-up-to-watch rotation works without awkward contortions.
4. While menu is open, point the right ray at a weapon tile and use right trigger. No shot or unwanted turn should occur; after leaving the menu and releasing controls, gun actions should behave normally.
5. With left hand down at normal combat height, press left grip: **Ori**, not a surprise menu. With left hand raised and in the watch-ready zone, left grip should pin/unpin the hologram.
6. Check **Classic** posture setting and return to **Palm Up / Watch Ready**. Compare cosmetics without losing calibrations or affecting your original/Pit save data.

Automated tests cover pose isolation, real tracked roll gating, transition math, independent right hand, and panel proximity. They cannot determine whether a physical Quest controller's grip basis matches every user's comfortable wrist roll; that remains a human field test. Report a screenshot from neutral hand and watch-open hand after merge before signing off #16.
