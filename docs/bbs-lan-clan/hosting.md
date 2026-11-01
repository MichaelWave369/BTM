# BBS LAN CLAN — review and self-hosting

This candidate is based on `2ca035e7c5e1dd02d70628b6fafa088f0db84681` (merged PR #11). Multiplayer is an optional process. The original game still runs offline without it. GitHub Pages hosts the client; it cannot run the Node server.

## Review in a browser, without installing locally

Open [this branch in GitHub Codespaces](https://codespaces.new/MichaelWave369/BTM/tree/feat/bbs-lan-clan). Choose this repository and `feat/bbs-lan-clan` if the picker does not preselect them. The checked-in dev container installs the **server-only** locked dependency, builds the native client and starts port 8787. Open the forwarded browser URL, then choose **BBS LAN CLAN**. The server address defaults to the same forwarded host using `wss://…/ws`.

Use two separately authenticated browser profiles for two independent players. Create a room in one, join its eight-character code in the other, mark both Ready and start. Codespaces port forwarding stays **private**; another browser profile must have access to that Codespace. The owner can deliberately change forwarding visibility to share a review, subject to their GitHub account and Codespaces allowance. No Codespace or public service is created by this PR. The configuration is provided; live Codespaces provisioning and TLS forwarding were not executed in this Work environment.

After editing: stop the old server, run `npm run build`, then `node scripts/dev-network.mjs` in the Codespaces terminal. The dev helper intentionally binds to `0.0.0.0` inside the forwarded container. The ordinary server below defaults to loopback.

## Local or LAN host

Node 20+ is required (CI uses Node 22). No client installation or framework is required.

```sh
npm ci --prefix server --ignore-scripts
npm run build
npm run server
```

Open `http://127.0.0.1:8787/` or `/bbs.html`. The endpoint is `ws://127.0.0.1:8787/ws`. A second browser profile has independent storage, identity and connection. A second ordinary tab also makes a separate connection, but do not copy a private pass unless deliberately transferring the same player.

For a LAN session, the host explicitly opts in:

```sh
node server/index.mjs --host 0.0.0.0 --port 8787
```

Desktop players on that LAN open `http://HOST-LAN-IP:8787/bbs.html` and enter `ws://HOST-LAN-IP:8787/ws`. Allow the port in the host firewall only for the intended network. There is no UPnP, automatic router forwarding, discovery scan, public room directory or hosted matchmaking.

## HTTPS, WSS and Quest

An HTTPS client must use a **trusted WSS** endpoint. A Quest immersive WebXR page also needs a secure context. Plain LAN HTTP/WS is useful for desktop development, not a claim of Quest immersive support. A self-signed certificate is not automatically trusted by a headset.

Put the optional Node service behind a TLS reverse proxy you control, with a certificate trusted by each browser/headset. Preserve WebSocket upgrades, `Host` and `Origin`; configure suitable connection timeouts. For example, a Caddy site can proxy `btm.example.org` to `127.0.0.1:8787`. Configure the certificate/DNS and network exposure deliberately; this repository does not provision them.

If the client and server are hosted at different origins, allow each exact client origin:

```sh
node server/index.mjs --origin https://michaelwave369.github.io
```

Repeat `--origin` for another allowed origin. Origin entries have scheme/host/optional port, **no path**. Use a trusted `wss://YOUR-HOST/ws` in the terminal. Same-host browser origins are accepted by default; non-browser WebSocket clients are also permitted. Origin checks are not account authentication. Private room codes and private reconnect passes control session access.

Public internet hosting needs your own TLS, updates, supervision, network policy and capacity planning. This candidate does not provide accounts, persistent clans, public matchmaking, DDoS protection or a globally tested latency service. Internet/WSS routing and physical Quest performance remain field checks.

## Room and campaign rules

| Mode | Players | Authority and finish |
|---|---:|---|
| Deathmatch | 2–8 | Free for all; server frags; three-second respawn; chosen frag limit |
| Team Deathmatch | 2–8 | Alternating cyan/pink teams; friendly fire off; shared team frag limit |
| Clan Arena | 2–8 | Team elimination; no mid-round respawn; three-second intermission; chosen round-win limit |
| Co-op Story | 2–4 | One shared world, separate inventories; shared objectives and host-owned progression |

Rooms start with at least two connected Ready players. New identities join from the lobby; active sessions require an existing private pass. The owner can return competitive rooms to a fresh lobby. Co-op **Save / Suspend** pauses the shared campaign for the squad and preserves the same campaign and resumes it instead of minting a new loadout. Retry a wiped squad before suspending it.

Disconnects neutralize input immediately. Bodies and resources remain in the room; a disconnected competitive player cannot respawn or avoid a death already adjudicated. A connected teammate becomes SYSOP if needed. Joining with the valid pass reattaches the existing actor and inventory. Empty rooms expire after roughly two minutes of server time; co-op checkpoints remain on disk.

Co-op teammates cannot shoot one another. A downed player has 45 seconds before bleeding out; a living teammate uses within reach and line of sight for two uninterrupted simulation seconds to revive at 35 health. Only one reviver advances the timer. A squad wipe retries the complete stage-entry world/inventory checkpoint. A raid with fewer than two living or revivable identities offers Retry instead of leaving an impossible paired task. Active living teammates must reach extraction together; downed/dead/disconnected members can regroup at the next stage. A reconnect never refills ammunition. The finale requires at least **two connected living players** for paired tasks and escape.

There is no passive charge or reserve regeneration. Reload transfers finite reserve into charge. Every co-op energy cell contains one finite 45-unit share per stable squad identity, with partial claims preserved across reconnect/save. Different players can consume their own share of the same cell; one cannot take another's. Competitive cells instead respawn on a ten-second timer; health/armor on fifteen seconds. Weapons/cooldowns, hits, damage and pickup consumption are host-authoritative.

The six original Nightmare layouts were authored with Legacy regeneration. Their co-op Survival adaptation adds two finite entry-room energy caches per player plus one reserved armor and two reserved health pickups per player. These are collectible floor items, not automatic stage ammunition grants. Their HP inflation is divided by `sqrt(original difficulty)` before the normal party scaling. Solo Nightmare/Legacy and Pit definitions remain untouched. See the exact evidence and human-balance limits in [verification](verification.md).

## Save and resume

Only the optional host writes `server/data/CODE.json`, schema **`btm.coop/1`**, via a serialized atomic rename. Use `--save-dir /YOUR/PRIVATE/PATH` for another host directory, outside `dist`. Files are private mode `0600`; the default directory is ignored by git and excluded from source downloads. At most 128 checkpoints / 32 MiB are accepted; the host must archive/delete its own old files to free space. Individual files are capped at 2 MiB. Malformed resources, identities, geometry and progression are rejected.

Use **Save Co-op** and wait for its acknowledgement. Each player can **Export Private Pass** to retain the room code, server address and their random bearer capability. **Keep that file private.** It is not a solo save, and possession permits resuming that identity. Restore it in BBS, then choose **Resume My Signal**. Any saved squad member can reopen the campaign after a host-process restart and becomes SYSOP; the other pass reattaches its own actor. Host data and player passes are both needed for durable recovery.

The browser's existing original/Pit save keys and formats are never written by BBS. It reads existing controller/wrist comfort preferences, while BBS connection preferences use their own local key and the current pass uses tab session storage. Gen.E.Wrist travel saves the host checkpoint when applicable, exits XR, then navigates through the existing explicit confirmation flow.

## Optional dependency and reproducibility

Only `server/package.json` depends on **`ws@8.22.1`**, pinned with its registry integrity in `server/package-lock.json`. Node supplies HTTP and WebSocket clients, but not the WebSocket **server** framing/limits/heartbeat implementation needed here. Reusing this maintained, audited implementation avoids inventing an unaudited framing parser. Its optional native accelerators are unnecessary. The captured audit found one dependency and zero vulnerabilities; this is a point-in-time audit, not a future guarantee. No `ws`, Node modules or package loader is imported by the browser/solo entry points.

Run:

```sh
npm run check
npm test
npm run test:network
BTM_COOP_STAGES=24 npm run playtest:network
npm run playtest:raid
```

The campaign runner writes an **ephemeral private** completed checkpoint to `/tmp/btm-coop-completed.json`; the raid runner requires that actual completed run. Never upload that file or private passes as evidence. Browser tooling is external to the shipped game; see [verification](verification.md) and the network CI workflow.

Reference: [official Node dev-container image](https://github.com/devcontainers/images/blob/main/src/javascript-node/README.md), [WebXR secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API), [GitHub Pages hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
