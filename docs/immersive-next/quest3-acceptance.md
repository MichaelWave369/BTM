# Immersive Next / Quest 3 acceptance — pending

This checklist extends [the original complete checklist](../v0.4.0/quest3-acceptance.md). All original checks still apply, including every campaign sector, six weapons, CODE BROWN/ΦWAD, desktop/Arcade return, interruptions, saves and offline behavior. No physical Quest or Touch acceptance has been performed for this candidate.

Use a secure HTTPS test origin for this branch's built `dist/`. Record date, Quest OS, Browser version, controller profile, seated/standing posture and quality. Retain the first failed checkpoint/settings/capture before repair. Do not merge or replace public production merely to run a test.

| Added check | Acceptance | Status |
| --- | --- | --- |
| Stereo / neon depth | Both eyes show spatial floor, ceiling, panels, doors and wall terminals; no duplicate eye, cracks or missing chunks at fog cutoff | Pending |
| Palette / brightness | All 12 sectors remain navigable; signs, enemies, lock colors and important controls stay legible; no objectionable glare | Pending |
| Hands / weapons | Both gloves follow grip motion at natural scale, including twist; all 6 weapons aim through safe muzzle; flash and recoil stay weapon-local | Pending |
| Hand / wall collision | Lean/crouch with gun and gloves at corners, locked doors, floor and ceiling; no through-wall shots or unsafe hand reach | Pending |
| Point at world objects | Highlight agrees with right-grip use for captive, relay, archive, locked/unlocked door and extraction; hidden walls remain hidden before vision | Pending |
| Wrist capture | Point at blank/locked/action panel regions with both sticks/triggers/grips held; no unintended movement, snap turn, shot, alternate release, weapon cycle or ability | Pending |
| Neutral rearm | Move pointer away while trigger/stick stays held; nothing resumes until controls return to neutral; next deliberate press works once | Pending |
| Wrist pointer / tracking | Laser endpoint and hover outline agree with selected button; lowering/removing the left controller removes the panel; no stale targets | Pending |
| Wrist readability | 0.48m panel, vitals, objective, all weapons, discovered map marks and utilities are usable at comfortable arm distance in both postures | Pending |
| Menus / transitions | Pause/resume, settings, death/retry, CODE BROWN and calibration have no held-input leak or duplicate simulation clock | Pending |
| Comfort sliders | Smooth-turn speed changes only smooth turning; 15/30/45° snap stays exact; vignette .2–1 is adjustable with an independent toggle | Pending |
| Ori | Core/rings follow smoothly, stay outside weapon lane, react to assist/scan/threats and match positional assistance sounds; captions remain comfortable | Pending |
| Combat / Warden | Trails, attack rings and crown communicate threats without hiding targets, excessive flashing or artificial headset shake | Pending |
| Reduced motion | Decorative bob, terminal sweep and pulsing steady; gameplay, scan timing and threat information remain intact | Pending |
| Three quality presets | Count/detail changes immediately, next-session resolution changes as documented; no geometry holes, buffer overflow or unstable cadence | Pending |
| XR repetition | Enter/exit both modes 10+ times, including denied entry, visibility loss and tracking reset; no accumulating GPU resources or stale input | Pending |
| Sustained Quest performance | Measure 15+ minutes including sector 12/Wardens, peak effects and all presets; target ≥72 FPS with dropped-frame, GPU/CPU, thermal and battery notes | Pending |
| HTTPS offline | Wait for OFFLINE READY; disconnect, reopen, continue old checkpoint and load cached CODE BROWN; no remote runtime asset requests | Pending |

CPU submission milliseconds and world draw counts are diagnostics, not a headset FPS measurement. Human comfort, haptic feel, audio direction and performance acceptance remain open until tested on real supported hardware.
