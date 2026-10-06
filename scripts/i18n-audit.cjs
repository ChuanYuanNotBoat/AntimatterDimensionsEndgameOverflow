'use strict';
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'docs/i18n-audit-domains.json'), 'utf8'));
const domainFor = value => policy.domains.find(domain => new RegExp(domain.pattern, 'iu').test(value))?.id ?? 'shared';
const scopesByKey = new Map();
for (const entry of JSON.parse(fs.readFileSync(path.join(root, 'docs/adechinese-sync.json'), 'utf8')).provenance) {
  scopesByKey.set(entry.id, [...new Set(entry.references.map(reference => reference.file))]);
}
const updateFile = path.join(root, 'docs/adec-translation-update.json');
const translationUpdate = fs.existsSync(updateFile) ? JSON.parse(fs.readFileSync(updateFile, 'utf8')) : null;
for (const entry of translationUpdate?.entries ?? []) if (entry.key) {
  scopesByKey.set(entry.key, [...new Set([...(scopesByKey.get(entry.key) ?? []), ...entry.references.map(reference => reference.file)])]);
}
for (const filename of ['adechinese-rules.json', 'display-terms.json']) {
  for (const rule of JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', filename), 'utf8'))) {
    scopesByKey.set(rule.id, [...new Set([...(scopesByKey.get(rule.id) ?? []), ...rule.scopes])]);
  }
}
function enumerateKeys(node, scope, seen = new Set()) {
  if (!node) return null;
  if (node.type === 'StringLiteral') return [node.value];
  if (node.type === 'ConditionalExpression') {
    const left = enumerateKeys(node.consequent, scope, seen), right = enumerateKeys(node.alternate, scope, seen);
    return left && right ? [...new Set([...left, ...right])] : null;
  }
  if (node.type === 'Identifier' && scope && !seen.has(node.name)) {
    const binding = scope.getBinding(node.name);
    if (binding?.constant && binding.path.node.type === 'VariableDeclarator') {
      return enumerateKeys(binding.path.node.init, scope, new Set([...seen, node.name]));
    }
  }
  return null;
}
function parameterNames(nodes) {
  const names = new Set();
  for (const node of nodes) {
    if (![0, 7].includes(node.type) && node.value) names.add(node.value);
    for (const option of Object.values(node.options ?? {})) for (const name of parameterNames(option.value)) names.add(name);
    if (node.children) for (const name of parameterNames(node.children)) names.add(name);
  }
  return [...names].sort();
}
const findings = [];
const keyReferences = [];
const calls = [];
const addFinding = finding => {
  const review = policy.reviewedDependencies.find(entry => entry.file === finding.file && entry.reason === finding.reason && entry.expressions.includes(finding.expression));
  const isError = !review && policy.acceptance.errors.includes(finding.type);
  findings.push({ domain: domainFor(`${finding.file ?? ''} ${finding.key ?? ''} ${(scopesByKey.get(finding.key) ?? []).join(' ')}`),
    severity: isError ? 'error' : 'warning', priority: finding.type === 'localized-identity-dependency' ? 'P0' :
      isError || ['mixed-language-output', 'adec-available-fallback'].includes(finding.type) ? 'P1' : 'P2', ...finding,
    ...(review ? { type: 'string-dependency', status: review.disposition } : {}) });
};
function localized(node, scope, seen = new Set()) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'CallExpression' && ['t', '$t', 'textRef', 'translate', 'resolveText'].includes(node.callee.name ?? node.callee.property?.name)) return true;
  if (node.type === 'MemberExpression' && node.property.name === 'displayName') return true;
  if (node.type === 'Identifier' && !seen.has(node.name)) {
    seen.add(node.name);
    const binding = scope.getBinding(node.name);
    if (binding?.path.node.type === 'VariableDeclarator' && localized(binding.path.node.init, scope, seen)) return true;
  }
  return ['object', 'property', 'callee', 'left', 'right', 'test', 'consequent', 'alternate', 'argument']
    .some(field => localized(node[field], scope, seen));
}

const candidates = [];
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
function usesName(node) {
  if (!node || typeof node !== 'object') return false;
  if ((node.type === 'Identifier' && /^(?:name|label|displayName)$/u.test(node.name)) ||
      (node.type === 'MemberExpression' && /^(?:name|label|displayName)$/u.test(node.property.name))) return true;
  return ['object', 'property', 'callee', 'left', 'right', 'test', 'consequent', 'alternate']
    .some(field => usesName(node[field]));
}
async function audit() {
  findings.length = 0;
  keyReferences.length = 0;
  candidates.length = 0;
  calls.length = 0;
  const inspectCall = (node, scope, file, line, source) => {
    if (!['t', '$t', 'textRef'].includes(node.callee.name ?? node.callee.property?.name)) return;
    const keys = enumerateKeys(node.arguments[0], scope);
    if (!keys) {
      addFinding({ type: 'dynamic-translation-key', file, line, reason: 'not-statically-enumerable',
        expression: source.slice(node.arguments[0]?.start ?? node.start, node.arguments[0]?.end ?? node.end).slice(0, 240) });
      return;
    }
    for (const key of keys) keyReferences.push({ key, file, line });
    const values = node.arguments[1];
    const names = !values ? [] : values.type === 'ObjectExpression' && values.properties.every(value =>
      value.type === 'ObjectProperty' && !value.computed) ? values.properties.map(value => value.key.name ?? value.key.value) : null;
    const form = node.arguments[2]?.type === 'StringLiteral' ? node.arguments[2].value : 'text';
    if (names) calls.push({ keys, names, form, file, line });
  };
  for (const file of files(path.join(root, 'src')).filter(name => /\.(?:js|vue)$/u.test(name))) {
    const source = fs.readFileSync(file, 'utf8');
    const part = file.endsWith('.vue') ? compiler.parseComponent(source).script ?? { content: '', start: 0 } : { content: source, start: 0 };
    const offset = source.slice(0, part.start ?? 0).split('\n').length - 1;
    const ast = babel.parseSync(part.content, { configFile: false, babelrc: false, sourceType: 'module' });
    const add = (kind, node) => candidates.push({
      kind, domain: domainFor(file), impact: /automator/u.test(file) ? 'automator' : /storage|migration/u.test(file) ? 'save' :
        /core/u.test(file) ? 'logic-or-stable-index' : 'display-or-css', status: 'needs-producer-consumer-review',
      file: path.relative(root, file).replaceAll(path.sep, '/'), line: node.loc.start.line + offset,
      expression: part.content.slice(node.start, node.end).replace(/\s+/gu, ' ').slice(0, 240),
    });
    babel.traverse(ast, {
      BinaryExpression({ node, scope }) {
        if (['===', '==', '!==', '!='].includes(node.operator) && localized(node, scope)) {
          addFinding({ type: 'localized-identity-dependency', file: path.relative(root, file), line: node.loc.start.line + offset,
            reason: 'translated-comparison', expression: part.content.slice(node.start, node.end).replace(/\s+/gu, ' ') });
        }
        if (['===', '==', '!==', '!='].includes(node.operator) && (usesName(node.left) || usesName(node.right))) {
          add('name-comparison', node);
        }
      },
      SwitchStatement({ node }) { if (usesName(node.discriminant)) add('name-dispatch', node.discriminant); },
      MemberExpression({ node, scope }) {
        if (node.computed && localized(node.property, scope)) addFinding({ type: 'localized-identity-dependency',
          file: path.relative(root, file), line: node.loc.start.line + offset, reason: 'translated-index', expression: part.content.slice(node.start, node.end).replace(/\s+/gu, ' ') });
        if (node.computed && usesName(node.property)) add('name-derived-index', node);
        else if (node.computed && node.property.type === 'StringLiteral') add('literal-index', node);
      },
      AssignmentExpression({ node, scope }) {
        if (/^(?:player[.[]|.*className)/u.test(part.content.slice(node.left.start, node.left.end)) && localized(node.right, scope)) {
          addFinding({ type: 'localized-identity-dependency', file: path.relative(root, file), line: node.loc.start.line + offset,
            reason: 'translated-save-or-css-assignment', expression: part.content.slice(node.start, node.end).replace(/\s+/gu, ' ') });
        }
      },
      ObjectProperty({ node }) {
        if (node.key.name === 'nameKey' && node.value.type === 'StringLiteral') keyReferences.push({ key: node.value.value, file: path.relative(root, file), line: node.loc.start.line + offset });
      },
      CallExpression({ node, scope }) {
        inspectCall(node, scope, path.relative(root, file), node.loc.start.line + offset, part.content);
        if (node.callee.type !== 'MemberExpression') return;
        const method = node.callee.property.name;
        if (['toLowerCase', 'toUpperCase', 'replace', 'replaceAll'].includes(method) && usesName(node.callee.object)) {
          add('name-derived-text-or-key', node);
        }
        if (['get', 'set', 'has', 'includes', 'indexOf'].includes(method) && node.arguments[0]?.type === 'StringLiteral') {
          add('literal-lookup', node);
        }
      },
    });
    if (file.endsWith('.vue')) {
      const template = compiler.parseComponent(source).template;
      const seen = new WeakSet();
      const inspectExpression = (expression, line) => {
        const tree = babel.parseSync(`(${expression});`, { configFile: false, babelrc: false, sourceType: 'module' });
        babel.traverse(tree, { CallExpression({ node, scope }) {
          inspectCall(node, scope, path.relative(root, file), line, `(${expression});`);
        } });
      };
      function visit(node) {
        if (!node || seen.has(node)) return;
        seen.add(node);
        const line = source.slice(0, (template.start ?? 0) + (node.start ?? 0)).split('\n').length;
        if (node.type === 2) inspectExpression(node.expression, line);
        if ([2, 3].includes(node.type) && !node.isComment && /[A-Za-z]{3,}/u.test(node.text ?? '') &&
            !['code', 'pre', 'textarea'].includes(node.parent?.tag)) {
          const literal = (node.text ?? '').replace(/\{\{[\s\S]*?\}\}/gu, '').replace(/\s+/gu, ' ').trim();
          if (/[A-Za-z]{3,}/u.test(literal)) addFinding({ type: 'hardcoded-ui-english', file: path.relative(root, file), line,
            reason: 'visible-template-literal-candidate', text: literal.slice(0, 500) });
        }
        for (const attribute of node.attrsList ?? []) {
          if (node.tag === 'LocalizedText' && attribute.name === 'id') keyReferences.push({ key: attribute.value, file: path.relative(root, file), line });
          if (/^(?::|v-bind:)/u.test(attribute.name) || ['v-if', 'v-else-if', 'v-show', 'v-text', 'v-html'].includes(attribute.name)) inspectExpression(attribute.value, line);
        }
        for (const child of node.children ?? []) visit(child);
        for (const slot of Object.values(node.scopedSlots ?? {})) visit(slot);
        for (const branch of node.ifConditions ?? []) visit(branch.block);
      }
      if (template) visit(compiler.compile(template.content, { outputSourceRange: true }).ast);
    }
  }
  const catalogs = Object.fromEntries(fs.readdirSync(path.join(root, 'src/locales')).filter(file => file.endsWith('.json'))
    .map(file => [file.slice(0, -5), JSON.parse(fs.readFileSync(path.join(root, 'src/locales', file), 'utf8'))]));
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/i18n/service.js'), 'utf8').replace(/^import .*;$/gm, '').replace(/^export /gm, '') + '\nthis.resolve = resolveCatalog;', context);
  const { IntlMessageFormat } = await import('intl-messageformat');
  const signature = nodes => {
    const args = new Map();
    const selectors = new Map();
    function visit(nodes) {
      for (const node of nodes) {
        if (![0, 7].includes(node.type) && node.value) {
          const types = args.get(node.value) ?? new Set();
          types.add(node.type);
          args.set(node.value, types);
        }
        if (node.options && !node.pluralType) selectors.set(node.value, Object.keys(node.options).sort());
        for (const option of Object.values(node.options ?? {})) visit(option.value);
        if (node.children) visit(node.children);
      }
    }
    visit(nodes);
    return JSON.stringify({ args: [...args].sort().map(([key, types]) => [key, [...types].sort()]), selectors: [...selectors].sort() });
  };
  let base;
  try { base = context.resolve(catalogs.en); }
  catch (error) { addFinding({ type: 'catalog-error', locale: 'en', reason: error.message }); }
  if (base) for (const call of calls) for (const key of call.keys) {
    const text = base.get(`${key}|${call.form}`) ?? base.get(`${key}|text`);
    if (text === undefined) continue;
    const ast = new IntlMessageFormat(text, 'en').getAst();
    const expected = parameterNames(ast), extra = call.names.filter(name => !expected.includes(name));
    // Conditional branches may intentionally omit parameters from the unused branch.
    const hasOptions = nodes => nodes.some(node => node.options || node.children && hasOptions(node.children));
    const missing = hasOptions(ast) ? [] : expected.filter(name => !call.names.includes(name));
    if (extra.length || missing.length) addFinding({ type: 'parameter-error', key, file: call.file, line: call.line,
      reason: extra.length ? 'extra-static-parameters' : 'missing-static-parameters', expected, provided: call.names });
  }
  if (base && translationUpdate) {
    const crypto = require('node:crypto');
    for (const key of Object.keys(catalogs.en).filter(key => key !== '$meta' && !Object.hasOwn(catalogs['zh-CN'] ?? {}, key))) {
      const text = base.get(`${key}|text`);
      const ast = new IntlMessageFormat(text, 'en').getAst();
      if (ast.some(node => ![0, 1].includes(node.type))) continue;
      const source = ast.map(node => node.type === 0 ? node.value : `{${node.value}}`).join('');
      const hash = crypto.createHash('sha256').update(source).digest('hex');
      const matches = translationUpdate.entries.filter(entry => entry.sourceHash === hash);
      if (matches.length) addFinding({ type: 'adec-available-fallback', key, locale: 'zh-CN',
        reason: 'external-source-requires-context-review', sourceIds: matches.map(entry => entry.sourceId) });
    }
  }
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (locale !== 'en') for (const key of Object.keys(catalogs.en).filter(key => key !== '$meta' && !Object.hasOwn(catalog, key))) {
      addFinding({ type: 'english-fallback', locale, key, reason: 'missing-translation' });
    }
    let messages;
    try { messages = context.resolve(catalog, catalogs.en, event => addFinding({ type: 'english-fallback', locale, ...event, reason: 'reference' })); }
    catch (error) { addFinding({ type: 'catalog-error', locale, reason: error.message }); continue; }
    const duplicates = new Map();
    for (const [token, text] of messages) {
      const [key, form] = token.split('|');
      try {
        const ast = new IntlMessageFormat(text, locale).getAst();
        if (locale !== 'en' && !key.startsWith('terms.') && Object.hasOwn(catalog, key)) {
          const identity = `${base?.get(token)}\0${text}`;
          const group = duplicates.get(identity) ?? [];
          group.push(key); duplicates.set(identity, group);
        }
        if (base?.has(token) && signature(ast) !== signature(new IntlMessageFormat(base.get(token), 'en').getAst())) {
          addFinding({ type: 'parameter-error', locale, key, form, reason: 'signature-mismatch' });
        }
        if (locale !== 'en' && text === base?.get(token) && /[A-Za-z]{3}/u.test(text)) addFinding({ type: 'identical-translation', locale, key, form, reason: 'candidate' });
        const literals = [];
        function visit(nodes) {
          for (const node of nodes) {
            if (node.type === 0) literals.push(node.value);
            for (const option of Object.values(node.options ?? {})) visit(option.value);
          }
        }
        visit(ast);
        if (locale.startsWith('zh') && literals.some(literal => /[\u3400-\u9FFF]/u.test(literal) && /[A-Za-z]{3}/u.test(literal))) {
          addFinding({ type: 'mixed-language-output', locale, key, form, reason: 'catalog-literal-candidate' });
        }
      } catch (error) { addFinding({ type: 'catalog-error', locale, key, form, reason: error.message }); }
    }
    for (const keys of duplicates.values()) if (new Set(keys).size > 1) addFinding({ type: 'duplicate-translation', locale,
      key: keys[0], keys: [...new Set(keys)], reason: 'same-base-and-translation-review-candidate' });
  }
  for (const reference of keyReferences) if (!Object.hasOwn(catalogs.en, reference.key)) addFinding({ type: 'missing-base-key', ...reference });
  const counts = {};
  for (const candidate of candidates) counts[candidate.kind] = (counts[candidate.kind] ?? 0) + 1;
  const findingCounts = {};
  const domains = {};
  for (const finding of findings) {
    findingCounts[finding.type] = (findingCounts[finding.type] ?? 0) + 1;
    const counts = domains[finding.domain] ??= {};
    counts[finding.type] = (counts[finding.type] ?? 0) + 1;
  }
  const references = Object.fromEntries([...new Set(keyReferences.map(reference => reference.key))].map(key =>
    [key, keyReferences.filter(reference => reference.key === key)]));
  return { version: 2, note: 'Static findings and dependency candidates require review. Fallback, duplicates and mixed output are not automatic defects.',
    counts, findingCounts, domains, findings, candidates, references };
}
if (require.main === module) audit().then(report => {
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else console.log(JSON.stringify({ ...report, findings: report.findings.slice(0, 20), candidates: report.candidates.slice(0, 12) }, null, 2));
  if (process.argv.includes('--strict') && report.findings.some(finding => policy.acceptance.errors.includes(finding.type))) process.exitCode = 1;
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { audit, localized, domainFor, enumerateKeys, parameterNames };
