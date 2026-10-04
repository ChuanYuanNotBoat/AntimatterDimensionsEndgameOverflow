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
for (const filename of ['adechinese-rules.json', 'display-terms.json']) {
  for (const rule of JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', filename), 'utf8'))) {
    scopesByKey.set(rule.id, [...new Set([...(scopesByKey.get(rule.id) ?? []), ...rule.scopes])]);
  }
}
const findings = [];
const keyReferences = [];
const addFinding = finding => {
  const review = policy.reviewedDependencies.find(entry => entry.file === finding.file && entry.reason === finding.reason && entry.expressions.includes(finding.expression));
  findings.push({ domain: domainFor(`${finding.file ?? ''} ${finding.key ?? ''} ${(scopesByKey.get(finding.key) ?? []).join(' ')}`), ...finding,
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
      CallExpression({ node }) {
        const methodName = node.callee.name ?? node.callee.property?.name;
        if (['t', '$t', 'textRef'].includes(methodName) && node.arguments[0]?.type === 'StringLiteral') {
          keyReferences.push({ key: node.arguments[0].value, file: path.relative(root, file), line: node.loc.start.line + offset });
        }
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
        babel.traverse(tree, { CallExpression({ node }) {
          if (['t', '$t', 'textRef'].includes(node.callee.name ?? node.callee.property?.name) && node.arguments[0]?.type === 'StringLiteral') {
            keyReferences.push({ key: node.arguments[0].value, file: path.relative(root, file), line });
          }
        } });
      };
      function visit(node) {
        if (!node || seen.has(node)) return;
        seen.add(node);
        const line = source.slice(0, (template.start ?? 0) + (node.start ?? 0)).split('\n').length;
        if (node.type === 2) inspectExpression(node.expression, line);
        for (const attribute of node.attrsList ?? []) {
          if (node.tag === 'LocalizedText' && attribute.name === 'id') keyReferences.push({ key: attribute.value, file: path.relative(root, file), line });
          if (/^(?::|v-bind:)/u.test(attribute.name) || ['v-if', 'v-else-if', 'v-show', 'v-text', 'v-html'].includes(attribute.name)) inspectExpression(attribute.value, line);
        }
        for (const child of node.children ?? []) visit(child);
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
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (locale !== 'en') for (const key of Object.keys(catalogs.en).filter(key => key !== '$meta' && !Object.hasOwn(catalog, key))) {
      addFinding({ type: 'english-fallback', locale, key, reason: 'missing-translation' });
    }
    let messages;
    try { messages = context.resolve(catalog, catalogs.en, event => addFinding({ type: 'english-fallback', locale, ...event, reason: 'reference' })); }
    catch (error) { addFinding({ type: 'catalog-error', locale, reason: error.message }); continue; }
    for (const [token, text] of messages) {
      const [key, form] = token.split('|');
      try {
        const ast = new IntlMessageFormat(text, locale).getAst();
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
  return { version: 1, note: 'Static findings and dependency candidates require review. Fallback and mixed output are not automatic defects.',
    counts, findingCounts, domains, findings, candidates };
}
if (require.main === module) audit().then(report => {
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else console.log(JSON.stringify({ ...report, findings: report.findings.slice(0, 20), candidates: report.candidates.slice(0, 12) }, null, 2));
  if (process.argv.includes('--strict') && report.findings.some(finding => policy.acceptance.errors.includes(finding.type))) process.exitCode = 1;
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { audit, localized, domainFor };
