# BBS LAN CLAN / Witness Extraction · Rung C1 (issue #36)

## First playable server-owned PvE slice

This mission is an **independent**, optional BBS LAN CLAN `extraction` room for 2–4 connected, ready human players. It reuses BTM's existing original authored first-sector facility geometry and existing PvE enemy systems. It is not a new 25th co-op campaign stage, not PvP extraction, and not a server-hosted save. Initial arena selection is fixed to NO CARRIER in the lobby protocol, while the playable facility is called **THE SIGNAL VAULT**.

- Enter the facility with finite supplies and all six weapons. Original map enemy placement, combat and doors remain active; story relays, captives and campaign artifact collection are removed **only** for this isolated mission instance.
- Recover **witness intel** at the guarded vault coordinate via normal USE and actual server-accepted position/proximity/LOS. Nothing can be acquired from a fabricated client pickup or inventory command.
- Intel has exactly one host-owned carrier. The carrier drops it at their last server-valid location when downed or disconnected; teammates can pick up the dropped intel. Reconnecting never duplicates the package.
- Return the package to the spawn-side **EXFIL** pad and hold normal USE continuously for three seconds. Only the connected, living **carrier** on that pad can complete the mission. Holding USE elsewhere, holding with a non-carrier teammate, leaving the pad, dying, or losing network input resets channel progress.
- Fixed host time gives **240 seconds**. Alarm pressure occurs every 45 seconds, with at most four alarm triggers and at most two additional original BTM enemies per alarm. No client timer or enemy-spawn authority.
- Timer expiry or full squad wipe is a failure. The SYSOP may restart up to **two** round-local retries. The next run resets custody, world, clock and supplies rather than writing a campaign checkpoint.
- No personal account, new runtime dependencies, paid services, external models, loot/economy or online leaderboard.

## Authority and compatibility

- `src/net/extraction.js` owns package state, pickup/drop, timer, hold-to-exfil and bounded snapshots. `Room.step()` alone advances the clock and awards the result.
- The existing PROTOCOL=1 message shape is preserved; clients still submit `input.use` plus bounded movement, never positions or win/score writes. `extraction` is an additive room mode. This prototype requires clients running the new code and a matching upgraded BBS Node host.
- The PWA offline shell includes the extraction code, but a **network-hosted BBS node is required**. The offline-only bot arena worker deliberately does not advertise this PvE mode.
- No campaign save file is written for extraction; established cooperative saves, deathmatch, team, clan, control zones, solo offline and the Final Frequency remain independent.
- Inventory, team damage and enemy behavior use the existing shared noncompetitive simulation. There is no client-authoritative HP or packet claiming extracted loot.
- A server running older code will not accept the new room mode. A connected BBS host must deploy this branch after merge.

## Software acceptance

Run `npm run check && npm test && npm run playtest && npm run playtest:immersive && npm run build`, plus network browser/stereo/Quest-synthetic validation. Important tests cover honest pickup, duplicate-safe custody, carrier disconnect, timer loss, gated retries, spoofed protocol fields, two-host-actor objective consensus and save isolation.

## Remaining issue #36 work

- **Two real browser/Quest clients** in an actual deployed host. Prove line-of-sight around doors, pickup/recover, 3-second held USE, drop on defeat/disconnect and server result under packet delay.
- **Real Quest 3/3S** comfort, pad visibility, wrist text, haptic/audio warnings and right-hand shooting acceptance (issue #17).
- Quest-scale warning icons, guard tuning, door readability and richer original relay/pressure stages.
- More authored maps and extraction-specific tactical tradeoffs. No PvP or authenticated online match wins in this rung.

Do not close issue #36 based only on automated CI.