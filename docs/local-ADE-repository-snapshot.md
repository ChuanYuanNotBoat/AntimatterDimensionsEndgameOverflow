# Local ADE worktree snapshot

Captured: 2026-09-20 (Asia/Singapore)

This file records read-only observations made before any isolated clone, test, or experiment. No command in this snapshot changed the source repository.

## Repository

- Path: `E:\projects\tools\AntimatterDimensionsEndgameUpdate\AntimatterDimensionsEndgameUpdate`
- Git worktree: yes
- Only registered worktree: the path above
- Current branch: `feat/restore-multiplier-breakdown`
- HEAD: `ab358cf39a766e8c4c0e8b8fc44a95f185d82a41`
- Upstream: `origin/feat/restore-multiplier-breakdown`
- Ahead/behind: `+0/-0` at final verification
- Tracked modifications: none
- Staged modifications: none
- Non-ignored untracked files: none
- Ignored local fixture: `tests/fixtures/local-overflow-save.txt` (49,602 bytes); content was not printed or modified
- Stashes reported by `git stash list`: none

## Remotes

- `origin`: `https://github.com/ChuanYuanNotBoat/AntimatterDimensionsEndgameUpdate.git`
- `upstream`: `https://github.com/Supersonic-Seven/AntimatterDimensionsEndgameUpdate.git`
- `vanilla`: `https://github.com/IvarK/AntimatterDimensionsSourceCode.git`

Fetch and push URLs are identical for each remote. No fetch or push was performed against the local repository.

## Local branches

- `feat/restore-multiplier-breakdown` -> `ab358cf39a766e8c4c0e8b8fc44a95f185d82a41`; upstream `origin/feat/restore-multiplier-breakdown`; synchronized at final verification
- `master` -> `d975ac75854d79d07808fdc142cfefdaa1c356ba`; upstream `origin/master`; ahead 1

## Cached remote branches

### origin

- `ade-web` -> `9584fe08b8bd0f4322f5a16e337c483cd7e4601b`
- `feat/restore-multiplier-breakdown` -> `ab358cf39a766e8c4c0e8b8fc44a95f185d82a41`
- `master` -> `b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`

### upstream

- `feature/title-screen` -> `64a3c4f310d8866b354453f016f454188be5013c`
- `gh-pages` -> `86a1aea934d93220bf30c937a8ae59fa8bc1004d`
- `hira-test-time-studies-tab` -> `745c5585dff23e06f63efc438d56aff92b91d200`
- `master` -> `b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`
- `omsi_animations` -> `e0c5f9816c1e6a274dcfc0c7d5dc55d87efb88d1`
- `omsi_secret` -> `b111d56cf55145f671ddc968922fcb4520de06ec`
- `omsi_sfx` -> `c7c04e664e84b957138495a439d256123beb453f`
- `omsi_wheel` -> `560882d1e3aca2db63558189cc6baf82899283a9`
- `release` -> `175b2e6dbecb80cf4e878781b639c1f22046e4e6`
- `revert-60-FixGalaxyGeneratorPreviewRemainTime` -> `d639208f2343cff0439104bde45b6d498f64ac05`
- `revert-61-FixGalaxyGeneratorPreviewRemainTime` -> `7d13c0d1948b359dd26f63812d29f6b787b094b9`
- `steam-post-merge` -> `ac3636cf1d8c7fb9ac08862993d356a057527322`
- `test1` -> `acc5b974ce00e937c1ad5d764a8da2ee08e9047c`

### vanilla

- `feature/title-screen` -> `64a3c4f310d8866b354453f016f454188be5013c`
- `gh-pages` -> `9ee01b34c77897a9088c5cc009e909c3d2074ae4`
- `hira-test-time-studies-tab` -> `745c5585dff23e06f63efc438d56aff92b91d200`
- `master` -> `5409e320cecef96a917cca1dfb68f1f183e499ca`
- `omsi_animations` -> `e0c5f9816c1e6a274dcfc0c7d5dc55d87efb88d1`
- `omsi_secret` -> `b111d56cf55145f671ddc968922fcb4520de06ec`
- `omsi_sfx` -> `c7c04e664e84b957138495a439d256123beb453f`
- `omsi_wheel` -> `560882d1e3aca2db63558189cc6baf82899283a9`
- `release` -> `0b70035ab849f3d79c3a873e94171c62b3d08cf5`
- `steam-post-merge` -> `ac3636cf1d8c7fb9ac08862993d356a057527322`
- `test1` -> `acc5b974ce00e937c1ad5d764a8da2ee08e9047c`

## Live remote verification

`git ls-remote` was used outside the source repository. It confirmed:

- ChuanYuanNotBoat default/master: `b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`
- ChuanYuanNotBoat feature: `ab358cf39a766e8c4c0e8b8fc44a95f185d82a41`
- ChuanYuanNotBoat deployment branch: `9584fe08b8bd0f4322f5a16e337c483cd7e4601b`
- Supersonic-Seven default/master: `b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`
- HexaVault default/refactor: `14fcf1156011a36240e23c712dcf1e54fa01782f`
- HexaVault main: `982ec3fdd8b2d163bee7cde67ddbddf6df75c0bf`

## Divergence from ADE upstream master

Common baseline: `b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`

- Local `master`: 1 commit, 1 file, +1/-1
- Public feature branch at final verification: 10 commits, 133 files, +11,806/-1,330
- Local HEAD: 10 commits, 133 files, +11,806/-1,330

Local HEAD includes custom UI/analysis features, overflow fixes, test harnesses, and the latest late-game overflow commit. It is therefore the migration source of truth; public `master` is only the common comparison baseline. The public feature branch now points to the same SHA, but that does not make public `master` representative of the local project.
