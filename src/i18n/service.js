import { IntlMessageFormat } from "intl-messageformat";

export const LANGUAGE_STORAGE_KEY = "ade.language";

// Keep this service independent of Vue, player, and the simulation clock.
// eslint-disable-next-line no-console
export function createI18n({ catalogs, defaultLocale = "en", metadata = [], warn = console.warn }) {
  const state = { locale: defaultLocale, revision: 0 };
  const packs = new Map();
  const warnings = new Set();
  let storage;
  let documentRef;

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
      const messages = new Map();
      for (const [key, message] of Object.entries(catalog)) {
        if (!key || typeof message !== "string") throw new TypeError("Messages must have string keys and values");
        messages.set(key, new IntlMessageFormat(message, canonical));
      }
      // Compile the entire candidate before changing the active pack.
      packs.set(canonical, messages);
      if (canonical === state.locale) state.revision++;
      return true;
    } catch (error) {
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
    return packs.get(defaultLocale)?.get("common.messageUnavailable")?.format() ?? "Message unavailable.";
  }

  function t(key, values = {}) {
    // Vue makes this small state object observable; core code needs no Vue import.
    const locale = state.locale;
    const revision = state.revision;
    try {
      validateValues(values);
    } catch (error) {
      report(`values:${locale}:${key}`, error);
      return unavailable();
    }
    for (const candidate of new Set([locale, defaultLocale])) {
      const message = packs.get(candidate)?.get(key);
      if (!message) {
        report(`missing:${candidate}:${key}`, revision);
        continue;
      }
      try {
        const result = message.format(values);
        if (typeof result !== "string") throw new TypeError("Plain messages must produce text");
        return result;
      } catch (error) {
        report(`format:${candidate}:${key}`, error);
      }
    }
    return unavailable();
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

  for (const [locale, catalog] of Object.entries(catalogs)) registerLocale(locale, catalog);
  return { state, t, setLocale, registerLocale, initialize };
}
