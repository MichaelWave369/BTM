# BBS LAN CLAN · The Inversion, first Crawler Beast rung (issue #38)

## What this playable prototype does

**THE INVERSION / HUNTERS VS CRAWLER BEAST** is a distinct server-hosted multiplayer playlist. It uses one of the three original BTM arenas and existing authoritative 30 Hz movement, cover and damage. It does not transform a saved campaign enemy or modify the 24-stage co-op progression.

- One **Crawler Beast** is assigned by the server to the **SYSOP/room owner** when the match starts. One to four other participants are **Hunters**. Online room capacity is 2–5 for this playlist, and 1–3 *clearly marked* server Bot Pilots may fill Hunter seats. No offline-only fake multiplayer roster.
- **Beast controls:** normal WASD/Touch/stick movement; FIRE/RT for directional short-range claws; DASH/B/Space for a collision-safe 1.3-unit lunge with a 3.5-second cooldown. Human firearms, reserves, health pickups, weapon switching, Ori/Bass abilities and normal dash are unavailable to the Beast. Crawler health scales modestly with the number of Hunters.
- **Hunter controls:** the existing original BTM weapons and controller/Quest bindings, with normal collision/LOS combat. Hunter Bot Pilots submit the same bounded simulation inputs as a regular server bot and never choose roles or inject damage.
- **Win condition:** the Beast wins by eliminating every Hunter; Hunters win by defeating the Beast or surviving the 150-second round. No respawn during the round. Losing a connected role for more than 15 seconds voids the match rather than awarding a fake victory.
- **Presentation:** Classic Canvas has a distinct original squat Crawler sprite and local claw foreground; native immersive rendering gets its own violet creature body, claws and glowing eyes. BBS lobby, roster, HUD, navigation cues and status show the asymmetric objectives and cooldowns.
- **Host authority:** clients may only send the existing validated movement/aim and action intent. They cannot send role, HP, target, teleport, time, scoring, monster or victory fields. Host-owned snapshots identify roles, winner and round clock. No new protocol privileges, cloud AI, player account, ranking or verified receipt system.

## Compatibility and testing

The campaign, Pit, ΦWAD, offline-only Bot Arena, Witness Extraction, Control Zones, Team/Clan/Deathmatch, 24-stage co-op and Final Frequency remain independent. The existing PWA shell bundles the pure Beast module, but actually hosting a Beast match requires a BBS Node server upgraded to the same code revision. No persistence or leaderboard rewards are added.

Required gates: `npm run check`, `npm test`, `npm run playtest`, `npm run playtest:immersive`, `npm run build`, authoritative LAN browser and equipment/stereo checks.

**Physical Quest 3/3S still requires a real headset test:** confirm reach comfort and left wrist placement remain unchanged; verify claw input and lunge from Touch controls; check on-headset creature readability and sight-line fairness; confirm no firearm audio/mesh from the Beast role, that the claw doesn't block menus, and that weapon aiming/turn settings remain comfortable for Hunters. Synthetic stereo is not hardware acceptance.

## Still open under issue #38

Original Repeater, Plugged and Warden Beast archetypes; richer asymmetric abilities and animation/comfort tuning; more balanced spawn points; arena variations; fuller solo/offline Beast trial with AI defenders; fair disconnect replacement; real two-client + physical Quest proof; and any authenticated online verified match receipt. Keep parent issue #38 open.
