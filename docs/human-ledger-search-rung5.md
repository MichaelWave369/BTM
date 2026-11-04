# Human Ledger · Recovered-only search (issue #31)

## Scope

This rung adds a local text search to the desktop Human Ledger and a four-way category cycle to the native immersive Gen.E.Wrist index. Both go through `searchRecoveredArchive()` in `src/archive-ledger.js`; it reads `ledger.list()` instead of the master story array.

### Desktop
- Open **Human Ledger**, type a title, subject, archive category or phrase.
- Matches update without a submit/network request, with a labelled search field and a screen-reader status count.
- Selecting a record preserves the current query; clearing the field restores the earned archive.
- A zero-match result is distinct from having no records recovered.
- Opening the archive for a new visit clears the ephemeral search text. No search history is saved.

### Immersive Gen.E.Wrist
- Open **HUMAN LEDGER** on the left-wrist menu.
- Select **FILTER: ALL** to cycle **ALL → FILES → DOSSIERS → INTEL**.
- The index page resets after each filter, preserves readable large 53px row buttons and shows the number of visible entries.
- Filter controls change only the wrist index. They do not alter the gameplay state, earned rewards or which cases are unlocked.

### Spoiler and privacy boundary
- Only `ArchiveLedger.list()` entries can match. Sealed/unfound records are not indexed.
- Search text for unsolved challenges includes the visible question but **not** answer options or the sealed debrief. A solved challenge's visible debrief may match.
- Nothing is exported, uploaded or persisted by search. The separate explicit Markdown export remains unchanged.
- No changes to level navigation, original/Pit saves, multiplayer authority, equipment math, or physical hand placements.

## Acceptance

Automated: `npm run check && npm test && npm run playtest && npm run playtest:immersive && npm run build`; offline, controller, multiplayer and VR-equipment checks must continue to pass.

**Physical Quest 3/3S (not certified by automated tests):**
1. Open Human Ledger with the left wrist and Touch controls; cycle each filter, including an empty category.
2. Confirm filter button remains reachable, doesn't occlude recovered list items and closes reliably.
3. Read a longer recovered story and use INDEX, PREV, NEXT. Ensure no accidental movement/aim.
4. Verify comfortable text size under actual stereo focus and that previous left-wrist positioning remains intact.
5. With one, nine and 48 recovered records, confirm pages, categories and earned visibility behave correctly.

Keep issue #31 open: original optional archive art/audio, optional ΦWAD extensions and device acceptance remain.
