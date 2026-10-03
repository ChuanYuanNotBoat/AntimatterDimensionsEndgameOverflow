"use strict";
const assert = require("node:assert/strict");
const { test, before } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Vue = require("vue");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
let IntlMessageFormat;
before(async () => { ({ IntlMessageFormat } = await import("intl-messageformat")); });

function setup(catalogs, rules) {
  const context = vm.createContext({ IntlMessageFormat, Intl, Map, Set, console });
  vm.runInContext(read("src/i18n/service.js").replace(/^import .*;$/gm, "").replace(/^export /gm, "") +
    "\nthis.create = createI18n;", context);
  const service = context.create({ catalogs, warn() {} });
  context.I18n = service;
  const displayContext = vm.createContext({ ...context, rules });
  vm.runInContext(read("src/i18n/legacy-display.js").replace(/^export /gm, "") +
    "\nthis.legacy = createLegacyDisplay(I18n, rules);", displayContext);
  return { service, display: displayContext.legacy, context };
}

function actual() {
  const catalogs = {};
  for (const locale of ["en", "zh-CN"]) {
    catalogs[locale] = JSON.parse(read(`src/locales/${locale}.json`));
  }
  const terms = JSON.parse(read("src/i18n/display-terms.json"));
  return setup(catalogs, [...terms, ...JSON.parse(read("src/i18n/adechinese-rules.json"))]);
}

test("ADEChinese covers header currencies, automation, dimensions, and descriptions without mutating canonical inputs", () => {
  const { service, display } = actual();
  const autobuyer = { name: "Infinity", mode: 0 };
  const original = JSON.stringify(autobuyer);
  service.setLocale("zh-CN");
  assert.equal(display.translate("Automatic Reality", "RealityAutobuyerBox"), "自动现实");
  assert.equal(display.translate("1st", "ModernInfinityDimensionRow"), "第一");
  assert.equal(display.translate("Infinity Points"), "无限点数");
  assert.equal(display.translate("Nebulae"), "终结之星");
  assert.equal(display.translate("Auto Tesseract ON", "ModernInfinityDimensionsTab"), "自动购买超立方体: 开启");
  assert.match(display.translate("You are getting (e^17)266 antimatter per second.", "HeaderCenterContainer"),
    /你每秒获得 \(e\^17\)266 反物质/u);
  assert.match(display.translate("1st and 8th Matter Dimensions gain a multiplier based on Infinities"), /物质/u);
  assert.equal(JSON.stringify(autobuyer), original);
  service.setLocale("en");
  assert.equal(display.translate("Automatic Reality"), "Automatic Reality");
  assert.equal(display.translate("1st"), "1st");
});

test("ambiguous translations are scoped, with unchanged English when there is no safe match", () => {
  const { service, display } = setup({ en: { a: "State", b: "State" }, "zh-CN": { a: "状态甲", b: "状态乙" } },
    [{ id: "a", source: "State", global: false, scopes: ["A"] },
      { id: "b", source: "State", global: false, scopes: ["B"] }]);
  service.setLocale("zh-CN");
  assert.equal(display.translate("State", "A"), "状态甲");
  assert.equal(display.translate("State", "B"), "状态乙");
  assert.equal(display.translate("State", "Other"), "State");
  const decimal = { toString() { throw Error("Never coerce model values"); } };
  assert.equal(display.translate(decimal), decimal);
  assert.equal(display.translate("New fork state"), "New fork state");
});

test("user names and command-like text stay intact in captured values and macros", () => {
  const { service, display } = setup({ en: { term: "Infinity", welcome: "Welcome %name; $1!", script: "Running {p0}" },
    "zh-CN": { term: "无限", welcome: "欢迎 %name；$1！", script: "正在运行 {p0}" } },
  [{ id: "term", source: "Infinity", global: true, scopes: [] },
    { id: "welcome", source: "Welcome %name; $1!", global: true, scopes: [] },
    { id: "script", source: "Running {p0}", protectedParameters: ["p0"], global: true, scopes: [] }]);
  service.setLocale("zh-CN");
  assert.equal(display.translate("Running Infinity"), "正在运行 Infinity");
  assert.equal(display.translate("Welcome $1; Infinity!"), "欢迎 $1；无限！");
  assert.equal(display.translate("auto infinity 1e309"), "auto infinity 1e309");
});

test("cached display translations invalidate on pack replacement and language switching", () => {
  const { service, display } = setup({ en: { label: "Label" }, "zh-CN": { label: "标签" } },
    [{ id: "label", source: "Label", global: true, scopes: [] }]);
  service.setLocale("zh-CN");
  assert.equal(display.translate("Label"), "标签");
  service.registerLocale("zh-CN", { label: "新标签" });
  assert.equal(display.translate("Label"), "新标签");
  service.setLocale("en");
  assert.equal(display.translate("Label"), "Label");
});

test("rich messages reorder the original styled VNodes while paused, with no markup from catalogs", async () => {
  const { service, context } = setup({ en: { rich: "Magnitude {p0}; power {p1}; threshold {p2}." },
    "zh-CN": { rich: "因子 {p0}；高于 {p2} 时指数 {p1}。" } }, []);
  Vue.observable(service.state);
  vm.runInContext(read("src/i18n/localized-text.js").replace(/^import .*;$/gm, "").replace(/^export /gm, "") +
    "\nthis.component = LocalizedText;", context);
  let calls = 0;
  const view = new Vue({
    render(h) {
      return h("p", [h(context.component, { props: { id: "rich" }, scopedSlots: {
        p0: () => { calls++; return [h("span", { class: "magnitude" }, "1.000")]; },
        p1: () => [h("b", "0.100")], p2: () => [h("em", "ee318")]
      } })]);
    }
  });
  const text = node => node.text ?? (node.children ?? []).map(text).join("");
  const english = view._render();
  assert.equal(text(english), "Magnitude 1.000; power 0.100; threshold ee318.");
  assert.equal(calls, 1);
  service.setLocale("zh-CN");
  await Vue.nextTick();
  const translated = view._render();
  assert.equal(text(translated), "因子 1.000；高于 ee318 时指数 0.100。");
  assert.equal(translated.children.find(node => node.tag === "span").data.class, "magnitude");
  assert.equal(translated.children.filter(node => node.tag).map(node => node.tag).join(","), "span,em,b");
  view.$destroy();
});

test("generic patterns cannot split multiword resource names into smaller matching terms", () => {
  const { service, display } = setup({
    en: { "terms.ip": "Infinity Points", "terms.cip": "Celestial Infinity Points",
      short: "You have {p0} Infinity Points.", full: "You have {p0} Celestial Infinity Points." },
    "zh-CN": { "terms.ip": "无限点数", "terms.cip": "天界无限点数",
      short: "你有 {p0} [[terms.ip]]。", full: "你有 {p0} [[terms.cip]]。" }
  }, [
    { id: "terms.ip", global: true, scopes: [] }, { id: "terms.cip", global: true, scopes: [] },
    { id: "short", global: true, scopes: ["short"] }, { id: "full", global: false, scopes: ["full"] }
  ]);
  service.setLocale("zh-CN");
  assert.equal(display.translate("Celestial Infinity Points"), "天界无限点数");
  assert.equal(display.translate("You have ee400 Celestial Infinity Points.", "short"),
    "You have ee400 Celestial Infinity Points.");
  assert.equal(display.translate("You have ee400 Celestial Infinity Points.", "full"), "你有 ee400 天界无限点数。");
  assert.equal(display.translate("You have ee400 Infinity Points.", "short"), "你有 ee400 无限点数。");
});

test('short conjunction templates cannot reorder paragraphs or split named resources', () => {
  const { service, display } = actual();
  service.setLocale('zh-CN');
  const unknown = 'New game systems and future rewards are described together in this paragraph.';
  assert.equal(display.translate(unknown, 'EffarigTab'), unknown);
  assert.equal(display.translate('1e100 Relic Shards'), '1e100 遗迹碎片');
  assert.equal(display.translate('1e100 Celestial Infinity Points'), '1e100 天界无限点数');
  assert.equal(display.translate('Unreleased Infinity Points'), 'Unreleased Infinity Points');
  service.setLocale('en');
  assert.equal(display.translate('1e100 Relic Shards'), '1e100 Relic Shards');
});
