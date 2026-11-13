# Two-story BTM field test: Quest 3 pair

**Review candidate only.** This guide covers the optional twelve-sector *solo* campaign. The two testers run independent sessions; it is **not** two-player cooperative BBS. It does not change the normal flat campaign, Pit, or multiplayer.

## Open the right build

1. On both Quest browsers, open the same approved **HTTPS candidate build** and record its commit SHA. A branch PR is not automatically the public GitHub Pages site; verify the deployed revision before attributing results to it.
2. From the title screen, enter **IMMERSIVE VR**, then select **TWO-STORY FIELD TEST** in the in-headset title menu. On desktop, the same new menu choice launches the preview directly.
3. Backward-compatible method: add `?solo2f=1` to the candidate URL and select **ENTER THE MATRIX**. The default URL without this flag and without the new button keeps the flat campaign.
4. Confirm the HUD contains **TWO-STORY PREVIEW**. The room label switches between **GROUND FLOOR**, **RAMP**, and **UPPER DECK** based on the player support surface.

**Save safety:** This is a *memory-only* research campaign. Retry and sector changes retain temporary preview checkpoints, but closing/reloading the tab loses preview progress. No permanent normal-campaign save should be written. The existing **CONTINUE TRANSMISSION** button remains the original flat save.

## Test circuit for each headset

| Step | What each tester does | Expected observation |
| --- | --- | --- |
| 2F-01 | Fresh preview, Sector 01. Find the map-highlighted ramp; walk up without jumping | Smooth continuous ascent, no blocked top edge or teleport; see UPPER DECK |
| 2F-02 | Walk off the deck, then use wrist **JUMP** under and beside the deck | Normal gravity/landing; head does not pass through slab, jump remains distinct from Dash Bash |
| 2F-03 | Shoot toward an upstairs guard from below, then from the open upper deck | Solid deck blocks shots; clear same-floor aim can hit |
| 2F-04 | Fight the upper sentry and lure it toward/down the ramp | Guard follows authored ramp without teleporting or shooting through floors |
| 2F-05 | Approach upstairs UPPER SIGNAL; press **right grip USE** | One successful sync, replenishment, 1/12 total; no repeated rewards |
| 2F-06 | In Sector 02+, collect the optional upper color card, descend and find its matching supply gate | Red/blue/green access works; GOLD remains separate and required only for original extraction |
| 2F-07 | Complete original relays/rescues/gold and exit from the ground floor | No optional upper signal or guard kill is required for progression |
| 2F-08 | Retry after a failure; open and close the wrist while moving; turn smoothly or snap | Preview checkpoint and movement survive, menu does not leak a shot or grip interaction |
| 2F-09 | Return to title, start a normal campaign or CONTINUE a pre-existing save | Original flat level is preserved; preview content is absent |
| 2F-10 | Visit at least one Act III/IV sector using the preview's NIGHTMARE RUN link (`?solo2f=1`) if a full twelve-sector run is too long | Late layouts still have a reachable ramp, guard, color card and uplink |

For direct late-stage access, use `?solo2f=1` + **NIGHTMARE RUN** (starts at Sector 07). The separate menu button always starts Sector 01. Use the wrist map or TAB map to locate ramps/upper signals without relying on memory.

## Compare two headsets

For every issue record: device, headset/browser version, build SHA, sector, VR settings (posture, quality, smooth/snap turning), whether it reproduced on both devices, expected vs. observed behavior, and a screenshot or short clip where feasible. Record battery/thermal comfort separately. A single software browser pass does **not** establish physical Quest acceptance.

The first acceptance priorities are **ramp collision, motion comfort, upstairs enemy shots, usable right-grip uplinks, and color-key access**. Stop testing if discomfort develops. Keep existing campaign checkpoints untouched.
