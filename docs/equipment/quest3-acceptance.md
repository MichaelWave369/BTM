# Cybernetic equipment — physical Quest 3 acceptance

**All checks below are pending.** No physical Quest/Touch or human comfort validation has occurred. This extends the [PR #3 checklist](../immersive-next/quest3-acceptance.md) and [original campaign/XR checklist](../v0.4.0/quest3-acceptance.md). The new 320mm default supersedes the previous checklist's 480mm wrist width.

Serve this branch's built `dist/` over a secure HTTPS test origin. Record commit, date, Quest OS/Browser, refresh rate, Touch profile, posture, eye-height preset and quality. Keep the first failed capture/settings/checkpoint before repair. Run seated and standing; use the safe defaults before testing calibration extremes.

| Check | Acceptance / procedure | Status |
| --- | --- | --- |
| Human scale / tracking | Inspect both palms, thumbs, finger segments, cuffs and forearm transitions in all three finishes. Twist both controllers; no detached pieces, clipping, excessive claw scale or sight obstruction. | Pending |
| Six weapon grip / aim | Equip every weapon, aim/reload/charge/fire at near/far targets and inspect both eyes. Handle stays in the hand; muzzle flash, projectile and target ray agree; recoil is restrained. | Pending |
| Calibration / collision | Try ±40mm XYZ offsets, wall corners, closed/open doors, floor, ceiling, crouch and maximum reach. No through-wall origin, large hand separation or unsafe reach. Restore defaults. | Pending |
| Ordinary combat | Walk, turn, fight, lower hands and look around. Only compact hardware appears; full HUD does not open accidentally or obscure targets/direction. | Pending |
| Deliberate wrist activation | Raise/facing/gaze opens after intentional attention, with stable readable orientation. Brief attention loss does not flicker; sustained lowering closes. Near-face/out-of-range/tracking loss hides it. | Pending |
| Both-eye placement | Inspect near/far arm poses, asymmetric wrist roll, seated/standing and size/offset extremes. Whole interactive surface remains usable without uncomfortable convergence or near clipping. | Pending |
| Pointer / capture / rearm | Point at controls, locked weapons and blank space while sticks/triggers/grips are held. No movement, turn, weapon cycle, shot, charge release or ability leak on opening. Move away while held, then release; next deliberate input works exactly once. | Pending |
| Pin / manual / HUD off | Pin/unpin through hardware and panel. Manual mode requires the explicit target. Tracking loss/range/HUD visibility still wins. Hiding wrist equipment retains dialogue and pause access. | Pending |
| Information / map | Read health/armor/energy/Ori, weapons, objective/progress and utilities under bright/dark palettes. Only discovered minimap cells/objects appear; map close and pin remain reachable. | Pending |
| Comfort communication | Read Ori, Wave, archives and field alerts during walking, aiming, damage and active wrist use. No critical warning, sight or menu overlap; font size/duration controls help at all presets. | Pending |
| Ori Spatial fallback | Put Ori ahead, behind, far, near and behind a wall; force the fallback. No head turn is required to read. Long text wraps/pages without missing words. | Pending |
| Motion / brightness | Test interface motion off, existing reduced motion and .4–1.1 brightness. Important information remains visible without excessive pulse, flare or motion. | Pending |
| Settings / old saves | Load an existing v1 checkpoint/settings set, adjust equipment, reload/reenter XR and continue. Campaign/resources stay intact and preferences persist. | Pending |
| Existing modes / interruptions | Complete original mode/lifecycle tests: Classic/Xbox/Arcade, CODE BROWN/ΦWAD, death/retry, pause/settings, controller removal, visibility loss, recenter and exit. | Pending |
| Repeated sessions / cleanup | Enter/exit both VR modes at least ten times, including denied entry and tracking resets. No stale input, texture loss or accumulating GPU resources. | Pending |
| Sustained performance | Measure ≥15 minutes including sector 12/Warden, maximum effects, wrist/dialogue and all quality presets. Target ≥72 FPS; record compositor drops, GPU/CPU time, heat, battery and any spikes. World draw/CPU diagnostics alone cannot pass this. | Pending |
| HTTPS offline | Wait for OFFLINE READY, disconnect, reload, continue an old checkpoint, enter both VR modes and launch cached CODE BROWN. No remote runtime request is required. | Pending |

Record pass/fail, observer and evidence for each row. Candidate software checks support review; they do not grant hardware acceptance or merge/release authority.
