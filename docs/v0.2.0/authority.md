# v0.2.0 — The Gameplay Upgrade

Controlling amendment: the user's explicit v0.2.0 request in this conversation, following the supplied v0.1.0 brief. Baseline source commit: `a73abd140e14b24a6c715437de67ce872d485131`. The original specification and prior verification remain preserved. No unrelated project is in scope.

Requirements: preserve the original three-sector campaign, six weapons, Ori, progression, offline play and every existing test; improve combat response, contextual companion assistance/dialogue, navigation/encounters/storytelling, expressive portrait, industrial horror atmosphere, controls/onboarding; add three increasingly challenging sectors; exercise actual traversal, combat, pickups, deaths, recovery and Warden combat; rebuild and deliver a playable update with honest verification limits.

Implementation boundary: native Canvas raycaster and local simulation retained; no paid services or external runtime dependencies. Act I retains its original Warden ending and checkpoint semantics. The ending now offers Act II's three additional sectors. This makes all six sectors playable while preserving the first campaign and its existing assertions.

Verification plan: run the original tests unchanged; add focused regression tests; drive complete maps through movement, aiming, weapons and interactions without player teleportation or artificial damage in the traversal runs; test deliberate failure/retry separately; run the same driver in the browser with rendering and ordinary UI checks. Author-run tests are not independent certification. Publishing the requested playable update is authorized; preserve the existing Site audience.

Original test hashes: `core.test.mjs`: f107bd7104d3410b59bbb7c59a275862ff0fce24c2e354b14f5667698f4aaccf; `browser-smoke.js`: a71acb493d8b6943d3a4bcee21bb107e5d447aeddfb9c86d3baa9dc25299b8ae.
