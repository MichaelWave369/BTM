# The Human Ledger · optional witness intelligence investigations (issue #31, Rung 3)

BTM now offers four original story reconstruction challenges **inside the existing Human Ledger**. They are optional, local-only investigations earned by collecting genuinely placed wall-plaque testimony in the original campaign. None creates a door, a new combat route, a game weapon, a multiplayer rank, loot, or a required mission objective.

## Why these unlocks are meaningful

Each investigation is *sealed* until an entire four-record cross-sector evidence chain has been recovered. The player must read testimony from more than one sector and resolve a contradiction using the testimony itself:

1. **Mara Venn / Recognition**: family rhythm surviving Plugged conversion, without claiming Mara was rescued.
2. **The Choir / Unapproved Voice**: independent fragments contradict total broadcast compliance.
3. **Warden / Stolen Lessons**: training on human escape attempts, not human bodies inside manufactured machines.
4. **Ori / Last Witness**: uncatalogued preservation of captive names, without claiming to prove Ori's original author.

An investigation shows a prompt and three answers. Correctly answering stores one optional, persistent local `intelSolved` receipt. Wrong or repeated answers give no reward. Solved files reveal an additional debrief. Before the four required readings, the challenge, question, answers, and debrief do not appear in any catalog.

## Delivery and compatibility

- Desktop Human Ledger opens the same records as before and exposes keyboard-focusable choice buttons.
- Native immersive Gen.E.Wrist Human Ledger uses its existing pointer and trigger hit areas: select the optional INTEL case and choose one of three in-wrist answers. No changes to watch anchoring or controller mapping.
- The storage key `mwave-btm-human-ledger-v1` and schema `btm.human-ledger/1` remain unchanged; `intelSolved` is an optional field and old saves load normally. Invalid, hidden or orphaned solved entries are rejected when reading local storage.
- Any verified result is *only local*. There is no claim of server-verified progression, leaderboards, account identity or anti-cheat.
- `Game.snapshot()` formats (original v1, Pit v2), network authoritative state, player stats, achievements, main objectives and all 24 canonical stages are untouched.
- No dependencies, external services, mandatory network or fees.

## Acceptance

Automated tests must verify four correct evidence chains, zero spoilers before the final reading, refusal of invalid/wrong answers, exactly-once persistence, backwards-compatible/corrupt storage, and unchanged campaign snapshots. Then run the normal BTM build, offline, network, and VR software validations.

**Physical Quest acceptance remains pending.** During field testing, check challenge readability and three separate controller-selectable answer hit boxes in seated and standing configurations. No claim that screenshots constitute real headset validation.

## Remaining issue #31 scope

Rung 3's optional challenge baseline is addressed by this PR, but issue #31 still tracks Rung 4 collectible art/audio presentation, optional ΦWAD archival extensions, spoiler-safe exports, accessibility evaluation and physical Quest testing. **Do not close the parent issue solely because this PR passes CI.**
