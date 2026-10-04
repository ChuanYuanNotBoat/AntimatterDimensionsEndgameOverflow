import { I18nAudit } from "./index";
import policy from "../../docs/i18n-audit-domains.json";
import displayRules from "./adechinese-rules.json";
import termRules from "./display-terms.json";

const scopesByKey = new Map([...displayRules, ...termRules].map(rule => [rule.id, rule.scopes]));
export function auditDomain(event) {
  if (policy.domains.some(domain => domain.id === event.domain)) return event.domain;
  const source = `${event.domain ?? ""} ${event.component ?? ""} ${event.key ?? ""} ${(scopesByKey.get(event.key) ?? []).join(" ")}`;
  return policy.domains.find(domain => new RegExp(domain.pattern, "iu").test(source))?.id ?? "shared";
}

// Display-only heuristics produce review candidates, never translation or gameplay decisions.
// A hash groups repeated output without recording text which could contain a player-entered name.
export function outputFingerprint(text) {
  let hash = 2166136261;
  for (const character of text.replace(/[\d.,]+/gu, "#")) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function inspectOutput(text, { locale, ...context }, record) {
  if (/\[\[[\w.|-]+\]\]|\{p\d+\}|[\uE000\uE001]/u.test(text)) {
    record({ ...context, locale, type: "parameter-error", reason: "unresolved-output", fingerprint: outputFingerprint(text) });
  }
  if (/\[object Object\]/u.test(text)) {
    record({ ...context, locale, type: "text-ref-error", reason: "object-output-candidate", fingerprint: outputFingerprint(text) });
  }
  if (!locale.startsWith("zh")) return;
  // Units, currencies, math/notation labels and proper names are reviewed separately.
  const prose = text.replace(/\b(?:Infinity|Infinite|NaN|Normal|ON|OFF|Auto|IP|EP|RM|CP|CIP|CEP|OoMs|ms|BH|EC|AD|ID|TD|UI|Glyph|Replicanti|Effarig|Lai|tela|Ra|Teresa|V)\b/gu, "")
    .replace(/\b[eE]\d+\b/gu, "");
  const words = prose.match(/[A-Za-z]{3,}/gu) ?? [];
  if (/[\u3400-\u9FFF]/u.test(text) && words.length) {
    record({ ...context, locale, type: "mixed-language-output", reason: "candidate", fingerprint: outputFingerprint(text) });
  } else if (words.length >= 2) {
    record({ ...context, locale, type: "english-fallback", reason: "unkeyed-output-candidate", fingerprint: outputFingerprint(text) });
  }
}

export function installBrowserAudit(windowRef, i18n) {
  // Core errors/fallbacks are always bounded in memory. DOM scanning is opt-in for QA.
  if (new URLSearchParams(windowRef.location.search).get("i18nAudit") !== "1") return;
  const documentRef = windowRef.document;
  // Final output is retained only in an explicitly enabled, local QA session.
  // The generic collector still stores no output or parameter values.
  const outputs = new Map();
  const record = (event, text) => {
    I18nAudit.record(event);
    const fingerprint = event.fingerprint ?? outputFingerprint(text);
    const token = `${event.locale}\0${event.key ?? ""}\0${event.component ?? ""}\0${event.location ?? ""}\0${fingerprint}`;
    if (outputs.has(token)) outputs.get(token).count++;
    else if (outputs.size < 500) outputs.set(token, { ...event, fingerprint, text: text.slice(0, 1000), count: 1 });
  };
  const englishResources = new Map();
  for (const rule of termRules) {
    const source = i18n.messageSource(rule.id, rule.form);
    if (source && /^[A-Za-z][A-Za-z -]* [A-Za-z -]+$/u.test(source)) {
      englishResources.set(source, { key: rule.id, pattern: new RegExp(`\\b${source}\\b`, "u") });
    }
  }
  const inspect = (text, context) => {
    inspectOutput(text, context, event => record(event, text));
    if (!context.locale?.startsWith("zh") || !/[\u3400-\u9FFF]/u.test(text)) return;
    for (const resource of englishResources.values()) if (resource.pattern.test(text)) {
      record({ ...context, type: "mixed-language-output", reason: "embedded-english-resource",
        reference: resource.key }, text);
    }
  };
  function sourceContext(element) {
    let current = element;
    let component;
    for (let depth = 0; current && depth < 8; depth++, current = current.parentElement) {
      if (current.__vue__?.$options.name) {
        component = current.__vue__.$options.name;
        break;
      }
    }
    const path = [];
    current = element;
    for (let depth = 0; current && depth < 4; depth++, current = current.parentElement) {
      const tag = current.tagName.toLowerCase();
      const position = current.parentElement ? Array.from(current.parentElement.children).indexOf(current) + 1 : 1;
      path.unshift(`${tag}:nth-child(${position})`);
    }
    return { component: component ?? "DOM", location: path.join(" > ") };
  }
  function scan(root = documentRef.body) {
    if (!root) return;
    const walker = documentRef.createTreeWalker(root, windowRef.NodeFilter.SHOW_TEXT);
    let node;
    let visited = 0;
    while ((node = walker.nextNode()) && visited++ < 10000) {
      const element = node.parentElement;
      if (!element || element.closest("script,style,code,pre,textarea,input,[contenteditable],.CodeMirror,.c-automator-editor,.c-news-ticker")) continue;
      if (!element.getClientRects().length) continue;
      inspect(node.textContent, { ...i18n.state, ...sourceContext(element) });
    }
    // Also inspect whole small display elements to catch phrases split across number/highlight slots.
    for (const element of root.querySelectorAll("button,label")) {
      if (element.textContent.length < 1000 && element.getClientRects().length) {
        inspect(element.textContent, { ...i18n.state, ...sourceContext(element) });
      }
    }
  }
  const severity = event => (["parameter-error", "text-ref-error", "catalog-error"].includes(event.type) ||
    event.type === "missing-key" && event.candidate === "en" ? "error" : "warning");
  const priority = event => (severity(event) === "error" ||
    ["mixed-language-output", "stale-locale-cache"].includes(event.type) ? "P1" : "P2");
  windowRef.__i18nAudit = { ...I18nAudit, scan,
    clear() {
      outputs.clear();
      I18nAudit.clear();
    },
    snapshot() {
      const report = I18nAudit.snapshot();
      const entries = report.entries.map(event => ({ ...event, domain: auditDomain(event), severity: severity(event), priority: priority(event) }));
      const domains = {};
      for (const event of entries) {
        const counts = domains[event.domain ?? "shared"] ??= {};
        counts[event.type] = (counts[event.type] ?? 0) + event.count;
      }
      return { ...report, entries, domains, outputs: [...outputs.values()].map(event => ({ ...event })) };
    },
    inspect(text, context = {}) { inspect(text, { ...i18n.state, ...context }); },
    translation(key, values, form, text, context = {}) {
      // Observe the existing formatter result; never change arguments, output, or exception behavior.
      try {
        const source = i18n.messageSource(key, form);
        if (typeof source === "string" && values && typeof values === "object" && Object.keys(values).length &&
            !Array.isArray(values)) {
          // The messageSource API intentionally exposes only plain messages. Complex ICU schemas
          // are checked statically; do not infer selector parameters from rendered text.
          const expected = new Set([...source.matchAll(/\{([\w]+)\}/gu)].map(match => match[1]));
          const extra = Object.keys(values).filter(name => !expected.has(name));
          if (extra.length) record({ ...i18n.state, ...context, key, form, type: "parameter-error", reason: "extra-parameters" }, text);
        }
        inspect(text, { ...i18n.state, ...context, key, form });
      } catch {
        // Diagnostic failure must not affect the rendering caller.
      }
    }
  };
  let scheduled = false;
  const observer = new windowRef.MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    windowRef.setTimeout(() => {
      scheduled = false;
      try {
        scan();
      } catch {
        // QA observers cannot interrupt the game.
      }
    }, 250);
  });
  observer.observe(documentRef.documentElement, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["lang"] });
}
