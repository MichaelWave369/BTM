# The Human Ledger · Rung 4, spoiler-safe publishing

The Human Ledger is a fictional witness archive inside BTM. Players who earned records can download **their own recovered account** as a plain Markdown document. This is a player-triggered, local browser operation, not a remote upload or an account sync.

## Player experience

1. Collect at least one wall archive during the original campaign (face a plaque, press **USE**).
2. Open **Human Ledger** on the desktop menu, or leave immersive mode and open the archive overlay.
3. Select **EXPORT RECOVERED WITNESS ARCHIVE (.MD)**. The browser offers `BTM-Human-Ledger-NN-of-48.md`.
4. Share or read the file as plain text/Markdown. Never need a login, server, or hosting subscription.

### Exactly what goes into the file

- Only recovered wall testimonies, in their canonical catalog order
- Only 3/6/9 threshold dossiers actually unlocked
- Only linked evidence cases for which **every required witness** has been recovered
- Only debrief conclusions for intelligence investigations **solved correctly**
- Basic local progress counts and a note about fictional content

### Exactly what stays locked

- Unfound records, their names, their testimony and their excerpts
- Unopened dossiers, incomplete linked cases and unsolved investigation titles
- Challenge questions, three multiple-choice options and correct answer indices, **even on solved cases**
- Personal profile data, room pass tokens, campaign saves, gameplay stats and network receipts

The pure `src/archive-export.js` utility can see only `ArchiveLedger.list()`'s currently earned entries. It deliberately excludes unsolved challenges and never reads raw `localStorage`. It does not write storage, grant unlocks or generate campaign rewards. Markdown filenames are deterministic and the export stays bounded.

The browser downloads an in-memory `Blob` directly from a user click. It does not transmit the file to a website, change PWA caches, require a content CDN, import untrusted HTML, or expose arbitrary file paths. The export module is included in the same mandatory offline shell as the archive, so it works after the existing game is installed for offline use.

## QA / existing BTM compatibility

New `tests/archive-export.test.mjs` cases cover empty, single-witness, 3/6/9 thresholds, four-record case completion, hidden unsolved choices, solved-only debriefs, deterministic 48-record exports, storage immutability and offline/source/UI wiring.

Normal checks must pass: Node test/check, desktop playthrough, Pit, native immersive playthrough, production offline build and all LAN browser/raid regressions.

**Physical Quest acceptance remains open:** Controller selection of the desktop menu button in a 2D overlay, headset download support, font readability and immersive wrist UX must be checked on hardware. The current export is a desktop archive-screen action, **not a direct wrist download**. No claim of physical Quest acceptance is made.

## Next issue #31 scope

Advanced original archive illustrations/audio, optional ΦWAD-compatible archival extensions, and physical Quest field acceptance still belong to #31. The core 48 testimonies, linked evidence and four investigations were merged earlier in PRs #32, #35 and #54. Do not close the parent solely on this export rung.
