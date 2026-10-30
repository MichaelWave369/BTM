---
name: btm-router
description: Entry skill for scoped BTM development. Detect native WebXR raycasting architecture, route only relevant tasks, enforce preservation and evidence rules.
---

# BTM skills: project authority

Read `AGENTS.md` first. Route with `node scripts/route-agent-skills.mjs --task "..."`; never load all skills automatically. Engine identity: offline-first JavaScript, Canvas classic renderer, bespoke WebGL immersive world and native WebXR. Do not apply Godot/Unity/Unreal/Three.js or external asset import APIs to this codebase. Generic upstream skills describe design principles only.

## Architecture & preservation
- Core simulation, campaign and saves are BTM's authority. Retain twelve sectors, six weapons, Ori, objectives and boss gates.
- Preserve Classic, Xbox, VR Arcade, Immersive VR, hosted ΦWAD and offline functionality independently.
- Own XR lifecycle in BTM (`src/main.js`, immersive modules). Gen.E.Wrist is a consumer snapshot, not a gameplay engine.
- Start by reading the relevant `src/` implementation, tests, and existing docs. Do not trust old controls tables over executable code and recent field-retest docs.
- Never turn task prose into arbitrary shell execution. Do not fetch/install skill updates at runtime.

## Required evidence
- For coding changes: `npm run check`, `npm test`, `npm run playtest`, `npm run playtest:immersive`, `npm run build`, offline validation; browser equipment/legacy suites when available.
- Distinguish automated simulated stereo/Quest checks from **physical Quest 3** testing, which is still pending where indicated.
- State regressions, measured results, and the remaining hardware checklist. No fabricated screenshots, FPS or headset acceptance.
- Open a reviewable PR; do not merge to main without the owner's instruction.

## Source precedence
BTM code and tests > current BTM field-retest docs > BTM-owned skills > pinned upstream discipline/genre references. This order prevents a generic FPS template from overriding existing gameplay or comfort behavior.
