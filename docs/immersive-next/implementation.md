# Immersive Next — 0.5.0-rc.1 candidate

Implementation authority: the attached **BTM: IMMERSIVE VR NEXT** brief, recorded in [controlling-brief.md](controlling-brief.md) with only CRLF → LF normalization. Original attachment SHA-256: `023e3a4242fdd6ed400a2b597aa9f11ea97d6d21a40719519c15fbaf8413ce3d`; repository copy SHA-256: `478b63f498ce8a602a9d9afe25f1db24cb33d8d66f7231f2d2dcf273f31c2cdc`. Normative text is unchanged. Baseline is latest `main` at `6e1a41b13e04bc3910d72d2eab1abdd015150ee1` (hosted CODE BROWN). Explicit user authority covers implementation, regression checks, a feature branch and a reviewable PR; merge and public release remain Michael's decisions.

This is a coherent first upgrade, as permitted by section 12 of the brief. It is not completion of every requested enhancement. No runtime dependencies or downloaded art were added. All new materials, glove geometry, holographic ornament and terminal art are original procedural MIT work bundled in source.

## Requirement / build register

| ID | Brief scope | Candidate implementation | Evidence / remaining boundary |
| --- | --- | --- | --- |
| NEXT-01 | Inspect and extend current systems | Reuses the WebGL atlas, static chunks, dynamic batch, XR lifecycle and authoritative simulation | Baseline commit and `preservation.json`; original 178 tests retained |
| NEXT-02 | Neon spatial environments / sector identities | Twelve palettes; panelled walls, gridded floors, emissive ceiling art, wall lights, original terminal screens, animated scan bars, subtle reactive accent gain and sector fog | Actual production WebGL, 12 sectors × 3 presets; original collisions unchanged |
| NEXT-03 | Tracked hands and six weapons | Left/right low-poly gloves track independent grip poses; safe right grip uses existing reach/wall clamp; six existing meshes have dark bodies and signal rails; emitter and flash align to safe tracked muzzle; existing recoil/charge effects retained | Aim/grip/muzzle regressions; six-weapon mechanics tests; physical fit remains pending |
| NEXT-04 | In-world controls | Larger 0.48m wrist instrument, vital meters, hover outline, discovered objective map marks, world pointer laser, blank/locked panel capture and neutral-input rearming | Browser Canvas/ray tests; no firing, charged release, stick movement, turn or ability input leaks while captured |
| NEXT-05 | Ori | Smoothed visual core, two spatial ring planes, restrained bob, assist/scan response, player/objective/threat attention and amber warnings; assist beams originate at displayed Ori | Presentation snapshot tests; existing gameplay timing/dialogue/positional audio retained |
| NEXT-06 | Combat feedback | Correct muzzle flash height, capped projectile trails, interaction focus respecting reach/ray/locks/hidden walls, Warden crown and incoming-attack rings | Production scene tests and browser captures; no camera shake or simulation balance changes |
| NEXT-07 | Comfort | Existing seated/standing, collision, recenter, head/controller movement and snap choices retained; saved smooth-turn speed and vignette-strength controls added | Sanitization, snap invariance, physical-head sweep and UI regressions |
| NEXT-08 | Entry staging area | Deferred | Existing immersive title/pause flow preserved; stage after headset input/readability acceptance |
| NEXT-09 | Quest optimization | Existing shared atlas/static batches; fog-distance AABB rejection before frustum drawing; 12/28/48 fixture caps; 8/12/16 ring segments; 24/48/96 particles; bounded trail/effect buffers; reused line scratch vertices | Browser draw/triangle/batch counts, resource deletion, Node stress checks; actual 72 FPS/thermal acceptance pending |
| NEXT-10 | Preserve original game | Simulation, map definitions, AI, six weapon costs/damage, dialogue, sound, v1 checkpoints, CODE BROWN/ΦWAD, Classic/Xbox/Arcade remain authoritative | Byte hashes, full original tests and Classic/tracked twelve-sector traversals |
| NEXT-11 | Verification | Seven requested commands plus an optional genuine Chromium/Canvas/WebGL/offline verifier | See `verification.md`, receipts and physical checklist |
| NEXT-12 | Delivery | Feature branch, reviewable PR, source/tests/docs/captures and bounded follow-up phases | Human review; no automatic merge |

## Architecture and performance decisions

`neon-signal.js` owns immutable palettes, budgets, deterministic wall-fixture derivation and original material painting. `signal-presentation.js` adds presentation geometry to the existing `VertexBatch`. It has no authority to change enemies, objectives, damage, resources or saved state. The original billboard enemy art remains; volumetric replacements are deferred. Lighting is bright atlas art and batched geometry with cheap colored floor decals, not dynamic shadow maps, bloom or a light accumulation pass.

Fixture derivation occurs only on level replacement. Geometry and the single 1024² atlas upload on level changes, as before. Animated fixtures, hands, rings, effects and projectiles share one dynamic world buffer/draw per eye. The quality setting changes detail/distance immediately; framebuffer scales remain 0.65/0.85/1.0 at next XR entry. Line construction now writes directly into reusable scratch vertices. Other bounded per-frame arrays remain; there is no claim of zero allocation or measured absence of GC spikes.

Wrist hit testing uses the current tracked transforms before virtual locomotion/turning. The entire visible panel captures input, including whitespace and locked controls. Capture cancels buffered primary/alternate shots and abilities; leaving while holding a gameplay control keeps the latch until neutral. Physical head motion still uses collision. The simulation and live enemies continue while using the wrist; use Pause for a safe break.

Gloves use WebXR grip transforms; the existing weapon/ballistic transform retains the preferred pointing ray along local −Z, as described by the [WebXR input-source model](https://www.w3.org/TR/webxr/#xrinputsource-interface). The shared safe muzzle remains the combat origin. Hardware profile offsets, hand scale and wall clipping are explicitly pending human headset checks.

## Scope / deviation receipt

The user's brief explicitly permits a coherent tested first upgrade when the full scope exceeds a single implementation window. This candidate takes that route without changing the simulation or adding an engine. No ammunition/reload system, teleport, direct hand tracking, mandatory direct touch, new dialogue, new audio synth/asset bank, new mission gates or staging scene is introduced.

Optional direct touch was investigated against the existing right-ray/left-grip architecture: Touch grip data alone does not supply an index fingertip, and using triggerless proximity would add accidental-activation and tracking-loss cases. It is deferred until the point interface has physical acceptance. Teleport requires a separate navigability/encounter gate proof. The immersive staging area should reuse the current title/mission adapters after the core has passed the manual checklist. GPU timer extensions and adaptive frame resolution also remain follow-up work; CPU submission time is not GPU/compositor FPS.

Rollback is the PR's source diff against the baseline. New settings are optional fields on the existing settings key and are ignored by older builds; v1 campaign save schema and keys are unchanged. The package candidate version does not rewrite historical save release tags.

## Next phases

1. Run [Quest 3 acceptance](quest3-acceptance.md), preserve failures and tune brightness, glove offsets, panel distance and budgets against actual 72 Hz compositor results.
2. Use those findings for deeper holographic briefing/pause layouts, hand-menu placement, directional companion audio polish, and optional direct touch.
3. Investigate the Neon Signal staging area and collision/gate-constrained teleport as separately tested follow-up PRs. Preserve the original mission-loading flow and progression in both.

The candidate was built and exercised by the same authoring agent using the Forge and Wayne workflows. It has no independent reviewer, physical hardware or release-certification claim. Detailed verification is separate from implementation status; Michael owns merge and release.
