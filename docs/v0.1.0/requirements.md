# Requirements-to-build register

Controlling authority: supplied `Pasted text.txt`, preserved verbatim in `controlling-spec.md`. Candidate: 0.1.0. Human authority: Michael “Mikey” Hughes. No other repositories are in scope.

| ID | Brief requirement | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| FPS-01 | Standalone original browser FPS, science-fantasy story | All source; README; title/manual/ending | Browser startup and static build | Demonstrated locally |
| FPS-02 | True 2.5D raycast corridors and sprites | core castRay; renderer; assets | Raycasting tests and browser render | Demonstrated locally |
| FPS-03 | WASD/mouse, collision, animated doors | main; core movement/interact | Unit and browser corridor smoke | Demonstrated locally; native lock unverified |
| FPS-04 | Three full Stage A weapons, later expansion | Six WEAPONS, shoot, renderer, audio | Six weapon logic tests; keyboard selection | Implemented; first-sector combat demonstrated |
| FPS-05 | Original hosts, programs, varied AI | Plugged, Repeater, Enforcer, Crawler | Damage/telegraph/projectile/path/phase checks | Executed locally |
| FPS-06 | Free human hosts rather than kill them | freeHost, captive E rescue, liberation particles | No-double-count tests and combat smoke | Demonstrated locally |
| FPS-07 | Autonomous deterministic Ori | Follow, auto fire, Q scan/stun, energy, dialogue | Pure tests and normal browser Q | Demonstrated locally |
| FPS-08 | Three themed levels, keys/relays/pickups/secrets/exits | SECTORS/createLevel | Reachability all entities; mandatory route without secret | Executed locally |
| FPS-09 | Resonance Vision, secret detection, bass drop | core vision/interact/bassDrop | Unit tests and browser F | Demonstrated locally |
| FPS-10 | Warden phases and clear victory | updateEnemy/complete, boss HUD, ending | Three-phase and final gate tests | Executed locally |
| FPS-11 | HUD portrait/vitals/weapon/Ori/liberation/key/artifacts | assets portrait; index; main updateHUD | Browser title/live HUD/settings | Demonstrated locally |
| FPS-12 | Title/pause/death/retry/stats/ending | main screen state and core modes | UI pause/continue; smoke retry/progression | Executed locally; main result screens inspected by code |
| FPS-13 | Original offline procedural soundtrack/SFX | AudioEngine | Browser instantiated with no app error, mute/volume UI | Implemented; listening review unverified |
| FPS-14 | Sensitivity/volumes/resolution/CRT/reduced motion/fullscreen | settings + persisted browser state | Browser settings controls | Demonstrated locally except native fullscreen |
| FPS-15 | Saves/checkpoints | Game snapshot/restore/retry; localStorage | Round-trip/rejection tests and browser save/continue | Demonstrated locally |
| FPS-16 | Offline, relative static paths, GitHub Pages compatibility | builder, worker, manifest, workflow | Build; cache/path checks | Built; final cache activation in delivery receipt |
| FPS-17 | Modular source and replaceable art/sounds | core/render/assets/audio/main modules | Module syntax, source inspection | Implemented |
| FPS-18 | Source/build/README/assets/results/Pages config | source package, dist, docs, workflow | Archive integrity and build receipt | Packaged for delivery |
| FPS-19 | New GitHub repository if capabilities allow | No create-repository operation exposed | Tool capability inspection | Blocked; standalone package supplied |
| FPS-20 | Eventual colossal Demiurge | Candidate ending breaks its control lattice | No separate boss implementation claimed | Deferred as eventual antagonist |

## Milestones

- **A — Vertical slice:** first-sector movement, doors, three weapons, two+ enemy types, liberation, Ori, audio, secret, death and extraction gates. Complete as a working candidate with the checks above.
- **B — Campaign:** sectors two/three, six weapons, new enemies and phased Warden. Implemented and simulation-tested. Long-form combat balance remains for playtesting.
- **C — Candidate polish:** original art/audio, menus, settings, local checkpoints, offline cache, package and hosting. Implemented subject to environment limits documented in verification.

## Implementation choices and deferred scope

Preferred TypeScript/Vite changed to native JavaScript ES modules and a dependency-free builder; preferred Canvas/raycasting architecture is unchanged. All client features operate without APIs. No material external dependency was added. No multiplayer or ecosystem adapters were introduced. Larger campaign, Demiurge encounter, rebinding, deeper upgrade trees and mature touch/gamepad support are future work; their absence does not hide a stub behind a finished control.
