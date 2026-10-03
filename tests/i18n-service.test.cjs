'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const Vue = require('vue');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const strip = source => source.replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
let IntlMessageFormat;
test.before(async () => { ({ IntlMessageFormat } = await import('intl-messageformat')); });

function setup(catalogs = {
  en: { 'common.messageUnavailable': 'Unavailable.', label: 'English', amount: 'Amount: {value}' },
  'zh-CN': { label: '中文', amount: '数量：{value}' },
}) {
  const warnings = [];
  const context = vm.createContext({ IntlMessageFormat, Intl, console });
  vm.runInContext(`${strip(read('i18n/service.js'))}\nthis.create = createI18n;`, context);
  return { service: context.create({ catalogs, warn: (...args) => warnings.push(args) }), warnings, context };
}

test('ICU selects and plurals use the requested language', () => {
  const { service } = setup({
    en: { items: '{count, plural, one {# item} other {# items}}', mode: '{mode, select, paused {Paused} other {Running}}' },
    'zh-CN': { items: '{count, plural, other {# 个物品}}', mode: '{mode, select, paused {暂停} other {运行}}' },
  });
  assert.equal(service.t('items', { count: 1 }), '1 item');
  assert.equal(service.t('items', { count: 2 }), '2 items');
  assert.equal(service.setLocale('zh-CN'), true);
  assert.equal(service.t('items', { count: 2 }), '2 个物品');
  assert.equal(service.t('mode', { mode: 'paused' }), '暂停');
});

test('partial packs fall back to English and deduplicate warnings', () => {
  const { service, warnings } = setup({ en: { onlyEnglish: 'Still readable' }, 'zh-CN': {} });
  service.setLocale('zh-CN');
  assert.equal(service.t('onlyEnglish'), 'Still readable');
  assert.equal(service.t('onlyEnglish'), 'Still readable');
  assert.equal(warnings.length, 1);
});

test('malformed replacement packs are rejected atomically', () => {
  const { service } = setup();
  service.setLocale('zh-CN');
  const revision = service.state.revision;
  assert.equal(service.registerLocale('zh-CN', { label: 'Changed', broken: '{' }), false);
  assert.equal(service.state.revision, revision);
  assert.equal(service.t('label'), '中文');
  assert.equal(service.setLocale('nonexistent'), false);
  assert.equal(service.state.locale, 'zh-CN');
});

test('huge Decimal values are preformatted and never implicitly converted', () => {
  const { service } = setup();
  const huge = new Decimal('(e^17)266.3176063805634');
  let conversions = 0;
  huge.valueOf = () => { conversions++; throw new Error('Implicit Decimal conversion'); };
  assert.equal(service.t('amount', { value: huge.toString() }), `Amount: ${huge.toString()}`);
  assert.equal(service.t('amount', { value: huge }), 'Unavailable.');
  assert.equal(service.t('amount', { value: Infinity }), 'Unavailable.');
  assert.equal(service.t('amount', { value: Number.MAX_SAFE_INTEGER + 1 }), 'Unavailable.');
  assert.equal(conversions, 0);
});

test('storage read and write failures do not stop a language switch', () => {
  const { service } = setup();
  const document = { documentElement: {} };
  service.initialize({
    document,
    storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } },
  });
  assert.equal(service.t('label'), 'English');
  assert.equal(service.setLocale('zh-CN'), true);
  assert.equal(service.t('label'), '中文');
  assert.equal(document.documentElement.lang, 'zh-CN');
  assert.equal(document.documentElement.dir, 'ltr');
});

test('language preference survives a new service independently of gameplay state', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const first = setup().service;
  first.initialize({ storage });
  first.setLocale('zh-CN');
  assert.deepEqual([...values], [['ade.language', 'zh-CN']]);
  const second = setup().service;
  second.initialize({ storage });
  assert.equal(second.state.locale, 'zh-CN');
  assert.equal(second.t('label'), '中文');
});

test('Vue computed consumers refresh on locale and active catalog changes without ticks', async () => {
  const { service } = setup();
  Vue.observable(service.state);
  const view = new Vue({ computed: { label: () => service.t('label') } });
  assert.equal(view.label, 'English');
  service.setLocale('zh-CN');
  await Vue.nextTick();
  assert.equal(view.label, '中文');
  service.registerLocale('zh-CN', { label: '更新' });
  await Vue.nextTick();
  assert.equal(view.label, '更新');
  view.$destroy();
});

test('TextRef resolves old strings and dynamic values without freezing the language', () => {
  const { service, context } = setup();
  context.t = service.t;
  vm.runInContext(`${strip(read('i18n/text-ref.js'))}\nthis.ref = textRef; this.resolve = resolveText;`, context);
  let value = 'ee100';
  const reference = context.ref('amount', () => ({ value }));
  assert.equal(context.resolve('legacy'), 'legacy');
  assert.equal(context.resolve(() => 'legacy function'), 'legacy function');
  assert.equal(context.resolve(reference), 'Amount: ee100');
  service.setLocale('zh-CN');
  value = '(e^17)266';
  assert.equal(context.resolve(reference), '数量：(e^17)266');
});

test('even a failing diagnostic callback cannot turn missing messages into exceptions', () => {
  const { context } = setup();
  const service = context.create({ catalogs: { en: {} }, warn() { throw Error('bad logger'); } });
  assert.equal(service.t('missing'), 'Message unavailable.');
});

test('cached DescriptionDisplay text refreshes while the simulation is paused', async () => {
  const { service, context } = setup();
  context.t = service.t;
  context.wordShift = { wordCycle: () => 'scrambled' };
  vm.runInContext(`${strip(read('i18n/text-ref.js'))}\nthis.ref = textRef;`, context);
  const script = read('components/DescriptionDisplay.vue').split('<script>')[1].split('</script>')[0];
  vm.runInContext(script.replace(/^import .*;\s*$/gm, '').replace('export default', 'this.component ='), context);
  Vue.observable(service.state);
  const view = new Vue({
    ...context.component,
    propsData: { config: { description: context.ref('amount', { value: 'ee100' }) } },
    computed: { ...context.component.computed, $i18nRevision: () => service.state.revision },
  });
  assert.equal(view.description, 'Amount: ee100');
  service.setLocale('zh-CN');
  await Vue.nextTick();
  assert.equal(view.description, '数量：ee100');
  view.$props.config = { description: () => 'press * here', scrambleText: ['a', 'b'] };
  await Vue.nextTick();
  assert.equal(view.description, 'Press scrambled here');
  view.$destroy();
});
