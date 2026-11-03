# Launch BTM BBS LAN CLAN on Railway (preferred managed host)

**Status:** Deployment-ready source configuration. A public server, paid plan, DNS records and final human Quest/Internet acceptance are **NOT** created by this pull request. Do not call the node live until both `/status` and a genuine two-browser match pass.

Railway hosts a single long-running Node/WebSocket service. The existing Netlify `www.enterthefield.org` website and GitHub Pages BTM frontend remain unchanged. Railway handles public TLS itself, so **do not deploy the separate Caddy Compose service on Railway**. That Compose setup remains an alternative for a conventional VPS.

## Connection and initial service

1. Connect the Railway account through the Railway app (or use the Railway dashboard directly). Confirm the billing plan and usage limits yourself before enabling a public service. Expect ongoing resource and network costs; free allowances are not a promise of 24/7 capacity.
2. Create a new Railway service **from GitHub**: `MichaelWave369/BTM`, branch `main`, after this host-hardening PR is merged and green. Use the repo root as the source directory.
3. Select the Dockerfile at **`deploy/bbs/Dockerfile`**. If Dockerfile autodetection does not see the nested path, set **`RAILWAY_DOCKERFILE_PATH=deploy/bbs/Dockerfile`** in the service variables/settings.
4. Set **one replica** in an appropriate U.S. region. This is a stateful, in-memory room server. Running multiple uncoordinated replicas would split rooms by instance.
5. Attach one **persistent volume mounted at `/saves`**. Set **`RAILWAY_RUN_UID=0`**, so the entrypoint can repair the root-owned volume's permissions and then drop privileges to the `node` user. Never store co-op checkpoints in the ephemeral source tree.
6. Set `BTM_ALLOWED_ORIGINS` to the comma-delimited, exact frontend origins:

   ```text
   https://michaelwave369.github.io,https://www.enterthefield.org,https://enterthefield.org,https://phi-field.com
   ```

   No asterisks, paths, browser passwords or private tokens. Include extra trusted origins only when necessary.
7. The Docker image's default command starts `server/index.mjs` at **`0.0.0.0`** and reads the platform-injected **`PORT`**. Do not override it with a hardcoded `8787`. Keep the default Docker `ENTRYPOINT`, which prepares the volume and drops privileges.
8. Set deployment health check path **`/status`**, with an appropriate startup timeout. Keep sleep/serverless mode **disabled** during active public hosting, since BTM keeps rooms in memory.
9. Generate a temporary `*.up.railway.app` public HTTPS hostname. Confirm `https://YOUR-RAILWAY-HOST/status` returns JSON including `"service":"BTM BBS LAN CLAN"`. Test a normal `wss://YOUR-RAILWAY-HOST/ws` handshake (not just the HTTP status).

## Custom domain without touching the Netlify site

10. Add **`play.enterthefield.org`** as a Railway custom domain for this one service. Railway will show the **exact CNAME and TXT** DNS records needed for domain routing and ownership verification. Copy those records to your current DNS provider **for this subdomain only**. Do not substitute an invented IP address, do not change Netlify `www` or apex records, and do not use the VPS-specific A-record instructions.
11. Once Railway verifies the domain and issues TLS, confirm `https://play.enterthefield.org/status` and `wss://play.enterthefield.org/ws`. A CNAME resolving without the requested TXT record may still return 404.
12. Open `https://michaelwave369.github.io/BTM/` in **two separate browsers or devices**. Enter **BBS LAN CLAN** inside the game; verify it preselects `wss://play.enterthefield.org/ws` unless the browser already saved another address. Connect, create a room, join with a private code, ready/start, play, reconnect, and verify a private co-op checkpoint survives a service restart. Inspect real WebSocket and game logs, not just a green health endpoint. Finally test Quest 3 twice.
13. Enable spending limits/alerts, access logs, volume backups, and rate/uptime monitoring before public promotion. Restarting a single instance can interrupt current games. Keep the `/saves` volume backed up and preserve private reconnect tokens securely.

## Acceptance gates

- `npm test`, network regression, production build and browser equipment CI pass on merged `main`.
- Public HTTP `/status` is 200 on the assigned custom domain.
- One real `wss://` session connects from the exact allowed GitHub Pages origin.
- Two distinct actual browsers create/join/ready/play; reconnect works; co-op save survives restart.
- Client browser never navigates away from BTM when entering the embedded lobby.
- Solo and Pit saves are not changed; offline bots still work without the remote host.
- Host cost, region, backup and behavior under load are understood and documented.

**Still a separate choice:** moving the BTM frontend to `www.enterthefield.org/games/btm/` requires an intentional Netlify release; it is not necessary for Internet multiplayer now.
