# Stabilization audit baseline (2026-10-04)

Known screenshot display regressions were fixed and deployed in PR #5 before this audit phase. The audit preserves partial-language fallback and does not claim every visible English word has been translated.

Validation on an isolated late-game save:

- 54 targeted i18n/identity/paused-cache/Domain regression tests passed.
- 39 chapter-3 progression and Ethereal boundary tests passed.
- `i18n:check` passed: 8,420/8,431 Chinese catalog keys, 11 intentional missing translations, 1,301 referenced keys.
- Static strict audit passed with no base-key, parameter-signature, catalog or unreviewed translated-identity errors.
- 10 real gameplay scenarios produced identical operation results and complete serialized saves in English/Chinese. Clock/random control is test-only and no player fields were excluded.
- 600 UI renders covered the 69 unlocked subtabs in both layouts with repeated language changes, including 186 targeted screenshot fixture checks. 12 mobile layouts passed.
- Changed i18n source passed ESLint without errors; the release build passed. The generic core sources were also checked against their built source-map contents.

The static review queue contains 270 mixed-language literal candidates and 6 translations identical to English. These counts include notation, abbreviations, proper names and reused terms, so they are not counts of confirmed defects. Findings are assigned using semantic key prefixes, source paths and the existing display-rule scopes; unknown/shared findings remain explicit.

The browser sweep's keyed missing-translation events involved only these four existing partial-pack entries; all successfully fell back to English:

| Key | Classification |
| --- | --- |
| `navigation.universes.tangible` | Missing Chinese translation; base message exists |
| `terms.serpentinePower` | Missing Chinese translation; base resource exists |
| `terms.hawkingRadiation` | Missing Chinese translation; base resource exists |
| `terms.thermalRadiation` | Missing Chinese translation; base resource exists |

No missing English/base keys, TextRef failures, parameter failures, rejected catalogs or stale-locale-cache errors were observed. No audit entries were dropped in the sweep. Unkeyed English prose and mixed DOM output remain review candidates; occurrence totals are amplified by repeated renders and shared headers. They must not be presented as unique bugs or as completed translation acceptance.

Rendering and the listed gameplay contracts have passed this baseline. Full translation review, earlier unlock-stage saves, older migration fixtures and additional domain-specific mechanics are still pending. Follow the per-domain acceptance sequence in [i18n-stabilization.md](i18n-stabilization.md); expand fixtures and fix demonstrated local problems, not the general translation architecture.

Only sanitized results are checked in. Private save exports and detailed browser reports are excluded.
