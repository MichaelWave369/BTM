---
name: btm-genewrist
description: Preserve Gen.E.Wrist canonical 3/6/9 registry and explicit BTM-owned WebXR travel, save, wrist UI, confirmation and offline snapshot contracts.
---

# Gen.E.Wrist in BTM: scoped consumer integration

Read `docs/genewrist-bridge.md`, `src/genewrist-bridge.js`, `src/genewrist-ui.js`, `src/genewrist/catalog.js`, `src/genewrist/worlds.js`, and `tests/genewrist.test.mjs`.

- Canonical GenEWrist project owns shared catalog/world registry. BTM carries an **offline pinned snapshot**, not a new independent canonical source. Changes require review against upstream GenEWrist and pin documentation.
- BTM owns gameplay, wrist pointer hit-tests/capture, tracking and XR lifecycle; do not allow a shared widget to mutate combat or save data.
- Preserve 3/6/9 rings and original combat wrist controls; WORLD/Realm Atlas is an opt-in view, never a gameplay override.
- External destination must be from a verified allowlisted HTTPS registry and must require an explicit confirmation step. No auto-navigation or hidden background transfer.
- Campaign checkpoint/save where supported, XR session orderly end, and then cross-origin navigation. Custom ΦWAD progress is not saveable; show warning before exit.
- Do not claim cross-site seamless teleportation or transmit BTM health/armor/energy to another domain.
- Test known and unknown destinations, unsafe URLs, cancel/back, custom mission warning, and offline availability.
