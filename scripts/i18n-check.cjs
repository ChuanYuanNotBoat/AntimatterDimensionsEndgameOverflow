'use strict';
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const root = path.resolve(__dirname, '..');
const parse = source => babel.parseSync(source, { configFile: false, babelrc: false, sourceType: 'module' });

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

async function main() {
  const { IntlMessageFormat } = await import('intl-messageformat');
  const literalType = new IntlMessageFormat('literal', 'en').getAst()[0].type;
  const catalogs = {};
  const signatures = {};
  const failures = [];
  for (const locale of fs.readdirSync(path.join(root, 'src/locales'))) {
    const catalog = catalogs[locale] = {};
    signatures[locale] = {};
    for (const file of files(path.join(root, 'src/locales', locale)).filter(name => name.endsWith('.json'))) {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw);
      const properties = parse(`(${raw})`).program.body[0].expression.properties;
      const keys = properties.map(property => property.key.value);
      if (new Set(keys).size !== keys.length) failures.push(`Duplicate key in ${file}`);
      for (const [id, message] of Object.entries(parsed)) {
        if (Object.hasOwn(catalog, id)) failures.push(`Duplicate ${locale} message: ${id}`);
        catalog[id] = message;
        if (typeof message !== 'string') { failures.push(`${locale}:${id} must be text`); continue; }
        try {
          const ast = new IntlMessageFormat(message, locale).getAst();
          const argumentsByName = {};
          const selectors = {};
          function visit(nodes) {
            for (const node of nodes) {
              if (node.type !== literalType && typeof node.value === 'string') {
                (argumentsByName[node.value] ??= new Set()).add(node.type);
              }
              if (node.options) {
                if (!node.pluralType) selectors[node.value] = Object.keys(node.options).sort();
                for (const option of Object.values(node.options)) visit(option.value);
              }
              if (node.children) visit(node.children);
            }
          }
          visit(ast);
          signatures[locale][id] = JSON.stringify({
            arguments: Object.entries(argumentsByName).sort().map(([name, types]) => [name, [...types].sort()]),
            selectors: Object.entries(selectors).sort(),
          });
        } catch (error) { failures.push(`${locale}:${id}: ${error.message}`); }
      }
    }
  }
  const english = catalogs.en;
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (locale === 'en') continue;
    for (const id of Object.keys(catalog)) {
      if (!Object.hasOwn(english, id)) failures.push(`Unknown ${locale} key: ${id}`);
      else if (signatures[locale][id] !== signatures.en[id]) failures.push(`ICU arguments/selectors differ: ${locale}:${id}`);
    }
    // Partial translations are intentional; omitted keys use English at runtime.
    console.log(`${locale}: ${Object.keys(catalog).length}/${Object.keys(english).length} extracted messages; ` +
      `${Object.keys(english).filter(id => !Object.hasOwn(catalog, id)).length} English fallbacks`);
  }
  const references = new Set();
  function collectReferences(source) {
    babel.traverse(parse(source), {
      CallExpression({ node }) {
        const callee = node.callee.type === 'Identifier' ? node.callee.name : node.callee.property?.name;
        const argument = node.arguments[callee === 'notation' ? 1 : 0];
        if (['t', '$t', 'textRef', 'notation'].includes(callee) && argument?.type === 'StringLiteral') {
          references.add(argument.value);
        }
      },
      ObjectProperty({ node }) {
        if (node.key.name === 'nameKey' && node.value.type === 'StringLiteral') references.add(node.value.value);
      },
    });
  }
  for (const file of files(path.join(root, 'src')).filter(name => /\.(?:js|vue)$/.test(name))) {
    const source = fs.readFileSync(file, 'utf8');
    if (!file.endsWith('.vue')) { collectReferences(source); continue; }
    const component = compiler.parseComponent(source);
    collectReferences(component.script?.content ?? '');
    const seen = new WeakSet();
    function collectTemplate(node) {
      if (!node || seen.has(node)) return;
      seen.add(node);
      if (node.type === 2) collectReferences(`(${node.expression});`);
      for (const attribute of node.attrsList ?? []) {
        if (/^(?::|v-bind:)/u.test(attribute.name) || ['v-if', 'v-else-if', 'v-show', 'v-text', 'v-html'].includes(attribute.name)) {
          collectReferences(`(${attribute.value});`);
        }
      }
      for (const child of node.children ?? []) collectTemplate(child);
      for (const branch of node.ifConditions ?? []) collectTemplate(branch.block);
    }
    if (component.template) collectTemplate(compiler.compile(component.template.content).ast);
  }
  for (const id of references) if (!Object.hasOwn(english, id)) failures.push(`Missing base message: ${id}`);
  const scope = JSON.parse(fs.readFileSync(path.join(root, 'docs/i18n-scope.json')));
  for (const relative of scope.templatesWithoutStaticEnglish) {
    const template = compiler.parseComponent(fs.readFileSync(path.join(root, relative), 'utf8')).template?.content;
    const ast = compiler.compile(template).ast;
    const seen = new WeakSet();
    function check(node) {
      if (!node || seen.has(node)) return;
      seen.add(node);
      if (node.type === 3 && !node.isComment && /[A-Za-z]{2,}/u.test(node.text)) {
        failures.push(`New hardcoded template text in ${relative}: ${node.text.trim()}`);
      }
      for (const attribute of node.attrsList ?? []) {
        if (['title', 'placeholder', 'aria-label', 'alt', 'label'].includes(attribute.name) && /[A-Za-z]/u.test(attribute.value)) {
          failures.push(`New hardcoded ${attribute.name} in ${relative}`);
        }
      }
      for (const child of node.children ?? []) check(child);
      for (const branch of node.ifConditions ?? []) check(branch.block);
    }
    if (ast) check(ast);
  }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else console.log(`PASS: ICU syntax, parameters, base keys, duplicate keys, and migrated template text (${references.size} key references).`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
