# Preserved failures and repairs

These are failed runs from development, not acceptance evidence. Final receipts are one directory above.

1. Geometry audits caught a key placed on a cover pillar, a final hazard outside its corridor and a tiny room without enough safe item slots. Authored coordinates/layout were corrected; all twelve maps now pass reachable occupancy checks for actors, objectives, loot, props and hazards.
2. Early boss runs could suppress too many tells with inherited long stuns. Pit guardians now cap weapon stun and use shorter Ori stun; phase changes clear stale stun/tells and guarantee health gates. Successful full runs now include live attacks from all four families and all three phases.
3. [Classic](classic-before-charge-fix.json) and [tracked](tracked-before-charge-fix.json) runs exhausted retry budgets on trial 12. The [contact trace](final-boss-contact-trace.json) retained the actual failure. A ram could finish inside the player; the scripted driver also circled at near-zero radius. Rams now substep and stop on first contact; the driver uses normal movement to back away. A focused regression checks non-overlap and one-hit budget. Both final full runs clear all twelve trials.
4. The first browser namespace assertion compared the original slot before returning home, when home legitimately creates a newer original checkpoint. The comparison now starts after that save and checks byte equality throughout Pit play. The first Gatekeeper capture was obscured by a foreground captive. Capture selection checks frontal line of sight; a supplemental clear frame was then captured from an actual driven checkpoint through canonical restore. Neither correction changes gameplay state.

5. The existing browser suite caught mobile title/footer overlap at 390×844. The title/footer now use normal vertical flow on small screens, and all four viewports also check real Pit start/resume with both checkpoint buttons present. A parallel software-rendered Survival capture timed out waiting for element stability; that tool now captures the page clipped to the actual app bounds, without waiting for live gameplay to stop. Both failures are retained here.

6. One repeated capture run while other Chromium suites were active printed a native browser “fatal library error, lookup self” after trial 3 and stalled. The capture runner now has a four-minute per-campaign watchdog; the complete capture suite was rerun alone. This is recorded as a browser/tooling failure, not erased as a game pass.

No HP, ammo, coordinates, enemy state or completion flags were patched to make the full playthrough pass. The driver uses exact aim and map knowledge; this is simulation verification, not a human difficulty study.
