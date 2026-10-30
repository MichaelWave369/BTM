# BTM Agent Skills Pilot #1

This is a **development-only, offline, native-WebXR-first** skill router, not a shipped runtime dependency or an autonomous installer.

## Run it
```sh
node scripts/route-agent-skills.mjs --task "Fix Quest right-stick diagonal turn and wrist capture" --json
node scripts/route-agent-skills.mjs --task "Profile VR frame pacing" --load
node scripts/route-agent-skills.mjs --validate
npm test
```

The routing script fingerprints BTM's existing `package.json` and native WebXR source. It always loads `btm-router` first, then selects additive BTM skills and upstream cross-engine concepts via documented keyword matching. Unknown projects fail closed instead of pretending to be a known engine.

### Reviewable paths
- `AGENTS.md` gives agent entry instructions.
- `.agents/skills/btm-*/SKILL.md` are original BTM-specific skills.
- `.agents/skills/{fps-shooter,input-systems,performance-optimization}/SKILL.md` are unchanged upstream snapshots.
- `scripts/route-agent-skills.mjs` routes and optionally reads selected skills, without executing them.
- `tests/agent-skills.test.mjs` covers fingerprints, deterministic choices, defaults, loading, path security and metadata.

## Preserved boundaries
No changes to player code, pages, WebXR input, the Gen.E.Wrist catalog or game runtime. No downloads at test/runtime and no network dependency. Do not install all 77 skills globally. No auto-updating upstream skills. GitHub CI's existing `npm test` discovers the new test.

These documents influence agents but do not by themselves guarantee every agent obeys them. PR review and actual test evidence remain mandatory.

## Upstream and attribution
Selected unchanged `SKILL.md` files were copied from:
https://github.com/gamedev-skills/awesome-gamedev-agent-skills

Pinned upstream commit: `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` (October 2026).
Source paths: `skills/genres/fps-shooter/SKILL.md`, `skills/disciplines/input-systems/SKILL.md`, `skills/disciplines/performance-optimization/SKILL.md`.

Those vendored files are Apache-2.0 licensed (see `LICENSE-APACHE-2.0.txt` in this directory); the BTM game itself remains MIT licensed. No upstream skill text was modified. Future updates need an explicit upstream revision, review of changed content, license/notice preservation and regression checks.

## Pilot scorecard
1. Zero functional gameplay or distribution changes.
2. Skill selection is reproducible, is engine-aware, and avoids unrelated generic engines.
3. Skill inventory and loader checks pass.
4. Existing CI remains green; actual Quest 3 checks still need human headset play.
5. After a real BTM task, compare scoped-agent edits with and without routing using test failures, review scope, and the manual hardware checklist. No claim of improved quality without evidence.
