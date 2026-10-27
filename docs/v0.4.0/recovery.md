# Reconstruction and source recovery

The earlier v0.4.0 candidate archive and local commit did not survive the interruption. Its persistent-file save had failed because storage was full, and the user had not downloaded it. The restored workspace only contained v0.2.1. The published Site's source recovered v0.3.0 at commit `914ff27305fbecab782d531be7992c91b79e14a6`; its 128 tests passed again before reconstruction.

This candidate is newly reconstructed and newly tested. Its reports describe this run; historical lost-candidate test counts or hashes are not reused as proof. The old candidate's known dodge-reference issue informed the reconstruction and has a regression, but its unavailable original failure log is not presented as a current artifact.

A checkpoint was pushed to the existing Site source repository on **`candidate/v0.4.0-reconstructed`**, separate from `main`. Readback verified commit `27a8d29cde50ee2ee46c8c785eddffa8c416feb9`; remote `main` remained at the v0.3.0 baseline. No save/deploy, merge, force push or automatic-publication window was used. The final handoff updates only this candidate branch and checks readback again. The delivery receipt identifies the final commit.

To recover after another workspace reset, open the existing game Site source with a fresh short-lived credential, then fetch `refs/heads/candidate/v0.4.0-reconstructed` into an isolated checkout. Never reset the public branch to the candidate. Run the checks listed in `verification.md`, rebuild and repackage with `node scripts/package-candidate.mjs /absolute/output.zip`. Git source history and the complete portable source/build ZIP are independent recovery routes.

Credentials are never included in the repository or archive. This is source backup only; public v0.3.0 remains the live release. The source is externally Git-backed, so no duplicate repository copy is required in saved-file storage.

The final archive is also retained on the candidate branch under `releases/MichaelWave-Ori-BreakTheMatrix-v0.4.0-reconstructed.zip`, with an archive receipt. This folder is excluded from package generation to avoid recursive ZIP nesting. Source commit, archive hash and restoration readback are recorded at delivery. The complete archive can be recovered directly from that branch rather than relying on a surviving temporary download link.
