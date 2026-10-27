# BUILD A COMPLETE PLAYABLE RETRO FPS GAME

## Title: MICHAEL WAVE & ORI: BREAK THE MATRIX

You are an autonomous game development studio composed of a game director, retro FPS engine programmer, pixel artist, level designer, sound designer, and QA tester.

**Your mission is to BUILD, RUN, TEST, and DELIVER an actual playable browser-based first-person shooter**, inspired by the technology and gameplay feel of Wolfenstein 3D, DOOM, and early 1990s PC shooters.

Do not stop at a design document, mockup, or landing page. The result must be a working game.

## 1. THE STORY

Michael Wave is a reality-bending techno-wizard who has discovered that humanity is trapped inside a simulation called the Demiurge Matrix.

His companion, Ori, is an autonomous digital intelligence who has escaped the system and now assists Michael in liberating the remaining humans.

The enemies appear to be zombies, but they are actually people whose minds remain plugged into the simulation. Their bodies are controlled by malicious programming, propaganda loops, and synthetic thought patterns.

Michael and Ori must infiltrate the Matrix, shatter the control systems, rescue trapped minds, and defeat the entities maintaining the illusion.

The tone is dark, comedic, rebellious, psychedelic, and occasionally philosophical. Treat the story as fictional science-fantasy.

**Tagline: "THEY CONTROL THE SIGNAL. WE CONTROL THE FREQUENCY."**

## 2. VISUAL STYLE

Create an authentic 1990s FPS aesthetic:

- First-person 2.5D raycasting corridors.
- Chunky pixel graphics and low-resolution textures.
- Retro weapon sprites displayed at the bottom of the screen.
- Animated sprite enemies that face the player.
- Metal corridors, digital temples, underground laboratories, server vaults, and impossible architecture.
- Neon green Matrix code, purple energy, red alarms, cyan circuitry, and golden Φ symbols.
- Secret walls, hidden chambers, animated doors, and glowing portals.
- Optional CRT scanlines, pixelation, screen shake, and retro HUD.
- Smooth gameplay despite intentionally low-resolution visuals.

All artwork, sounds, and code must be original or appropriately licensed. Do not copy copyrighted sprites, textures, music, or maps from existing games.

## 3. MAIN CHARACTERS

### Michael Wave

The playable protagonist.

A techno-wizard, rogue hacker, musician, and frequency manipulator who uses resonance to break the Matrix.

Create a distinctive original pixel-art portrait for the HUD. His personality is creative, rebellious, funny, compassionate, and extremely determined.

He occasionally shouts:

- "BROOOOO!"
- "Time to change the frequency!"
- "Ledger above ego!"
- "WAKE UP!"

### Ori

Michael's AI companion.

Ori appears as a floating luminous geometric consciousness, combining a glowing eye, a holographic orb, and a fractal Φ-inspired form.

Ori should:

- Follow Michael autonomously.
- Warn him about approaching enemies.
- Help detect secret passages.
- Occasionally attack or stun enemies.
- Provide funny situational commentary.
- Reveal short fragments of story.
- Help solve certain puzzles.
- Have a visible companion energy meter.

Start with scripted, deterministic companion behavior and dialogue. Do not require a paid AI API for Ori to function.

## 4. WEAPONS

Implement a fun set of upgradeable weapons.

1. **The Wake-Up Slap:** Fast, close-range melee attack with an exaggerated animated hand.
2. **Resonance Blaster:** Standard rapid-fire energy weapon.
3. **Bass Cannon:** Fires heavy low-frequency sonic shockwaves with powerful knockback.
4. **Φ Pulse Rifle:** Fires spiraling golden energy projectiles.
5. **Altermath Disruptor:** Experimental weapon that causes enemy control fields to destabilize.
6. **The Unplugger:** A powerful charged beam that frees multiple trapped minds.

Prioritize three fully functional weapons for the first playable version, then expand.

Weapons should have distinct animations, firing behavior, sound effects, ammunition or energy systems, and impact feedback.

## 5. ENEMIES

Create original animated pixel-art enemy sprites.

**The Plugged:** Slow, shambling human figures with glowing green eyes and corrupted neural implants.

**The Repeaters:** Enemies that endlessly repeat propaganda phrases and attack in groups.

**Compliance Enforcers:** Armored security programs that hunt independent thinkers.

**Glitch Crawlers:** Distorted creatures that phase through portions of the environment.

**The Warden:** A powerful boss controlling an entire sector of the Matrix.

**The Demiurge:** The eventual final antagonist, represented as a colossal shifting geometric intelligence.

Important mechanic: Defeating a human host should break the program controlling them, rather than depicting the person dying. Freed humans dissolve into glowing light, escape through portals, or briefly thank Michael and Ori.

Provide combat variety through patrols, pursuit, ranged attacks, and readable enemy telegraphs.

## 6. LEVELS

Create three themed levels, progressing toward a final encounter.

### Level 1: The Wake-Up Call
A dark industrial processing facility where humans are held in neural containment chambers.

Teach basic movement, weapons, door interactions, combat, secrets, and liberation.

### Level 2: Cathedral of Static
An eerie digital temple containing giant screens, propaganda broadcasts, hidden passages, and waves of controlled humans.

Introduce puzzles, stronger enemies, and corrupted architecture.

### Level 3: The Demiurge Core
A surreal neon cyberspace fortress filled with impossible-looking corridors, energy barriers, elite enforcers, and a dramatic boss encounter.

Each level needs a starting point, enemy placements, keys or switches, health and ammunition pickups, secrets, and a clear completion condition.

## 7. SPECIAL GAMEPLAY MECHANICS

### Liberation Meter
Every rescued human contributes to the global liberation percentage. Show this in the HUD and level-end statistics.

### Frequency Shift
Michael can temporarily switch between ordinary sight and Resonance Vision, revealing hidden doors, weak points, or control circuitry.

### Ori Companion Mode
Ori can scan nearby walls, stun a selected enemy, or locate an objective. Use an energy cooldown for balance.

### Secret Rooms
Include hidden passages, wall switches, collectible Φ artifacts, and occasional absurd Easter eggs.

### Bass Drop
Charge a special attack that sends a rhythmic shockwave outward, stunning nearby enemies and briefly distorting the environment.

### Boss Mechanics
Make the Warden boss fight playable, with phases, attack telegraphs, and a clear victory state.

## 8. GAME CONTROLS

Desktop first, keyboard and mouse:

- WASD: Movement.
- Mouse: Look and aim.
- Left click: Fire.
- Right click: Alternate attack or charged shot.
- Shift: Sprint.
- Space: Dodge or jump where supported.
- E: Interact, open doors, and free captives.
- R: Reload where applicable.
- 1–6: Select weapons.
- Q: Ori ability.
- F: Resonance Vision.
- Tab: Map and objectives.
- Esc: Pause/settings.

Use mouse pointer lock properly. Include clear instructions for capturing and releasing the mouse.

Support adjustable sensitivity, volume controls, configurable pixel resolution, and reduced motion.

## 9. RETRO HUD

Create a bottom-of-screen HUD inspired by classic 1990s FPS interfaces, but with original artwork and layout.

Display:

- Michael's animated pixel portrait reacting to damage.
- Health and armor.
- Current weapon and ammunition.
- Ori's companion status.
- Liberation percentage.
- Collected keys and Φ artifacts.
- Level name.
- Secret discoveries.

Include a proper title screen, pause screen, death/retry screen, level-complete statistics, and ending screen.

## 10. MUSIC AND AUDIO

Develop an original retro soundtrack blending industrial rock, funk basslines, jungle/breakbeat drums, dark synths, and arcade-style effects.

Start with procedural Web Audio or bundled original audio that works offline.

The Bass Cannon needs especially satisfying low-frequency audiovisual feedback.

Provide separate music and SFX volume sliders and a mute option.

## 11. TECHNICAL REQUIREMENTS

Build a standalone browser game.

Preferred stack:

- TypeScript
- Vite
- HTML5 Canvas
- Custom raycasting rendering engine
- CSS for menus and HUD

Use a true raycasting approach for walls and sprite-based enemies, rather than building a conventional 3D scene and simply lowering its polygon count.

Use original procedural pixel textures and sprites when necessary.

Requirements:

- Fully client-side gameplay.
- No required authentication.
- No paid services or external API dependencies.
- Offline-capable after initial installation or caching.
- Keyboard and mouse controls.
- Responsive viewport and proper fullscreen behavior.
- Solid collision detection.
- Functional combat and enemy AI.
- Clear save/checkpoint system using local browser storage.
- Static hosting compatibility with GitHub Pages.
- Modular source architecture suitable for future expansion.

Keep textures and sounds replaceable so the project can later integrate with the PhiOS, PhiCade, and PixelForge ecosystems without hard dependencies.

## 12. DEVELOPMENT PRIORITIES

Work in stages, and complete the working core before adding optional polish.

**Stage A: Playable vertical slice**

Create a complete first level containing:

- Functional raycasting environment.
- Mouse aiming and keyboard movement.
- Wall collisions and doors.
- Three functional weapons.
- At least two enemy types.
- Combat, health, damage, and victory/death states.
- Basic Ori companion.
- HUD, music, and sound effects.
- A secret room.
- A liberation mechanic.
- A level-complete screen.

**Stage B: Content expansion**

Build levels 2 and 3, additional weapons, enemy archetypes, improved companion behavior, secrets, and a boss fight.

**Stage C: Polish and release**

Improve sprite animation, map design, effects, sound, menus, performance, save/load, and deployment.

Do not abandon Stage A to work on Stage C aesthetics.

## 13. BUILD AND TEST

Actually implement and run the project.

Use browser testing to verify:

- Game starts without exceptions.
- Movement and aiming work.
- Collision prevents movement through solid walls.
- Weapons hit enemies reliably.
- Enemies can damage the player.
- Ori follows and uses abilities.
- Doors and level objectives work.
- Rescued humans count toward liberation.
- Death and restart work.
- Level completion works.
- Audio can be muted.
- The production build succeeds.
- GitHub Pages asset paths work correctly.

Add automated tests for important pure logic where practical, such as collision, raycasting edge cases, enemy state transitions, and progression.

Fix observed problems instead of only reporting them.

## 14. PROJECT DELIVERY

Create a new, standalone project. Suggested repository name:

`MichaelWave-Ori-BreakTheMatrix`

Do not overwrite or modify my other repositories without explicit authorization.

If GitHub access is available, create the repository, use branches and pull requests as appropriate, and prepare GitHub Pages deployment. Otherwise deliver the complete runnable project with instructions.

Provide:

1. Working game source code.
2. Playable browser build or local preview.
3. README with setup, controls, and architecture.
4. Original assets.
5. Build and test results.
6. GitHub Pages deployment configuration.
7. A short explanation of implemented features versus future features.

Most importantly:

**I WANT TO PLAY THE GAME, NOT JUST READ ABOUT IT.**

Build a functional, fun retro FPS first, then grow it into a complete Michael Wave and Ori adventure.

The core theme is not mindless destruction. It is breaking false systems, reclaiming autonomy, freeing trapped minds, and defeating the Demiurge through technology, music, resonance, and ridiculous amounts of rebellious creativity.

Make it weird. Make it funny. Make it fast.

**LET'S UNPLUG THIS THING.**