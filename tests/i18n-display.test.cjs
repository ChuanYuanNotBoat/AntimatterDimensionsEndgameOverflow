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
    computed: { ...options.computed, ...computed },
    methods: { ...options.methods, ...Object.fromEntries(Object.entries(globals).filter(([,value]) => typeof value === "function")),
      $t: runtime.service.t, $recompute() {},
      $legacyText: value => runtime.display.translate(value, options.name) }
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

test('Batch A/B scoped messages retain parameter order and roundtrip without competing scope rules', () => {
  const { service, display } = actual();
  const rules = JSON.parse(read('src/i18n/adechinese-rules.json')).filter(rule =>
    /^(dimensions\.(?:tooltip|buy|boost)\.|slabdrill\.(?:effects|condition|strike)\.|compression\.exit\.|endgame\.collider\.)/u.test(rule.id));
  assert.ok(rules.length > 50);
  for (const rule of rules) {
    const template = service.messageSource(rule.id, 'en', rule.form);
    const values = Object.fromEntries([...template.matchAll(/\{(p\d+)\}/gu)].map((m, i) => [m[1], `×${i + 2}.50`]));
    const canonical = template.replace(/\{(p\d+)\}/gu, (_, name) => values[name]);
    service.setLocale('zh-CN');
    assert.equal(display.translate(canonical, rule.scopes[0]), service.t(rule.id, values, rule.form), rule.id);
    service.setLocale('en');
    assert.equal(display.translate(canonical, rule.scopes[0]), canonical, rule.id);
  }
});

test('charged-upgrade hints and locked dimension prices preserve their actual meanings', () => {
  const { service } = actual(); service.setLocale('zh-CN');
  for (const key of ['ade.09d3c343a8f2191c','ade.0bc8be150b7e51fc']) {
    assert.match(service.t(key), /已充能/u); assert.doesNotMatch(service.t(key), /未充能/u);
  }
  for (const [key, resource] of [['ade.0e6c57db71518a7b','永恒点数'],['ade.bf16249a88df4a3b','永恒点数'],
    ['ade.2563bc10ad33d8f9','天界点数'],['ade.1be3f49bbe5e362c','无限点数']]) {
    assert.ok(service.t(key).includes(resource), key);
  }
});

test('both Infinity layouts render whole dimension targets in EC9 and flipped states', () => {
  const Decimal = require('break_eternity.js');
  for (const layout of ['Modern','Classic']) for (const isEC9Running of [false,true]) for (const isFlipped of [false,true]) {
    const { service, view, render } = renderComponent(`src/components/tabs/infinity-dimensions/${layout}InfinityDimensionsTab.vue`,
      { infinityPower: new Decimal(123), dimMultiplier: new Decimal(456), conversionRate: 7, isEC9Running, isFlipped,
        showLockedDimCostNote: false }, { format: String, formatX: x => `×${x}`, formatPow: x => `^${x}` });
    const english = render(); assert.match(english, isEC9Running ? /Time Dimensions due to Eternity Challenge 9/u : /(?:Anti)?[Mm]atter Dimensions/u);
    service.setLocale('zh-CN');
    assert.ok(render().includes(isEC9Running ? '时间维度' : isFlipped ? '正物质维度' : '反物质维度'));
    assert.doesNotMatch(render(), /Dimensions\.|Compression Upgrade|维度维度/u);
    service.setLocale('en'); assert.equal(render(), english); view.$destroy();
  }
});

test('Endgame unlock explanations and Void ANR retain prerequisites', () => {
  const { service } = actual(); service.setLocale('zh-CN');
  assert.match(service.t('ade.6fc343de35b1b8fb'), /权限会永久保留/u);
  assert.match(service.t('ade.38ca641dce4c5a63'), /未解锁.*已解锁.*Shift/u);
  assert.match(service.t('ade.633ed9379a3147be'), /抹除多元宇宙后.*ANR/u);
  assert.doesNotMatch(service.t('ade.633ed9379a3147be'), /1%/u);
});

test('unknown Tangible Universe stays a whole fallback and does not partially translate its suffix', () => {
  const { service, display } = actual(); service.setLocale('zh-CN');
  assert.equal(display.translate('Tangible Universe','EnterUniverseModal'), 'Tangible Universe');
  assert.equal(service.t('navigation.universes.transient'), '流幻宇宙');
  service.setLocale('en'); assert.equal(display.translate('Tangible Universe','EnterUniverseModal'), 'Tangible Universe');
});

test('Slabdrill uses finite display IDs and Compression confirmation uses its own context', () => {
  const { service, display } = actual(); service.setLocale('zh-CN');
  for (let id = 0; id <= 10; id++) assert.match(service.t(`slabdrill.strike.name.${id}`), /[\u3400-\u9fff]/u);
  for (const word of ['Infinite','Forever','Eternal']) assert.doesNotMatch(display.translate(`You are here ${word}`, 'SlabdrillStrike'), /You are here/u);
  assert.equal(display.translate('None','SlabdrillStrike'), '无');
  for (const key of ['compression.confirmation.disable','compression.confirmation.reenable']) {
    assert.match(service.t(key), /压缩确认/u); assert.doesNotMatch(service.t(key), /激能确认/u);
  }
});
