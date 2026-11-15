# The Buried Network

In Classic, select **Episodes → New Run / The Buried Network**. On Quest, enter **Immersive VR** or **VR Arcade** first and select the same episode inside the session. Return through **Episodes → Continue / The Buried Network** to resume a checkpoint, a cleared stage, or the finale. Starting a new run replaces the save for this episode.

Resonance Vision reveals violet service panels that open with Use. The upper decks in stages 3, 6, and 8 have walkable approaches and supply caches. The stage objectives are reachable from the ground. Standard finite charge and reserve carry between stages, along with earned artifacts. **Settings → Picture / Display → World material style → Auto** selects each stage’s assigned BTM material family. The first successful online load installs the offline shell. Enhanced PNGs are optional and the episode falls back to local procedural materials offline.

| Stage | Route and encounter |
| --- | --- |
| 1. Cable Mouth | Freight yard loop, dispatch office and a gated transfer lift |
| 2. Copper Loop | Distribution ring and an optional red shortcut into the switch vault |
| 3. Pump Cathedral | Twin pump wings flank an open nave with a supply gallery |
| 4. Blind Switchboard | Long serpentine rows with a blue maintenance crossover |
| 5. Dead Letter Exchange | Sorting racks and aisles connect three controlled desks |
| 6. Counterweight Shaft | Separate anchor wings and a ramp over the central hall |
| 7. Ghost Schedule | Parallel platforms linked by end bridges and a green crossover |
| 8. Glass Spine | Staggered memory banks, side connections and an optional upper deck |
| 9. Last Carrier | Three carrier feeds, covered approach lanes and a three-phase Carrier Warden |

## Author another episode

Register a first-party stage pack in `src/episodes/index.js`. Each pack supplies an ID, revision, title, summary, ending and ordered stage list. Each stage has a stable ID and an ASCII grid, with world-space actor/objective points and authored room labels, props, wall signs, texture family and palette. Floor tiles are `.`, wall materials are `#`, `2` and `3`, doors are `+`, gold doors are `$`, secret walls are `?`, and colored doors are `r`, `b` and `g`. Place cell-centered points at integer coordinates plus 0.5. Ramps currently ascend east into their deck and have a clear two-tile approach. The compiler checks the perimeter, door axes, placements and objective reachability. Episode files in `src/episodes/` enter the offline shell at build time.

The checkpoint key is `mwave-ori-episode-<id>-checkpoint-v1`. Use a new revision for incompatible stage geometry or changes to stage order. The current reader rejects old revisions and exposes a fresh-run path. Existing campaign, Pit, and LAN save formats use their existing readers.

## Verification

Run `node --test tests/episode-registry.test.mjs tests/buried-network.test.mjs`. The nine-stage drivers use production input and simulation in Classic and synthetic tracked mode, collecting every secret and upper artifact and restoring each cleared stage before entering the next. Browser CI runs `scripts/verify-episodes-browser.mjs` after the production build and stores its reports and paired Canvas/WebGL captures in the VR equipment evidence artifact.

The browser test compares both eyes’ output, checks geometry submission and dropped vertices, and verifies offline launch, resume and finale with the original and Pit slots and BBS preferences intact. The existing LAN workflows cover co-op stage progression and disk saves. The headless run measures software rendering and synthetic pose behavior. Physical Quest 3 testing remains open for headset stereo, ramp comfort, tracked controls and sustained frame pacing.


## Episode II: Synthetic City (9 stages)

The city is a new, **separately saved** authored episode. Select **Episodes → NEW RUN / Synthetic City** or **CONTINUE / Synthetic City**, on desktop, VR Arcade, or in the immersive Quest 3 menu. This episode does not add stages to the original 12-sector campaign or Pit. Its checkpoint key is `mwave-ori-episode-synthetic-city-checkpoint-v1`.

The map topology is authored as fixed city-district rectangles connected into walkable streets, then compiled into BTM's native episode ASCII grid. There are nine individual layouts, gold-locked exit chambers, one optional violet secret cache per stage, and normal maintenance doors. Stages 4 and 7 also offer colored-badge side caches; stages 3, 6 and 8 have optional ramp-accessible decks with supplies. Ground objectives are independent of those upper decks.

| Stage | District | Main experience |
| --- | --- | --- |
| 1 | Arrival Curfew | Neon customs terminal, arrival queue and exit clearance |
| 2 | Ring of Adverts | Outer adwalk loop and central dead plaza |
| 3 | Midnight Concourse | Railway platforms and optional high gallery |
| 4 | Sundown Offices | Offset boardrooms and blue maintenance shortcut |
| 5 | The Mall After | Abandoned retail courts and multiple crossings |
| 6 | Skybridge Cascade | Three tower stacks and elevated supply detour |
| 7 | Firewall Boulevard | Watched avenues and red-badge bypass |
| 8 | Identity Arcology | Numbered residential blocks and upper atrium |
| 9 | Crown Broadcast | Three signal feeds and the Crown Warden finale |

The new episode uses existing owned industrial, cyberpunk, horror, corporate and Matrix Facility styles with procedural offline fallback. It adds no commercial dependencies. Tests load and render every stage, check the independent save slot, run the original/Pit regressions and attempt complete input-driven Classic and synthetic tracked playthroughs. **Real Quest 3 comfort, frame pacing and physical Touch control validation remain pending**.


## Episode III: The Black Frequency (9 stages)

Choose **Episodes → NEW RUN / The Black Frequency** or **CONTINUE / The Black Frequency** on Classic, VR Arcade or Immersive Quest. This is a self-contained nine-stage signal-complex episode, not an extension of the original 12 sectors, Pit, co-op or either previous standalone episode. Its versioned checkpoint remains in `mwave-ori-episode-black-frequency-checkpoint-v1`.

The nine designed topologies progress from deserted intake crypts through archive wings, a copper harmonic array, an empty signal theatre, decommissioned tunnels and a fractured observatory to the Black Frequency source. Stages 3, 6 and 8 include **optional** short ramps to upstairs artifact/supply galleries; normal objective and exit paths remain below. Each stage has a gold-key exit chamber, a single hidden violet service seal and at least one control relay. The Unheard has a blue-badge side route; Fracture Array has a red-badge bypass. Ground geometry, enemy rosters and room labels are authored; deterministic compilation connects any separated architectural wings.

| Stage | Map | Encounter and exploration |
| --- | --- | --- |
| 1 | Static Pilgrimage | Silent entry crypt and multiple signal feeders |
| 2 | Resonance Crypt | Twin archive wings and memory choir |
| 3 | Choir of Copper | Oscillator rooms and optional upper gallery |
| 4 | The Unheard | Empty broadcast theatre and blue access |
| 5 | Null Procession | Parallel service tunnels and hidden records |
| 6 | Cathedral of Noise | Overtone complex and elevated countertone supplies |
| 7 | Fracture Array | Fragmented observatories and red bypass |
| 8 | Oracle Engine | Prediction chambers and optional high walkway |
| 9 | Zero Transmission | Three source relays and the Black Warden finale |

The episode reuses BTM-owned retro, Industrial, Cyberpunk, Horror, Corporate and Matrix Facility material systems with original procedural fallback. No paid dependencies, new network protocols, or existing campaign/save mutations. Test requirements: nine distinct worlds, all secrets and upper artifacts, Classic and simulated tracked completion and boss phases, production stereo browser capture, offline restart/finale, and existing BBS/Pit regressions. **Actual Quest 3 movement feel, aiming and sustained frame rate remain field acceptance tasks**.


## Episode IV: The Last Relay (9 stages)

The fourth expansion completes the original **60 solo campaign/trial stage** roadmap: 12 original sectors, 12 Pit trials, 9 Buried Network, 9 Synthetic City, 9 Black Frequency and 9 Last Relay. On desktop or Quest, choose **Episodes → NEW RUN / The Last Relay**, or **CONTINUE / The Last Relay**. The independent checkpoint key is `mwave-ori-episode-last-relay-checkpoint-v1`. All original/Pit/BBS progression and saves remain isolated.

Nine distinct authored layouts take the player from the destroyed relay graveyards through exposed surveillance plazas, lifts, vaults, cooling structures, a downed satellite array and interlocked tracks to the last active relay. The gameplay preserves finite charge, original BTM combat rules, ground-reachable relay/key/exit objectives and the familiar resonance secret system. Every level has a hidden cache and a gold-locked exit, and named locations and wall messages help distinguish stages. An **optional** upper artifact/supply route appears on stages 3, 6 and 8, while stages 4 and 7 add blue/red side-badge routes. Stage 9 ends in a three-phase **Final Warden** battle.

| Stage | Level | Main route |
| --- | --- | --- |
| 1 | Relay Graveyard | Fallen antenna field and buried uplinks |
| 2 | Glass Frontier | Surveillance plaza with exposed corridors |
| 3 | Signal Lift | Hanging shaft and optional upper supply deck |
| 4 | Cipher Vault | Three vault chambers and blue service annex |
| 5 | Iron Horizon | Interlocked cooling channels and bridges |
| 6 | Orbitfall Array | Fallen satellite with upper maintenance gallery |
| 7 | Midnight Junction | Track crossings and red-key bypass |
| 8 | Human Frequency | Restoration halls and optional observation deck |
| 9 | The Last Relay | Three final feeds and the Final Warden |

No paid dependencies, copyrighted shooter assets or new external services. CI requires input-driven 9-stage Classic and simulated tracked-VR completion, full secret and optional deck collection, independent checkpoint restoration, world geometry and material validation, both-eye WebGL production browser captures, and offline restart/end-game checks. **Physical Quest 3 testing remains necessary for comfort and sustained rendering performance.**


## Episode progress atlas

The **Episodes** picker displays a numbered nine-stage route for each standalone episode. Completed markers reflect the current valid checkpoint, the bright current marker identifies the running stage or the next stage after a cleared checkpoint, and the text names the relevant level. Final completion displays **EPISODE CLEARED**. New episodes show all nine stages with the first marker highlighted. Existing Save / Continue / New Run button names remain unchanged for Quest and Classic controller navigation.

The display is **read-only** and derives entirely from each episode's existing `mwave-ori-episode-<id>-checkpoint-v1` save. It uses the same strict checkpoint validator as game restoration, does not invent a leaderboard or write extra progress data, and refuses to offer Continue for an invalid checkpoint. An invalid save is left untouched, with **CHECKPOINT UNAVAILABLE** and a fresh New Run option. Completion progress is per episode, never combined with original, Pit or BBS progression. Tests cover four episodes, new/active/cleared/finale and rejected corrupt/mismatched snapshots, and the production Chromium picker before and after real saved movement.
