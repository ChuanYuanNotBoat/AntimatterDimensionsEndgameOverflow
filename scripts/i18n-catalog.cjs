"use strict";

// Build explicit references to complete terms. Longer resource names are matched first.
// This runs during import, never against player data or live DOM fragments.
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const crypto = require("node:crypto");
const outsideReferences = (text, transform) => text.split(/(\[\[[\w.|-]+\]\])/gu)
  .map(part => part.startsWith("[[") ? part : transform(part)).join("");
const reference = (id, form) => `[[${id}${form && form !== "text" ? `|${form}` : ""}]]`;

function shareTerms(packs, definitions) {
  const english = packs.en;
  const aliases = [];
  const metadata = [];
  const chineseAliases = new Map();
  for (const definition of definitions) {
    const { id, source } = definition;
    if (!Object.hasOwn(english, id)) continue;
    const base = typeof english[id] === "string" ? { text: english[id] } : { ...english[id] };
    let form = Object.entries(base).find(([, text]) => text === source)?.[0];
    if (!form) {
      form = `form${Object.keys(base).length}`;
      base[form] = source;
    }
    english[id] = base;
    metadata.push({ id, ...(form !== "text" ? { form } : {}), global: true, scopes: [] });
    if (!id.startsWith("terms.dimension.ordinal") && !["terms.on", "terms.off"].includes(id)) {
      aliases.push({ id, source, form });
      const translation = packs["zh-CN"]?.[id];
      if (typeof translation === "string") chineseAliases.set(translation, id);
    }
  }
  // Include case variants from imported sentences without changing their English spelling.
  const englishPattern = new RegExp(`(?<![A-Za-z0-9_])(?:${[...new Set(aliases.map(a => a.source))]
    .sort((a, b) => b.length - a.length).map(escape).join("|")})(?![A-Za-z0-9_])`, "giu");
  const byEnglish = new Map(aliases.map(alias => [alias.source.toLowerCase(), alias]));
  for (const [key, value] of Object.entries(english)) {
    if (key === "$meta" || key.startsWith("terms.") || typeof value !== "string") continue;
    const matches = outsideReferences(value, part => part.replace(englishPattern, source => `\0${source}\0`))
      .split("\0").filter((part, index) => index % 2 === 1);
    for (const source of matches) {
      const { id } = byEnglish.get(source.toLowerCase());
      const entry = english[id];
      if (!Object.values(entry).includes(source)) entry[`form${Object.keys(entry).length}`] = source;
    }
  }
  // Old localization may use several spellings for one complete resource. Unify exact aliases only.
  for (const definition of definitions) {
    const id = byEnglish.get(definition.source.toLowerCase())?.id;
    if (!id) continue;
    for (const [key, value] of Object.entries(english)) {
      if (value !== definition.source) continue;
      const translated = packs["zh-CN"]?.[key];
      if (typeof translated === "string" && !/[{}\[\]<>]/u.test(translated)) {
        chineseAliases.set(translated.replace(/^个/u, ""), id);
      }
    }
  }
  const chinesePattern = chineseAliases.size ? new RegExp([...chineseAliases.keys()]
    .filter(Boolean).sort((a, b) => b.length - a.length).map(escape).join("|"), "gu") : null;
  let uses = 0;
  for (const [locale, catalog] of Object.entries(packs)) {
    for (const [key, value] of Object.entries(catalog)) {
      if (key === "$meta" || key.startsWith("terms.") || typeof value !== "string") continue;
      if (locale === "en") catalog[key] = outsideReferences(value, part => part.replace(englishPattern, source => {
        const { id } = byEnglish.get(source.toLowerCase());
        const form = Object.entries(english[id]).find(([, text]) => text === source)[0];
        uses++;
        return reference(id, form);
      }));
      else if (locale === "zh-CN" && chinesePattern) catalog[key] = outsideReferences(value, part => part.replace(chinesePattern, source => {
        uses++;
        return reference(chineseAliases.get(source));
      }));
    }
  }
  // A plain term needs only one string. Forms are optional for every other language.
  for (const [id, entry] of Object.entries(english)) {
    if (id.startsWith("terms.") && typeof entry === "object" && Object.keys(entry).length === 1) english[id] = entry.text;
  }
  return { terms: metadata, uses };
}

function shareMatterTerms(packs, rules) {
  const all = [...rules];
  const counterparts = { antimatter: "matter", antimatterDimension: "matterDimension", antimatterUniverse: "matterUniverse" };
  for (const rule of rules) {
    const english = packs.en[rule.id];
    if (typeof english !== "string") continue;
    let changed = false;
    const convert = (message, locale) => message.replace(/\[\[terms\.(antimatter\w*)(?:\|([\w.-]+))?\]\]/gu,
      (whole, term, variant) => {
        const counterpart = counterparts[term];
        if (!counterpart) return whole;
        changed = true;
        if (locale !== "en") return reference(`terms.${counterpart}`);
        const original = packs.en[`terms.${term}`];
        const source = typeof original === "string" ? original : original[variant ?? "text"] ?? original.text;
        const text = source.replace(/antimatter/giu, word => word === word.toLowerCase() ? "matter" : "Matter");
        const id = `terms.${counterpart}`;
        const entry = typeof packs.en[id] === "string" ? { text: packs.en[id] } : packs.en[id];
        let form = Object.entries(entry).find(([, value]) => value === text)?.[0];
        if (!form) { form = `alias${Object.keys(entry).length}`; entry[form] = text; }
        packs.en[id] = entry;
        return reference(id, form);
      });
    const translated = convert(english, "en");
    if (!changed) continue;
    const id = `ade.${crypto.createHash("sha256").update(`${rule.id}\0matter`).digest("hex").slice(0, 16)}`;
    packs.en[id] ??= translated;
    if (packs["zh-CN"][rule.id]) packs["zh-CN"][id] ??= convert(packs["zh-CN"][rule.id], "zh-CN");
    all.push({ ...rule, id, source: rule.source?.replace(/\bAntimatter\b/giu, "Matter") });
  }
  return all;
}

module.exports = { shareTerms, shareMatterTerms };
