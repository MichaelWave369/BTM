# Pit environmental traps · Rung 5, server-owned co-op authority (issue #18)

## Why

Single-player Pit and the standalone Hazard Vault already support one electric orb, staggered double, alternating wall crossfire, warning tile, periodic arc lane and pressure pulse. The two-player co-op server previously advanced generic recurring hazards but not the staged pressure-plate and floor-trap state machines for every avatar. Network clients could therefore display inert trap artwork.

## Implemented

- `src/net/shared-pit-traps.js` advances the **existing authored trap definitions**, once per fixed 30 Hz server tick, **after** all living avatars move and before the server's real swept projectile physics.
- Shared wall-plate entry is tracked per actor ID, with one scheduled warning and one server-owned volley even if two players trigger together. The emitter retains original stage-authored muzzle orientation, target lock, one/two-shot pattern, charge-up and cooldown. A saturated or blocked muzzle consumes its shot without duplicating it.
- Every floor hazard has an independent authoritative impact path for each squad member: charge-tile and arc-lane track the active cycle per avatar; pressure pulse sends one shared countdown and checks the blast radius against every player. Real `Game.damagePlayer` applies armor, invulnerability, shield absorption and downed state.
- All six traps use the original world artwork, sounds and telegraphs. No new input packet, client damage request, physics fork, ammo rule, cosmetic network power-up or server cost.
- `packWorld` sends only bounded dynamic warning timers and pulse states (not duplicate map geometry). Both native WebGL/XR and Classic renderers already use `level.traps` and `level.floorTraps` for warnings, emitters and floor art.
- `btm.coop/1` stays the same. Save restore reconstitutes static trap geometry from **canonical Pit stage templates**, validates bounded timers/actor IDs and preserves a pending shot. Legacy valid checkpoints missing optional trap arrays safely receive the idle canonical stage traps. Original 12 sectors, 12 Pit trial definitions, competitive arenas, all player local save slots and the offline Hazard Vault are unchanged.
- Client `applyWorld` accepts older format-1 snapshots without added trap timers, but rejects unexpected IDs/invalid numeric state.

## Regression evidence required before merging

- Unit tests for same-frame two-player entry, single server-owned orb, cooldown/leave/reentry, real swept collision, shield mitigation, double/crossfire variants, per-actor floor damage and per-cycle receipts, co-op save/load/tamper resistance, dynamic snapshot parity, competitive and original mode isolation.
- GitHub `network.yml` co-op browser job now includes `scripts/verify-coop-traps-browser.mjs` after the existing natural-revive/disk-resume proof. It creates **two independent Chromium sessions**, enters BBS *inside* BTM, joins a genuine server co-op room, crosses one Pit pressure plate through WebSocket intent, verifies one server warning, two matching client countdowns and one real fired orb. It saves actual browser screenshots with no personal tokens in public artifacts.
- Required baseline: `npm run check`, `npm test`, `npm run test:network`, original/Pit/immersive playthroughs, `npm run build`, `scripts/verify-build.mjs`, offline check, browser equipment and all multiplayer jobs.

## Outstanding physical headset acceptance

GitHub Chromium/WebGL simulation is not a physical Quest 3 test. Two real Quest players should run the Pit stage 4 wall plate, stage 5 charge tile, stage 7 crossfire and arc lane, stage 8 double volley and stage 10 pressure pulse, verify matching warnings/real shield feedback/avoidance, and confirm comfort, input, network behavior and headset frame pacing.

**Issue #18:** the server-side authority and two-browser check are proposed by this PR, not yet shipped until merged and fully green. Close only when the remaining acceptance criteria are demonstrably met; physical Quest 3 confirmation may belong to the existing field-test issue #17 if explicitly handed off.
