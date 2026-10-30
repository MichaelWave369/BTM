---
name: btm-xr-comfort
description: Native WebXR comfort and performance checks for Quest 3: per-eye rendering, turning, vignette, wrist readability, Ori occlusion, calibration and honest hardware acceptance.
---

# BTM immersive comfort and frame evidence

Read `src/immersive-rig.js`, `src/left-hand-pose.js`, `src/ori-comfort.js`, `src/equipment-math.js`, `docs/quest3-first-contact.md`, `docs/equipment/quest3-acceptance.md`, and related tests.

- Keep headset head pose independent from locomotion/weapon pose; no synthetic head shake.
- Maintain user snap/smooth preferences, comfort vignette, quality levels, recenter and seated/standing adjustments.
- Avoid wrist intersections, below-hand placement and unreadable near-eye panels. Preserve safe distance, tracking availability, and occlusion protections.
- Ori's *visual* size/peripheral placement is adjustable and must not mutate Ori's underlying simulation, interaction or combat authority.
- Test both eyes using actual BTM stereo/browser suites when possible; mocked/synthetic stereo is not physical headset validation.
- Measure representative render and frame timing before optimizing. Existing CPU submission and draw-call diagnostics do NOT establish compositor FPS, GPU time, 72 Hz stability or thermal comfort.
- State any explicit performance budget as a target, not as an achieved number. Do not promise motion-sickness prevention.
- Physical Quest 3 comfort, controller behavior, smooth turning, text legibility and sustained frame pacing remain manual acceptance until observed and logged.

Use upstream `performance-optimization` only for measurement method; its Unity/Godot/Unreal profiler examples do not describe BTM's runtime.
