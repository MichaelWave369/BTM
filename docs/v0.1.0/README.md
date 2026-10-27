# Michael Wave & Ori: Break the Matrix

**THEY CONTROL THE SIGNAL. WE CONTROL THE FREQUENCY.**

An original, playable browser FPS built with a custom DDA raycasting renderer, pixel sprites, procedural Web Audio, and a deterministic simulation. Version **0.1.0** is a three-sector campaign candidate with a Warden fight and an ending. The story is fictional science-fantasy. Human hosts are liberated, never killed.

## Play locally

Requires Node.js 20 or newer. There are **no package dependencies to install**.

```sh
npm run build
npm run dev
```

Open **http://localhost:5173/**. `npm run dev` serves the built `dist/` when present, or source files before the first build. For a different port: `npm run dev -- --port 8080`.

The downloaded package includes a prebuilt `dist/`. You can also serve that folder with any static web server. Use an HTTP server; ES modules do not work reliably by double-clicking `index.html` through `file://`.

## Your first mission

1. Press **Enter the Matrix**. Click the viewport to capture your mouse.
2. Move straight toward the door. Approach it and press **E**.
3. Fire at the plugged-in hosts. They turn into liberation particles; freed people add to the campaign counter.
4. Find the two control terminals and press **E** at each. Collect the golden key.
5. Reach the extraction portal. Repeat in the Cathedral of Static, then confront the Warden in the Demiurge Core.

Ori's **Q** ability stuns a nearby visible enemy, or marks objectives when no enemy is close. **F** reveals secret walls. Face a secret wall and press **E** to open it. Every two Φ artifacts improve all weapon damage by 15%.

## Controls

| Input | Action |
| --- | --- |
| WASD / Up, Down | Move; A/D strafe |
| Mouse / Left, Right arrows | Aim / turn |
| Left click / Left Ctrl | Fire |
| Hold right click, release | Charged alternate fire |
| Shift | Sprint |
| Space | Directional dodge; brief damage immunity |
| E | Open door, break relay, free captive, use exit |
| R | Vent capacitor; restores energy after a short delay |
| 1–6 / mouse wheel | Select unlocked weapon |
| Q | Ori scan / stun |
| F | Toggle Resonance Vision |
| B | Bass drop when liberation has charged it to 100% |
| Tab | Toggle discovered map and objectives |
| M | Mute |
| Esc | Release pointer / pause |

**Mouse capture:** Browsers can deny pointer lock, especially inside embedded previews. Arrow keys and drag-to-aim remain available. If capture fails, click and drag across the viewport while firing, or turn with the arrow keys. Mouse look is horizontal, like a classic Wolfenstein-style shooter. Fullscreen is available from the top bar when the browser permits it.

Coarse-pointer devices receive touch movement, turn, fire, interact, Ori and pause buttons. This is a desktop-first game; touch is a basic fallback, not a full mobile control scheme.

## Implemented

- Three original, connected 29 × 25 maps with keys, switches, pickups, discoverable secrets and extraction gates.
- DDA raycasting walls and depth-tested billboard sprites; no conventional polygonal 3D engine.
- Original generated wall textures, four-frame enemies, weapon silhouettes, HUD portrait, portal effects and geometric Ori art.
- Six distinct weapons: free melee slap, rapid blaster, bass cone/knockback, travelling Φ projectile, area disruptor/stun, piercing Unplugger beam.
- First sector begins with three weapons; sector two unlocks the pulse rifle; sector three unlocks the disruptor and Unplugger.
- Plugged humans, ranged Repeaters, armored Enforcers, thin-wall-phasing Glitch Crawlers and a three-phase Warden with telegraphed projectiles.
- Following, automatic assistance, energy-limited Q ability, secret hints and deterministic dialogue from Ori.
- Liberation, captive rescue, optional artifacts, armor, capacitor recharging, vision energy, dodge and bass drop.
- Title, manual, settings, pause/save, death/retry, sector statistics and campaign ending.
- Local checkpoints after entering a sector, relays, the key, artifacts and Warden liberation. Manual save from pause; page exit also saves active play. Continue restores the latest checkpoint. No cloud saves or accounts.
- Original 138 BPM procedural breakbeat / bass soundtrack and synthesized weapon, door, rescue, alarm and pickup effects. Separate music/SFX controls, mute, sensitivity, pixel resolution, scanlines and reduced motion.
- Content-hashed service-worker cache and static, relative-path deployment.

## Offline play and portability

On HTTPS or `localhost`, wait for the footer to show **OFFLINE READY**. The complete game shell is cached. Loading the same address can then work without a network connection while that browser retains its cache. Clearing browser data removes saves and the cache. A hosting provider can still gate access to its private URL; keep the downloadable source/build for independent local use.

The source download is available in **How to Play**. The package needs no online services, API keys, fonts, CDNs, authentication SDKs, analytics, or downloaded art/audio. Ori works entirely in the local simulation.

## Build and checks

```sh
npm run check
npm test
npm run build
```

`tests/core.test.mjs` covers collision, raycasting, map reachability, line of sight, all weapon systems, rescue accounting, enemy attacks, Ori, phasing, pickups, upgrades, checkpoints, death/retry, sector gates and the Warden. Open **/qa.html**, then press **Run Gameplay Checks**, for browser-side simulation and rendering smoke checks. The normal corridor scenario uses movement, doors and combat. Progression checks position the player beside objectives and defeat the boss programmatically; they are not evidence of a human playing the campaign end to end.

See `docs/verification.md` for actual results and limitations. These checks are implementation evidence, not independent verification.

## GitHub Pages

Create a standalone repository, for example `MichaelWave-Ori-BreakTheMatrix`, upload/push this project, and choose **GitHub Actions** under Settings → Pages. The included `.github/workflows/pages.yml` checks source syntax, runs tests, builds `dist/`, and deploys it on pushes to `main`; pull requests run checks without deploying. No existing repository needs modification.

All application asset URLs, imports, manifest URLs and service-worker scope are relative. A repository subpath such as `/MichaelWave-Ori-BreakTheMatrix/` works without changing a base URL. Pages configuration is prepared; no GitHub deployment or new GitHub repository is claimed by this package.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/core.js` | Pure deterministic simulation, map definitions, DDA queries, collision, combat, AI, checkpoints and progression |
| `src/renderer.js` | Canvas raycasting, sprite occlusion, weapons, particles, automap and effects |
| `src/assets.js` | Replaceable original pixel-texture and sprite factories |
| `src/audio.js` | Web Audio sequencer and synthesized sound effects |
| `src/main.js` | Browser input, menus, HUD, save/settings persistence and service-worker registration |
| `src/style.css` | Responsive shell, menus and original retro HUD |
| `scripts/build.mjs` | Dependency-free static production build and content-hashed offline cache |
| `scripts/serve.mjs` | Local static preview; honors `--port` and `PORT` |
| `scripts/package-source.mjs` | Rebuilds the downloadable source/production ZIP with built-in Node compression |
| `tests/` and `public/qa.html` | Automated simulation and browser smoke checks |

The preferred TypeScript/Vite stack was implemented as native JavaScript ES modules with a small zero-dependency Node builder. The custom Canvas raycaster and module boundaries are preserved. This is a local implementation choice under the brief's preferred-stack wording. No runtime integration with PhiOS, PhiCade or PixelForge has been claimed; the replaceable modules are ready for later adapters.

## Future work

The colossal, shifting **Demiurge itself** is an eventual antagonist in the brief. This candidate ends with the playable **Warden** encounter and collapse of the local control lattice. A separate Demiurge fight, larger maps, richer directional/attack sprite sets, spoken dialogue, expanded weapon upgrade trees, rebinding controls, and mature mobile/gamepad support remain future work. No multiplayer or paid AI API is included.

## License

Code, artwork factories, maps, dialogue and audio compositions are original for this project and released under the included MIT license. DOOM and Wolfenstein are historical inspirations only; no sprites, maps, textures, samples or music from those games are used.
