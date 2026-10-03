// Compatibility for existing English display strings. Canonical values never leave the game model.
// New UI text should use semantic $t keys; this layer keeps ADEChinese's existing text reusable.
export function createLegacyDisplay(i18n, rules) {
  const exact = new Map();
  const patterns = new Map();
  const cache = new Map();
  const normalize = value => value.replace(/\s+/gu, " ").trim();
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const bucket = value => (value.match(/^[A-Za-z]+/u)?.[0] ?? value[0] ?? "").toLowerCase();
  const parameterPattern = /^(?:\{(?:p\d+|value\d*|mult|power)\}|\$\d+|%name)$/u;
  const resourceNames = rules.filter(rule => rule.id.startsWith("terms.") &&
    !rule.id.startsWith("terms.dimension.ordinal") && !["terms.on", "terms.off"].includes(rule.id))
    .map(rule => rule.source ?? i18n.messageSource(rule.id, rule.form)).filter(Boolean);
  const resourcePattern = resourceNames.length ? new RegExp(`(?<![A-Za-z0-9_])(?:${[...new Set(resourceNames)]
    .sort((a, b) => b.length - a.length).map(escape).join("|")})(?![A-Za-z0-9_])`, "giu") : null;

  for (const definition of rules) {
    const rule = { ...definition, source: definition.source ?? i18n.messageSource(definition.id, definition.form) };
    if (!rule.source) continue;
    // Single-letter fragments are articles, hotkeys, selectors, and symbols, not standalone messages.
    if (!/[A-Za-z]{2}/u.test(rule.source)) continue;
    const parts = rule.source.split(/(\{(?:p\d+|value\d*|mult|power)\}|\$\d+|%name)/gu);
    const parameters = parts.filter(part => parameterPattern.test(part));
    if (!parameters.length) {
      const key = rule.source.toLowerCase();
      const entries = exact.get(key) ?? [];
      entries.push(rule);
      exact.set(key, entries);
      continue;
    }
    const literals = parts.filter(part => !parameterPattern.test(part)).join("");
    if (literals.length < 3 || /\{p\d+\}\{p\d+\}/u.test(rule.source)) continue;
    // An unanchored conjunction is not a sentence template. It can consume an
    // entire paragraph and reorder its words when no complete message matches.
    if (!parts[0].trim() && !parts.at(-1).trim() && literals.trim().length < 24) continue;
    const prefix = parts[0];
    const entry = { ...rule, parts, parameters, specificity: literals.length,
      prefix: prefix.toLowerCase(), suffix: parts.at(-1).toLowerCase(),
      regex: new RegExp(`^${parts.map(part => (parameterPattern.test(part) ? "(.+?)" : escape(part))).join("")}$`, "iu") };
    const key = prefix ? bucket(prefix) : "*";
    const entries = patterns.get(key) ?? [];
    entries.push(entry);
    patterns.set(key, entries);
  }
  for (const entries of patterns.values()) entries.sort((a, b) => b.specificity - a.specificity);

  const quantities = rules.filter(rule => rule.id.startsWith("terms.") &&
    !rule.id.startsWith("terms.dimension.ordinal") && !["terms.on", "terms.off"].includes(rule.id))
    .map(rule => ({ ...rule, source: rule.source ?? i18n.messageSource(rule.id, rule.form) }))
    .filter(rule => rule.source).sort((a, b) => b.source.length - a.source.length);
  function translateQuantity(text) {
    for (const term of quantities) {
      if (!text.toLowerCase().endsWith(` ${term.source.toLowerCase()}`)) continue;
      const amount = text.slice(0, -term.source.length).trim();
      // Accept formatted numbers only. A longer named resource cannot become an amount.
      if (/^[+-]?(?:[\d.,eEfFgG^()+×:/⁰¹²³⁴⁵⁶⁷⁸⁹-]|\s|Infinity|Infinite)+$/u.test(amount)) {
        return i18n.t("ui.quantity", { amount, resource: i18n.t(term.id, {}, term.form) });
      }
    }
    return undefined;
  }

  function choose(entries, scope) {
    const scoped = entries.filter(entry => entry.scopes.includes(scope));
    const candidates = scoped.length ? scoped : entries.filter(entry => entry.global);
    const ids = new Set(candidates.map(entry => entry.id));
    return ids.size === 1 ? candidates[0] : undefined;
  }

  function translate(value, scope = "", depth = 0) {
    // Always track the locale and revision, including in paused Vue render functions.
    const { locale, revision } = i18n.state;
    if (locale === "en" || typeof value !== "string" || value.length > 20000) return value;
    const text = normalize(value);
    if (!text || !/[A-Za-z]{2}/u.test(text)) return value;
    const cacheKey = `${revision}\0${scope}\0${text}`;
    let result = cache.get(cacheKey);
    if (result === undefined) {
      const normalized = text.toLowerCase();
      const staticRule = choose(exact.get(normalized) ?? [], scope) ??
        (text.endsWith("s") ? choose(exact.get(normalized.slice(0, -1)) ?? [], scope) : undefined);
      if (staticRule) result = i18n.t(staticRule.id, {}, staticRule.form);
      else if (translateQuantity(text) !== undefined) result = translateQuantity(text);
      else {
        const matches = [];
        for (const entry of [...(patterns.get(bucket(text)) ?? []), ...(patterns.get("*") ?? [])]) {
          if (!entry.global && !entry.scopes.includes(scope)) continue;
          if (!normalized.startsWith(entry.prefix) || !normalized.endsWith(entry.suffix)) continue;
          const match = entry.regex.exec(text);
          if (match) {
            // A generic sentence must never capture part of a longer resource name.
            // Example: "{amount} Infinity Points" cannot consume "Celestial Infinity Points".
            const spans = resourcePattern ? [...text.matchAll(resourcePattern)]
              .map(resource => [resource.index, resource.index + resource[0].length]) : [];
            let position = 0;
            let parameter = 1;
            const splitsResource = entry.parts.slice(0, -1).some(part => {
              position += parameterPattern.test(part) ? match[parameter++].length : part.length;
              return spans.some(([start, end]) => position > start && position < end);
            });
            if (!splitsResource) matches.push({ entry, match });
          }
        }
        const specificity = Math.max(...matches.map(match => match.entry.specificity));
        const selected = matches.filter(match => match.entry.specificity === specificity);
        const rule = choose(selected.map(match => match.entry), scope);
        if (rule) {
          const { match } = selected.find(candidate => candidate.entry === rule);
          const values = {};
          const replacements = [];
          const capturedByParameter = new Map();
          if (rule.parameters.some((parameter, index) => {
            const captured = match[index + 1];
            if (capturedByParameter.has(parameter)) return capturedByParameter.get(parameter) !== captured;
            capturedByParameter.set(parameter, captured);
            return false;
          })) return value;
          rule.parameters.forEach((parameter, index) => {
            const captured = match[index + 1];
            const translated = parameter === "%name" || rule.protectedParameters?.includes(parameter.slice(1, -1)) ||
              /^['"].*['"]$/u.test(captured) || depth >= 2
              ? captured : translate(captured, scope, depth + 1);
            if (/^\{p\d+\}$/u.test(parameter)) values[parameter.slice(1, -1)] = translated;
            else replacements.push([parameter, translated]);
          });
          result = i18n.t(rule.id, values);
          if (replacements.length) {
            const byParameter = new Map(replacements);
            const macroPattern = new RegExp(replacements.map(([parameter]) => escape(parameter)).join("|"), "gu");
            result = result.replace(macroPattern, parameter => byParameter.get(parameter));
          }
        }
      }
      result ??= text;
      // Dynamic numbers change every tick. Keep memory bounded across long sessions.
      if (cache.size >= 2048) cache.clear();
      cache.set(cacheKey, result);
    }
    if (result === text) return value;
    return value.match(/^\s*/u)[0] + result + value.match(/\s*$/u)[0];
  }

  function translateHtml(value, scope, documentRef) {
    if (i18n.state.locale === "en" || typeof value !== "string" || !documentRef) return value;
    // Parse only the original trusted game markup. Translations are written using textContent,
    // never innerHTML, so a language pack cannot add executable markup or change links/styles.
    const fragment = documentRef.createElement("template");
    fragment.innerHTML = value;
    function visit(node) {
      if (["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(node.nodeName)) return;
      if (node.nodeType === 3) node.textContent = translate(node.textContent, scope);
      if (node.nodeType === 1) {
        for (const attribute of ["title", "aria-label", "alt"]) {
          if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute), scope));
        }
      }
      for (const child of node.childNodes) visit(child);
    }
    visit(fragment.content);
    return fragment.innerHTML;
  }
  return { translate, translateHtml };
}
