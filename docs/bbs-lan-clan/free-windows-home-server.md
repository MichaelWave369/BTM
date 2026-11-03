# Zero-monthly-hosting-cost BBS LAN CLAN beta · Windows 11 + Starlink + Tailscale Funnel

**Goal:** Play BTM's real authoritative co-op and multiplayer over the internet **without paying a monthly server bill**, using your own Windows PC. There are no port-forwarding rules, public IP purchases, Netlify deploys or edits to `enterthefield.org`. Existing GitHub Pages BTM remains the player-facing game. This is a small-community beta, not a guaranteed 24/7 service.

## How it works

BTM GitHub Pages game ➜ in-game BBS LAN CLAN ➜ `wss://YOUR-PC.YOUR-TAILNET.ts.net/ws` ➜ Tailscale Funnel HTTPS endpoint ➜ **localhost-only** Node BTM server on your Windows PC ➜ server-owned rooms and private co-op save folder.

Players do **not** need Tailscale installed: Funnel provides a publicly reachable HTTPS/WSS endpoint. Tailscale Personal and Funnel can be free, but Funnel is subject to beta restrictions and nonconfigurable bandwidth limits. Latency and throughput must be evaluated using real players, especially on Starlink uplink. Your PC must remain on, Tailscale connected and the BTM server process running. This setup consumes PC power and existing ISP data.

**Security:** Funnel exposes the selected local web app publicly. **Anyone with the Funnel URL can connect**; the BBS room code and server message validation remain your in-game controls. Use the official Tailscale installer, keep Windows/Tailscale/Node updated, and never expose RDP, SMB, Node inspector or the `/saves` folder. Do not share private co-op pass tokens.

## First-time setup

1. Install Node.js 22 LTS or another supported LTS with npm, Git for Windows, and the official [Tailscale Windows application](https://tailscale.com/docs/install/windows). The server can run without Docker.
2. Log into your free Tailscale Personal tailnet. Ensure MagicDNS and HTTPS are enabled. Funnel setup requires your approval in the Tailscale admin console and a valid HTTPS certificate. The first Funnel command may display an approval link.
3. Open PowerShell **as your normal Windows user** and clone the repository (or open your existing up-to-date BTM checkout):
   ```powershell
   git clone https://github.com/MichaelWave369/BTM.git
   Set-Location .\BTM
   ```
   If BTM is already cloned, use `git pull --ff-only` instead of cloning again. The script below should be run from a green merged main branch; a PR branch is only for review.
4. In that PowerShell window, launch the BBS server. This installs its pinned `ws` dependency, builds the existing game assets and serves on **127.0.0.1 only**, port 8787:
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-bbs-home.ps1
   ```
   Keep this window running. Your co-op saves live outside the public `dist/` folder at `%LOCALAPPDATA%\BTM\BBS-Saves`.
5. Verify the local Node service from a second window:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:8787/status
   ```
   The JSON should contain `service: BTM BBS LAN CLAN` and a protocol version.
6. In a **separate Administrator PowerShell** window, enable public Funnel on **HTTPS 443**, forwarding to local 8787:
   ```powershell
   tailscale funnel --bg 8787
   tailscale funnel status
   ```
   The status output provides **your actual public hostname** such as `https://my-pc.my-tailnet.ts.net`. This is an example, not your real address. Funnel is public, not the tailnet-only `tailscale serve` feature.
7. Verify from an independent connection (e.g. cellular data rather than just the same home Wi-Fi):
   ```powershell
   Invoke-RestMethod https://YOUR-ACTUAL-HOSTNAME.ts.net/status
   ```
   For multiplayer, transform your actual HTTPS hostname into a WSS endpoint: `wss://YOUR-ACTUAL-HOSTNAME.ts.net/ws`. No DNS changes to Enter the Field are necessary. Never use `ws://` on an HTTPS game page.

## First public multiplayer test

1. Open [BTM GitHub Pages](https://michaelwave369.github.io/BTM/) in two separate independent browsers or devices.
2. Click **BBS LAN CLAN** to open its embedded lobby. In the **Server Address** box, replace the default `wss://play.enterthefield.org/ws` placeholder with the **actual** Funnel `wss://...ts.net/ws` address and connect. BTM remembers the last custom address.
3. Have one player create a room and share only its room code. The other joins, both Ready and Start, then verify movement, combat and co-op objectives. Test leaving/rejoining and checkpoint saves.
4. Run a genuine test across Starlink and an **outside internet connection**, then two Quest 3 headsets. Evaluate latency, relay capacity, disconnect/reconnect and input behavior. Green GitHub CI does not establish home-network performance or physical headset comfort.
5. For offline solo Bot Arena, choose the local bots mode: it does **not** need Funnel or any multiplayer server.

## Shut down safely

- Stop the BTM server by pressing **Ctrl+C** in the normal-user PowerShell console.
- **Turn off the public Funnel explicitly** so a future process cannot unexpectedly inherit the public route:
  ```powershell
  tailscale funnel --https=443 off
  tailscale funnel status
  ```
- Keep Windows from going to sleep during a session. For long-running use, consider dedicated machine power controls and automated backups, but do not expose services or alter power settings without reviewing them.
- Never forward the router port 8787 or disable your firewall; the server binds to localhost and Funnel makes an outbound connection.

## If you want `play.enterthefield.org` later

Tailscale Funnel only serves `*.ts.net` names, **not a custom domain**. For a branded `play.enterthefield.org` address, a separate option is a named **Cloudflare Tunnel** to the same local Node server, which supports WebSockets but requires a domain configured in Cloudflare. That can entail DNS migration, so leave the current Netlify/registrar setup alone unless intentionally reviewed. The public `*.ts.net` address is enough to beta-test the complete in-game experience with no DNS work.

## Recovery and expectations

- If Tailscale authentication or Funnel authorization fails, use the Tailscale admin console. Funnel is subject to fixed traffic limits; switch to paid/hosted infrastructure if real-world player load exceeds them.
- If the connection responds over HTTPS but not WSS, check the exact `/ws` endpoint, game Server Address and Tailscale status; `/status` alone is not sufficient evidence that a WebSocket match works.
- If your PC loses power, sleeps or Starlink disconnects, the game server goes offline. Private co-op saves remain on disk, but live in-memory matches stop.
- External clients should never be routed to an open Windows firewall port; verify the Node process remains bound to `127.0.0.1` only.

Useful official references: [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel), [Funnel CLI](https://tailscale.com/docs/reference/tailscale-cli/funnel), [Windows installation](https://tailscale.com/docs/install/windows), [Starlink CGNAT](https://starlink.com/ci/support/article/1192f3ef-2a17-31d9-261a-a59d215629f4).
