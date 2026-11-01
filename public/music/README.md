# BREAK THE MATRIX — original 18-track MP3 album

The game uses these original MP3 tracks only when the player selects **Original Album** in the Φ369 Jukebox. The native procedural score remains intact and is automatically used when MP3s are unavailable. No track is preloaded into the initial offline shell.

## Installing the album

Download the game-ready package from the original ChatGPT delivery, extract it, and upload **the 18 MP3 files** from its `public/music` folder into **this folder on this PR branch**. Do not upload the ZIP itself. Keep the exact original filenames, including the unusual space in `11- Last Life Last Round.mp3`.

These files were supplied together as `BTM.zip`; total original MP3 size is approximately 70.1 MiB. The largest individual file is under GitHub's web-upload per-file limit. A standard GitHub web multi-file upload is sufficient; upload in smaller batches if necessary.

## Runtime rules

- Album play begins only following a user gesture. Browsers/Quest can reject autoplay.
- The current scene requests one MP3 using a local same-origin URL. All 18 are **not** required to download at startup.
- Score cues cover the original 12 sectors, the 12 Pit trials, BBS deathmatch/team/clan lobbies, 24-stage co-op and Demiurge Prime.
- Automatic score, entire-album sequence, or a chosen individual track are available in the in-game Φ369 Jukebox.
- Missing files and unsupported media contexts fall back to procedural music. Gameplay, sound effects, speech and saves remain independent.
- Full offline availability of all MP3s is **not implied** by the basic game's offline-ready status. Users who want a completely offline album should download and serve their own first-party music files.

## Rights note

The included tracks were supplied for Break the Matrix by the project author, with embedded artist tag `michaelwave369`. The source-code MIT license does **not automatically** grant rights to redistribute the music separately. Music usage remains subject to its original creation platform's applicable terms and the copyright holder's permissions.
