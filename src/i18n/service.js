import { IntlMessageFormat } from "intl-messageformat";

export const LANGUAGE_STORAGE_KEY = "ade.language";

// A language file contains text, optional grammatical forms, and its own metadata.
// References are explicit whole entries, not replacements of individual words.
export function resolveCatalog(catalog, fallback = {}, onFallback) {
  const resolved = new Map();
  const visiting = new Set();
  const dependencies = new Map();
  function forms(entry) {
    if (typeof entry === "string") return { text: entry };
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.text !== "string" ||
        Object.values(entry).some(value => typeof value !== "string")) {
      throw new TypeError("Messages must be text or named text forms");
    }
    return entry;
  }
  function expand(key, form = "text", useFallback = false) {
    const token = `${useFallback ? "fallback:" : ""}${key}|${form}`;
    if (resolved.has(token)) return resolved.get(token);
    if (visiting.has(token)) throw new Error(`Circular message reference: ${key}`);
    const source = useFallback ? fallback : catalog;
    if (!Object.hasOwn(source, key)) {
      if (!useFallback && Object.hasOwn(fallback, key)) {
        const message = expand(key, form, true);
        resolved.set(token, message);
        dependencies.set(token, [{ reference: key, form }]);
        return message;
      }
      throw new Error(`Unknown message reference: ${key}`);
    }
    visiting.add(token);
    const entry = forms(source[key]);
    // Languages without separate plural/case forms translate the term once.
    const inherited = [];
    const message = (entry[form] ?? entry.text).replace(/\[\[([\w.-]+)(?:\|([\w.-]+))?\]\]/gu,
      (whole, reference, variant) => {
        const referenceForm = variant ?? "text";
        const text = expand(reference, referenceForm, useFallback);
        inherited.push(...dependencies.get(`${useFallback ? "fallback:" : ""}${reference}|${referenceForm}`) ?? []);
        return text;
      });
    visiting.delete(token);
    resolved.set(token, message);
    dependencies.set(token, inherited);
    return message;
  }
  const messages = new Map();
  for (const [key, entry] of Object.entries(catalog)) {
    if (key === "$meta") continue;
    if (!key) throw new TypeError("Messages must have nonempty keys");
    for (const form of Object.keys(forms(entry))) {
      const token = `${key}|${form}`;
      messages.set(token, expand(key, form));
      for (const dependency of dependencies.get(token) ?? []) onFallback?.({ key, form, reference: dependency.reference, referenceForm: dependency.form });
    }
  }
  return messages;
}

// Keep this service independent of Vue, player, and the simulation clock.
// eslint-disable-next-line no-console
export function createI18n({ catalogs, defaultLocale = "en", metadata = [], warn = console.warn, onDiagnostic }) {
  const state = { locale: defaultLocale, revision: 0 };
  const packs = new Map();
  const rawPacks = new Map();
  const referenceFallbacks = new Map();
  const warnings = new Set();
  let storage;
  let documentRef;

  // Only identifiers and error categories leave this boundary, never parameter values or output text.
  function diagnose(type, details = {}) {
    try {
      onDiagnostic?.({ ...details, type, locale: state.locale, revision: state.revision });
    } catch {
      // Audit failures must not change formatting or simulation behavior.
    }
  }

  function report(token, error) {
    if (warnings.has(token)) return;
    warnings.add(token);
    try {
      warn(`[i18n] ${token}`, error);
    } catch {
      // Diagnostic callbacks must not interrupt the game.
    }
  }

  function registerLocale(locale, catalog) {
    try {
      const canonical = Intl.getCanonicalLocales(locale)[0];
      if (!canonical || !catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
        throw new TypeError("Invalid locale catalog");
      }
      const candidates = new Map(rawPacks);
      candidates.set(canonical, catalog);
      const compiled = new Map();
      const inherited = new Map();
      const affected = canonical === defaultLocale ? candidates : new Map([[canonical, catalog]]);
      for (const [id, candidate] of affected) {
        const messages = new Map();
        const fallbacks = new Map();
        const recordFallback = event => {
          const token = `${event.key}|${event.form}`;
          const entries = fallbacks.get(token) ?? [];
          if (!entries.some(entry => entry.reference === event.reference && entry.referenceForm === event.referenceForm)) entries.push(event);
          fallbacks.set(token, entries);
        };
        for (const [key, message] of resolveCatalog(candidate, candidates.get(defaultLocale), recordFallback)) {
          messages.set(key, new IntlMessageFormat(message, id));
        }
        compiled.set(id, messages);
        inherited.set(id, fallbacks);
      }
      // Rebuild references atomically, including terms inherited from English.
      rawPacks.set(canonical, catalog);
      for (const [id, messages] of compiled) packs.set(id, messages);
      for (const [id, fallbacks] of inherited) referenceFallbacks.set(id, fallbacks);
      if (canonical === state.locale || canonical === defaultLocale) state.revision++;
      return true;
    } catch (error) {
      diagnose("catalog-error", { candidate: locale, reason: error.name });
      report(`catalog:${locale}`, error);
      return false;
    }
  }

  function validateValues(values) {
    if (!values || typeof values !== "object" || Array.isArray(values)) throw new TypeError("Expected named values");
    for (const value of Object.values(values)) {
      if (typeof value === "string" || typeof value === "boolean") continue;
      if (typeof value === "number" && Number.isFinite(value) &&
          (!Number.isInteger(value) || Number.isSafeInteger(value))) continue;
      // Decimal and other objects must be formatted by the caller, never coerced here.
      throw new TypeError("Message values must be strings, booleans, or finite safe numbers");
    }
  }

  function unavailable() {
    return packs.get(defaultLocale)?.get("common.messageUnavailable|text")?.format() ?? "Message unavailable.";
  }

  function t(key, values = {}, form = "text") {
    // Vue makes this small state object observable; core code needs no Vue import.
    const locale = state.locale;
    const revision = state.revision;
    try {
      if (typeof key !== "string" || !key || typeof form !== "string" || !form) {
        throw new TypeError("Expected a nonempty message key and form");
      }
      validateValues(values);
    } catch (error) {
      diagnose("parameter-error", { key: typeof key === "string" ? key : "", form, reason: "invalid-values" });
      report(`values:${locale}:${typeof key === "string" ? key : "invalid-key"}`, error);
      return unavailable();
    }
    for (const candidate of new Set([locale, defaultLocale])) {
      const messages = packs.get(candidate);
      const selectedForm = messages?.has(`${key}|${form}`) ? form : "text";
      const message = messages?.get(`${key}|${selectedForm}`);
      if (!message) {
        diagnose("missing-key", { key, form, candidate });
        report(`missing:${candidate}:${key}`, revision);
        continue;
      }
      try {
        const result = message.format(values);
        if (typeof result !== "string") throw new TypeError("Plain messages must produce text");
        if (candidate !== locale) diagnose("english-fallback", { key, form, candidate, reason: "message" });
        if (candidate !== defaultLocale) {
          for (const fallback of referenceFallbacks.get(candidate)?.get(`${key}|${selectedForm}`) ?? []) {
            diagnose("english-fallback", { ...fallback, candidate: defaultLocale, reason: "reference" });
          }
        }
        return result;
      } catch (error) {
        diagnose("parameter-error", { key, form, candidate, reason: "format", error: error.name });
        report(`format:${candidate}:${key}`, error);
      }
    }
    return unavailable();
  }

  function messageSource(key, form = "text") {
    const messages = packs.get(defaultLocale);
    const message = messages?.get(`${key}|${form}`) ?? messages?.get(`${key}|text`);
    if (!message) return undefined;
    const nodes = message.getAst();
    if (nodes.some(node => ![0, 1].includes(node.type))) return undefined;
    return nodes.map(node => (node.type === 0 ? node.value : `{${node.value}}`)).join("");
  }

  function updateDocument() {
    if (!documentRef?.documentElement) return;
    documentRef.documentElement.lang = state.locale;
    documentRef.documentElement.dir = metadata.find(entry => entry.id === state.locale)?.direction ?? "ltr";
  }

  function setLocale(locale, { persist = true } = {}) {
    let canonical;
    try {
      canonical = Intl.getCanonicalLocales(locale)[0];
    } catch (error) {
      report(`locale:${locale}`, error);
      return false;
    }
    if (!packs.has(canonical)) return false;
    if (canonical !== state.locale) {
      state.locale = canonical;
      state.revision++;
    }
    updateDocument();
    if (persist && storage) {
      try {
        storage.setItem(LANGUAGE_STORAGE_KEY, canonical);
      } catch (error) {
        report("storage:write", error);
      }
    }
    return true;
  }

  function initialize(environment = {}) {
    storage = environment.storage;
    documentRef = environment.document;
    try {
      const saved = storage?.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && !setLocale(saved, { persist: false })) report("storage:unknown-locale", saved);
    } catch (error) {
      report("storage:read", error);
    }
    updateDocument();
  }

  // Load the default first so partial packs can reference its terms.
  if (catalogs[defaultLocale]) registerLocale(defaultLocale, catalogs[defaultLocale]);
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (locale !== defaultLocale) registerLocale(locale, catalog);
  }
  return { state, t, setLocale, registerLocale, initialize, messageSource, diagnose };
}
