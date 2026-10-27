# Reconstruct v0.4.0 immersive world candidate

Add a native stereoscopic 6DoF world over all twelve shared maps while preserving the existing Classic game, VR Arcade, six weapons, Ori, progression, Xbox and v1 checkpoints. Head pose is independent of body/weapon aim; tracked rays and height-aware projectiles use the same costs/damage/cooldowns. Shared swept collision protects head/muzzle movement and locked doors. Wrist UI, captions, comfort settings, positional audio, optional haptics and lifecycle recovery complete the candidate.

Validation: 162 Node tests (128 prior cases unchanged), 36 Chrome immersive/Canvas checks, 27 Xbox/DOM checks, 10 original smoke and 20 Arcade XR logic checks; twelve-sector Classic/tracked traversal and live enemy death/retry in Node and Chrome; 28 worker resources and 82 repository-subpath references. Exact world/comfort/Arcade shaders and actual twelve-map stereo meshes/atlases render on software Mesa GLES.

Limits: actual browser WebGL is unavailable here. Physical Quest/Touch presentation, haptics/audio, comfort, long-session stability and 72 FPS remain pending. This reconstructs the lost candidate and supplies fresh evidence. Do not auto-merge or deploy; public v0.3.0 remains unchanged. See verification.md and quest3-acceptance.md.

No matching GitHub game repository was identified, so no PR was opened. The isolated source branch and this description are ready for a matching-repository handoff.
