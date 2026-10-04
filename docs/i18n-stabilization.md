# i18n stabilization and acceptance

The screenshot defects are fixed in PR #5. This phase freezes infrastructure expansion: keep one catalog per language and explicit references to complete resource names. Add diagnostics and regressions; change identities only where localization can affect gameplay, saves, stable indexes, CSS or Automator. No extraction project or broad rewrite is part of this phase.

## Audit commands

```sh
npm run i18n:check
node scripts/i18n-audit.cjs --json --strict > i18n-static-audit.json
npm run test:i18n
npm run test:chapter3
```

CI retains the static JSON report as an artifact. Strict mode fails on missing base keys, invalid catalogs/parameter signatures and unreviewed direct translated identity dependencies. Partial translations, identical English translations and mixed-language candidates form review queues. They do not fail a build merely because English appears. `i18n:check` continues to enforce duplicate keys, ICU selectors, referenced base keys and migrated template boundaries.

Static dependency candidates include canonical name comparisons, string indexes, dispatch and name transformations. Follow the producer and consumer before changing anything. Automator tokens, historical migrations, notation names, theme IDs and player-entered names are valid canonical contracts. `docs/i18n-identities.json` records reviewed contracts; `docs/i18n-audit-domains.json` holds ADE domain policy and narrowly reviewed display-only comparisons. These files contain no translations.

The AST scan follows direct localized expressions and local variable initializers. It is not whole-program data-flow analysis; dynamic keys, aliases across modules and indirect caches also require runtime coverage and producer/consumer review.

## Runtime recording

The generic service accepts a failure-isolated diagnostic callback. The bounded collector retains up to 500 distinct entries, occurrence counts, totals, overflow count, locale and catalog revision. The generic collector stores identifiers and categories, not values, rendered text, exception messages, save data or Automator script content. The optional browser QA adapter separately retains up to 500 final-output records (1,000 characters each) with key/component/DOM path; this requires `?i18nAudit=1` and remains local. Normal production logging is quiet. Reports are in memory only; no network telemetry or dependencies were added.

| Category | Meaning |
| --- | --- |
| `missing-key` | Message is absent in the attempted locale. Missing English/base keys are errors; missing Chinese keys may be an intentional fallback. |
| `english-fallback` | Successfully used the default English message or an entire referenced English term. DOM-only unmatched English prose is separately marked `unkeyed-output-candidate`. |
| `mixed-language-output` | Catalog literal or visible DOM contains potentially untranslated English beside Chinese. A candidate requires review. |
| `parameter-error` | Unsupported values, ICU formatting failure or unresolved rendered slots/references. No implicit Decimal conversion. |
| `text-ref-error` | Invalid TextRef result or a throwing text/value producer; the original exception contract is preserved. |
| `stale-locale-cache` | Cached locale/revision disagrees with the active stamp, or a paused locale roundtrip changes the same fixture's output. Unchanged text alone does not prove staleness. |
| `catalog-error` | Malformed replacement pack was rejected atomically. |

Open a QA page with `?i18nAudit=1` (or append `&i18nAudit=1`). This exposes `window.__i18nAudit` with `snapshot()`, `clear()`, `setContext({domain})`, `scan()` and `inspect(text, context)`. A throttled MutationObserver scans visible text automatically. Snapshots include severity/priority, domain counts and opt-in `outputs` for locating candidates. `$t` additionally observes plain-message extra parameters; complex ICU schemas remain static checks. Complete English resources embedded in Chinese are recorded as mixed-output candidates. Core errors/fallbacks are collected even without DOM scanning. DOM scanning skips code, editable input, CodeMirror and the news ticker; short units, notation and reviewed names are excluded from prose heuristics. Remaining candidates may still include intentional abbreviations, a whole English resource fallback or player text. The audit never rewrites output.

Display matching clears its bounded cache on locale/catalog revision changes and checks cache stamps before reuse. Catalog reference fallback dependencies propagate through nested messages, including cached expansion, and are reported only for the grammatical form actually rendered.

## English/Chinese gameplay equivalence

The optional existing browser runner uses an installed Playwright/browser without adding project dependencies:

```sh
ADE_TEST_SAVE=/path/to/private-export.txt \
ADE_TEST_URL='http://127.0.0.1:40765/?inspectSave=1' \
ADE_TEST_REPORT=/tmp/ade-browser-report.json npm run test:browser
```

Each gameplay scenario selects English/Chinese through the actual language selector, reloads the same fixture save, performs identical production operations with a deterministic test clock/random stream, then compares the **entire serialized player and operation result**. No player fields are ignored. Test clock/random replacements are restored in `finally`. Language selection itself must leave the save unchanged. The supplied export is never overwritten.

The ten scenarios cover compression purchase/reset boundaries, universe entry/rewards, overcharge low/capped rewards, Core snapshots/cooldown, nine star rewards/masteries, hadrons/collider/singularity, charged upgrade budgets, save roundtrip/game/offline ticks, dimension/Replicanti purchases/autobuyer toggles and canonical Automator compilation/execution. The runner also retains scoped screenshot fixtures, paused `en -> zh-CN -> en` output equality, both layouts, unlocked-tab render checks and mobile checks. `ADE_TEST_GAMEPLAY_ONLY=1` runs just the gameplay pairs; `ADE_TEST_UI_ONLY=1` runs UI acceptance; `ADE_TEST_FIXTURES_ONLY=1` omits the full unlocked-tab sweep.

Runtime reports are attached to each tab/subtab or scenario, so a failure can be assigned to a domain. Keep reports containing the private export or visible player text outside git. Only sanitized aggregate results belong in review documentation.

## Domain acceptance sequence

For each domain: reproduce the same state/operations in both languages, inspect visible text and rich slots, review missing/fallback/mixed candidates, verify stable IDs/CSS/save/Automator contracts, then run the applicable gameplay pairs. Record separately whether rendering, translation review and mechanics have passed. A successful UI sweep is not full gameplay acceptance, and a candidate count is not a defect count.

| Domain | First acceptance coverage | Remaining review |
| --- | --- | --- |
| Dimensions / Infinity / automation | Production purchase/toggle pairs; Replicanti and Continuum screenshot fixtures; both layouts | Review unmatched text and canonical autobuyer name contracts |
| Reality / Glyphs | Rich-slot and special-Glyph limits; generated set names; paused locale roundtrip; canonical glyph/save/CSS identity tests | Filter/sorting text and remaining rarity/style dependencies |
| Celestials | Effarig text fixtures; Hadrons DOM; Core snapshot and charged-budget pairs | Review Ra remembrance, help navigation and domain-specific fallback candidates |
| ADE 2.0 progression | Compression, universes, overcharge, stars/masteries, collider/singularity and real/offline tick pairs | More unlock-stage saves and per-system boundary fixtures |
| Automator | Same canonical script compilation/execution; template ID contracts; undo/redo stable subtab key | Block-editor operation matrix and user preset/import boundaries |
| Options / saves / notation | Actual selector leaves player unchanged; repeated switching; notation names/formatting; save roundtrip | Older save migration fixtures and remaining preference dialogs |
| Eternity / studies / challenges / achievements | Unlocked-tab rendering and static audit | Domain-specific operation fixtures before claiming full acceptance |

Only two existing identity couplings are changed in this phase: Automator undo/redo checks `subtab.key`, and dimension autobuyer group dispatch compares the existing type accessor. Canonical labels, saved fields and Automator commands remain intact. Other reviewed candidates stay local or pending until evidence warrants a structural change.

## Boundary for future AD:I18N

`service.js` and `audit.js` have no ADE imports, player state or simulation dependencies. Catalog loading, ADEChinese display matching, DOM heuristics, domain policy and browser gameplay fixtures remain outside that generic boundary. Preserving this boundary requires no additional extraction layers now.

## Translation update baseline

The 2026-10-04 ADEC translation-only update and expanded audit/real browser coverage are recorded in [adec-stabilization-baseline.md](adec-stabilization-baseline.md). This supersedes earlier coverage counts without changing core APIs or the one-file language format.
