'use strict';
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const root = path.resolve(__dirname, '..');
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
for (const file of files(path.join(root, 'src')).filter(name => /\.(?:js|vue)$/u.test(name))) {
  const source = fs.readFileSync(file, 'utf8');
  const part = file.endsWith('.vue') ? compiler.parseComponent(source).script : { content: source, start: 0 };
  if (!part) continue;
  const offset = source.slice(0, part.start ?? 0).split('\n').length - 1;
  const ast = babel.parseSync(part.content, { configFile: false, babelrc: false, sourceType: 'module' });
  const add = (kind, node) => candidates.push({
    kind, file: path.relative(root, file).replaceAll(path.sep, '/'), line: node.loc.start.line + offset,
    expression: part.content.slice(node.start, node.end).replace(/\s+/gu, ' ').slice(0, 240),
  });
  babel.traverse(ast, {
    BinaryExpression({ node }) {
      if (['===', '==', '!==', '!='].includes(node.operator) && (usesName(node.left) || usesName(node.right))) {
        add('name-comparison', node);
      }
    },
    SwitchStatement({ node }) { if (usesName(node.discriminant)) add('name-dispatch', node.discriminant); },
    MemberExpression({ node }) {
      if (node.computed && usesName(node.property)) add('name-derived-index', node);
      else if (node.computed && node.property.type === 'StringLiteral') add('literal-index', node);
    },
    CallExpression({ node }) {
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
}
const counts = {};
for (const candidate of candidates) counts[candidate.kind] = (counts[candidate.kind] ?? 0) + 1;
console.log(JSON.stringify({
  note: 'Candidates require producer/consumer review; syntax tokens and canonical IDs are legitimate exceptions.',
  counts, candidates: process.argv.includes('--json') ? candidates : candidates.slice(0, 12),
}, null, 2));
