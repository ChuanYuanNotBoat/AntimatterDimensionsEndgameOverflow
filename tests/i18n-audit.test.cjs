'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test, before } = require('node:test');
const babel = require('@babel/core');
const { localized } = require('../scripts/i18n-audit.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '../src/i18n', file), 'utf8');
const strip = text => text.replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
let IntlMessageFormat;
before(async () => { ({ IntlMessageFormat } = await import('intl-messageformat')); });
function setup(catalogs = { en: { full: 'Full English', text: 'Value: {value}', resource: 'Celestial Infinity Points' },
  'zh-CN': { text: '数量：{value}', term: '资源：[[resource]]', nested: '嵌套：[[term]]' } }) {
  const context = vm.createContext({ IntlMessageFormat, Intl, console });
  vm.runInContext(`${strip(read('audit.js'))}\nthis.audit = createI18nAudit();`, context);
  vm.runInContext(`${strip(read('service.js'))}\nthis.create = createI18n;`, context);
  const service = context.create({ catalogs, onDiagnostic: context.audit.record, warn() {} });
  context.I18n = service;
  context.t = service.t;
  return { service, audit: context.audit, context };
}
test('runtime distinguishes missing keys from successful English fallback, and retains revision/domain', () => {
  const { service, audit } = setup();
  audit.setContext({ domain: 'infinity', component: 'Fixture' });
  service.setLocale('zh-CN');
  assert.equal(service.t('full'), 'Full English');
  assert.equal(service.t('absent'), 'Message unavailable.');
  const report = audit.snapshot();
  assert.equal(report.totals['missing-key'], 3);
  assert.equal(report.totals['english-fallback'], 1);
  assert.ok(report.entries.every(entry => entry.locale === 'zh-CN' && entry.revision === service.state.revision && entry.domain === 'infinity'));
});
test('nested shared-term fallback is recorded for every consumer, including cached resolution', () => {
  const { service, audit } = setup();
  service.setLocale('zh-CN');
  assert.equal(service.t('nested'), '嵌套：资源：Celestial Infinity Points');
  assert.equal(service.t('term'), '资源：Celestial Infinity Points');
  const inherited = audit.snapshot().entries.filter(entry => entry.reason === 'reference');
  assert.equal(inherited.length, 2);
  assert.ok(inherited.every(entry => entry.reference === 'resource'));
  service.registerLocale('zh-CN', { resource: '天界无限点数', term: '资源：[[resource]]', nested: '嵌套：[[term]]' });
  audit.clear();
  assert.equal(service.t('nested'), '嵌套：资源：天界无限点数');
  assert.equal(audit.snapshot().entries.length, 0);
});
test('invalid values, missing parameters and rejected catalogs record errors without values', () => {
  const { service, audit } = setup();
  service.setLocale('zh-CN');
  assert.equal(service.t({ toString() { throw Error('must not coerce a malformed key'); } }), 'Message unavailable.');
  service.t('text', { value: { private: 'secret' } });
  service.t('text', {});
  service.registerLocale('zh-CN', { broken: '{' });
  const report = audit.snapshot();
  assert.ok(report.totals['parameter-error'] >= 2);
  assert.equal(report.totals['catalog-error'], 1);
  assert.doesNotMatch(JSON.stringify(report), /secret|private/);
});
test('fallback audit follows the selected grammatical form instead of unrelated variants', () => {
  const { service, audit } = setup({ en: { resource: 'English Resource', item: { text: 'Item', plural: 'Items' } },
    'zh-CN': { item: { text: '物品', plural: '[[resource]]' } } });
  service.setLocale('zh-CN');
  assert.equal(service.t('item'), '物品');
  assert.equal(audit.snapshot().entries.length, 0);
  assert.equal(service.t('item', {}, 'plural'), 'English Resource');
  const entry = audit.snapshot().entries[0];
  assert.equal(entry.form, 'plural');
  assert.equal(entry.referenceForm, 'text');
});
test('TextRef and parameter producers report failures and preserve the original exception contract', () => {
  const { audit, context } = setup();
  vm.runInContext(`${strip(read('text-ref.js'))}\nthis.resolve = resolveText; this.ref = textRef;`, context);
  assert.throws(() => context.resolve(42), /Expected a string/);
  const original = new Error('private exception text');
  assert.throws(() => context.resolve(context.ref('text', () => { throw original; })), error => error === original);
  assert.equal(audit.snapshot().totals['text-ref-error'], 2);
  assert.doesNotMatch(JSON.stringify(audit.snapshot()), /private exception/);
});
test('audit memory is bounded, deduplicated, redacted and snapshots cannot mutate it', () => {
  const { context } = setup();
  const audit = context.createI18nAudit({ limit: 2 });
  audit.setContext({ domain: 'safe', values: { private: 'secret' } });
  audit.record({ type: 'missing-key', key: 'one', values: { secret: 'private' }, text: 'private' });
  audit.record({ type: 'missing-key', key: 'one' });
  audit.record({ type: 'missing-key', key: 'two' });
  audit.record({ type: 'missing-key', key: 'three' });
  audit.record({ type: '__proto__', key: 'ignore' });
  const report = audit.snapshot();
  assert.equal(report.entries.length, 2);
  assert.equal(report.entries[0].count, 2);
  assert.equal(report.dropped, 1);
  assert.equal(report.totals['missing-key'], 4);
  assert.doesNotMatch(JSON.stringify(report), /private|secret/);
  report.entries[0].key = 'changed';
  assert.equal(audit.snapshot().entries[0].key, 'one');
  audit.clear();
  assert.equal(audit.snapshot().entries.length, 0);
});
test('broken audit sinks cannot alter message output, locale switching or catalog replacement', () => {
  const { context } = setup();
  const service = context.create({ catalogs: { en: { text: 'English' }, 'zh-CN': {} },
    warn() { throw Error('logger'); }, onDiagnostic() { throw Error('audit'); } });
  service.setLocale('zh-CN');
  assert.equal(service.t('text'), 'English');
  assert.equal(service.registerLocale('zh-CN', { text: '中文' }), true);
  assert.equal(service.t('text'), '中文');
});
test('stale cache stamps record errors; unchanged text alone never means stale', () => {
  const { audit } = setup();
  assert.equal(audit.checkCache({ locale: 'en', revision: 2, cachedLocale: 'en', cachedRevision: 2 }), true);
  assert.equal(audit.checkCache({ locale: 'zh-CN', revision: 3, cachedLocale: 'en', cachedRevision: 2 }), false);
  assert.equal(audit.checkCache({ locale: 'zh-CN', revision: 4, cachedLocale: 'zh-CN', cachedRevision: 3 }), false);
  assert.equal(audit.snapshot().totals['stale-locale-cache'], 2);
});
test('DOM heuristics separate mixed-language candidates, unkeyed fallback and unresolved slots', () => {
  const { context, audit } = setup();
  context.I18nAudit = audit;
  vm.runInContext(`${strip(read('browser-audit.js'))}\nthis.inspect = inspectOutput;`, context);
  for (const text of ['数量：1e100 IP', '主题：Normal', 'Infinity', '天界 Celestial Points', 'Pause autobuyers', '数量：\uE000p0\uE001']) {
    context.inspect(text, { locale: 'zh-CN', domain: 'fixture' }, audit.record);
  }
  const report = audit.snapshot();
  assert.equal(report.totals['mixed-language-output'], 1);
  assert.equal(report.totals['english-fallback'], 1);
  assert.equal(report.totals['parameter-error'], 1);
  assert.ok(report.entries.every(entry => entry.fingerprint && !entry.text));
});
test('static identity audit follows locally assigned translated values but preserves canonical names/tokens', () => {
  const detected = [];
  const ast = babel.parseSync(`const label = t('name'); model[label]; model[model.name];
    label === 'English'; token.name === 'EOF'; model[entry.displayName];`, { configFile: false, babelrc: false });
  babel.traverse(ast, { MemberExpression({ node, scope }) { if (node.computed) detected.push(localized(node.property, scope)); },
    BinaryExpression({ node, scope }) { detected.push(localized(node, scope)); } });
  assert.deepEqual(detected, [true, false, true, false, true]);
});
test('generic core has no ADE domain imports or gameplay globals', () => {
  for (const file of ['service.js', 'audit.js']) assert.doesNotMatch(read(file), /(?:from\s+["'].*(?:core|ade|display)|\b(?:player|GameUI|AutomatorBackend)\.)/u);
});
