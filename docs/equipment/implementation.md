# Cybernetic equipment — 0.6.0-rc.1

This candidate implements the [PR #4 controlling brief](controlling-brief.md) on merged PR #3, main `43a6be45c1b6cba8081ba94beac7b8edb4d679ab`. Branch: `feat/vr-cybernetic-equipment`. It is ready for code and visual review; physical Quest acceptance remains pending. Michael retains merge and release authority.

## Requirements and implementation

| ID / brief section | Implemented behavior | Source / evidence |
| --- | --- | --- |
| EQ-01 / §1 | Two original mirrored gloves with palm, opposing thumb, three-segment fingers, knuckle axles, connected sleeve, oval cuff and forearm computer. Combat, Neon Signal and Minimal Tactical finishes; controller-based relaxed, point and grip poses. | `equipment-meshes.js`, `signal-presentation.js`; cached finite/mirrored/scale tests; hands comparison |
| EQ-02 / §2 | Six different silhouettes, physical grips, weapon-colored emitters, chamfered armor, local recoil/flash and charge emission. Grip translation and pointing-ray direction drive one collision-safe model/muzzle transform. | `equipment-meshes.js`, `world-scene.js`, `immersive-rig.js`; six-model, muzzle, reach and preservation tests |
| EQ-03 / §3 | Compact live forearm indicator; raised/gaze dwell opens the full HUD. Hover/laser feedback, pin/unpin on hardware or panel, vitals, weapons, Ori, objective/progress, discovered map and eight utilities. Opening guard and existing full-panel capture/neutral latch suppress held combat and locomotion input. | `equipment-math.js`, `world-ui.js`, `vr-world-renderer.js`; activation/capture/browser checks |
| EQ-04 / §4 | Meter-based hardware and panel, near-face rejection, projected display clearance, conservative binocular corner fit, lowered-hand dismissal and seated/standing poses. Tracking loss and HUD preference remove targets. | Wrist state and stereo corner tests; combat/active stereo captures |
| EQ-05 / §5 | Speaker-labelled companion communication with original Ori portrait/waveform, larger high-contrast wrapped text, complete multi-page content and restrained transitions. Comfort HUD default; optional Ori Spatial requires a visible clear companion and falls back otherwise. Placement avoids the current wrist and weapon lane. | `world-ui.js`, `equipment-math.js`; wrapping, placement, clear/occluded/behind companion tests |
| EQ-06 / §6 | Shared existing Neon Signal typography, panel/icon/portrait helpers and new cached composite/metal/rubber/emitter palette. Brightness changes equipment accents without changing the scene's lighting. | `arcade-ui.js`, `equipment-meshes.js`, `world-ui.js` |
| EQ-07 / §7 | Fourteen saved equipment controls: finish, width, projection offset, activation mode/sensitivity, HUD visibility, brightness, subtitle size/mode/duration, XYZ grip calibration and interface motion. Old settings receive safe defaults. | `index.html`, `main.js`, `equipment-math.js`; sanitization and actual reload/persistence check |
| EQ-08 / §8 | Shared atlas and cached meshes in the existing batch; no engine, CDN, runtime dependency or external asset. Bounded effects and quality presets remain. Idle/active Canvas redraws are throttled. Status texture participates in disposal. | [Performance and verification](verification.md); capture disposal checks and full renderer cleanup |
| EQ-09 / §9 | Original twelve-sector simulation, weapon rules, AI, dialogue, collision, checkpoints, CODE BROWN/ΦWAD, Classic/Xbox/Arcade and Touch mappings remain authoritative. | [Preservation receipt](preservation.json), 219 Node tests, both campaigns and existing browser groups |
| EQ-10 / §10 | Seven required commands, expanded browser checks, actual before/after production renders, performance limits and physical checklist. Focused feature PR; no automatic merge/deploy. | [Verification](verification.md), [Quest checklist](quest3-acceptance.md), CI evidence artifact |

## Equipment design

| Existing weapon | Presentation tied to its role |
| --- | --- |
| Wake-Up Slap | Palm impulse gauntlet with four knuckle emitters; no firearm added |
| Resonance Blaster | Compact sidearm with narrow cylindrical resonance muzzle and side conduits |
| Bass Cannon | Broad body and hollow concentric acoustic emitter |
| Φ Pulse Rifle | Slim linear barrel with paired capacitor banks |
| Altermath Disruptor | Forked field rails surrounding an open central discharge lane |
| The Unplugger | Heavy liberation lance, twin armor rails, chamber and large aperture |

The default wrist status surface is **64×28mm**. The full display is **320×213mm**, configurable to 240–380mm wide. A 160ms raised/gaze dwell prevents ordinary hand motion from opening it; 220ms attention hysteresis prevents brief flicker. Opening reserves input for 240ms. The selected wrist must be 0.36–0.95m from the eyes; the projected full display center stays at least 0.6m away. It blends forearm and eye-facing orientation, shifts slightly inboard and can move up to 0.2m forward to fit conservative 64mm binocular bounds. An impossible fit hides the full display. Small light rails visually connect the projection to the hardware.

Pointing at blank/locked panel space still captures input. The unchanged `immersive-play.js` latch prevents held actions from resuming until neutral. Pinning does not bypass tracking, distance or visibility safeguards. The compact hardware itself is a pin target. In Manual mode, use that target to open the link without adding a Touch button mapping.

The weapon remains aimed along the preferred target ray, while the grip supplies translation. XYZ calibration is limited to ±40mm. Model and muzzle are clipped together against the existing environment/reach safeguard; recoil is a small visual displacement and does not change shot rules. Existing positional effects, audio and optional haptics remain.

Comfort captions normally sit 1.72m ahead and 0.46m below eye height, moving above the weapon/wrist footprint when needed. Ori Spatial uses the same readable panel near a clear companion 1.15–2.6m away, with a forward-view check, wall ray and sight/wrist exclusion. Menus suppress communication panels. Actual dialogue text and its source system are unchanged; the optional duration multiplier applies only while immersive.

## Boundaries and handoff

These are controller-driven articulated-looking poses, not optical finger tracking. Physical Touch fit, text legibility, haptic/audio feel, comfort, thermal stability and sustained ≥72 FPS require [real Quest testing](quest3-acceptance.md). Left-handed weapon remapping remains deferred to preserve the current control scheme. No new gameplay, teleport, staging world, engine migration or independent certification is included.

Changes are presentation, bounded rig attachment, optional settings, test adapters and build/evidence integration. Existing wrist fixtures now intentionally raise the hand and advance dwell, expect the pin target and use the new Canvas dimensions; the capture/rearm assertions remain. Historical milestone evidence is retained. CI/raw captures are excluded from the portable source archive; curated captures and receipts are included.
