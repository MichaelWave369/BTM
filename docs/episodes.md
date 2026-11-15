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
