# BTM: IMMERSIVE VR NEXT
## Full Quest 3 Experience Upgrade

**Repository:** https://github.com/MichaelWave369/BTM

**Project:** Michael Wave & Ori: Break the Matrix

**Mission:** Transform the existing immersive VR experience into a polished, highly interactive, visually striking, native-feeling Meta Quest 3 shooter while preserving the complete original game.

This is an **implementation task, not a proposal or design-only exercise**. Inspect the current repository, implement the highest-impact improvements, run verification, and create a reviewable GitHub pull request.

### 1. First, inspect what we already built

Read the current source, README, WebXR implementation, rendering system, controller mappings, gameplay architecture, and Quest acceptance checklist.

The existing game already supports:

- Twelve campaign sectors and six weapons.
- Native immersive WebXR with stereo 3D environments.
- Quest Touch controller tracking and weapon aiming.
- Room-scale head movement and collision.
- World-space Ori companion.
- Wrist-mounted HUD and spatial interactions.
- Snap/smooth turning and locomotion comfort options.
- VR Arcade mode and traditional desktop/Xbox gameplay.
- Custom ΦWAD missions, including playable CODE BROWN.
- Offline-capable GitHub Pages deployment.

**Do not rebuild functioning systems unnecessarily.** Extend and improve them. Verify all assumptions against the latest `main` branch.

### 2. Upgrade the immersive visual experience

Give BTM the visual identity of a premium, original 1980s retro-futuristic sci-fi VR adventure.

Use the existing Neon Signal design language and develop:

- Dramatic neon-lit corridors and atmospheric environments.
- Cyan, magenta, electric blue, warning red, and amber lighting accents.
- Glowing terminals, animated displays, pulsing relays and holographic interfaces.
- Improved wall, floor, ceiling, door and environmental materials.
- Better depth cues, contrast, fog and environmental distance treatment.
- Improved enemies, projectiles, explosions and weapon impact effects.
- Environmental animations, flickering systems, signal interference and reactive lighting.
- Different visual identities across the campaign sectors.
- Visually impressive but performance-conscious boss encounters.

These should be actual spatial 3D environments, not flat scenery or stereoscopic screen overlays.

Keep every visual effect scalable through graphics quality settings. Avoid expensive effects that compromise VR frame pacing.

All assets must be original or appropriately licensed and bundled locally.

### 3. Make the player's hands feel real

Enhance tracked Touch controller representation and interactions.

Implement or improve:

- Visible left and right hand/controller representations.
- Natural weapon attachment to the right hand.
- Correct weapon scale, orientation, aiming and muzzle position.
- Distinct visual models or presentations for all six weapons.
- Responsive recoil, charging, firing and impact feedback.
- Optional controller vibration when supported.
- Clear interaction highlights on nearby usable objects.
- Point-and-interact behavior for doors, terminals, relays, rescues and other existing interactions.
- Reliable hand-to-menu interaction with proper input suppression.

Investigate optional direct-touch interaction for spatial controls without making it mandatory or breaking standard controller input.

Do not introduce ammunition or reload mechanics that conflict with the existing game's resource system.

### 4. Completely polish the VR interface

Redesign the immersive UI as a cohesive **in-world holographic combat system**.

The player should feel like they're wearing advanced equipment rather than looking at desktop menus inside VR.

Improve:

- Left wrist health, armor, energy and weapon status.
- Interactive weapon selection and objective tracking.
- Spatial minimap and discovered-sector information.
- Ori communication and status displays.
- Holographic mission briefing and pause interfaces.
- Point-and-select menu interactions.
- Readable world-anchored subtitles and alerts.
- Recenter, seated/standing height, calibration and comfort controls.
- Quick access to map, vision, vent, Ori, bass drop and other existing abilities.

Make panels appear deliberately positioned, correctly scaled in meters, and readable at realistic headset distances.

Prevent accidental firing or movement while navigating menus.

Provide comfortable controls for both seated and standing play.

### 5. Make Ori an unforgettable VR companion

Ori must feel like an actual character inhabiting the player's world.

Enhance the existing world-space Ori with:

- Smooth 3D following and positioning.
- Expressive original holographic animations.
- Context-aware orientation toward the player, objectives and threats.
- Visually readable route guidance and enemy warnings.
- Improved assistance, stun and scan effects.
- Directional audio cues and in-world dialogue captions.
- Subtle responses to player actions and significant events.

Preserve Ori's existing gameplay abilities, timing, dialogue and narrative identity.

Ori should be helpful and atmospheric without obstructing weapon aiming or blocking the player's view.

### 6. Upgrade VR combat presentation

Make combat feel responsive, physical and exciting while preserving the existing game rules.

Prioritize:

- Accurate tracked-hand aiming and projectile origin.
- Correct interaction between hand position, walls and weapon collision.
- Distinct weapon effects and audio identities.
- Directional damage indication.
- Better enemy hit responses.
- Clear telegraphing of incoming attacks.
- Impact particles and environmental feedback.
- Strong but comfortable boss-fight presentation.
- Optional haptics and spatialized sound.

Absolutely no artificial camera shake in the headset.

Use weapon-local effects, audio, subtle haptics and environmental reactions for intensity.

Do not alter campaign progression, enemy damage balance or weapon mechanics unless necessary to correct a documented VR-specific problem.

### 7. Improve locomotion and VR comfort

Keep the existing movement system but refine the experience.

Support:

- Smooth locomotion.
- Snap turning in existing selectable increments.
- Optional smooth turning.
- Head-relative and controller-relative movement.
- Seated and standing modes.
- Adjustable movement speed and turning sensitivity.
- Configurable comfort vignette.
- Natural crouching, leaning and room-scale movement.
- Reliable recenter and tracking reset handling.

Add optional teleport locomotion only if it can be integrated safely with collision, encounter design and progression. It must not allow players to bypass locked doors, walls, enemies or mission gates.

Maintain correct collision and interaction rules during physical movement.

Include obvious, accessible comfort defaults and warnings where appropriate.

### 8. Create a better VR-first entry experience

Investigate a lightweight, beautiful **Neon Signal VR staging area** that can serve as the immersive entry menu.

Visual direction:

A retro arcade-meets-cyberspace command environment with a synthwave horizon, floating holographic displays and glowing mission-selection interfaces.

Allow players to choose:

- Continue campaign.
- Start campaign.
- Enter CODE BROWN.
- Load a compatible custom mission.
- Adjust comfort and graphics settings.
- Recenter/calibrate.
- Exit immersive VR safely.

Implement this only if the core rendering, controller interaction and comfort improvements are stable first.

Reuse the existing gameplay/menu architecture and avoid creating a separate, incompatible game flow.

### 9. Quest 3 optimization is mandatory

Target Meta Quest 3 running the Quest Browser through HTTPS WebXR.

Prioritize stable **72 FPS or better**, but treat this as a hardware acceptance target, not an automatically verified result.

Investigate:

- WebGL draw-call reduction.
- Visibility culling.
- Static geometry batching.
- Texture atlas efficiency.
- Geometry and animation complexity.
- Dynamic effects budgets.
- Allocation and garbage-collection spikes.
- Framebuffer resolution and quality presets.
- GPU and CPU performance instrumentation where supported.
- Memory leaks during repeated XR entry/exit.

Preserve the existing dependency-light JavaScript, Canvas and WebGL architecture unless a change is clearly justified.

The game must remain suitable for GitHub Pages and offline use.

Do not introduce CDNs, remote runtime dependencies, paid APIs, analytics or accounts.

### 10. Preserve everything that already works

These are non-negotiable regression boundaries:

- All twelve original campaign sectors.
- All six weapons and their mechanics.
- Existing enemies, bosses, AI and objectives.
- Michael and Ori dialogue.
- Checkpoints and save compatibility.
- CODE BROWN and custom ΦWAD mission support.
- VR Arcade mode.
- Desktop and Xbox controls.
- Existing music and sound behavior outside intended VR improvements.
- Offline service-worker support.
- Original game identity and branding.

Do not substitute a new game engine or rewrite the core simulation.

Use feature flags or isolated modules where appropriate to protect stable systems.

### 11. Testing and verification

Run the repository's existing verification commands:

```bash
npm run check
npm test
npm run playtest
npm run playtest:immersive
npm run build
node scripts/verify-build.mjs
node scripts/verify-offline.mjs
```

Extend the automated test suite for new features, especially:

- Controller input and state transitions.
- Weapon and UI ray interaction.
- Stereo render state and camera transformations.
- Collision and physical-head movement.
- Save/checkpoint compatibility.
- Custom mission compatibility.
- XR session lifecycle and resource cleanup.
- Offline asset completeness.

Use genuine browser/WebGL checks wherever available.

Do not claim physical Quest 3 validation, actual headset frame rate, comfort certification, or controller/haptics testing unless it was performed on real supported hardware.

Update `docs/v0.4.0/quest3-acceptance.md` or create a clearly linked successor checklist with any newly required physical checks.

### 12. GitHub delivery

Work directly from the existing repository, create a new feature branch and produce a focused, reviewable pull request.

Include:

1. Actual implemented source-code improvements.
2. Any new original visual or audio assets.
3. Updated configuration and settings where required.
4. Added automated tests.
5. Updated user documentation and Quest controller guide.
6. A manual Quest 3 test checklist.
7. A concise performance and compatibility report.
8. Screenshots or captures where the environment supports them.
9. A summary of completed features, deferred enhancements and unresolved limitations.

**Do not merge the PR automatically.**

Prioritize working, playable improvements over speculative features or visual mockups.

If the full scope exceeds the available execution window, finish a coherent, tested upgrade first and document the next implementation phases rather than leaving a partially broken build.

### FINAL DESIGN GOAL

When the player puts on a Quest 3 and enters Michael Wave & Ori: Break the Matrix, they should feel as though they've physically stepped inside a rebellious 1980s cyberpunk universe.

The environments surround them. Weapons respond to their hands. Ori accompanies them through the world. Interfaces feel like futuristic equipment. Combat is engaging, precise and comfortable.

The original game's personality, mechanics and story remain intact.

**Take what we have already built and make the VR experience exceptional.**

Build it, verify it, document it, and deliver the GitHub PR for review.