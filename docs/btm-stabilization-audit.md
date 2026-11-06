# Break the Matrix stabilization audit

Audit date **November 5, 2026**. The live `main` baseline is [`66d7686dcd7e4ca2798e5c8e5e3a9bbd37cd3dd6`](https://github.com/MichaelWave369/BTM/commit/66d7686dcd7e4ca2798e5c8e5e3a9bbd37cd3dd6). The [Pages deployment](https://github.com/MichaelWave369/BTM/actions/runs/41790993771) succeeded and the live worker matched the worker rebuilt from that commit byte for byte. Release readiness is **pending**. Physical headset acceptance, a working public WSS path, and late solo Survival evidence are open gates.

## Open issues and acceptance

The live GitHub search returned exactly these 11 open issues. Baseline status describes `main`. A fix in review describes a candidate branch.

| Issue | Baseline classification | Evidence on `main` | Candidate status and acceptance |
| --- | --- | --- | --- |
| [#8](https://github.com/MichaelWave369/BTM/issues/8) Quest/Pit mission | Reproducibly broken in part | Finite charge/reserve, pickups, shield/Bash and standalone Pit are present. Standard Classic/tracked drivers clear 12 original sectors and 12 Pit trials. The original full solo Survival drivers exhaust retries in Sector 10. A different input strategy clears Sector 10 and exhausts retries in Sector 11 in both modes. | Wrist and aim fixes await review. Qualify late solo Survival using recorded input, plus real Quest wrist, Ori, captions and combat. |
| [#12](https://github.com/MichaelWave369/BTM/issues/12) BBS LAN CLAN | Partially implemented | Two, three and four independent local WebSocket clients completed 24 shared stages. Two clients earned and escaped the four-phase raid. Chromium reproduced latched Use and double-handled resume. The configured public WSS path returned HTTP 503 in this environment. | [PR #71](https://github.com/MichaelWave369/BTM/pull/71) awaits review. Public WSS and two-device play are externally blocked until a trusted host can be reached. Verify joins, reconnect resources, revive, save/resume and paired raid objectives. |
| [#16](https://github.com/MichaelWave369/BTM/issues/16) Left wrist | Reproducibly broken | The button-era panel follows the tracked left wrist with a cosmetic glove transform and no tethers. The new Touch fixture reproduces hover stopping locomotion and right-stick turn with an open panel and no pointer target. | [PR #68](https://github.com/MichaelWave369/BTM/pull/68) awaits review and headset testing. Seated and standing, keep walking from hover through close. Confirm a fresh trigger press is required to shoot, then test Pause and tracking recovery. |
| [#17](https://github.com/MichaelWave369/BTM/issues/17) Aim, Ori and captions | Reproducibly broken in part | Ori/right captions are already docked with collision and overlap checks. Tracked beams diverged from the diagnostic ray for spread hits, Slap used a firearm muzzle and BBS encoded the pre-move muzzle. | [PR #69](https://github.com/MichaelWave369/BTM/pull/69) awaits review and headset testing. Compare barrel, guide, shot and damage across three distances and both eyes. Recheck Ori sightline and long/critical captions under combat. |
| [#18](https://github.com/MichaelWave369/BTM/issues/18) Pit traps | Implemented but unverified on headset | [#56](https://github.com/MichaelWave369/BTM/pull/56) adds one server-owned trap update for both avatars, synchronized warnings, orb collision, shield/damage and checkpoint recovery. Solo Pit and Hazard Vault share the authored trap types. | Awaiting headset testing. Both players cross a stage 4 plate together, then exercise charge tile, crossfire/arc lane, double volley and pressure pulse at stages 5, 7, 8 and 10. Record warning timing, visible clearance and shield/hit results. |
| [#19](https://github.com/MichaelWave369/BTM/issues/19) Stackyard | Partially implemented | [#65](https://github.com/MichaelWave369/BTM/pull/65) supplies deck, ramp, jump, vertical collision and LOS. [#67](https://github.com/MichaelWave369/BTM/pull/67) gives server bots ramp ascent/descent and cross-floor sight. Touch stick click is wired to Pause on `main`, leaving the documented Quest jump shortcut unavailable. | [PR #71](https://github.com/MichaelWave369/BTM/pull/71) adds Fieldlink Jump. Two-headset testing covers ramp/fall/respawn, slab occlusion and exposed-edge shots. Other vertical arenas and story/Pit floors are deferred. |
| [#20](https://github.com/MichaelWave369/BTM/issues/20) Materials roadmap | Implemented but unverified on headset | [#66](https://github.com/MichaelWave369/BTM/pull/66) adds matched-pose production stereo captures. A fresh Chromium run produced six distinct images and a comparison sheet. | Awaiting field contrast and sustained pacing. Exercise doors, interactables, moving enemies, hazards and warnings across dark and bright rooms. |
| [#23](https://github.com/MichaelWave369/BTM/issues/23) Three authored families | Implemented but unverified on headset | [#55](https://github.com/MichaelWave369/BTM/pull/55) supplies Cyberpunk, Horror and Corporate. All eight authored textures per family loaded in the six-style production capture. The cyan door was identifiable in each view. | Awaiting headset contrast. Test moving hazards and enemies against the busier Cyberpunk/Horror detail and pickups against the bright Corporate floor. |
| [#24](https://github.com/MichaelWave369/BTM/issues/24) Offline HD and pacing | Implemented but unverified on headset | [#57](https://github.com/MichaelWave369/BTM/pull/57) pins eight same-origin tiles per selected enhanced family. Generated-worker tests cover versioning, failure cleanup, isolation, offline reads and removal. | Awaiting a real offline restart, removal/eviction, pack switching and sustained device timings. Log the headset and metric source against the 72 FPS target. |
| [#31](https://github.com/MichaelWave369/BTM/issues/31) Human Ledger | Reproducibly broken in part | 48 recovered records, 3/6/9 dossiers, four linked cases and investigations, recovered-only search/filter and explicit export are on `main`. Two Ledger instances can overwrite progress in the same storage snapshot. | [PR #70](https://github.com/MichaelWave369/BTM/pull/70) awaits review. Verify distinct records and solved investigations survive overlapping writes and reload. Check wrist filter legibility, longer entries and spoiler-safe export on Quest. |
| [#38](https://github.com/MichaelWave369/BTM/issues/38) Living Arcade | Partially implemented | Server-owned Bot Pilots, offline bot arena, Trophy Room and both stationary and moving Calibration Vault drills are present. Crawler, Repeater, Plugged and Warden have host-owned rules and transport coverage. | Awaiting real two-device matches and Beast tuning. Defer standalone offline Beast, hidden Gallery targets and signed multiplayer Trophy receipts to separate scoped work. |

## Repository and CI reconciliation

- `src/core.js`, `src/pit.js` and `src/campaign-storage.js` own game rules and independent checkpoints. Canvas Classic/VR Arcade, native WebGL/WebXR and the pinned Gen.E.Wrist consumer share this authority. `src/net/simulation.js` and `server/index.mjs` own optional host-side play. `src/net/offline-bots-worker.js` runs the same arena simulation in the local worker.
- Followed `AGENTS.md` and ran `node scripts/route-agent-skills.mjs --task "BTM comprehensive stabilization and Quest 3 field readiness" --json`. It routed the native BTM entry, Quest input and input-systems instructions. All seven local skill paths passed validation. The README, CHANGELOG, controls, deployment and versioned verification documents were checked against source and current tests. Historical control tables carry older wrist behavior.
- [#59](https://github.com/MichaelWave369/BTM/pull/59) is merged at `18d559d6` (Ledger search/filter), [#64](https://github.com/MichaelWave369/BTM/pull/64) at `e9e56e69` (Warden Beast), and [#67](https://github.com/MichaelWave369/BTM/pull/67) at `66d7686d` (Stackyard bot navigation). All three are ancestors of the audited tip. [#47](https://github.com/MichaelWave369/BTM/pull/47) also shipped the 60-second moving-target drill that the Living Arcade issue still lists as unfinished.
- The initial 100 Actions runs contained 55 successes, 35 cancellations and 10 failures. `pages.yml`, `equipment.yml` and `network.yml` all use per-ref cancel-in-progress. On #67, `1ddb393b` was superseded by `7b1f422d`, which passed [Pages](https://github.com/MichaelWave369/BTM/actions/runs/41788417459), [equipment](https://github.com/MichaelWave369/BTM/actions/runs/41788417619) and [network](https://github.com/MichaelWave369/BTM/actions/runs/41788417605). This is distinct from real failed steps, including the earlier [Stackyard unit failure](https://github.com/MichaelWave369/BTM/actions/runs/41783669438), [Warden syntax gate failure](https://github.com/MichaelWave369/BTM/actions/runs/41778075896) and [Pit orb browser failure](https://github.com/MichaelWave369/BTM/actions/runs/41724256108) on superseded heads.
- The latest successful `npm run build` took two seconds in Pages and three seconds in equipment CI. The clean local build took five seconds with concurrent work running. The reported historical build timeout did not reproduce on this tip. Local Chromium had two separate timeouts at the legacy graphics button and Pit QA navigation. Preserve those failures and rerun the exact browser checks before treating the local matrix as complete.

## Reproducing the baseline

Run from a clean checkout of the audited SHA. The local environment used Node `24.22.1`, Playwright `1.64.1` and Chrome for Testing `156.0.8078.4` with software WebGL. CI uses Node 22. Browser test tooling lives outside the game package.

```bash
npm ci --prefix server --ignore-scripts --no-fund
npm run check
npm test
npm run playtest
npm run playtest:immersive
npm run playtest:pit
npm run test:network
BTM_COOP_STAGES=24 npm run playtest:network
npm run playtest:raid
npm run build
node scripts/verify-build.mjs
node scripts/verify-offline.mjs
```

The audit branch also accepts `BTM_COOP_PLAYERS=3` and `BTM_COOP_PLAYERS=4`. Set `BTM_NETWORK_OUTPUT` and `BTM_COOP_CHECKPOINT` to separate local paths per run. The JSON checkpoint contains private reconnect passes. The default two-client run remains the input for `playtest:raid`.

| Gate | Local baseline evidence |
| --- | --- |
| Static checks, unit and transport | 538 unit checks and 16 real-WebSocket transport checks passed. Coverage includes Classic/Xbox, Quest pose math, reconnect/size limits, four Beast forms, Stackyard input/LOS and bot navigation, `CODE BROWN`, ΦWAD, music and save isolation. |
| Campaigns | The standard original campaign used Legacy energy and cleared 12/12 in Classic and synthetic immersive, including natural defeat/retry. Pit Survival cleared 12/12 in both. The dedicated original Survival tests cover finite-ammo opening act and Warden combat. The full Survival run separately stopped in Sector 10 in both modes. |
| Shared co-op and raid | `BTM_COOP_STAGES=24` cleared 24/24 over two distinct sockets, with 24 disk restores. Three- and four-client runs used the same snapshot planners with additional independent socket joins. Both cleared 24/24. Two clients resumed the earned checkpoint and completed the four raid phases and escape. |
| Competitive and Extraction | Two-browser deathmatch on No Carrier, Sysop's Revenge and Kill Switch, Team Deathmatch, Clan Arena and the disconnected solo bot arena passed locally. Two real Node sockets cleared Witness Extraction in 492 host ticks, reset an interrupted exfil channel and rejected a packet claiming score, checkpoint and victory. The four Beast forms are exercised by the transport suite. |
| Production browser | Six-material and equipment captures, desktop Survival controls, Gallery and Trophy Room passed locally. First-pass legacy graphics and Pit QA timeouts were recorded. The latest full baseline PR CI includes the browser equipment and network suites. |
| Offline and output | Production build and generated-worker verifier passed. In Chromium, Industrial and Horror each delivered eight cached tiles after going offline and reloading. Removing Industrial preserved all eight Horror tiles and the disconnected CODE BROWN launch. |

Full original Survival exploratory reproduction, from the repository root:

```bash
node --input-type=module <<'JS'
import {runCampaign} from './tests/playthrough.js';
import {runImmersiveCampaign} from './tests/immersive-playthrough.js';
for (const [mode, run] of [['Classic', runCampaign], ['Tracked', runImmersiveCampaign]]) {
  const report = run({sectors:12, secrets:true, energyMode:'survival'});
  console.log(mode, report.passed, report.results.length, report.error);
}
JS
```

The repeated Classic Sector 10 failure occurs after both relays and the key. The driver goes dry with 1 charge and 0 reserve, then chases enemies while its goal is a health pickup. Retrying returns to the same checkpoint with 5 charge and 0 reserve. Letting the test player protect its supply route clears Sector 10 in Classic and tracked modes and reaches the Sector 11 retry limit. This identifies an input-strategy sensitivity. A complete human or input-only Survival clear is still needed.

## Rendering, hosting and remaining scope

- The matched six-style shot shows the cyan door surround, archive plate and pickup in both eyes. Corporate's pale floor reduces the pickup's apparent contrast compared with dark rooms. Cyberpunk and Horror add substantial floor detail. The matched view samples one sector and one pose. For moving-enemy, hazard and objective contrast use the field matrix. [Production capture evidence](https://github.com/MichaelWave369/BTM/actions/runs/41784574358).
- The renderer reuses bounded geometry batches and GPU buffers. Atlas rebuilds follow level, texture style/quality and image revisions. The async authored-image cache keeps two styles and leaves the procedural fallback available. A 640×360 software stereo sweep exercised each of six styles at Retro/Performance, Enhanced/Balanced and Ultra/High. All 18 cases showed distinct eye pixels, reused the warmed atlas and had zero GL errors or dropped vertices. Instrumented WebGL buffers, textures, programs and shaders returned to zero on disposal. CPU submission and draw counts are available separately from headset frame pacing, switch stalls, battery and thermal measurements. [First-party material provenance](hd-materials.md).
- Pages serves the static PWA. The optional Node service defaults to loopback. The repo includes an origin allowlist, private room/reconnect credentials, bounded wire validation and a Caddy configuration for `/ws` and `/status`. A local TLS gateway accepted the explicitly trusted certificate and Pages origin, rejected an unapproved origin with 403 and rejected an untrusted certificate. The optional server dependency audit returned zero known vulnerabilities. The configured public health request and WSS upgrade both returned HTTP 503 from this Work environment. A second device and a trusted reachable host are needed for public/Quest acceptance. [Self-hosting](bbs-lan-clan/hosting.md) · [Windows home host](bbs-lan-clan/free-windows-home-server.md).
- The Calibration Vault moving practice and Trophy Room are local features. Beast balance and late campaign Survival tuning, hidden moving-target scenarios, wider vertical level design, and signed multiplayer rewards each need separate acceptance criteria.

## Review order and release checks

| Priority | Workstream | Dependency or release evidence |
| --- | --- | --- |
| P0 | Fieldlink locomotion and input capture [#68](https://github.com/MichaelWave369/BTM/pull/68) | PR checks, then seated/standing Touch acceptance with held movement and release/rearm. |
| P0 | Shot feedback and BBS tracked origin [#69](https://github.com/MichaelWave369/BTM/pull/69) | PR checks, then the three-range field calibration, Ori/captions and real host shots. |
| P1 | BBS physical controller actions and Stackyard Jump [#71](https://github.com/MichaelWave369/BTM/pull/71) | PR checks, then a verified WSS host for two-device pause, held USE, jump, reconnect and shared objectives. |
| P1 | Solo Survival late campaign | Preserve the Sector 10/11 failures and record a complete clear with a human or input-only player. Compare resource pressure and route before changing balance. |
| P2 | Human Ledger persistence [#70](https://github.com/MichaelWave369/BTM/pull/70) | PR checks, then cross-tab browser proof and on-headset wrist archive readability. |
| P2/P3 | Materials/performance, remaining content and achievements | First collect the field evidence in the existing six-style, trap, Stackyard and BBS builds. Separate new content into focused PRs. |

| Candidate | Local receipt | GitHub check runs for the reviewed head |
| --- | --- | --- |
| #68 `c4d2eec0` | 541 unit tests, production build and offline verifier. Explicit Pause still resets input. The first candidate's older Signal regression expected movement capture, so its assertion now compares left-stick movement with an uncaptured control while retaining the no-fire and no-ability checks. | [Pages build](https://github.com/MichaelWave369/BTM/actions/runs/42139499697) · [Equipment](https://github.com/MichaelWave369/BTM/actions/runs/42139499754) · [Network](https://github.com/MichaelWave369/BTM/actions/runs/42139499756) |
| #69 `80c7f86a` | 544 unit tests, 16 transport tests, 24-stage co-op, four-phase raid, Classic/immersive/Pit, build and offline passed. Three distances cover all six weapons. | [Pages build](https://github.com/MichaelWave369/BTM/actions/runs/42137214466) · [Equipment](https://github.com/MichaelWave369/BTM/actions/runs/42137214532) · [Network](https://github.com/MichaelWave369/BTM/actions/runs/42137214614) |
| #70 `baaa33cb` | 540 unit tests, 16 transport tests, Classic/immersive/Pit, build and offline passed. Two same-origin Chromium tabs showed live progress refresh, recovered-only search and a spoiler-safe download. | [Pages build](https://github.com/MichaelWave369/BTM/actions/runs/42138093645) · [Equipment](https://github.com/MichaelWave369/BTM/actions/runs/42138093631) · [Network](https://github.com/MichaelWave369/BTM/actions/runs/42138093698) |
| #71 `014d29f9` | A real WebSocket/browser fixture reproduced continued Use after release and a double-handled resume. The final focused Chromium run confirmed Use on hold, cancellation on release, single pause/resume and no shot on the resume frame. Touch and Stackyard fixtures cover held Use and the new Jump target. | [Pages build](https://github.com/MichaelWave369/BTM/actions/runs/42139507199) · [Equipment](https://github.com/MichaelWave369/BTM/actions/runs/42139507216) · [Network](https://github.com/MichaelWave369/BTM/actions/runs/42139507201) |

The four code candidates combined cleanly in a local worktree. The combined tree `f783c2d477bcca5a2a149916ed9ca393224cdd16` passed 550 unit checks, 16 transport checks, Classic/immersive/Pit playthroughs, production build and generated offline verification.

- [ ] Review current PR head SHAs and complete required build, equipment and network checks.
- [ ] Run the combined candidate against the original/Pit saves, CODE BROWN, ΦWAD, Xbox and offline startup.
- [ ] Record a credible late solo Survival playthrough or preserve and resolve the identified blocker.
- [ ] Capture a trusted WSS upgrade, two separate Quest sessions, disconnect/rejoin and shared objective/raid evidence.
- [ ] Record the actual headset results for wrist, weapons, Ori, captions, traps, Stackyard, archive, materials and sustained pacing.
- [ ] Michael Wave approves merge and release for the SHA that passed field acceptance.

[Quest 3/3S two-player field guide](btm-quest3-field-runbook.md)
