// Generic, bounded diagnostics. No game state, clock, DOM, or locale-specific policy belongs here.
export function createI18nAudit({ limit = 500 } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError("Invalid audit limit");
  const entries = new Map();
  const totals = {};
  const types = new Set(["missing-key", "english-fallback", "mixed-language-output", "text-ref-error",
    "parameter-error", "stale-locale-cache", "catalog-error"]);
  let context = {};
  let dropped = 0;
  const fields = ["type", "locale", "revision", "key", "form", "candidate", "reference", "referenceForm", "reason", "error",
    "domain", "component", "location", "fingerprint", "cachedLocale", "cachedRevision"];

  function record(event) {
    if (!event || !types.has(event.type)) return;
    // Allowlisted metadata only: no raw text, parameter values, save data, or user scripts.
    const item = {};
    const source = { ...context, ...event };
    for (const field of fields) {
      const value = source[field];
      if (typeof value === "string") item[field] = value.slice(0, 160);
      else if (typeof value === "number" && Number.isSafeInteger(value)) item[field] = value;
    }
    totals[item.type] = Math.min(Number.MAX_SAFE_INTEGER, (totals[item.type] ?? 0) + 1);
    const token = JSON.stringify(item);
    const previous = entries.get(token);
    if (previous) previous.count = Math.min(Number.MAX_SAFE_INTEGER, previous.count + 1);
    else if (entries.size < limit) entries.set(token, { ...item, count: 1 });
    else dropped = Math.min(Number.MAX_SAFE_INTEGER, dropped + 1);
  }

  function checkCache({ locale, revision, cachedLocale, cachedRevision, ...details }) {
    if (locale === cachedLocale && revision === cachedRevision) return true;
    record({ ...details, type: "stale-locale-cache", locale, revision, cachedLocale, cachedRevision });
    return false;
  }

  return {
    record,
    checkCache,
    setContext(value = {}) {
      context = Object.fromEntries(["domain", "component", "location"]
        .filter(field => typeof value[field] === "string").map(field => [field, value[field].slice(0, 160)]));
    },
    snapshot() {
      return { version: 1, limit, dropped, totals: { ...totals }, entries: [...entries.values()].map(item => ({ ...item })) };
    },
    clear() {
      entries.clear();
      for (const key of Object.keys(totals)) delete totals[key];
      dropped = 0;
    }
  };
}
