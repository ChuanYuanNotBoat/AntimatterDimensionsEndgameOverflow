# Shared terminology

The authoritative glossary is the `terms.*` section of each language file, starting with [English](../src/locales/en.json) and [Simplified Chinese](../src/locales/zh-CN.json). There is no separately maintained copy of the translations.

Each complete resource name has one shared key. Singular/plural forms and historical English aliases belong to that same entry. Chinese usually needs one string; other languages may supply named grammatical forms. Sentences reuse terms through `[[terms.key]]` or `[[terms.key|plural]]`.

Preserve complete names such as Celestial Infinity Points. Match the longest known name first and never translate a resource by matching its constituent words. Canonical names, saved keys and formula indexes remain unchanged.

Source and community instructions: [i18n.md](i18n.md).
