# BTM BBS LAN CLAN · in-game lobby + Enter the Field public node

## Status boundary

This repository adds an **in-page** multiplayer scene and a portable self-host package. It **does not deploy a public WebSocket server**, claim the hostname is reachable, alter Netlify projects, or update DNS. Do not describe `wss://play.enterthefield.org/ws` as live until a real connection handshake and two-client match have passed.

Netlify is an excellent **static frontend** for `www.enterthefield.org`, but its Functions/Edge runtimes do not act as this project's persistent in-memory Node/WebSocket match server. Netlify's HTTP proxy rewrites also cannot be assumed to carry WebSocket upgrades. We therefore use an **external, supervised WSS host** on a dedicated subdomain, while the public site stays on Netlify.

## Experience

- Open BTM's **BBS LAN CLAN** button to display a large in-game overlay. The browser address does not change.
- The BBS lobby and authoritative game remain on the existing same-origin `bbs.html` entrypoint inside an iframe. A second live multiplayer document is deliberately used so its socket, XR, controls and audio are isolated from the paused solo game.
- **RETURN TO GAME** unloads the iframe, closes its live connection, and restores the same BTM document. Returning to a paused solo run does not auto-resume firing/movement.
- **SOLO BOT ARENA** also uses the embedded BBS document with its original offline-bots flag, no external server.
- The existing standalone `bbs.html` URL is retained as a fallback for diagnostics and older bookmarks.
- On Quest, switching between solo immersive XR and embedded multiplayer requires exiting the old XR session and entering the new one; browser permission support must be validated in a physical headset.

## Deploy an actual Internet node (separate from Netlify)

Prerequisites: a maintained Linux VPS/container host with a public IP, Docker Engine and Compose, ports 80/443 reachable, a domain name under your control, adequate RAM/CPU/network, and a plan for backups/monitoring. The VPS is not provisioned by this PR.

1. At your DNS authority, add **A** (and AAAA if supported) records for `play.enterthefield.org` pointing to the dedicated server's public address. Do not alter existing Netlify `www`/apex records.
2. Clone/pull the BTM repository on that host. Configure firewall to permit inbound TCP 80 and 443, **not** public 8787.
3. From the repo root, run:
   ```sh
   docker compose -f deploy/bbs/compose.yaml up -d --build
   ```
   The `btm` service builds the existing app, installs only the pinned `ws` dependency and listens privately on port 8787. Caddy obtains a trusted TLS certificate and exposes **only** `/ws` and `/status`.
4. Confirm `https://play.enterthefield.org/status` returns the real BTM service name and protocol. In the BBS panel, connect to `wss://play.enterthefield.org/ws`.
5. Open **two independent browser profiles/devices**, create a room, join with its private code, Ready both, and play. Verify reconnect, packet loss and host restarts. Test Quest 3 explicitly before claiming headset acceptance.
6. Back up the named Docker volume `btm-saves` as part of normal hosting operations. That volume stores private co-op checkpoint JSON. Treat exported personal reconnect passes as secrets and never commit them.

A Docker deployment is portable to any comparable host. A VPS is not free by definition; choose a plan/region that fits actual player load. The service defaults to 32 rooms / 128 sockets, not a measured guarantee of capacity under public traffic. Add uptime alerts, bandwidth limits, firewall rules, controlled updates, backups and abuse monitoring before open promotion.

## Netlify frontend and URL plan

Current Netlify site: `https://www.enterthefield.org/`.

Two safe front-door choices:
- For **immediate progress without a Netlify deploy**: keep the BTM game at `https://michaelwave369.github.io/BTM/`. Its in-game BBS connects over WSS directly to `play.enterthefield.org` after the backend comes online.
- For a later **single-domain frontend**: add the BTM static `dist/` files under a namespaced path like `https://www.enterthefield.org/games/btm/` within the existing site's build, then link to that route in the site's PixelForge/games area. This is a deliberate separate Netlify release and should not overwrite the existing website. Because BTM assets are relative, retain the full BTM `dist/` tree together under that path. The same WSS backend still lives on `play.enterthefield.org`.

The default client suggests `wss://play.enterthefield.org/ws` when served from the Enter the Field domain or the MichaelWave369 GitHub Pages origin; the player can still override and save a trusted LAN/custom WSS URL. A suggested address is **not** proof the server is running.

## Safety / security boundaries

- The server checks the browser's exact `Origin`. Container boot allows only the explicitly configured production and GitHub Pages origins; extend deliberately if moving the frontend to another URL.
- Keep the private port private. Caddy must preserve WebSocket Upgrade (it handles it automatically) and use valid TLS.
- Client requests are intents only; room state, kills, ammunition, movement, and co-op saves stay server-authoritative.
- Existing solo/Pit saves are not sent to the BBS server. The embedded page retains the BBS private-pass lifecycle and its explicit resume semantics.
- In-page lobby integration does **not** imply continuous XR gameplay across mode switches or 24/7 availability before hosting.
