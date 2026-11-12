# Campaign colored keys: review candidate

Original solo sectors now place one color key in Act I, two per sector in Act II, and three per sector in Acts III–IV. RED, BLUE and GREEN keycards open matching existing type-4 doors; GOLD remains the original extraction key, and secret doors remain unchanged.

The placement solver flood-fills the *original* sector. It carves small blind-end bonus supply alcoves into otherwise solid walls, without adding locks to existing doors or corridors. Each color card is placed on a reachable original floor tile, never behind any color, gold, or secret gate. A colored bonus door without a reachable card is never activated. Keycards are unlimited-use within one sector.

Checkpoints retain original `version:1`; newly saved key inventory lives at `player.keys`. Older snapshots without that field or without color-locked doors remain playable. Pit, competitive BBS and network simulation are unchanged.

Acceptance: run Node tests, build/offline, original and immersive playthroughs; verify color-coded door art in classic and Quest 3, right-grip USE, wrist map/hints, checkpoint retry, and gold extraction. **No physical headset sign-off has been performed for this patch.**
