# Controller patch authority — v0.2.1

The current user asks to make the existing Michael Wave & Ori browser game work with an Xbox Bluetooth controller. This authorizes a bounded input/UI patch on the existing Site, preserving its public audience, campaign, weapons, progression, saves, offline behavior and all prior tests. Baseline: v0.2.0 commit `2f9f6cbc7de306b036158550a1280bab0b68c18e`.

Scope: native standard Gamepad API input, Xbox button labels, analog controls, menu operation, setup/status/settings, safe pause/reconnect behavior, optional vibration, regression verification, rebuild and same-Site publication. No external runtime dependencies, paid services or new game systems. Pairing is owned by the user's OS. Nonstandard controller layouts are reported as unsupported; the game does not guess mappings.

Patch version 0.2.1 is a local release-number choice. The save format/key remain v1. Author-run tests are evidence, not independent certification. Physical Xbox/Bluetooth/vibration verification remains the user's hardware trial.
