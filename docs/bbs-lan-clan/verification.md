# BBS LAN CLAN — candidate verification

Candidate `0.10.0-rc.1`, controlling specification [Issue #12](https://github.com/MichaelWave369/BTM/issues/12), baseline `2ca035e7c5e1dd02d70628b6fafa088f0db84681`. Read `AGENTS.md`, ran the native agent-skills router and retained Canvas/WebGL/WebXR. This is a review candidate; no merge or deployment is authorized/performed.

## Observed acceptance

| Requirement | Implementation and evidence | Status |
|---|---|---|
| P0 authoritative optional server | Single shared native world, 30 Hz fixed clock, server ammo/damage/collision/cooldowns/objectives, native WebSocket client, bounded validation | Implemented; pure and real-socket tests pass |
| Lobby, identities, reconnect | Real roster/Ready, owner start, private codes/passes, neutral input expiry, atomic disk resume | Two-browser DM and co-op restart pass |
| Two-player Deathmatch | Independent movement, weapons, damage/death, respawn, cells/reload, frags/results | [Actual two-browser report](browser-deathmatch.json) |
| Team / Clan rules | Automatic teams, friendly fire off, team score and round elimination/intermissions | [Team](browser-team.json), [Clan](browser-clan.json) actual two-browser wins |
| Arenas | Three authored native layouts with cover/spawns/supplies/hazards | Geometry tests pass; NO CARRIER and [SYSOP'S REVENGE](browser-deathmatch-sysops-revenge.json) browser passes; KILL SWITCH browser completion pending at publication |
| 2–8 competitive capacity | Eight separate real sockets and actors, movement; ninth rejected | Transport tests pass; eight-human combat/balance unverified |
| Co-op first sector | Separate inventories, one world, relays/key/captives, targeting, natural down/revive and extraction | [Two-browser proof](browser-coop.json); actual solo/Pit slots byte-preserved |
| 24-stage progression | Original 0–11 then Pit 0–11, all native objectives and four Pit bosses | [Input-only two-socket traversal](network-playthrough.json) passed all 24; latest persistence-hardening repeat may still be running at publication |
| Finale | Four pylons/waves, Fracture barrier and complementary consoles, corrupted Ori repairs, synchronized core windows, shared escape | [Two real sockets](network-raid.json) and [two real browsers](browser-raid.json) complete all phases and escape from an actual earned 24-stage checkpoint |
| Recovery fairness | Immutable entry saves, monotonic sequences/stable live actors on retry, finite per-identity claims, revive priority at nodes, retry if fewer than two viable raid identities | Targeted regression tests pass |
| Native controls / presentation | Existing keyboard, Xbox, Arcade and immersive paths; right-side Ori/peripheral comms; remote body/head/hand approximations | Original synthetic suites and equipment comparisons pass; mixed flat/tracked wire frag passes; [native stereo](browser-deathmatch.json) GL error 0, distinct eyes, no dropped batch |
| Solo/offline preservation | No browser dependency or server required; unchanged registries and solo schemas; Gen.E.Wrist/ΦWAD/CODE BROWN retained | Existing Node, campaign, immersive, Pit CLI, legacy browser/offline and equipment checks pass |
| Custom multiplayer map import | No unfinished import control exposed; existing solo ΦWAD unchanged | Deferred |
| Physical Quest 3 / real WSS / Codespaces | Configuration and explicit hosting/acceptance instructions | Not executed; [physical checklist](quest3-acceptance.md) |

Reports distinguish fixture-based unit tests from actual live network traversal. The campaign/raid planners read snapshots and send ordinary movement/fire/reload/Ori/bash/use intents. They never set live coordinates, HP, ammo, objectives, phase or completion. The 24-stage traversal used exact aim/map knowledge and finished without a squad wipe; it is not human difficulty validation. Every campaign stage used finite ammunition; the adaptation is specified in [hosting](hosting.md).

Browser evidence uses separate Chromium contexts and native WebSocket sessions, not cloned actors. A manual in-process test clock schedules the same fixed 1/30-second host ticks. During captures, read-only snapshot heartbeat delivery can continue while the test clock is frozen. Browser render callbacks are scheduled at at most 20 Hz to limit software-GPU cost; this is not a Quest performance measurement. Native software stereo uses synthetic matrices. The final raid is unnumbered and does not replace Pit trial 12.

## Commands and remaining checks

Executed: `npm run check`, `npm test`, `npm run test:network`, `npm run playtest`, `npm run playtest:immersive`, `npm run playtest:pit`, `npm run build`, `scripts/verify-network-browser.mjs` (DM/team/clan/Sysop), `scripts/verify-coop-browser.mjs`, `scripts/playthrough-network.mjs` (24), `scripts/playthrough-raid.mjs`, `scripts/verify-raid-browser.mjs`, `scripts/verify-immersive-browser.mjs`, `scripts/verify-equipment-browser.mjs`, and `scripts/verify-survival-browser.mjs`. Logs/reports are under [regressions](regressions/), with full generated comparison captures retained locally under the ignored CI artifact directory.

The user requested immediate PR preservation as the allowance approached its limit. Therefore final production `verify-build`, generated-worker verification, the existing full Pit **browser** suite, KILL SWITCH browser run and final post-hardening repeat results must be checked in CI before merge. Previous successful tests are retained without claiming they cover every subsequent line. The existing equipment workflow runs original browser/equipment/offline/Pit checks; the new network workflow runs all arena modes/maps, real two-browser co-op, 24-stage traversal and the raid. Consult actual PR checks, not this document, for CI outcome.

Additional limits: no historical hit rewind; internet latency tuning, sustained eight-player/Quest load, human 2–4 player campaign/raid balance and trusted live TLS remain unverified. No full-body tracking, public matchmaking, persistent clan backend or mandatory account service. Local pause does not stop a shared match; SYSOP can suspend the shared cooperative campaign. Host data and private passes are needed for durable resume.

## Preserved failures

[Failure records](failures/) include early frame scheduling/waypoint faults; retry actor replacement and sequence rewind; stage interaction-clock carryover; original coordinate-based Nightmare Warden objective lookup; insufficient co-op Survival support in Legacy-era layouts; a disabled reconnect control; screenshot timeouts after otherwise completed games; and the Fracture routing stall. Repairs and targeted tests retain these failures rather than relabeling them as passes. Original Nightmare HP inflation is reduced only in cooperative Survival; finite reserved cache items are added only to those cooperative layouts. Solo definitions remain unchanged.

## Review surface

[Hosting/browser review](hosting.md) · [protocol/security boundaries](protocol.md) · [physical Quest acceptance](quest3-acceptance.md). Review and hardware acceptance belong to Michael Wave. No automatic merge/deployment is requested.
