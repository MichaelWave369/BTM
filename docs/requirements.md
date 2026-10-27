# v0.3.0 acceptance register

| ID | User requirement / preserved contract | Implementation | Verification |
| --- | --- | --- | --- |
| NVR-01 | Six more progressively very difficult levels | Six authored 29x25 layouts, 20/23/26/29/32/36 enemies; rising HP, damage, speed, shot speed and cadence | Structural/pressure regressions; full Node/Chrome traversal; human balance open |
| NVR-02 | Challenge circle strafing | New-level-only leading fire, repositioning, fan volleys and weapon-stun resistance; Ori retained | Targeted AI assertions; actual new-map combat |
| NVR-03 | Campaign progression | Twelve levels, endings every three sectors, new continuations and sector-seven shortcut | All acts traversed; save/transition tests |
| NVR-04 | VR layer for Quest 3 / compatible browser | Native immersive-vr WebXR, head-tracked virtual arcade screen, separate eye views, Touch mapping, ray/selection menus, HUD, utility toolbar, recenter/exit, saved size/distance | 20 simulated XR checks pass; exact shaders/vertices/software GLES pass; real browser presentation and Quest hardware unable to verify |
| NVR-05 | Preserve original game | First six maps, six weapons, Ori, v1 save key/format, Xbox/keyboard/mouse and original tests | 128 tests pass; original 41 and Xbox tests unchanged; first-six traversal metrics retained |
| NVR-06 | Offline / no paid external runtime | New modules cached locally; native JS/WebGL/WebXR; generated ZIP | 18-resource worker logic and 41 build references pass |
| NVR-07 | Playable updated delivery and honest evidence | Same public Site; rebuilt source/build ZIP and detailed limits | Packaging/deployment receipt; `v0.3.0/verification.md` |

Authority: [current accepted scope](v0.3.0/authority.md). Historical acceptance registers remain in v0.2.1/v0.2.0/v0.1.0.
