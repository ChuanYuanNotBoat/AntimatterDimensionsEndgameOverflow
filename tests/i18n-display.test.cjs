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

test("reported Hell, analysis and Infinity upgrade messages translate complete sentences and restore English", () => {
  const { service, display } = actual();
  service.setLocale("zh-CN");
  assert.equal(service.t("slabdrill.core.changeTabs"), "切换页面");
  assert.equal(service.t("analysis.view.exponent"), "指数");
  assert.equal(display.translate("Slabdrill core multiplier override", "MultiplierBreakdownEntry"), "地狱维度倍率覆盖");
  assert.match(service.t("slabdrill.core.huntStatus", { amount: "7 混沌核心", chance: "0.01%", interval: "1 秒" }), /7 混沌核心.*0\.01%.*1 秒/u);
  for (const matter of ["antimatter", "matter"]) {
    for (const state of ["normal", "cursed"]) {
      const parameters = { state, matter, first: "1", second: "8" };
      assert.match(service.t("infinityUpgrades.dimensions.description", parameters), /获得基于无限次数的倍率加成/u);
      assert.doesNotMatch(service.t("infinityUpgrades.skipGalaxy.description", { state, matter, count: "4" }), /Start|Dimension|Antimatter/u);
    }
    assert.match(service.t("infinityUpgrades.buyTen.description", { matter, count: "10" }), /每购买 10 个/u);
  }
  assert.match(service.t("infinityUpgrades.ipMult.softcap", { amount: "1e3000000" }), /1e3000000 无限点数/u);
  assert.match(service.t("infinityUpgrades.ipMult.hardcap", { amount: "1e6000000" }), /无法继续购买/u);
  service.setLocale("en");
  assert.equal(service.t("analysis.view.exponent"), "Exponents");
  assert.equal(service.t("slabdrill.core.changeTabs"), "Change Tabs");
  assert.match(service.t("infinityUpgrades.dimensions.description", {
    state: "normal", matter: "matter", first: "1", second: "8"
  }), /Matter Dimensions/u);
});

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

test('all dimension row names retain their ordinal and whole resource name', () => {
  const { service, display } = actual();
  service.setLocale('zh-CN');
  const ordinals = ['第一','第二','第三','第四','第五','第六','第七','第八','第九'];
  for (const resource of [['Antimatter Dimension','反物质维度'],['Infinity Dimension','无限维度'],['Matter Dimension','正物质维度']]) {
    for (let tier = 1; tier <= 9; tier++) {
      const suffix = tier === 1 ? 'st' : tier === 2 ? 'nd' : tier === 3 ? 'rd' : 'th';
      assert.equal(display.translate(`${tier}${suffix} ${resource[0]}`), ordinals[tier-1]+resource[1]);
    }
  }
  const scaling = 'Increased Galaxy cost scaling: Exponential scaling past 5,151,048 (remote), quadratic scaling past e100 (distant)';
  assert.equal(display.translate(scaling, 'ModernAntimatterGalaxyRow'), scaling);
});

// Compile the real component templates: catalog-only tests miss leftover sentence tails.
function renderComponent(file, state = {}, globals = {}, computed = {}) {
  const compiler = require('vue-template-compiler');
  const parsed = compiler.parseComponent(read(file));
  const runtime = actual();
  Vue.observable(runtime.service.state);
  const passSlots = { functional: true, render(h, c) {
    return h('div', Object.values(c.scopedSlots).flatMap(slot => slot()) || c.children);
  } };
  const imports = Object.fromEntries([...parsed.script.content.matchAll(/^import (\w+).*;$/gm)]
    .map(match => [match[1], passSlots]));
  const context = vm.createContext({ Decimal: require('break_eternity.js'), ...imports, ...globals });
  const options = vm.runInContext(parsed.script.content.replace(/^import .*;$/gm, '')
    .replace('export default', 'this.options ='), context);
  vm.runInContext(read('src/i18n/localized-text.js').replace(/^import .*;$/gm, '').replace(/^export /gm, '') +
    '\nthis.component = LocalizedText;', runtime.context);
  const compiled = compiler.compile(parsed.template.content);
  assert.deepEqual(compiled.errors, []);
  options.render = vm.runInContext(`(function() { ${compiled.render} })`, context);
  options.staticRenderFns = compiled.staticRenderFns.map(code => vm.runInContext(`(function() { ${code} })`, context));
  const view = new Vue({ ...options, created: undefined, watch: undefined,
    propsData: Object.fromEntries(Object.keys(options.props || {}).filter(key => key in state).map(key => [key, state[key]])),
    components: { ...options.components, LocalizedText: runtime.context.component },
    computed: { $locale: () => runtime.service.state.locale, ...options.computed, ...computed },
    methods: { ...options.methods, ...Object.fromEntries(Object.entries(globals).filter(([,value]) => typeof value === "function")),
      $t: runtime.service.t, $recompute() {},
      $legacyText: (value, scope = options.name) => runtime.display.translate(value, scope) }
  });
  Object.assign(view, state);
  const text = node => node.text ?? (node.children ?? []).map(text).join('');
  return { ...runtime, view, render: () => text(view._render()).replace(/\s+/gu, ' ').trim() };
}

test('all continuum branches render exactly one complete sentence across locale switches', () => {
  const groups = { antimatterDimension: Object.assign(() => {}, { groupName: 'Antimatter Dimensions' }),
    infinityDimension: Object.assign(() => {}, { groupName: 'Infinity Dimensions' }),
    timeDimension: Object.assign(() => {}, { groupName: 'Time Dimensions' }) };
  for (const [group, flipped, resource] of [
    ['antimatterDimension', false, '反物质维度'], ['antimatterDimension', true, '正物质维度'],
    ['infinityDimension', false, '无限维度'], ['timeDimension', false, '时间维度']
  ]) {
    const type = groups[group];
    const { service, render, view } = renderComponent('src/components/tabs/autobuyers/MultipleAutobuyersBox.vue',
      { type, continuumActive: true, infinityContinuumUnlocked: true, timeContinuumUnlocked: true, isFlipped: flipped },
      { Autobuyer: groups });
    const english = render();
    assert.match(english, /now automatically and continuously scale/u);
    service.setLocale('zh-CN');
    const chinese = render();
    assert.ok(chinese.includes(resource));
    assert.equal((chinese.match(/连续统将取代/g) || []).length, 1);
    assert.doesNotMatch(chinese, /[A-Za-z]|\$\{/u);
    service.setLocale('en');
    assert.equal(render(), english);
    view.$destroy();
  }
});

test('glyph alteration renders one explanation and the translated sacrifice cap', () => {
  const { service, render, view } = renderComponent('src/components/tabs/glyphs/SacrificedGlyphs.vue',
    { hasAlteration: true, maxSacrifice: new (require('break_eternity.js'))(12345) },
    { format: value => String(value), GlyphAlteration: { additionThreshold: 10, empowermentThreshold: 20,
      boostingThreshold: 30, baseAdditionColor: () => '', baseEmpowermentColor: () => '', baseBoostColor: () => '' } },
    { isDoomed: () => false, types: () => [] });
  const english = render();
  assert.equal((english.match(/when their Glyph type/g) || []).length, 1);
  service.setLocale('zh-CN');
  assert.doesNotMatch(render(), /when their|All effects from|Glyph type/u);
  assert.equal((render().match(/某个效果将得到提升/g) || []).length, 1);
  assert.ok(render().includes('当符文献祭效果达到 12345 后'));
  service.setLocale('en');
  assert.equal(render(), english);
  view.$destroy();
});

test('generated glyph names localize known structured pieces without changing the glyph set', () => {
  const glyphs = ['reality','effarig','time','infinity','infinity'].map((type, id) => ({ type, id, effects: 0 }));
  const canonical = JSON.stringify(glyphs);
  const { service, view, render } = renderComponent('src/components/GlyphSetName.vue',
    { glyphSet: glyphs, slotCount: 5 },
    { Pelle: { isDoomed: false }, BASIC_GLYPH_TYPES: ['power','infinity','replication','time','dilation'],
      Glyphs: { isMusicGlyph: () => false }, getSingleGlyphEffectFromBitmask: () => true },
    { textStyle: () => ({}) });
  assert.equal(render(), 'Real Meta Transient Infinity');
  service.setLocale('zh-CN');
  assert.equal(render(), '现实 元神 刹那 无限');
  service.setLocale('en');
  assert.equal(render(), 'Real Meta Transient Infinity');
  assert.equal(JSON.stringify(glyphs), canonical);
  view.$destroy();
});

test('rich messages retain styled slots while selecting singular/plural limits', () => {
  const { service, context } = actual();
  vm.runInContext(read('src/i18n/localized-text.js').replace(/^import .*;$/gm, '').replace(/^export /gm, '') +
    '\nthis.component = LocalizedText;', context);
  for (const count of [0, 1, 2]) for (const each of [false, true]) {
    const view = new Vue({ render(h) {
      return h('p', [h(context.component, { props: { id: 'glyphs.uniqueLimit', values: { count, each } },
        scopedSlots: { p0: () => [String(count)], p1: () => [h('span', { class: 'colored-type' }, 'Effarig')] }
      })]);
    } });
    const text = node => node.text ?? (node.children ?? []).map(text).join('');
    service.setLocale('en');
    assert.match(text(view._render()), new RegExp(` ${count === 1 ? 'Glyph' : 'Glyphs'} equipped`));
    service.setLocale('zh-CN');
    const node = view._render();
    assert.equal(text(node), `你不能${each ? '分别' : ''}装备超过 ${count} 个Effarig符文。`);
    assert.equal(node.children.find(n => n.tag === 'span').data.class, 'colored-type');
    view.$destroy();
  }
});

test('the actual special-Glyph limit template renders both styled types and its complete translated sentence', () => {
  const { service, view, render } = renderComponent('src/components/tabs/glyphs/CurrentGlyphEffects.vue',
    { hasEffarig: true, hasReality: true, maxSpecialGlyphs: 1 },
    { formatInt: value => String(value), GlyphAppearanceHandler: { getBorderColor: () => '#123456' } },
    { glyphSet: () => [], pelleGlyphText: () => '', slabbyGlyphText: () => '', showChaosText: () => false });
  assert.ok(render().includes('You cannot have more than 1 Effarig or Reality Glyph equipped each.'));
  service.setLocale('zh-CN');
  assert.ok(render().includes('你不能分别装备超过 1 个鹿颈长 或 现实符文。'));
  assert.doesNotMatch(render(), /You cannot|Glyph equipped/u);
  service.setLocale('en');
  assert.ok(render().includes('You cannot have more than 1 Effarig or Reality Glyph equipped each.'));
  view.$destroy();
});

test('Replicanti effect templates translate all six complete descriptions and preserve multiplier/power slots', () => {
  const Decimal = require('break_eternity.js');
  for (const power of [false, true]) {
    const { service, view, render } = renderComponent('src/components/tabs/replicanti/ReplicantiTab.vue',
      { isUnlocked: true, hasTDMult: true, hasDTMult: true, hasIPMult: true, hasDEMult: true, hasSTMult: true,
        hasPow: power, hasTDPow: power, hasDTPow: power, hasIPPow: power, hasDEPow: power, hasSTPow: power,
        mult: new Decimal(123), multTD: new Decimal(234), multDT: new Decimal(345),
        multIP: new Decimal(456), multDE: new Decimal(567), multST: new Decimal(678),
        pow: 1.5, powTD: 1.6, powDT: 1.7, powIP: 1.8, powDE: 1.9, powST: 2 },
      { format: value => String(value), formatInt: value => String(value), formatX: value => `×${value}`,
        formatPow: value => `^${value}`, GlyphAlteration: { isAdded: () => true } },
      { isDoomed: () => false, hasMaxText: () => false, replicantiChanceSetup: () => ({}),
        replicantiIntervalSetup: () => ({}), maxGalaxySetup: () => ({}) });
    const english = render();
    assert.equal((english.match(/ multiplier /g) || []).length, 6);
    assert.equal((english.match(/ power /g) || []).length, power ? 6 : 0);
    service.setLocale('zh-CN');
    const chinese = render();
    assert.equal((chinese.match(/倍率加成/g) || []).length, 6);
    assert.equal((chinese.match(/指数加成/g) || []).length, power ? 6 : 0);
    assert.doesNotMatch(chinese, /multiplier|on all|from Glyphs|from an Alpha|from a Compression/u);
    for (const amount of [123,234,345,456,567,678]) assert.ok(chinese.includes(`×${amount}`));
    service.setLocale('en');
    assert.equal(render(), english);
    view.$destroy();
  }
});

test('imported reference expressions never appear as literal JavaScript in display translations', () => {
  const { service, display } = actual();
  service.setLocale('zh-CN');
  assert.doesNotMatch(read('src/locales/zh-CN.json'), /this\.isFlipped/u);
  assert.match(display.translate('Matter Dimension Autobuyers can have their bulk upgraded once interval is below 100 ms.'),
    /正物质维度.*100 毫秒/u);
  assert.match(display.translate('Antimatter Dimension Autobuyers can have their bulk upgraded once interval is below 100 ms.'),
    /反物质维度.*100 毫秒/u);
});

test('Hadron quantities render available and additional amounts without a template Decimal constructor', () => {
  const { service, view, render } = renderComponent('src/components/tabs/celestial-laitela/HadronsPane.vue',
    { lightHadrons: 10, totalLightHadrons: 14, darkHadrons: 20, totalDarkHadrons: 25,
      exoticHadrons: 30, totalExoticHadrons: 36, hasDark: true, hasExotic: true },
    { formatHybridSmall: value => String(value), format: value => String(value), formatDecimalPercents: () => '0%' },
    { hadronTime: () => '1h', effect5Text: () => '', effect5Percent: () => 0 });
  const english = render();
  assert.ok(english.includes('You have 10(+4) Light Hadrons.'));
  assert.ok(english.includes('You have 20(+5) Dark Hadrons.'));
  assert.ok(english.includes('You have 30(+6) Exotic Hadrons.'));
  service.setLocale('zh-CN');
  assert.ok(render().includes('你拥有 10(+4) 个强子。'));
  assert.ok(render().includes('你拥有 20(+5) 个暗强子。'));
  assert.ok(render().includes('你拥有 30(+6) 个奇迹强子。'));
  service.setLocale('en');
  assert.equal(render(), english);
  view.$destroy();
});

test('Replicanti upgrade autobuyer names use whole shared terms while canonical names remain English', () => {
  const { service, display } = actual();
  service.setLocale('zh-CN');
  for (const [canonical, translated] of [['Replicanti Chance','复制概率'],['Replicanti Interval','复制间隔'],
    ['Replicanti Max Galaxies','复制器星系上限']]) {
    const buyer = { name: canonical };
    assert.equal(display.translate(buyer.name, 'SingleAutobuyerInRow'), translated);
    assert.equal(buyer.name, canonical);
  }
});

test('reviewed ADEC messages preserve whole resources and reduction parameter meaning across locale changes', () => {
  const { service, display } = actual();
  const canonical = { dimension: 'Antimatter Dimensions', quantity: '2 Chaos Cores' };
  const before = JSON.stringify(canonical);
  const compression = () => service.t('ade.c1af03b6aff05402', { p0: display.translate(canonical.dimension) });
  const english = compression();
  service.setLocale('zh-CN');
  assert.equal((compression().match(/反物质维度/gu) ?? []).length, 1);
  assert.doesNotMatch(compression(), /维度维度/u);
  assert.equal(service.t('slabdrill.core.total', { amount: display.translate(canonical.quantity) }), '你拥有 2 混沌核心。');
  assert.match(service.t('slabdrill.core.enter'), /进入/u);
  assert.match(service.t('slabdrill.core.exit'), /离开/u);
  const transient = service.t('ade.c404c705d0ccd67f', { p0: '10', p1: '+2/s', p2: '', p3: '25%', p4: '' });
  assert.match(transient, /削弱\s+25%/u);
  assert.doesNotMatch(transient, /削弱至|Relativistic|Ephemeral/u);
  service.setLocale('en');
  assert.equal(compression(), english);
  assert.equal(JSON.stringify(canonical), before);
});

test('AD purchase tooltips translate zero, singular, huge counts and Continuum in both layouts while paused', () => {
  const Decimal = require('break_eternity.js');
  for (const layout of ['Modern', 'Classic']) for (const isFlipped of [false, true]) {
    const { service, view } = renderComponent(`src/components/tabs/antimatter-dimensions/${layout}AntimatterDimensionRow.vue`,
      { tier: 1, isFlipped }, { formatHybridLarge: value => String(value) });
    for (const amount of [0, 1, '1e1000']) {
      view.bought = new Decimal(amount);
      const canonical = String(view.bought);
      const english = view.boughtTooltip;
      service.setLocale('zh-CN');
      assert.equal(view.boughtTooltip, `已购买 ${canonical} 次`);
      service.setLocale('en');
      assert.equal(view.boughtTooltip, english);
      assert.equal(String(view.bought), canonical);
    }
    view.isContinuumActive = true;
    const english = view.boughtTooltip;
    service.setLocale('zh-CN');
    assert.equal(view.boughtTooltip, `连续统生产你的所有${isFlipped ? '正物质' : '反物质'}维度`);
    service.setLocale('en');
    assert.equal(view.boughtTooltip, english);
    view.$destroy();
  }
});

test('Galactic Power and Ra achievement descriptions select their reviewed context instead of generic fragments', () => {
  const { service, display } = actual();
  service.setLocale('zh-CN');
  assert.equal(display.translate('Increase Galaxy Strength', 'galactic-power:1'), '增强星系效力');
  assert.equal(display.translate('Galaxies are ×7.12e5 stronger', 'galactic-power:1'), '星系增强×7.12e5');
  assert.equal(display.translate('Get 1,000 total Ra Celestial Memory levels.', 'normal-achievements:246'),
    '太阳神的总记忆等级达到 1,000。');
});

test('achievement boost rows translate complete resource lists and preserve every multiplier and power', () => {
  const { service, view, render } = renderComponent('src/components/tabs/normal-achievements/NormalAchievementsTab.vue',
    { showPowers: true, achievementPower: 123, achPowers: 1.24, achMultToIDS: true, achMultToTDS: true,
      achMultToCDS: true, achMultToVDS: true, achMultToTP: true, achMultToBH: true, achMultToTT: true, achMultToEnt: true,
      achTPEffect: 234, achCDEffect: 345, achVDEffect: 456, achEnEffect: 567,
      achPowToTP: 1.25, achPowToCD: 1.26, achPowToVD: 1.27, achPowToEn: 1.28 },
    { formatX: value => `×${value}`, formatPow: value => `^${value}`, makeEnumeration: values => values.join(', '),
      timeDisplay() {}, timeDisplayNoDecimals() {}, cancelAnimationFrame() {} },
    { isDoomed: () => false, isDestroyed: () => false, renderedRows: () => [] });
  const english = render();
  service.setLocale('zh-CN');
  const chinese = render();
  assert.ok(chinese.includes('反物质维度、无限维度、时间维度：×123'));
  assert.ok(chinese.includes('时间之理产量：^1.24'));
  assert.doesNotMatch(chinese, /Dimensions|production|Generation|Power|Particles/u);
  for (const value of ['×123','×234','×345','×456','×567','^1.24','^1.25','^1.26','^1.27','^1.28']) assert.ok(chinese.includes(value));
  service.setLocale('en');
  assert.equal(render(), english);
  view.$destroy();
});

test('Flux consumes a complete translated sentence with its highlighted amount and speed', () => {
  const span = value => ({ toStringShort: () => String(value) });
  const { service, view, render } = renderComponent('src/components/tabs/statistics/StoredTimeTab.vue',
    { fluxUnlocked: true, fluxLevel: 7, maxFlux: 8 },
    { format: value => String(value), formatX: value => `×${value}`,
      TimeSpan: { fromSeconds: span, fromMinutes: span, fromHours: span } });
  const english = render();
  assert.ok(english.includes('6 seconds of Flux Time per real second'));
  service.setLocale('zh-CN');
  assert.ok(render().includes('每秒消耗 6 秒时间通量，使游戏速度达到实时速度的 ×7'));
  assert.doesNotMatch(render(), /of Flux Time|per real second|to provide/u);
  service.setLocale('en');
  assert.equal(render(), english);
  view.$destroy();
});

test('production expansion and Divinity TextRefs retain all separate reward lines across locale roundtrips', () => {
  const runtime = actual();
  const Decimal = require('break_eternity.js');
  Object.assign(runtime.context, { Decimal, t: runtime.service.t,
    format: value => String(value), formatInt: value => String(value), formatHybridLarge: value => String(value),
    formatX: value => `×${value}`, formatPow: value => `^${value}`, formatPercents: value => `${100 * value}%`,
    player: { universes: { current: 0 }, antimatter: new Decimal('1e600'), endgames: 10,
      reality: { imaginaryMachines: new Decimal('1e100') },
      records: { bestEndgame: { glyphLevel: new Decimal(30000), realTime: 50, galaxies: new Decimal('1e8') },
        bestAntimatterExponentOutsideDoom: new Decimal('1e500') },
      celestials: { laitela: { singularities: new Decimal('1e100') } } },
    Currency: { darkMatter: { value: new Decimal('1e100') } }, Tesseracts: { effectiveCount: 50 },
    DC: { E9E15: Decimal.pow10(9e15) },
    TimeSpan: { fromMilliseconds: value => ({ toStringShort: () => `${value} ms` }) } });
  vm.runInContext(stripImports(read('src/i18n/text-ref.js')) + '\nthis.resolve = resolveText;', runtime.context);
  for (const [file, name, field] of [
    ['endgame/expansion-packs', 'expansionPacks', 'description'],
    ['celestials/divinity-milestones', 'divinityMilestones', 'reward']
  ]) {
    vm.runInContext(stripImports(read(`src/core/secret-formula/${file}.js`)) + `\nthis.configs = ${name};`, runtime.context);
    for (const config of Object.values(runtime.context.configs)) {
      const english = runtime.context.resolve(config[field]);
      runtime.service.setLocale('zh-CN');
      const chinese = runtime.context.resolve(config[field]);
      assert.equal(chinese.split('\n').length, english.split('\n').length);
      assert.doesNotMatch(chinese, /Unlock|Multiply|Reduce|Gain|Currently|Hadrons|Dimensions|Machine|Matter|Endgame|Reality/u);
      assert.doesNotMatch(chinese, /\{p\d+\}|\[\[|undefined|NaN/u);
      runtime.service.setLocale('en');
      assert.equal(runtime.context.resolve(config[field]), english);
    }
  }
});

function stripImports(source) { return source.replace(/^import .*;$/gm, '').replace(/^export /gm, ''); }

test('Galactic Power formats small Decimal percentages and huge multipliers without native coercion', () => {
  const Decimal = require('break_eternity.js');
  const context = vm.createContext({ Decimal, DC: { NUMMAX: new Decimal(Number.MAX_VALUE) },
    formatX: value => `×${value}`, formatDecimalPercents: value => `${value.times(100)}%`,
    formatPercents() { throw Error('Native percentage formatter must not receive a Decimal'); } });
  vm.runInContext(stripImports(read('src/core/secret-formula/endgame/galactic-power.js')) +
    '\nthis.rewards = galacticPowerRewards;', context);
  for (const key of ['galaxyStrength', 'galaxyEmpowerment1', 'celestialGalaxyEmpowerment', 'galaxyEmpowerment2']) {
    assert.ok(context.rewards[key].formatEffect(new Decimal(1.25)).includes('25%'));
    assert.ok(context.rewards[key].formatEffect(new Decimal('1e1000')).includes('×1e1000'));
  }
});
