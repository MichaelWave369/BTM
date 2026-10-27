# Implementation choices and evidence boundaries

- Reconstruction replaces the lost local candidate, not the published baseline. It is newly tested and not claimed byte-identical to the unavailable previous ZIP.
- Shared collision/navigation functions were extracted verbatim to `collision.js` and re-exported by `core.js`, avoiding a circular import. Map/weapon definitions and prior tests remain unchanged.
- Existing sprites represent enemies, Ori, props and collectibles as depth-tested billboards; six small owned meshes represent tracked weapons. This is allowed by the brief. Floors/ceilings/walls/doors/pillars have true geometry.
- Decorative props retain their original nonblocking collision behavior; structural solids use the shared grid. Inventing new prop collision would alter preserved Classic gameplay.
- The same damage/cost/cooldown rules handle tracked combat. A post-movement pose hook keeps enemy/projectile logic and firing aligned to the current accepted head position. No separate VR AI is used.
- Quality detail changes immediately; XR framebuffer scale applies at session entry. The UI states that a new session is needed after changing render scale.
- Software GLES is an explicit verification fallback for missing cloud-browser WebGL. It does not establish actual browser GL calls, a real XR session, Quest rendering, haptics/audio, comfort or frame rate.
- No matching GitHub game repository was identified in repository searches. The code is backed up to an isolated branch of the existing Site source repository. No PR in an unrelated repository and no public deployment/merge occurred.
- No new current-run test failure was suppressed or removed. Known issues from the interrupted historical run (dodge reference and muzzle epsilon) informed explicit regressions; unavailable old logs are not fabricated here.

Hardware acceptance remains pending as permitted by the controlling scope. Public v0.3.0 and its main source commit remain recoverable.
