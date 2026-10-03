# ADE 2.0 progression and display hardening

This change prevents failed purchases, incompatible challenge entries, stale confirmations and unbounded native-number conversions from interrupting normal progression. It also fixes unsafe legacy display-template matching while keeping translations in one JSON catalog per language.

## Scope

| System | Guarded boundaries |
| --- | --- |
| Compression | Actual geometric bulk cost, safe integer purchase counts, positive Hawking Radiation, wave thresholds, authoritative entry/exit |
| Universes | Unlock and implementation checks, mutually exclusive runs, peak rewards settled before reset, repeated exits |
| Ascension and Overcharge | Unlocks and levels, low EP rewards, energy caps, live charged-upgrade budgets |
| Slabdrill Core and Reality Warp | All nine dimension snapshots, one-time exit, hunt cooldown/probability, zero-time effects, stale delayed callbacks, large-step cinematic transitions |
| Hadrons and collider | Decimal derived totals, bounded products, safe native allocation counts, actual bulk cost, Void entry |
| Ethereal and mastery tree | Zero and maximum operands, bounded star gains/effects, mastery unlocks, sequential virtual import costs and whole-word abbreviations |
| Save loading | Idempotent normalization of native counters, missing schema fields, conflicting runs and obsolete cinematic flags; derived Hadron totals rebuilt |
| Display | Whole resource names, dimension ordinals, quantity templates, galaxy scaling and Effarig paragraphs; unknown text falls back to English |

Resources stay as Decimal values. Native counters are bounded only where their representation or game rules require it. NaN is reported with effect context instead of silently replacing an already corrupted resource balance. This does not reconstruct lost balances from damaged saves.

Canonical save keys, resource identities and Automator commands remain English. Locale changes do not change serialized player data. Reusable terms and messages live in `src/locales/en.json` and `src/locales/zh-CN.json`.

## Validation

- `npm run i18n:check`: passed (8,368 of 8,379 Chinese entries; 11 English fallbacks).
- `npm run test:i18n`: 33 passed.
- `npm run test:chapter3`: 39 passed, including 28 new progression regressions using the real Decimal implementation and production gameplay modules.
- Release build and `git diff --check`: passed.
- Isolated Chromium: 8 gameplay scenarios, save serialization roundtrip, real 100 ms and 24-hour game ticks, 69 unlocked subtabs in both layouts with Chinese / English / Chinese changes (414 desktop renders), plus 6 mobile-browser renders. Checks cover runtime errors, placeholders, resource names and specific paragraph regressions. Screenshots receive a QA-only CJK font if the environment has no installed Chinese font.
- Full legacy Node suite: 402 passed / 48 failed (450 total). The clean pre-change source has the same 48 failures (372 passed / 48 failed, 420 total); no new failure names. These existing failures include incomplete VM fixtures and stale source-pattern assertions. The full suite is not green.

## Running the optional browser test

Build the game and serve `dist`, then run:

```sh
ADE_TEST_SAVE=/absolute/path/to/exported-save.txt npm run test:browser
```

The default URL is `http://127.0.0.1:40765/?inspectSave=1`; override it with `ADE_TEST_URL`. Supply an existing Playwright installation with `ADE_PLAYWRIGHT_MODULE` and optionally an existing Chromium binary with `ADE_CHROMIUM_PATH`. Neither is added to package dependencies or the lockfile. `ADE_TEST_PROXY` optionally configures the test browser proxy.

`ADE_TEST_REPORT` and `ADE_TEST_SCREENSHOT_DIR` write private QA outputs. `ADE_TEST_FONT_CSS` may point to a local Noto Sans SC font package solely for screenshots. `ADE_TEST_UI_ONLY=1` skips gameplay scenarios. Do not commit test saves or generated QA outputs.

The runner creates isolated browser storage, disables the game intervals and imports a copy of the supplied save. It never edits the supplied save file. These checks cover the reviewed boundaries, not every possible player save or future progression combination.
