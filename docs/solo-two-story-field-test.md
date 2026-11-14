# Two-story BTM field test: Quest 3 pair

**Review candidate only.** This guide covers the optional twelve-sector *solo* campaign. The two testers run independent sessions; it is **not** two-player cooperative BBS. It does not change the normal flat campaign, Pit, or multiplayer.

## Open the right build

1. On both Quest browsers, open the same approved **HTTPS candidate build** and record its commit SHA. A branch PR is not automatically the public GitHub Pages site; verify the deployed revision before attributing results to it.
2. From the title screen, enter **IMMERSIVE VR**, then select **TWO-STORY FIELD TEST** in the in-headset title menu. On desktop, the same new menu choice launches the preview directly.
3. Backward-compatible method: add `?solo2f=1` to the candidate URL and select **ENTER THE MATRIX**. The default URL without this flag and without the new button keeps the flat campaign.
4. Confirm the HUD contains **TWO-STORY PREVIEW**. The room label switches between **GROUND FLOOR**, **RAMP**, and **UPPER DECK** based on the player support surface.
5. To sample all levels without finishing every original mission, **PAUSE → NEXT TWO-STORY TEST SECTOR**. This resets health, enemies and objectives for the next sector but keeps the preview's 0/12 signal ledger. The control is absent from normal campaign, Pit and BBS, and is hidden on Sector 12.

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
| 2F-11 | Pause and use NEXT TWO-STORY TEST SECTOR repeatedly through Sector 12, then resume | Exactly the next stage, fresh combat setup, safe v1 storage isolation, 12/12 upper layouts present |

For direct late-stage access, use `?solo2f=1` + **NIGHTMARE RUN** (starts at Sector 07). The separate menu button always starts Sector 01. Use the wrist map or TAB map to locate ramps/upper signals without relying on memory.

## Compare two headsets

For every issue record: device, headset/browser version, build SHA, sector, VR settings (posture, quality, smooth/snap turning), whether it reproduced on both devices, expected vs. observed behavior, and a screenshot or short clip where feasible. Record battery/thermal comfort separately. A single software browser pass does **not** establish physical Quest acceptance.

The first acceptance priorities are **ramp collision, motion comfort, upstairs enemy shots, usable right-grip uplinks, and color-key access**. Stop testing if discomfort develops. Keep existing campaign checkpoints untouched.

## Upper-deck Frequency Fragments (new candidate)

Each experimental mezzanine also carries **one violet Frequency Fragment** opposite the uplink. Walk onto the upper deck and collect the artifact-shaped object. It grants **12 armor, 12 Ori and 20 reserve energy** (or 20 regular energy in Legacy), capped at normal limits, and advances a separate **FRAGMENTS 0/12** counter. This is **not** a normal weapon-upgrading artifact, gold key, relay or requirement to finish a sector. It cannot be collected from beneath the slab, and its temporary progress follows in-memory preview retry and sector transitions.

The wrist status and minimaps show a violet fragment marker after the relevant tile has been explored; the objective panel shows the 0/12 count. Compare the same pickup on both headsets, including whether the object appears above the deck, disappears only once and retains its collected state after retry. The normal campaign, Pit and BBS have no Frequency Fragments.


## Upper Sentry Hunt (new candidate)

Every optional mezzanine already has one elevated sentry with genuine ramp navigation and floor-aware combat. The new **SENTRIES 0/12** challenge records each sector's upstairs guard defeat. An actual kill grants a capped **+20 health and +15 armor** recovery. The guard can only award a clear once; retry checkpoints preserve both the dead enemy and that clear. The desktop objective HUD and Gen.E.Wrist show the count. After discovering the corresponding tile, maps display the living upper guard in red; the marker disappears on defeat.

Field-test by shooting from the ground beneath the slab (should be blocked), then walking up the ramp and fighting on an exposed line of sight. Confirm health/armor recovery after the defeat and that reload/retry does not duplicate rewards. This challenge never locks extraction or changes the normal flat campaign, Pit, BBS co-op, or their disk saves. Each of the two Quest headsets should run independently.

## Three-role upper guard combat (review candidate)

Each of the twelve authored upper sentries now rotates through three deterministic combat roles (four of each):

| Sectors | Guard | Behavior |
| --- | --- | --- |
| 01, 04, 07, 10 | **BREACHER** (coral) | Faster melee charge. Stay mobile; it can chase through the actual ramp. |
| 02, 05, 08, 11 | **MARKSMAN** (cyan) | Slower long-range shots with a longer warning. Sidesteps on the upper deck without falling off; cover the exposed sightline. |
| 03, 06, 09, 12 | **BULWARK** (violet) | More health and a rechargeable shield absorbing the first 22 damage every six seconds. **Ori's stun bypasses the shield** while it holds. |

The same upper-sentry reward and 0/12 optional ledger apply; no extra required enemy kills, new weapon, model dependency, or save format. Native stereo uses distinct tints and a small active bulwark cover marker; Classic shows guard roles as readable labels. Roles are part of the preview checkpoint's validation so a forged role cannot replace another sector's sentry. The original campaign and Pit/BBS remain unchanged.

Field check: approach the first three sectors as separate encounters, fire a single shot into the BULWARK and note the 22-damage cover absorption, then let the shield recharge or use Ori to expose it. Confirm the MARKSMAN stays on the deck while strafing and its projectiles still collide with the platform. This remains software-tested, not Quest hardware accepted.

## Real tactical upper cover (new candidate)

Two **solid barricades per experimental upper deck**, located on the north and south rows without occupying the ramp, middle walking lane, optional color key, supply, uplink, fragment or sentry's initial position. The same dimensions drive native WebXR static geometry, Classic rendering, 3D line-of-sight/VR tracked gun rays, enemy targeting, projectile collision, and **upper-body walking collision**. The ground-floor room directly beneath remains traversable, and the deck/ramp vertical physics are unchanged.

Suggested pair test: Sector 01, find both cyan-trimmed blocks, approach from above and confirm you cannot walk through them; move *around* them using the central lane; from the upper level put a block between you and a Breacher then test whether its projectile/shot is stopped. Peek beside or jump to clear the obstruction. Repeat on Sector 02 with Marksman shots from range and Sector 03 with the Bulwark. Walk and jump underneath the upper deck to confirm the downstairs airspace remains unchanged, and verify Ori uplink/right-grip, fragments, original gold extraction and guard descent/ascent through the ramp still work. Check both native stereo and Classic; any actual Quest 3 comfort or aim handling remains manually unverified.


## Ori's two-story wayfinder (new candidate)

The optional research campaign now gives each mezzanine a **non-solid cyan ramp-entry beacon** and short glowing discs following the true rising ramp surface. When **Ori scan** is available and activated with no nearby enemy, the ten-second scan adds smaller green breadcrumbs along a real ground-floor navigation route to the ramp; it honors normal doors and never routes through an inaccessible red/blue/green lock. On the upper deck, any incomplete **UPLINK** or **Frequency Fragment** also gets a subtle colored marker. Completed goals stop emitting markers. These are rendered in Classic, native stereo/WebXR and both classic and Gen.E.Wrist maps, without changing collisions, shots, save data, progression, multiplayer, or controls. The new module is included in the offline service-worker cache to prevent an offline Code Brown regression.

Test: start an optional two-story sector, spot the ramp discs, trigger Ori scan from a safe room with no enemies close, follow the green trail around walls and unlocked doors. Walk up the actual ramp, then use the cyan uplink and violet fragment markers. After each collection, confirm its marker disappears. Repeat in a 3x3 late-sector mezzanine, both rendering modes, and offline. Physical Quest comfort and depth presentation still require human acceptance.

## Upper guard cover flanking (review candidate)

The three optional upper guard roles now recognize the **real, solid barricades** as navigation obstacles. When pursuing a target behind a block, the sentry finds a walkable half-tile path around it, following normal body collision and maintaining continuous vertical physics. Once the firing lane opens, the MARKSMAN's existing sidestep resumes. A player moving within 2.65 tiles behind a block can alert a nearby same-floor guard by footsteps, but the guard **cannot fire through the cover**: the existing 3D ray/line-of-sight checks still gate damage and projectiles. Guards entering or leaving the upper story continue to take the authored ramp; the route planner never offers a floor teleport, a mandatory guard kill, a new saved field, or gameplay outside the opt-in two-story solo preview.

Pair test: stand on the opposite north-row side of a cyan barricade from a Breacher and watch it go via the inner walking lane, instead of pressing forward against the block. Do the same for the Marksman and Bulwark on sectors 2 and 3, then lure each downstairs along the ramp and upstairs again. Move away from a guard to ensure the original chase works. Shoot at a guard when cover blocks the line of sight to verify it still cannot hit through the block. Check both Classic and Quest 3, with real headset movement/comfort requiring field validation.

## Colored Signal Cache hunts (new review candidate)

The existing RED, BLUE and GREEN key-card alcoves now form an optional treasure hunt in the **two-story preview only**. From Sector 02 onward, one matching card is upstairs, so the quest connects both floors. There are one to three optional caches in a sector, depending on the stage, and the desktop objective strip and Gen.E.Wrist show **CACHES collected/total**. This is derived from actual bonus cache pickups, not a new disk-save field.

Collect a card on the upper deck, then descend. Its matching ground-floor bonus door gains a color-matched visual marker; a normal ten-second Ori scan adds a safe path toward the unlocked door. Once open, the cache itself receives a matching marker. Enter the alcove and pick up the supply. Each cache always counts once, even if its normal sprite would be uncollectible at full resources. Extra color-specific benefits are capped: **RED +35 health/+15 armor; BLUE +35 reserve energy (or legacy energy)/+25 Ori; GREEN +20 health/+25 armor/+20 Ori**. Completion removes the beacon. A cache does not have to be opened to finish the main sector, and GOLD key/relay/extraction conditions are unchanged.

For each of the twelve sectors: check the available colored locks and cache count; inspect upstairs card height and floor isolation; confirm right-grip USE on a colored door and correct requirement when missing the card; collect all caches, watch the counter increment once, retry from memory-only checkpoint, and ensure no duplication. Test normal campaign, Pit, BBS, offline reload and Classic/Quest 3. Actual headset behavior and comfort still require human verification.

## Upper-deck Resonance Sweeps (review candidate)

Two non-solid scanner pads appear on the **center row of each optional upstairs mezzanine**, with the middle walking lane left free, the existing barricades and color-key objects undisturbed, and no modification to 12 standard stages. Their timing is deterministic and staggered: each six-second period has a **1.2-second amber WARNING** followed by a **0.7-second red ACTIVE** window. The rest of the cycle is inactive. A player standing within 0.38 map units of an active pad at normal deck height takes **9 damage maximum once per pulse** through the same shield/armor/health rules as other hazards. Jump at least 0.32 map-height above the deck or sidestep away to avoid it. The ground floor directly underneath is immune.

The Classic renderer, native stereo/WebXR world and both maps derive the identical yellow/red/cyan pad state from the game clock. No new action binding, physics collider, mandatory objective, score gate, engine, runtime package, network data, or save format is added. The pulse-hit deduplication is ephemeral and resets on a preview retry or level change; no repeated damage in a single active window.

**Quest 3 field test:** in optional Sector 01, walk onto the upstairs middle-left pad while amber (no damage yet), then stay for red (one hit only), then jump to clear the next pulse. Repeat while standing underneath the same X/Y coordinate on the ground floor (zero hits). Verify the other staggered pad is not simultaneously red and that the center walking lane always stays navigable. Repeat across sectors with compact 3x3 mezzanines; check Classic, map indicators, VR comfort and performance. This is not hardware-accepted until tested on physical headsets.

## Solo Thruster Jetpack (review candidate)

The opt-in twelve-sector **TWO-STORY FIELD TEST** includes a fuel-limited aerial assist. First use the existing **JUMP** action (desktop `J`, Gen.E.Wrist JUMP). While airborne, **hold the existing SPRINT action** (Quest 3 **left stick click**, Xbox **left stick click**, desktop **Shift**) to ignite the jetpack. Releasing sprint restores unchanged gravity and preserves airborne strafing and mid-air shooting. It cannot launch a grounded player by itself; a jump or ledge fall begins flight.

- Fuel capacity **100**, burn **48 per second** while thrusting, recharge **32 per second** when grounded. No recharge in flight; exhausted fuel cannot sustain indefinite hovering.
- Jetpack boosts upward to **4.4 max cruise speed**, but the original **7.2 initial jump velocity** is never truncated. Existing **3.9 ceiling**, platform undersides, collision, guard targeting, air strafing and safe landings remain authoritative.
- Classic HUD has a **JET %** bar; Gen.E.Wrist shows fuel; native stereo adds cyan exhaust near the player's feet. Thrust stops on landing, at the ceiling or when sprint is released. Captured wrist-menu interactions do not trigger thrust.
- Fuel/thrust state lives only on opt-in solo preview player snapshots. Existing campaign/Pit/BBS players, bots, ΦWADs, physics, and disk checkpoints remain unchanged. Older temporary previews missing fuel fields can restore with full fuel.
- **Not multiplayer flight:** community Tag/.phiwadvr and LAN replication need separate authority, synchronization, and comfort tests.

**Physical test:** jump off the Sector 01 deck, hold left-stick click for a short burn while strafing, release and land. Observe hang time and whether aiming and firing work throughout. Verify JUMP alone feels unchanged, held sprint on the ground doesn't lift the player, and sustained thrust drains fuel. Wait on the floor to refuel, then try a compact late-sector deck. Boost directly underneath the slab: the character must never pass through its underside. Check normal campaign, Pit and BBS to ensure no fuel UI or altered movement. Compare two Quest 3 headsets, seated/standing modes, turning options, comfort, aim, FPS and wrist readability.

## Quest 3 controller shortcuts (review candidate)

The native **IMMERSIVE VR** input mapping now provides distinct face-button edges:
- **Left X:** toggle the **actual map view on the left-arm Gen.E.Wrist**. Press X again to close, even while the map has captured combat buttons. The physical menu remains anchored to left-controller tracking. Lowering the arm moves the map out of view but does not silently dismiss the explicit X request; raising it reveals the same map. The standard watch-face RIGHT TRIGGER menu still works independently.
- **Left Y:** trigger the existing vertical JUMP action, including from the ground or upper deck when the optional two-story mode is active. No auto-repeat when held. The standard flat campaign has no jump.
- **Right B:** the existing directional DODGE / DASH BASH control; **right A or grip:** INTERACT / USE.
- **Left grip:** Ori, **left stick click:** sprint / optional airborne jetpack, **left trigger:** charge, **right trigger:** fire and UI select. Quest reload and vision remain on the wrist tools.
- Xbox gamepad and desktop mappings are unchanged, including Xbox X reload, Y Ori, View map, and right-stick Help; no camera/aim changes.
- No new save data or network messages. The headset input adapter owns the Quest face conversion; X/Y are not mapped to two actions simultaneously.

**Check on real Quest 3:** Press X at rest: the map should be mounted on your left arm when you raise it, not floating at your face. Press X a second time to close (without a ghost shot). Open X again, then use right trigger to activate CLOSE MAP. Confirm Y jumps once, B dashes with left-stick direction, left grip still calls Ori, A and right grip still interact, right trigger still shoots when the map is closed, and left-stick-click sprint/jetpack remains available. Repeat in seated and standing modes, both headsets and all menus. A software-emulated XR controller test does not replace this physical check.
