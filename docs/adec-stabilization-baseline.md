# ADEC translation update and stabilization baseline — 2026-10-04

## Source and review decisions

The previous import used `mushduck/ADEChinese` **exp `27fc05ba8c57aa1f476b3bc156b7895ad0568943`**. That branch is unchanged. This review uses **main `2deeebcae272eaf674528d6d13a21bd50ff2a1a9`**, including the new 2.0 translations. Both reports align against this fork's unlocalized English commit `855c9f23e832be0a610eeca77af49967b557a9df`. The original import also used reference predecessor `796a911c74a8e55e345e2e15480f31ed5b590237`; its historic manifest is retained.

Only translation pairs and terminology are reused. No ADEC program files, component structure, gameplay, balance or 2.0 integration are merged/cherry-picked. Source code remains this fork's implementation.

| Decision | Count |
| --- | ---: |
| Safely extracted changed source pairs | 856: 783 new, 73 revised |
| New stable message entries | 657 |
| Existing message keys updated | 41 |
| Context-specific header messages reviewed separately | 3 |
| Reviewed whole resource entries | 7: 3 missing entries filled, 4 new reusable entries |
| Changed source pairs skipped | 155 |
| Competing/current translations needing further context review | 92 |
| Fragment/parameter/whole-message mapping pending | 40 |
| Deliberate resolved skips | 23: 18 shared terms reused, 5 incorrect/version-incompatible meanings preserved locally |
| Removed or revised old source groups retained pending review | 53 |
| Existing explicit Chinese catalog fallbacks eliminated | 3: Hawking Radiation, Thermal Radiation, Serpentine Power |

These counts describe reviewed pairs, not every upstream string or every visible English phrase. Seven resource decisions are separate from the message counts; seven small whole-message entries were added locally for compression/Core display boundaries. Catalog coverage is **9,130 / 9,138** entries, with **8 explicit fallbacks**. Unkeyed English UI remains a separate queue.

The imported areas include compression, transient universes, Slabdrill/Elemental quotes and descriptions, masteries/divinity, achievements and some later milestones. Existing manual corrections and conflicting contexts are retained rather than globally replaced. Complete resources use existing `[[terms.*]]` references, with English grammatical forms and one Chinese translation per resource.

`adec-translation-update.json` records each source fingerprint, source location, target key and decision; it contains no shipping Chinese strings. Skips: 76 current-translation/context reviews, 30 conditional fragments, 18 shared-term reuse, 16 ambiguous current keys, 6 incomplete whole-message fragments, 4 symbolic/partial parameter structures, 3 incompatible current meanings and 2 upstream meaning errors. Deleted/changed source occurrences are not evidence that a current key should be deleted.

## P0/P1 causes addressed

- **Wrong source alignment:** inserting confirmation options shifted positional matching. Report-only extraction now aligns the existing `option` identity. Anonymous prose arrays with changed layouts are rejected. Regression verifies both and that report generation cannot modify catalogs/components.
- **Wrong context mapping:** the same header/navigation English text had competing translations. Dilation/Infinity/Eternity challenge state messages receive scoped reviewed mappings; existing navigation labels and stable IDs remain intact.
- **Wrong parameter meaning:** the transient particle parameter is the amount of penalty reduction (`1 - remaining factor`). Its Chinese message now says reduction *by* the fraction. The numerical formula is unchanged.
- **Duplicate resource suffix:** a compression description appended the Chinese dimension suffix to an already complete dimension parameter. Remove that suffix locally and check the actual rendered upgrade text.
- **Reversed entry label:** ADEC's Core entry text reused its exit meaning. Preserve separate entry/exit keys at the existing render boundary; Core mechanics and canonical computed names remain unchanged.
- **Missed render boundaries:** compression totals/reset branches, transient paragraphs and Slabdrill labels now resolve complete messages at their own views, preserving styled number slots and controls.
- **Diagnostic isolation:** a broken QA observer cannot alter `$t` output or suppress a real formatter exception. Production diagnostic logging is quiet; detailed final output requires the explicit QA flag.

No new translated logic/save/index/CSS/Automator dependency has been confirmed by static checks or the covered real operations. This is scoped evidence, not whole-program proof. The prior PR's stable autobuyer type dispatch and Automator subtab key fixes remain in place. Generic `service.js`, `audit.js`, TextRef, loader, fallback and catalog format/API are unchanged in this update.

## Audit baseline

Static checks find base-key errors, invalid catalogs/ICU/parameter signatures, locally traceable translated identity dependencies, finite key choices, non-enumerable dynamic keys, literal-call missing/extra parameters, template English candidates, repeated equivalent entries, catalog mixed-language candidates and ADEC-source matches still falling back. Reports carry severity/priority, key, source locations, references and domain. Complex selectors conservatively omit static missing-branch checks; extra parameters and cross-language schema mismatches remain checked.

Opt-in runtime QA retains bounded final output, component/DOM path, key when known, locale/revision and counts, in addition to the existing redacted generic collector. It catches missing/fallback (including nested resources), malformed TextRefs, formatting/value errors, plain-message extra parameters, unresolved output, mixed prose, complete English resource names embedded in Chinese, and cache stamp/paused roundtrip errors. No automatic translations or game decisions are made by audit.

Limits: no whole-program taint analysis; indirect keys, spread/computed parameter objects and arbitrary caches need runtime coverage. The runtime extra-parameter bridge uses the existing plain-message source API and does not guess complex ICU selector schemas or quoted literal braces; those stay in static review. DOM locations are structural paths, not source-map call stacks. Code/user input/news are excluded from DOM prose scanning; catalog news/quotes are still statically reviewed. Identical and duplicate entries can be intentional scoped contexts. English abbreviations, formulas, proper names and player text can produce candidates. Appended English and bilingual repetition are mixed-output candidates rather than proof of their construction history. Final-output storage and the core collector each cap at 500 records; overflow totals must be read when interpreting a sampled report.

Static baseline: **0 missing base keys, 0 schema/parameter errors, 0 unreviewed translated identity errors**. Remaining **8 explicit fallbacks (P2)**; **290 mixed-language candidates (P1 review)**; **294 hardcoded UI candidates, 18 dynamic-key sites, 96 duplicate groups and 6 identical-English entries (P2 review)**. Two translated comparisons are reviewed display-only contracts, not pending P0s. Table counts are candidates, not confirmed defects; duplicate groups are assigned to their first key's domain.

| Domain | P2 fallback | P1 mixed candidates | P2 English UI candidates | P2 dynamic keys | P2 duplicate groups |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dimensions | 0 | 4 | 8 | 6 | 4 |
| Infinity | 1 | 6 | 6 | 0 | 10 |
| Eternity | 0 | 4 | 9 | 0 | 9 |
| Reality | 0 | 18 | 9 | 0 | 6 |
| Glyphs | 0 | 134 | 3 | 0 | 3 |
| Celestials / Slabdrill | 2 | 4 | 16 | 0 | 10 |
| Pelle | 0 | 30 | 5 | 0 | 2 |
| ADE Endgame / Universes | 2 | 14 | 29 | 0 | 18 |
| Multiplier Breakdown / Statistics | 0 | 0 | 81 | 0 | 9 |
| Automator | 0 | 2 | 22 | 2 | 3 |
| H2P | 0 | 4 | 0 | 0 | 1 |
| News / Quotes / Ending | 0 | 17 | 2 | 0 | 1 |
| Autobuyers | 0 | 7 | 9 | 0 | 2 |
| Options / saves | 0 | 14 | 10 | 2 | 3 |
| Shared / unclassified | 3 | 32 | 85 | 8 | 15 |

The eight remaining explicit keys are `terms.celestialDilatedTime`, `terms.celestialTachyonParticle`, `terms.matterUniverse`, `terms.molecularMass`, `terms.nullParticle`, `terms.stellarAugmenter`, `analysis.state.infinityDisabled` and `navigation.universes.tangible`. An absent catalog entry is distinguishable from an existing translation which missed its rendering boundary. Do not infer that all unkeyed output is missing upstream translation.

## Validation

- `i18n:check` and strict static audit pass; 1,322 direct key references validated.
- **60 i18n/identity/audit/import/domain regression tests** and **39 Chapter 3/Ethereal tests** pass. Focused runtime-adapter lint has zero errors; existing style warnings are not a P3 cleanup project.
- Production build passes. The container's build tools require a local `os.networkInterfaces` environment shim; it is neither committed nor included in gameplay tests/runtime.
- A real private late-game export drives **10 same-state/same-operation English/Chinese gameplay pairs**: compression purchases/reset; universe entry/rewards; overcharge; Core snapshot/cooldown; star/mastery boundaries; collider/hadrons/singularity; charged budgets; save/game/offline ticks; dimensions/Replicanti/autobuyers; canonical Automator compile/execution. Complete serialized players and operation results are equal; no player fields are broadly excluded. Locale remains outside player; scheduled background ticks are paused and the test clock/random stream is restored after each scenario.
- **654 UI renders**: 69 unlocked tabs/subtabs × 2 layouts × 3 locale passes = 414, plus **40 targeted display fixtures × 2 layouts × `en -> zh-CN -> en` = 240**. **12 mobile checks** pass. Runtime totals across 452 audited batches: **0 parameter/TextRef/catalog/stale-cache/base-key errors and 0 browser errors**; zero collector overflow. Repeated missing-key/fallback/mixed candidates are retained, not suppressed.
- The neutral fixture closes the Slabdrill run. Its real tab is temporarily opened using the existing player run flag only to obtain its production component for display fixtures, then the flag is restored. No mechanics are stubbed. Compression's still-untranslated child upgrades and Slabdrill conditional penalties remain in the full audit; specific translation assertions cover the reviewed render boundaries, not an unsupported full-domain translation claim.
- Visual QA uses a locally supplied CJK font in the isolated browser, because this container lacks Chinese glyphs. The additional font-enabled run passes all 240 targeted DOM fixtures and 12 mobile checks; Chinese glyphs are visually inspected. No font/dependency is added to the project. Private exports, full output reports and screenshots stay outside git; `i18n-audit-baseline.json` retains sanitized aggregates.

The first browser attempt reported a one-off before/after locale snapshot difference before field-path diagnostics were available. It did not recur in subsequent gameplay-only and full browser runs. The runner now reports changed field paths rather than dumping a private encoded save; a repeat remains a test failure and is not ignored.

This is representative acceptance, not complete gameplay coverage. Earlier unlock-stage/migration saves, Automator block/preset operations and indirect state-derived keys/caches need subsequent domain work.

## Next domain acceptance

1. Dimensions / Infinity / autobuyers: stable group names, purchase/reset/Continuum boundaries and earlier unlock-stage saves.
2. ADE Endgame / Universes / Slabdrill: new paragraphs, full resource parameters, remaining upgrade descriptions, conditional milestones and source review queue.
3. Reality / Glyphs / Automator: largest mixed-text queue, filter/sorting controls, templates/block-editor/preset imports and canonical grammar.
4. Pelle / other Celestials, then Eternity / studies: domain reset/unlock fixtures and translation contexts.
5. Multiplier Breakdown / Statistics, H2P, News / Quotes / Ending: large display-only queues, formulas and authored prose.

Each acceptance separates verified mechanics, render regressions and translation review. Use the reviewed language pack as the audit baseline. No large infrastructure refactor or ADE dependency in generic i18n is required.
