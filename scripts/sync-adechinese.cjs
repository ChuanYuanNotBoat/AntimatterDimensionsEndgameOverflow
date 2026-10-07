"use strict";

// Extract text only. Never copy reference scripts, conditions, identifiers, or formulas.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const babel = require("@babel/core");
const generate = require("@babel/generator").default;
const compiler = require("vue-template-compiler");
const parse5 = require("parse5");
const { shareTerms, shareMatterTerms } = require("./i18n-catalog.cjs");
const packs = Object.fromEntries(["en", "zh-CN"].map(id => [id,
  JSON.parse(fs.readFileSync(path.join(__dirname, `../src/locales/${id}.json`), "utf8"))]));
const updatePack = (id, additions) => {
  for (const [key, value] of Object.entries(additions)) {
    if (!Object.hasOwn(packs[id], key)) packs[id][key] = value;
  }
};

const root = path.resolve(__dirname, "..");
const reference = process.argv[2];
if (!reference) throw new Error("Usage: node scripts/sync-adechinese.cjs /path/to/ADEChinese");
const referenceRoot = path.resolve(reference);
const reportArgument = process.argv.indexOf("--report-only");
if (reportArgument >= 0 && process.argv.includes("--migrate")) {
  throw new Error("Report-only extraction cannot migrate templates");
}
const sourceArgument = process.argv.indexOf("--source");
const sourceRoot = sourceArgument >= 0 ? path.resolve(process.argv[sourceArgument + 1]) : root;
if (sourceRoot === root) throw new Error("Pass --source with an unlocalized English checkout; do not extract from translated templates");
if (process.argv.includes("--migrate") && !process.argv.includes("--reset-templates") &&
    fs.readFileSync(path.join(root, "src/components/GenericDimensionRowText.vue"), "utf8").includes("$legacyText")) {
  throw new Error("Templates are already migrated. Omit --migrate to preserve manual work and community edits");
}
const extraArgument = process.argv.indexOf("--extra-source");
const extraRoot = extraArgument >= 0 ? path.resolve(process.argv[extraArgument + 1]) : null;
const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: referenceRoot, encoding: "utf8" }).trim();
const parse = text => babel.parseSync(text, { configFile: false, babelrc: false, sourceType: "module" });
const chinese = text => /[\u3400-\u9fff]/u.test(text);
const normalize = text => text.replace(/\s+/gu, " ").trim();
const quote = text => text.replace(/'/gu, "''").replace(/[{}<>]/gu, value => `'${value}'`);
const pairs = [];
const unmatched = [];
const templateEdits = new Map();
const messageId = (en, zh) => `ade.${crypto.createHash("sha256").update(`${en}\0${zh}`).digest("hex").slice(0, 16)}`;
const protectedValue = expression => /(?:saveFileName|fileName|script\.name|scriptName|statusName|editingName|presetName|customName|username|dropdownLabel|\.content\b|\.command\b)/u.test(expression);

function syncNavigation() {
  const file = "src/core/secret-formula/tabs.js";
  const englishSource = fs.readFileSync(path.join(sourceRoot, file), "utf8");
  const chineseSource = fs.readFileSync(path.join(referenceRoot, file), "utf8");
  const array = source => parse(source).program.body.find(node => node.type === "ExportNamedDeclaration")
    .declaration.declarations[0].init.elements;
  const property = (node, key) => node.properties.find(value => value.key?.name === key);
  const key = node => property(node, "key").value.value;
  const enCatalog = {};
  const zhCatalog = {};
  const edits = [];
  function entry(en, zh, id) {
    const name = property(en, "name");
    if (property(en, "nameKey")) return;
    const refName = zh && property(zh, "name")?.value;
    if (name.value.type === "StringLiteral") {
      enCatalog[id] = quote(name.value.value);
      if (refName?.type === "StringLiteral") zhCatalog[id] = quote(refName.value);
      edits.push({ start: name.end, text: `,\n${" ".repeat(name.loc.start.column)}nameKey: "${id}"` });
    } else if (id === "navigation.dimensions.antimatter") {
      enCatalog[id] = "{resource, select, matter {Matter Dimensions} other {Antimatter Dimensions}}";
      zhCatalog[id] = "{resource, select, matter {[[terms.matterDimension]]} other {[[terms.antimatterDimension]]}}";
      edits.push({ start: name.end, text: `,\n        nameKey: "${id}",\n        nameValues: () => ({ resource: player.universes.current === 2 ? "matter" : "antimatter" })` });
    }
  }
  const zhTabs = array(chineseSource);
  for (const tab of array(englishSource)) {
    const refTab = zhTabs.find(value => key(value) === key(tab));
    entry(tab, refTab, `navigation.${key(tab)}`);
    const zhSubtabs = refTab ? property(refTab, "subtabs").value.elements : [];
    for (const subtab of property(tab, "subtabs").value.elements) {
      entry(subtab, zhSubtabs.find(value => key(value) === key(subtab)), `navigation.${key(tab)}.${key(subtab).replace(/ /gu, "_")}`);
    }
  }
  updatePack("en", enCatalog);
  updatePack("zh-CN", zhCatalog);
  if (process.argv.includes("--migrate")) {
    let source = englishSource;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      source = source.slice(0, edit.start) + edit.text + source.slice(edit.start);
    }
    // The existing comma follows each inserted nameKey, keeping every canonical name intact.
    fs.writeFileSync(path.join(root, file), source);
  }
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(full) : [full];
  });
}

// Expression identity includes operators, numbers, calls, and identifiers. Only string values may differ.
function expressionKey(node) {
  const copy = babel.types.cloneNode(node, true);
  babel.traverse(babel.types.file(babel.types.program([babel.types.expressionStatement(copy)])), {
    StringLiteral({ node: value }) { value.value = "__text__"; delete value.extra; },
    TemplateElement({ node: value }) { value.value = { raw: "__text__", cooked: "__text__" }; },
  });
  return generate(copy, { compact: true }).code;
}

function stringForm(node) {
  if (node.type === "StringLiteral") return { parts: [node.value], expressions: [] };
  if (node.type === "TemplateLiteral") {
    return { parts: node.quasis.map(value => value.value.cooked), expressions: node.expressions };
  }
  if (node.type === "BinaryExpression" && node.operator === "+" &&
      (stringForm(node.left) || stringForm(node.right))) {
    const a = stringForm(node.left) ?? { parts: ["", ""], expressions: [node.left] };
    const b = stringForm(node.right) ?? { parts: ["", ""], expressions: [node.right] };
    return { parts: [...a.parts.slice(0, -1), a.parts.at(-1) + b.parts[0], ...b.parts.slice(1)],
      expressions: [...a.expressions, ...b.expressions] };
  }
  return null;
}

function addPair(enForm, zhForm, file, location, kind, scope) {
  if (!enForm || !zhForm || !chinese(zhForm.parts.join("") + zhForm.expressions.map(value => generate(value).code).join(""))) {
    return false;
  }
  const usedExpressions = new Set();
  const expressionIndices = zhForm.expressions.map(value => {
    const index = enForm.expressions.findIndex((source, position) =>
      !usedExpressions.has(position) && expressionKey(source) === expressionKey(value));
    usedExpressions.add(index);
    return index;
  });
  if (enForm.expressions.length !== zhForm.expressions.length || expressionIndices.includes(-1)) {
    unmatched.push({ file, location, reason: "expression-differs", text: normalize(zhForm.parts.join("…")) });
    return false;
  }
  const en = normalize(enForm.parts.map((part, index) => part +
    (index < enForm.expressions.length ? `{p${index}}` : "")).join(""));
  const zh = normalize(zhForm.parts.map((part, index) => part +
    (index < zhForm.expressions.length ? `{p${expressionIndices[index]}}` : "")).join(""));
  if (!/[A-Za-z]/u.test(en) || chinese(en) || !en || en === zh) return false;
  if (/<\/?[a-z][^>]*>/iu.test(en)) {
    // Rich text uses the original markup. Extract only corresponding text nodes/attributes.
    const left = parse5.parseFragment(en);
    const right = parse5.parseFragment(zh);
    const segments = [];
    const collect = (a, b, trail) => {
      if (!a || !b || a.nodeName !== b.nodeName) return;
      if (a.nodeName === "#text") segments.push([a.value, b.value, trail]);
      if ((a.childNodes?.length ?? 0) !== (b.childNodes?.length ?? 0)) return;
      for (let index = 0; index < (a.childNodes?.length ?? 0); index++) {
        collect(a.childNodes[index], b.childNodes?.[index], `${trail}/${index}`);
      }
    };
    collect(left, right, "html");
    for (const [a, b, trail] of segments) addRawPair(a, b, file, `${location}/${trail}`, "html-text");
    return true;
  }
  pairs.push({ en, zh, file, location, kind, scope, parameters: enForm.expressions.length,
    protectedParameters: enForm.expressions.flatMap((expression, index) =>
      protectedValue(generate(expression).code) ? [`p${index}`] : []) });
  // Also extract display terms inside pluralize/conditional expressions. They remain canonical in scripts.
  enForm.expressions.forEach((expression, index) => {
    const refIndex = expressionIndices.indexOf(index);
    if (refIndex < 0) return;
    const a = jsStrings(`const value = (${generate(expression).code});`);
    const b = jsStrings(`const value = (${generate(zhForm.expressions[refIndex]).code});`);
    for (const [key, value] of b) {
      const source = a.get(key);
      if (source && !source.form.expressions.length && !value.form.expressions.length) {
        addRawPair(source.form.parts[0], value.form.parts[0], file, `${location}/value/${key}`, "display-term");
      }
    }
  });
  return { en, zh, id: messageId(en, zh) };
}

function addRawPair(en, zh, file, location, kind, scopes = [], scopedOnly = false) {
  const left = [...en.matchAll(/\{p(\d+)\}/gu)].map(match => match[1]);
  const right = [...zh.matchAll(/\{p(\d+)\}/gu)].map(match => match[1]);
  if (JSON.stringify(left.sort()) !== JSON.stringify(right.sort())) {
    unmatched.push({ file, location, reason: "parameter-differs", text: normalize(zh) });
    return;
  }
  if (!chinese(zh) || chinese(en) || !/[A-Za-z]/u.test(en)) return;
  pairs.push({ en: normalize(en), zh: normalize(zh), file, location, kind, scopes, scopedOnly,
    parameters: new Set(left).size });
}

function keyOf(node, index) {
  if (!node) return String(index);
  if (["ObjectProperty", "ObjectMethod", "ClassMethod", "ClassProperty"].includes(node.type)) {
    return `key:${node.key.name ?? node.key.value}`;
  }
  if (node.type === "VariableDeclarator") return `var:${generate(node.id).code}`;
  if (["FunctionDeclaration", "ClassDeclaration"].includes(node.type)) return `decl:${node.id?.name}`;
  if (node.type === "ExportNamedDeclaration" && node.declaration) return keyOf(node.declaration, index);
  if (node.type === "ExportDefaultDeclaration") return "default";
  if (node.type === "VariableDeclaration") return `vars:${node.declarations.map(value => generate(value.id).code).join(",")}`;
  if (node.type === "SwitchCase") return `case:${node.test ? generate(node.test).code : "default"}`;
  // Database array entries are identified by their canonical id/key, not their position.
  if (node.type === "ObjectExpression") {
    const identity = node.properties.find(value => value.type === "ObjectProperty" &&
      ["id", "key", "option"].includes(value.key.name) && ["StringLiteral", "NumericLiteral"].includes(value.value.type));
    if (identity) return `entry:${identity.value.value}`;
    const name = node.properties.find(value => value.type === "ObjectProperty" && value.key.name === "name" &&
      value.value.type === "StringLiteral" && /^[a-z][A-Za-z0-9]*$/u.test(value.value.value));
    if (name) return `name:${name.value.value}`;
  }
  return String(index);
}

function jsStrings(source) {
  const result = new Map();
  function visit(node, trail, contextId, arrayLengths = []) {
    if (!node || ["ImportDeclaration", "CommentBlock", "CommentLine"].includes(node.type)) return;
    if (node.type === "ObjectExpression") {
      const id = node.properties.find(value => value.type === "ObjectProperty" && value.key.name === "id" &&
        ["StringLiteral", "NumericLiteral"].includes(value.value.type));
      if (id) contextId = id.value.value;
    }
    if (stringForm(node)) result.set(trail, { node, form: stringForm(node), contextId, arrayLengths });
    for (const property of babel.types.VISITOR_KEYS[node.type] ?? []) {
      if (property === "key" && !node.computed) continue;
      const child = node[property];
      if (Array.isArray(child)) {
        child.forEach((value, index) => {
          // Positional prose arrays are unsafe after insertion/deletion; keyed database entries are stable.
          const lengths = node.type === "ArrayExpression" && /^\d+$/u.test(keyOf(value, index))
            ? [...arrayLengths, child.length] : arrayLengths;
          visit(value, `${trail}/${property}/${keyOf(value, index)}`, contextId, lengths);
        });
      } else visit(child, `${trail}/${property}`, contextId, arrayLengths);
    }
  }
  visit(parse(source).program, "script");
  return result;
}

function syncScripts(enSource, zhSource, file, unsafeMembers = new Set()) {
  const en = jsStrings(enSource);
  const zh = jsStrings(zhSource);
  const stable = location => location.replace(/\/body\/\d+/gu, "/body/*");
  for (const [location, value] of zh) {
    if (!chinese(value.form.parts.join(""))) continue;
    const member = location.match(/\/properties\/key:(?:computed|methods)\/value\/properties\/key:([^/]+)/u)?.[1];
    if (unsafeMembers.has(member)) {
      unmatched.push({ file, location, reason: "template-action-differs", text: normalize(value.form.parts.join("…")) });
      continue;
    }
    let source = en.get(location);
    if (!source) {
      const candidates = [...en].filter(([key]) => stable(key) === stable(location)).map(([, entry]) => entry);
      if (candidates.length === 1) [source] = candidates;
    }
    if (source && JSON.stringify(source.arrayLengths) !== JSON.stringify(value.arrayLengths)) {
      unmatched.push({ file, location, reason: "positional-array-layout-differs", text: normalize(value.form.parts.join("…")) });
      continue;
    }
    const scope = source?.contextId === undefined ? undefined : `${path.basename(file, ".js")}:${source.contextId}`;
    if (source) addPair(source.form, value.form, file, location, "script-text", scope);
    else unmatched.push({ file, location, reason: "no-source-node", text: normalize(value.form.parts.join("…")) });
  }
  // ADEChinese adds display helpers instead of translating canonical enum keys in these components.
  // Reuse their explicit English-case -> Chinese-label mappings only at the display boundary.
  babel.traverse(parse(zhSource), {
    ObjectMethod({ node }) {
      if (!/^(?:getChineseName|ChineseName)$/u.test(node.key.name ?? "")) return;
      for (const statement of node.body.body) {
        if (statement.type !== "SwitchStatement") continue;
        for (const branch of statement.cases) {
          const returned = branch.consequent.find(value => value.type === "ReturnStatement")?.argument;
          if (branch.test?.type === "StringLiteral" && returned?.type === "StringLiteral") {
            addRawPair(branch.test.value, returned.value, file, `display-helper/${node.key.name}/${branch.test.value}`, "enum-display");
          }
        }
      }
    },
    ObjectExpression({ node }) {
      const englishName = node.properties.find(value => value.key?.name === "name")?.value;
      const chineseName = node.properties.find(value => value.key?.name === "ChineseName")?.value;
      if (englishName?.type === "StringLiteral" && chineseName?.type === "StringLiteral") {
        addRawPair(englishName.value, chineseName.value, file, `configured-name/${englishName.value}`, "configured-name",
          ["StarContainer"], true);
      }
      if (!file.endsWith("away-progress-types.js")) return;
      const name = node.properties.find(value => value.key?.name === "name")?.value;
      const display = node.properties.find(value => value.key?.name === "forcedName")?.value;
      if (name?.type === "StringLiteral" && display?.type === "StringLiteral") {
        const label = name.value.replace(/[A-Z]/gu, value => ` ${value}`).replace(/^\w/u, value => value.toUpperCase());
        addRawPair(label, display.value, file, `derived-display/${name.value}`, "derived-display");
      }
    }
  });
}

function textForm(text) {
  const pieces = text.split(/\{\{([\s\S]*?)\}\}/gu);
  return { parts: pieces.filter((value, index) => index % 2 === 0),
    expressions: pieces.filter((value, index) => index % 2 === 1).map(value => parse(`(${value})`).program.body[0].expression) };
}

// A label is only a translation of the same control when its event bindings agree.
// Keep canonical event arguments intact: changing a string ID also changes the action.
function templateActions(node, parents) {
  const events = (node.attrsList ?? []).filter(attribute => /^(?:@|v-on:)/u.test(attribute.name))
    .map(attribute => `${attribute.name.replace(/^@/u, "v-on:")}=${normalize(attribute.value)}`).sort();
  return events.length ? [...parents, `${node.tag}:${events.join(";")}`] : parents;
}

function unsafeTemplateMembers(left, right) {
  const members = new Set();
  for (const [location, value] of right) {
    const source = left.get(location);
    if (JSON.stringify(source?.actions ?? []) === JSON.stringify(value.actions)) continue;
    for (const form of [source?.form, value.form].filter(Boolean)) {
      for (const expression of form.expressions) {
        babel.traverse(babel.types.file(babel.types.program([babel.types.expressionStatement(expression)])), {
          ReferencedIdentifier({ node }) { members.add(node.name); },
          MemberExpression({ node }) {
            if (node.object.type === "ThisExpression" && !node.computed) members.add(node.property.name);
          }
        });
      }
    }
  }
  return members;
}

function templateNodes(template) {
  const result = new Map();
  const ast = compiler.compile(template, { preserveWhitespace: false, outputSourceRange: true }).ast;
  function visit(node, trail, parents = []) {
    if (!node) return;
    const actions = templateActions(node, parents);
    if ([2, 3].includes(node.type)) {
      if (!node.isComment && normalize(node.text)) result.set(`${trail}/text`, {
        form: textForm(node.text), start: node.start, end: node.end, text: node.text, node, actions });
      return;
    }
    for (const attribute of node.attrsList ?? []) {
      const location = `${trail}/attr/${attribute.name.replace(/^:/u, "")}`;
      if (attribute.name.startsWith(":") || attribute.name.startsWith("v-bind:") ||
          ["v-text", "v-html"].includes(attribute.name)) {
        try {
          const values = jsStrings(`const value = (${attribute.value});`);
          for (const [key, value] of values) result.set(`${location}/${key}`, { ...value, actions });
        } catch { /* Non-expression Vue syntax isn't translation text. */ }
      } else if (!["class", "style", "id", "key", "ref", "slot", "href", "type"].includes(attribute.name) &&
          !/^(?:@|v-)/u.test(attribute.name)) result.set(location, {
            form: { parts: [attribute.value], expressions: [] }, actions });
    }
    const counts = new Map();
    for (const child of node.children ?? []) {
      const key = child.tag ?? "text";
      const index = counts.get(key) ?? 0;
      counts.set(key, index + 1);
      visit(child, `${trail}/${key}:${index}`, actions);
    }
    for (let index = 1; index < (node.ifConditions?.length ?? 0); index++) {
      visit(node.ifConditions[index].block, `${trail}/else:${index}`, parents);
    }
  }
  visit(ast, "template");
  return result;
}

function compoundNodes(template) {
  const result = new Map();
  const ast = compiler.compile(template, { outputSourceRange: true }).ast;
  const inline = ["span", "b", "i", "strong", "em", "small", "sup", "sub", "kbd", "br"];
  const valid = node => node.type !== 1 || (inline.includes(node.tag) &&
    !(node.attrsList ?? []).some(attribute => /^(?:@|v-(?:if|else|for|show|html|text)|#)/u.test(attribute.name)) &&
    (node.children ?? []).every(valid));
  const fingerprint = node => {
    if ([2, 3].includes(node.type)) return textForm(node.text).expressions.map(expressionKey).join(";");
    return `${node.tag}:${node.attrsMap?.class ?? ""}(${(node.children ?? []).map(fingerprint).join(";")})`;
  };
  function visit(node, trail, parents = []) {
    if (!node || node.type !== 1) return;
    const actions = templateActions(node, parents);
    if (node.children.some(child => child.type === 1) && node.children.every(valid) &&
        !node.children.some(child => child.type === 1 && child.ifConditions?.length > 1)) {
      const parts = [""];
      const expressions = [];
      const slots = [];
      for (const child of node.children) {
        if (child.type === 1) {
          expressions.push(babel.types.identifier(`slot_${crypto.createHash("sha256").update(fingerprint(child)).digest("hex").slice(0, 12)}`));
          slots.push({ start: child.start, end: child.end });
          parts.push("");
        } else {
          const form = textForm(child.text);
          parts[parts.length - 1] += form.parts[0];
          form.expressions.forEach((expression, index) => {
            expressions.push(expression);
            slots.push({ expression: generate(expression, { compact: true }).code });
            parts.push(form.parts[index + 1]);
          });
        }
      }
      if (/[A-Za-z\u3400-\u9fff]/u.test(parts.join(""))) {
        result.set(trail, { form: { parts, expressions }, slots, node, actions,
          start: node.children[0].start, end: node.children.at(-1).end });
      }
    }
    const counts = new Map();
    for (const child of node.children) {
      const key = child.tag ?? "text";
      const index = counts.get(key) ?? 0;
      counts.set(key, index + 1);
      visit(child, `${trail}/${key}:${index}`, actions);
    }
    for (let index = 1; index < (node.ifConditions?.length ?? 0); index++) {
      visit(node.ifConditions[index].block, `${trail}/else:${index}`, parents);
    }
  }
  visit(ast, "template");
  return result;
}

for (const extractionRoot of [sourceRoot, extraRoot].filter(Boolean)) {
for (const absolute of walkFiles(path.join(referenceRoot, "src")).filter(file => /\.(?:vue|js)$/u.test(file))) {
  const file = path.relative(referenceRoot, absolute).split(path.sep).join("/");
  const currentPath = path.join(extractionRoot, file);
  if (!fs.existsSync(currentPath)) {
    if (chinese(fs.readFileSync(absolute, "utf8"))) unmatched.push({ file, reason: "reference-only-file" });
    continue;
  }
  const enSource = fs.readFileSync(currentPath, "utf8");
  const zhSource = fs.readFileSync(absolute, "utf8");
  if (!chinese(zhSource)) continue;
  try {
    if (file.endsWith(".js")) syncScripts(enSource, zhSource, file);
    else {
      const en = compiler.parseComponent(enSource, { deindent: false });
      const zh = compiler.parseComponent(zhSource, { deindent: false });
      const left = templateNodes(en.template?.content ?? "");
      const right = templateNodes(zh.template?.content ?? "");
      syncScripts(en.script?.content ?? "", zh.script?.content ?? "", file, unsafeTemplateMembers(left, right));
      const enCompound = compoundNodes(en.template?.content ?? "");
      const zhCompound = compoundNodes(zh.template?.content ?? "");
      const covered = [];
      for (const [location, value] of zhCompound) {
        const source = enCompound.get(location);
        if (!source || covered.some(range => source.start >= range.start && source.end <= range.end)) continue;
        if (JSON.stringify(source.actions) !== JSON.stringify(value.actions)) {
          unmatched.push({ file, location, reason: "template-action-differs", text: normalize(value.form.parts.join("…")) });
          continue;
        }
        const pair = addPair(source.form, value.form, file, `${location}/compound`, "template-slots");
        if (!pair?.id) continue;
        covered.push(source);
        if (process.argv.includes("--migrate") && extractionRoot === sourceRoot) {
          const offset = en.template.start + en.template.content.length - en.template.content.trimStart().length;
          const slots = source.slots.map((slot, index) => {
            const text = slot.expression
              ? `{{ ${protectedValue(slot.expression) ? `_s(${slot.expression})` : `$legacyText(_s(${slot.expression}))`} }}`
              : enSource.slice(offset + slot.start, offset + slot.end).replace(/\{\{([\s\S]*?)\}\}/gu,
                (whole, expression) => protectedValue(expression) ? whole : `{{ $legacyText(_s(${expression.trim()})) }}`);
            return `\n<template #p${index}>${text}</template>`;
          }).join("");
          const edits = templateEdits.get(file) ?? [];
          const original = enSource.slice(offset + source.start, offset + source.end);
          const leading = original.match(/^\s*/u)[0];
          const trailing = original.match(/\s*$/u)[0];
          const indentation = leading.split("\n").at(-1) || "  ";
          const formattedSlots = slots.replace(/\n<template/gu, `\n${indentation}  <template`);
          edits.push({ start: offset + source.start, end: offset + source.end,
            text: `${leading}<LocalizedText id="${pair.id}">${formattedSlots}\n${indentation}</LocalizedText>${trailing}` });
          templateEdits.set(file, edits);
        }
      }
      for (const [location, value] of right) {
        if (!chinese(value.form.parts.join("") + value.form.expressions.map(expression => generate(expression).code).join(""))) continue;
        const source = left.get(location);
        const insideSlot = source?.start !== undefined &&
          covered.some(range => source.start >= range.start && source.end <= range.end);
        if (source) {
          if (JSON.stringify(source.actions) !== JSON.stringify(value.actions)) {
            unmatched.push({ file, location, reason: "template-action-differs", text: normalize(value.form.parts.join("…")) });
            continue;
          }
          const pair = addPair(source.form, value.form, file, location, "template-text");
          if (process.argv.includes("--migrate") && extractionRoot === sourceRoot && pair?.id && !insideSlot && source.start !== undefined) {
            const parameters = source.form.expressions.map((expression, index) => {
              const value = generate(expression, { compact: true }).code;
              return `p${index}: ${protectedValue(value) ? `_s(${value})` : `$legacyText(_s(${value}))`}`;
            });
            const expression = `$t('${pair.id}'${parameters.length ? `, { ${parameters.join(", ")} }` : ""})`;
            const edits = templateEdits.get(file) ?? [];
            const offset = en.template.start + en.template.content.length - en.template.content.trimStart().length;
            const original = enSource.slice(offset + source.start, offset + source.end);
            edits.push({ start: offset + source.start, end: offset + source.end,
              text: `${original.match(/^\s*/u)[0]}{{ ${expression} }}${original.match(/\s*$/u)[0]}` });
            templateEdits.set(file, edits);
          }
        }
        else unmatched.push({ file, location, reason: "no-template-node", text: normalize(value.form.parts.join("…")) });
      }
    }
  } catch (error) { throw new Error(`${file}: ${error.message}`, { cause: error }); }
}
}

// Conflicting source strings stay scoped to their originating component. Unique translations can be
// shared by generic display components (descriptions, costs, header currencies, tooltips, etc.).
if (reportArgument >= 0) {
  const destination = process.argv[reportArgument + 1];
  if (!destination || destination.startsWith("--")) throw new Error("Pass an output file after --report-only");
  fs.writeFileSync(path.resolve(destination), `${JSON.stringify({ repository: "mushduck/ADEChinese", revision,
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim(),
    pairs, unmatched }, null, 2)}\n`);
  console.log(`Report only: ${pairs.length} occurrences; no catalogs, matching rules or templates written.`);
  process.exit(0);
}
const byEnglish = new Map();
for (const pair of pairs) {
  const values = byEnglish.get(pair.en) ?? new Map();
  const entry = values.get(pair.zh) ?? [];
  entry.push(pair);
  values.set(pair.zh, entry);
  byEnglish.set(pair.en, values);
}
const enCatalog = {};
const zhCatalog = {};
const rules = [];
const provenance = [];
for (const [english, translations] of [...byEnglish].sort(([a], [b]) => a.localeCompare(b))) {
  for (const [translation, entries] of translations) {
    const id = messageId(english, translation);
    const toICU = text => text.split(/(\{p\d+\})/gu).map(value => /^\{p\d+\}$/u.test(value) ? value : quote(value)).join("");
    enCatalog[id] = toICU(english);
    zhCatalog[id] = toICU(translation);
    const scopes = [...new Set(entries.flatMap(entry => [entry.scope, ...(entry.scopes ?? []),
      path.basename(entry.file).replace(/\.(?:vue|js)$/u, "")]).filter(Boolean))].sort();
    rules.push({ id, source: english, global: translations.size === 1 && !entries.every(entry => entry.scopedOnly), scopes,
      protectedParameters: [...new Set(entries.flatMap(entry => entry.protectedParameters ?? []))].sort() });
    const references = new Map(entries.map(({ file, location, kind }) =>
      [`${file}\0${location}\0${kind}`, { file, location, kind }]));
    provenance.push({ id, references: [...references.values()] });
  }
}
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
updatePack("en", enCatalog);
updatePack("zh-CN", zhCatalog);
const matchedLocations = new Set(pairs.map(pair => `${pair.file}\0${pair.location}`));
const pending = new Map(unmatched.filter(entry => !matchedLocations.has(`${entry.file}\0${entry.location}`))
  .map(entry => [`${entry.file}\0${entry.location}\0${entry.reason}`, entry]));
write("docs/adechinese-sync.json", { repository: "mushduck/ADEChinese", revision,
  sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim(),
  additionalSourceRevision: extraRoot ? execFileSync("git", ["rev-parse", "HEAD"], { cwd: extraRoot, encoding: "utf8" }).trim() : null,
  messages: rules.length, occurrences: pairs.length, provenance, unmatched: [...pending.values()] });
if (process.argv.includes("--migrate")) {
  // Apply translation only to template output, including legacy configuration/computed display text.
  // Input values, handlers, component props used as identifiers, classes, and DOM names are untouched.
  for (const absolute of walkFiles(path.join(sourceRoot, "src/components")).filter(file => file.endsWith(".vue"))) {
    const file = path.relative(sourceRoot, absolute).split(path.sep).join("/");
    const source = fs.readFileSync(absolute, "utf8");
    const component = compiler.parseComponent(source, { deindent: false });
    if (!component.template) continue;
    const template = component.template.content;
    const offset = component.template.start + template.length - template.trimStart().length;
    const edits = templateEdits.get(file) ?? [];
    const editedStarts = new Set(edits.map(edit => edit.start));
    const scope = path.basename(file, ".vue");
    const selectRule = text => {
      const matching = rules.filter(rule => rule.source === normalize(text));
      const scoped = matching.filter(rule => rule.scopes.includes(scope));
      const candidates = scoped.length ? scoped : matching.filter(rule => rule.global);
      return new Set(candidates.map(rule => rule.id)).size === 1 ? candidates[0] : null;
    };
    const seen = new WeakSet();
    const visit = (node, preserve = false) => {
      if (!node || seen.has(node)) return;
      seen.add(node);
      const keep = preserve || edits.some(edit => offset + node.start >= edit.start && offset + node.end <= edit.end) ||
        ["code", "pre", "textarea"].includes(node.tag) ||
        node.attrsMap?.["data-i18n-preserve"] !== undefined;
      if (!keep && [2, 3].includes(node.type) && !node.isComment && !editedStarts.has(offset + node.start)) {
        const original = source.slice(offset + node.start, offset + node.end);
        let text = original;
        if (node.type === 2) {
          text = original.replace(/\{\{([\s\S]*?)\}\}/gu, (whole, expression) =>
            /\$(?:t|legacyText|legacyHtml)\(/u.test(expression) || protectedValue(expression)
              ? whole : `{{ $legacyText(_s(${expression.trim()})) }}`);
        } else if (/[A-Za-z]{2}/u.test(node.text)) {
          const rule = selectRule(node.text);
          if (rule) text = `${original.match(/^\s*/u)[0]}{{ $t('${rule.id}') }}${original.match(/\s*$/u)[0]}`;
        }
        if (text !== original) edits.push({ start: offset + node.start, end: offset + node.end, text });
      }
      if (!keep) for (const attribute of node.attrsList ?? []) {
        const display = ["title", "label", "placeholder", "aria-label", "alt", "on", "off", "ach-tooltip"];
        const name = attribute.name.replace(/^:/u, "");
        let text;
        if (attribute.name === "v-html" && !attribute.value.includes("$legacyHtml(")) {
          text = `v-html="$legacyHtml(${attribute.value.replace(/"/gu, "&quot;")})"`;
        } else if (attribute.name === "v-tooltip" && !attribute.value.includes("$legacyTooltip(")) {
          text = `v-tooltip="$legacyTooltip(${attribute.value.replace(/"/gu, "&quot;")})"`;
        } else if (display.includes(name) && attribute.name.startsWith(":")) {
          if (!/\$(?:t|legacyText)\(/u.test(attribute.value)) {
            text = `${attribute.name}="$legacyText(${attribute.value.replace(/"/gu, "&quot;")})"`;
          }
        } else if (display.includes(name)) {
          const rule = selectRule(attribute.value);
          if (rule) text = `:${name}="$t('${rule.id}')"`;
        }
        if (text !== undefined && attribute.start !== undefined) {
          const original = source.slice(offset + attribute.start, offset + attribute.end);
          edits.push({ start: offset + attribute.start, end: offset + attribute.end,
            text: original.match(/^\s*/u)[0] + text + original.match(/\s*$/u)[0] });
        }
      }
      for (const child of node.children ?? []) visit(child, keep);
      for (const branch of node.ifConditions ?? []) visit(branch.block, keep);
    };
    visit(compiler.compile(template, { outputSourceRange: true }).ast);
    if (edits.length) templateEdits.set(file, edits);
  }
}
for (const [file, edits] of templateEdits) {
  let source = fs.readFileSync(path.join(sourceRoot, file), "utf8");
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  fs.writeFileSync(path.join(root, file), source);
}
console.log(`ADEChinese ${revision}: ${rules.length} messages from ${pairs.length} occurrences; ${unmatched.length} unmatched nodes.`);
syncNavigation();
const definitions = Object.entries(packs.en).filter(([id]) => id.startsWith("terms."))
  .flatMap(([id, entry]) => Object.values(typeof entry === "string" ? { text: entry } : entry)
    .map(source => ({ id, source })));
const shared = shareTerms(packs, definitions);
const completeRules = shareMatterTerms(packs, rules);
const exactResources = new Set(definitions.map(term => term.source.toLowerCase()));
write("src/i18n/display-terms.json", shared.terms);
write("src/i18n/adechinese-rules.json", completeRules.filter(rule => !exactResources.has(rule.source?.toLowerCase()))
  .map(({ source, ...rule }) => rule));
for (const [id, catalog] of Object.entries(packs)) write(`src/locales/${id}.json`, catalog);
