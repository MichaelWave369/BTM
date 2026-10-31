# Ori Reborn / Survival implementation

Baseline: `4ada148` (latest main after PR #7). Scope: Issue #8 P0 + P1. Native Canvas/WebGL/WebXR; no runtime package/framework/engine/CDN additions. Pit of Despair is follow-up work and has no menu entry or placeholder content in this candidate.

## Wrist geometry and interaction

`WristComputer` retains the calibrated glove/cuff hardware transform, tracking and gaze dwell. A grip-local +Y offset alone can project under a rolled real controller. The hologram now faces the viewer, derives upright orientation from the head basis, and places its **whole lower edge above the transformed glove/forearm support bounds**, with clearance. This is computed from the worn geometry rather than an arbitrary world-height increment. Existing range/face/frustum limits, right-trigger targets, capture guard and neutral rearm remain in force. Visual calibration never changes controller input or right-hand shot origins.

Pose fixtures cover 45 combinations (three heights × three pitches × five rolls, including ±180°), preserving tracked matrices and left-side projection. The renderer lab adds standing, inverted and tilted binocular views. Recenter still resets the equipment epoch/pin and rebuilds the pose.

## Communications

The default .68m × approximately .20m dock sits to the right, with its inner edge outside a central 15° lane. It checks wrist overlap, the actual aimed direction, and projected enemies/exit/near interactions. It tries lower/upper peripheral slots, then yields if blocked. The old Ori-spatial preference aliases this safe dock. Long text wraps/pages; the full retained line remains in the log even when the dock yields or expires.

`Communications` consumes the original dialogue events without changing simulation order. Captions and optional speech have separate switches; speech has independent volume, is off by default, requires a page gesture and an available local-service voice, and fails without interrupting gameplay. Queue/history are bounded; mode changes, visibility loss and mute cancel speech. A watchdog handles speech engines that never complete. No claim that Web Speech works offline or that Quest provides voices.

The wrist log pages the latest 100 dialogue/field entries in memory; the desktop manual shows the latest 30. This is session history, not a persistent archive across page reloads. A separate .46m × .075m alert dock provides critical health, boss charge, behind-you, dry-fire and dash feedback even with dialogue captions off. It also yields to aim/threat clearance. Combat and map buttons have non-overlapping pointer rectangles.

## Original procedural Ori

A cached 16cm-core Φ369 mini-drone has a Phi lens, speaker grille, three identity ticks, side pods, short aerial and subtle thrusters. Idle/scan/assist/low-health states use original procedural geometry and restrained movement. Overall envelope stays below .25m at supported scales; no borrowed ED-E mesh, texture, logo or audio.

`OriFlight` finds a right-side, head-relative visual position with minimum distance, body clearance, wall sight checks and threat/interaction/weapon avoidance. Collision-substepped smoothing never relocates visibly through a wall or through the central lane. A blocked or re-centering companion can hide while finding a valid route; no teleport is used to bypass geometry. Canonical `game.ori`, AI, stuns, hits and ability timing remain untouched. Classic retains its original sprite. Assist beams follow the visible robot only while it is safely visible.

## Finite energy and compatibility

New runs default to `energyMode: survival`: 100 current charge, 45 starting reserve, 100 charge capacity, 180 reserve capacity. Existing map energy cells hold 45 reserve units; partial pickup leaves the remainder in the world. Manual R / Xbox X / Quest X / RELOAD takes .8s and transfers only existing reserve; it blocks firing during reload. All original weapon costs and free Slap remain unchanged.

Survival grants no passive, relay or sector-transition energy, and retry restores the complete checkpoint without a bonus charge grant. Saving mid-reload records pre-transfer ammo; reload is cancelled on restore, preventing duplicate transfer. Level transition carries current charge/reserve. Original health/armor recovery is retained. Early survival enemies move 8% faster and deal 10% more damage, while readable tell timing is retained.

Snapshots stay v1 and add `energyMode` and `player.reserve`. Missing mode fields migrate to named Legacy Recharge, preserving old saves and original dodge/recharge behavior. The setting affects new runs only. ΦWAD/CODE BROWN explicitly uses Legacy mission rules, restores the preceding rule preference on exit and never overwrites the campaign checkpoint. `SECTORS` stays twelve; Nightmare, host counts, act indices and Gen.E.Wrist catalog/handoff are unchanged.

## Dash Bash / shield

Survival's existing dodge action uses a narrow frontal arc and the actual swept travel (maximum one tile). It hits one nearest target in range and line of sight, stops before contact, and applies bounded damage/stun/knockback. Enforcers resist; Wardens resist further. Walls and doors still use the canonical collision substeps. No frontal hit grants a .30s shield with an **18 damage total** budget; subsequent damage penetrates after that budget is spent. The 1.7s cooldown prevents repeated activation. Tracked aim/body yaw and wrist input capture remain separate. Legacy keeps its old dodge for saved-run compatibility.

## Tooling / evidence

Ran the repository router for Quest/comfort/performance and shooter/combat tasks; used the returned native-project skills. Added focused Node/browser regressions and real renderer captures. The source ZIP now includes AGENTS.md and the pinned .agents skills so the existing router works in downloaded source as well. No external runtime assets were added. Physical acceptance remains explicitly pending.
