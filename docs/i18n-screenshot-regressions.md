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
