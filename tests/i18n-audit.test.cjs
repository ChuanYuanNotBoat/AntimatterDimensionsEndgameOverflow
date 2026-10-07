'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { test, before } = require('node:test');
const babel = require('@babel/core');
const { localized, enumerateKeys, parameterNames, domainFor } = require('../scripts/i18n-audit.cjs');
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
  context.policy = { domains: [] };
  context.displayRules = [];
  context.termRules = [];
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
test('static audit enumerates immutable key choices and leaves state-derived keys explicit', () => {
  const values = [];
  const ast = babel.parseSync(`const fixed = flag ? 'one' : 'two'; t(fixed); t(model.nameKey);`, { configFile: false, babelrc: false });
  babel.traverse(ast, { CallExpression({ node, scope }) { values.push(enumerateKeys(node.arguments[0], scope)); } });
  assert.deepEqual(values, [['one', 'two'], null]);
  const message = new IntlMessageFormat("Literal '{hidden}' {choice, select, a {{amount}} other {{count, number}}}", 'en');
  assert.deepEqual(parameterNames(message.getAst()), ['amount', 'choice', 'count']);
});

test('static audit normalizes Windows paths before domain classification and reviewed dependency matching', () => {
  assert.equal(domainFor('src\\core\\secret-formula\\news.js'), 'news-quotes-ending');
  assert.equal(domainFor('src\\core\\celestials\\quotes\\teresa.js'), 'news-quotes-ending');
  // Isolate the path simulation so it cannot affect the other tests or module loader.
  const output = execFileSync(process.execPath, ['-e', String.raw`
    const path = require('node:path');
    const relative = path.relative;
    path.relative = (...args) => relative(...args).replaceAll('/', '\\');
    require('./scripts/i18n-audit.cjs').audit().then(report => {
      const files = [...report.findings, ...report.candidates, ...Object.values(report.references).flat()];
      console.log(JSON.stringify({
        errors: report.findings.filter(finding => finding.severity === 'error'),
        reviewed: report.findings.filter(finding => finding.status === 'display-only')
          .map(({ file, type, expression }) => ({ file, type, expression })),
        nonPortablePaths: files.filter(entry => entry.file?.includes('\\')).map(entry => entry.file)
      }));
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000 });
  const report = JSON.parse(output);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.nonPortablePaths, []);
  assert.deepEqual(report.reviewed, [
    { file: 'src/i18n/vue-adapter.js', type: 'string-dependency', expression: 'result !== value' },
    { file: 'src/i18n/vue-adapter.js', type: 'string-dependency', expression: 'translated !== value' },
  ]);
});
test('opt-in browser reports retain bounded final output and extra parameters without changing the formatter', () => {
  const selector = "'{literal}' {choice, select, a {{amount}} other {{count, number}}}";
  const { service, audit, context } = setup({ en: { text: 'Value: {value}', selector, resource: 'Celestial Infinity Points' },
    'zh-CN': { text: '数量：{value}', selector } });
  Object.assign(context, { I18nAudit: audit, URLSearchParams, policy: { domains: [] }, displayRules: [], termRules: [{ id: 'resource' }] });
  vm.runInContext(`${strip(read('browser-audit.js'))}\nthis.install = installBrowserAudit;`, context);
  const windowRef = { location: { search: '?i18nAudit=1' }, document: { documentElement: {} },
    MutationObserver: class { observe() {} }, setTimeout };
  context.install(windowRef, service);
  service.setLocale('zh-CN');
  const output = service.t('text', { value: '123', unused: 'never-record-this-value' });
  windowRef.__i18nAudit.translation('text', { value: '123', unused: 'never-record-this-value' }, 'text', output, { component: 'Fixture' });
  const report = windowRef.__i18nAudit.snapshot();
  assert.equal(output, '数量：123');
  assert.equal(report.entries[0].reason, 'extra-parameters');
  assert.equal(report.entries[0].severity, 'error');
  assert.equal(report.outputs[0].text, output);
  assert.doesNotMatch(JSON.stringify(report), /never-record-this-value/);
  assert.doesNotMatch(JSON.stringify(audit.snapshot()), /数量/);
  windowRef.__i18nAudit.clear();
  assert.equal(windowRef.__i18nAudit.snapshot().outputs.length, 0);
  const selectorValues = { choice: 'a', amount: '2' };
  const selected = service.t('selector', selectorValues);
  windowRef.__i18nAudit.translation('selector', selectorValues, 'text', selected);
  assert.equal(windowRef.__i18nAudit.snapshot().totals['parameter-error'] ?? 0, 0);
  windowRef.__i18nAudit.translation('selector', { ...selectorValues, literal: 'not-an-argument' }, 'text', selected);
  assert.equal(windowRef.__i18nAudit.snapshot().totals['parameter-error'] ?? 0, 0,
    'complex ICU schemas remain in the static audit; the bridge must not guess');
  windowRef.__i18nAudit.inspect('数量：Celestial Infinity Points');
  windowRef.__i18nAudit.inspect('数量：Celestial Infinity');
  const embedded = windowRef.__i18nAudit.snapshot().entries.filter(entry => entry.reason === 'embedded-english-resource');
  assert.equal(embedded.length, 1);
  assert.equal(embedded[0].reference, 'resource');
  const normal = { location: { search: '' } };
  context.install(normal, service);
  assert.equal(normal.__i18nAudit, undefined);
});
test('Vue translation observation isolates a broken QA sink and preserves real formatter failures', () => {
  const { service, context } = setup();
  context.window = { __i18nAudit: { translation() { throw Error('observer'); } } };
  context.document = {};
  context.installBrowserAudit = () => {};
  context.LocalizedText = {};
  context.DisplayI18n = {};
  vm.runInContext(`${strip(fs.readFileSync(path.join(__dirname, '../src/i18n/vue-adapter.js'), 'utf8'))}\nthis.install = installI18n;`, context);
  let mixin;
  context.install({ component() {}, observable() {}, mixin(value) { mixin = value; } });
  service.setLocale('zh-CN');
  assert.equal(mixin.methods.$t.call({ $options: { name: 'Fixture' } }, 'text', { value: '123' }), '数量：123');
  const original = new Error('formatter');
  service.t = () => { throw original; };
  assert.throws(() => mixin.methods.$t.call({ $options: {} }, 'text'), error => error === original);
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
