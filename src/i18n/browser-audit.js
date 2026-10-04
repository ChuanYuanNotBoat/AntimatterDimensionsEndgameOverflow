import { I18nAudit } from "./index";

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
  function scan(root = documentRef.body) {
    if (!root) return;
    const walker = documentRef.createTreeWalker(root, windowRef.NodeFilter.SHOW_TEXT);
    let node;
    let visited = 0;
    while ((node = walker.nextNode()) && visited++ < 10000) {
      const element = node.parentElement;
      if (!element || element.closest("script,style,code,pre,textarea,input,[contenteditable],.CodeMirror,.c-automator-editor,.c-news-ticker")) continue;
      if (!element.getClientRects().length) continue;
      const vm = element.__vue__;
      inspectOutput(node.textContent, { ...i18n.state, component: vm?.$options.name ?? "DOM",
        location: element.tagName.toLowerCase() }, I18nAudit.record);
    }
    // Also inspect whole small display elements to catch phrases split across number/highlight slots.
    for (const element of root.querySelectorAll("button,label")) {
      if (element.textContent.length < 1000 && element.getClientRects().length) {
        inspectOutput(element.textContent, { ...i18n.state, location: element.tagName.toLowerCase() }, I18nAudit.record);
      }
    }
  }
  windowRef.__i18nAudit = { ...I18nAudit, scan,
    inspect(text, context = {}) { inspectOutput(text, { ...i18n.state, ...context }, I18nAudit.record); } };
  let scheduled = false;
  const observer = new windowRef.MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    windowRef.setTimeout(() => {
      scheduled = false;
      scan();
    }, 250);
  });
  observer.observe(documentRef.documentElement, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["lang"] });
}
