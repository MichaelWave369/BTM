# Requirements / evidence register

Authority: the reconstructed controlling scope and the prior user-approved mission recorded in the conversation; see `authority.md` and `controlling-brief.md`. Every result is author-run candidate evidence, not independent certification.

| ID | Criterion | Implementation / verification | Status |
| --- | --- | --- | --- |
| R01 | Preserve twelve maps, six weapons, Ori, progress and all prior tests | Shared core/definitions; byte comparisons and previous 128 cases | Passed locally |
| R02 | Three explicit modes; preserve Classic/Arcade | Main title controls and shared XR presenter factory; browser fallback/manual flow | Integrated; physical entry pending |
| R03 | Actual stereo geometry for all maps | Shared-map chunk meshes, atlas and dynamic scene; geometry tests and twelve-map software GLES eye images | Demonstrated in software; browser WebGL unavailable |
| R04 | Independent tracked head/hand, pitch/lean/crouch | Rig matrices, per-eye inverse poses, combatPose; math/aim/crouch regressions | Simulated; hardware pending |
| R05 | No wall/locked-door/physical/muzzle bypass | Same swept collision, bounded menu proxy, safe muzzle ray | Local wall/door/occlusion/discontinuity tests passed |
| R06 | Comfort locomotion and calibration | Sanitized/persisted turn/reference/speed/height/posture/vignette/quality settings | Browser persistence/math passed; human comfort pending |
| R07 | Six weapons, charge, feedback and costs | Common weapon logic, tracked rays/pulses, meshes/FX/haptics | Cost/cooldown/charge/projectile/occlusion tests passed; haptics pending |
| R08 | World Ori, routes/secrets/dialogue/audio | Same AI/resource rules plus world/utility/caption/positional-audio rendering | Campaign/Canvas passed; spatial listening pending |
| R09 | Readable HUD/map/menu/save/retry/UI | Wrist HUD, ray targets, anchored captions, shared native menu actions | Canvas/menu/failure-recovery checks passed; headset readability pending |
| R10 | Efficient rendering/resource recovery/diagnostics | Static chunks, atlas, frustum culling, capped buffers/FX, quality scale, disposal | Local tests and GLES; Quest FPS/thermals pending |
| R11 | One simulation clock and clean handoff | One adapter update, post-movement pose, stopped desktop RAF during XR, guarded session callbacks | Synthetic lifecycle/clock tests passed |
| R12 | Compatible saves and offline/subpath use | V1 keys/format; all new modules cached; relative paths | Migration, 28-resource worker VM and 82-path build checks passed |
| R13 | Small future level-export schema | mwori.level/1.0 exporter, example and interface notes | All twelve metadata/grid equality checks passed; no external integration |
| R14 | Complete candidate/archive/evidence and preserved public release | Candidate branch backup, source/build package, receipts, manual Quest checklist | Package integrity checked separately; no deployment/merge; PR conditional |

Runtime dependencies added: **none**. Optional developer graphics verification uses installed Linux EGL/GLES/Pillow only. No requirement is silently dropped; actual browser WebGL, physical Quest acceptance, subjective controls/comfort, 72 FPS and real airplane-mode reload remain unverified.
