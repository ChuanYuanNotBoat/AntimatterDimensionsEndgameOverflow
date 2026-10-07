# Screenshot text regressions

These checks cover the four screenshots reported on 2026-10-04. Existing catalog coverage counts did not establish that complete rendered sentences were translated.

| Reported text | Diagnosis | Rendering correction |
| --- | --- | --- |
| Continuum explanation repeats in English | Full Chinese paragraph was assigned to the first English node; the English continuation remained | One complete semantic message, shared by AD, Matter, ID and TD branches |
| Glyph alteration repeats in English | Same partial-node migration | One complete explanation and a separate parameterized sacrifice-cap message |
| Current Setting, time mode, buy-max buttons | Translations already existed but display fields bypassed localization | Localize display fields; retain canonical modes and autobuyer names |
| Targets, dynamic amount, limits and singularity bounds | ADEChinese has translations, but these template fragments were missed by extraction | Centralized messages; shared complete resource terms |
| Replicanti multiplier/power descriptions | Highlight spans split whole translated templates into unmatched HTML nodes | Complete messages with numeric VNode slots, including all six effects and optional powers |
| Replicanti upgrade maximum, cap reward and auto-galaxy status | Unmatched formatted quantities/conditional phrases | Explicit quantity/status messages with shared resource names |
| Real Meta Transient Infinity | Generated English phrase had no whole-phrase match, despite translated name pieces | Localize only the known structured name tokens before composing the display name |
| Special Glyph equipment limit | Dynamic HTML split the count/type sentence | Whole ICU message with styled type slots and singular/plural selection |
| Celestial prestige buttons | Resource names were split across text nodes | Whole messages retaining highlights and complete singular/plural currency names |

Replicanti upgrade autobuyer names also existed in ADEChinese's core getter but were missed by extraction. Their three complete display names now use shared catalog terms; the getter and saved identities remain English.

The full browser sweep also exposed a real missing-content bug in `HadronsPane`: `new Decimal(...)` in the template compiled to `new _vm.Decimal(...)`, which is not a constructor. The pane failed to render. Decimal differences now live in computed properties; all three quantity headings use one localized message with complete resource names. Browser error capture now includes production Vue render exceptions.

The catalog also contained 38 imported literal `this.isFlipped` expressions from malformed reference text. Each was corrected using its corresponding English resource branch. They are not evaluated as JavaScript. The checker now rejects their return.

`Infinity` inside a formatted numeric threshold is numeric output, not evidence of a missing resource translation. Do not replace arbitrary words or modify canonical save/Automator identifiers to hide English.

Validation uses compiled production templates in the existing Node tests and optional real-browser checks in `scripts/test-chapter3-browser.cjs`. The browser checks cover repeated language changes, modern/classic layouts, six Reality autobuyer modes, four Continuum branches, multiplier-only/power Replicanti effects, auto-galaxy states, special-Glyph limits, and both prestige-rate displays. Their display fixtures do not replace production rendering or numeric formatters. Mobile captures include automation, Replicanti and Glyphs. `ADE_TEST_FIXTURES_ONLY=1` can run these focused cases without the full tab sweep. No test or browser dependencies are added.

Fallback remains intentional for catalog entries without a Chinese counterpart. This regression fix does not claim every future or unmatched fork sentence is translated.

## 2026-10-07 endgame and AD screenshots

| Reported area | Correction |
| --- | --- |
| Expansion packs and Divinity milestones | Resolve complete TextRefs before splitting into reward lines; keep each formatted value and shared resource term in the message |
| Galactic Power | Select the reviewed reward/effect context; format small Decimal percentages without implicit native conversion |
| Collider accelerators | Translate the three display names, filling state, total-Hadron cost and visible tooltip boundaries; canonical accelerator keys/names stay unchanged |
| Void description and Entropy limits | Translate whole sentences and allow long thresholds to wrap; move the first-accelerator Decimal expression out of the Vue template |
| Celestial Eternity and Eternity+ upgrades | Resolve the two conversion-formula descriptions and CIP multiplier autobuyer directly by key |
| Divinity upgrades | Translate the completion/generation descriptions and current/next effects; select the reviewed upgrade-name context |
| Achievement multipliers and powers | Render complete localized resource rows, including every enabled dimension type and Time Theorem production |
| Ra achievement tooltip | Select achievement 246's reviewed complete description instead of a generic quantity fragment |
| Stored Time | Render the complete Flux consumption sentence with the original highlighted amount and speed slots |
| AD purchase tooltips | Translate Continuum and purchase counts directly in both layouts; preserve formatted huge counts and singular English wording |

The language selector screenshot identifies the selected locale. Its existing incomplete-coverage notice remains accurate.

Validation: 67 localization tests and 39 Chapter 3/Ethereal tests pass. Six added regressions cover the production templates, paused language changes, both AD layouts, zero/singular/huge purchase counts, all nine expansion descriptions, all ten Divinity milestone descriptions and small/huge Galactic Power effects. ICU/key/parameter checks, strict static audit, the build and `git diff --check` pass. The modified source files have no additional lint errors; their existing lint count decreases from 31 to 29.

An isolated Edge browser loads a copy of the local late-game export and checks 38 fixtures in two layouts through paused `en -> zh-CN -> en` changes: 228 renders, no browser/formatter/TextRef/cache errors, no checked text overflow, stable serialized players and identical English roundtrips. Chinese expansion, milestone and Flux captures were visually inspected. Local reports and captures remain in ignored `.tmp/screenshot-qa`; no save, browser package or dependency is committed.

Additional gameplay validation passes the first three English/Chinese scenario pairs, then stops in the Core scenario with `Invalid Decimal operand in product right` from the Glyph effect combiner. An isolated build of unchanged `856114ead` reproduces the same failure at the same scenario. The full ten-scenario gameplay acceptance is therefore not claimed for this older fixture. The display fixes do not repair or suppress that existing error.
