# Campaign colored keys: review candidate

Original solo sectors now place one color key in Act I, two per sector in Act II, and three per sector in Acts III–IV. RED, BLUE and GREEN keycards open matching existing type-4 doors; GOLD remains the original extraction key, and secret doors remain unchanged.

The placement solver flood-fills reachability before each card is acquired. It keeps its own door closed, allows only previously obtained color locks, excludes gold/secret gates, and skips occupied cells. A colored door without a reachable card is never activated. Keycards are unlimited-use within one sector.

Checkpoints retain original `version:1`; newly saved key inventory lives at `player.keys`. Older snapshots without that field or without color-locked doors remain playable. Pit, competitive BBS and network simulation are unchanged.

Acceptance: run Node tests, build/offline, original and immersive playthroughs; verify color-coded door art in classic and Quest 3, right-grip USE, wrist map/hints, checkpoint retry, and gold extraction. **No physical headset sign-off has been performed for this patch.**
