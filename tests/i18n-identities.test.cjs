'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const strip = source => source.replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
const component = (file, globals = {}) => vm.runInNewContext(
  read(file).split('<script>')[1].split('</script>')[0].replace(/^import .*;\s*$/gm, '').replace('export default', 'result ='),
  globals
);

test('Potency restrictions use its key even when its name is translated or misleading', () => {
  const source = read('core/large-hadron-collider.js').split('export const Accelerators')[0];
  const context = vm.createContext({
    GameMechanicState: class {}, Pelle: { isDoomed: true }, Slabdrill: { isCursed: false },
    LHC: { acceleratorSpeed: 1 },
  });
  vm.runInContext(`${strip(source)}\nthis.Accelerator = AcceleratorState;`, context);
  const state = Object.create(context.Accelerator.prototype);
  Object.defineProperties(state, {
    config: { value: { key: 'potency', name: '译名', percentage: () => 1 } },
    isActive: { value: true }, isMaxed: { value: false },
    fillCurrency: { value: { value: new Decimal(100) } },
    amountFilled: { value: 0, writable: true },
    checkMilestoneStates: { value() {} },
  });
  state.fill(100);
  assert.equal(state.amountFilled, 0);
  state.config.key = 'emptiness';
  state.config.name = 'Potency Accelerator';
  state.fill(100);
  assert.equal(state.amountFilled, 0.1);
});

test('alchemy refinements keep the historical save key after display-name changes', () => {
  const source = read('core/celestials/ra/alchemy.js');
  const start = source.indexOf('class BasicAlchemyResourceState');
  const end = source.indexOf('class AdvancedAlchemyResourceState', start);
  const records = { power: 12 };
  const context = vm.createContext({
    AlchemyResourceState: class { constructor(config) { this.config = config; } },
    player: { celestials: { ra: { highestRefinementValue: records } } }, Ra: { alchemyResourceCap: 1e6 },
  });
  vm.runInContext(`${source.slice(start, end)}\nthis.Resource = BasicAlchemyResourceState;`, context);
  const resource = new context.Resource({ name: '力量', saveKey: 'power' });
  assert.equal(resource.highestRefinementValue, 12);
  resource.config.name = 'Another label';
  resource.highestRefinementValue = 50;
  assert.deepEqual(records, { power: 50 });
});

test('Ethereal manual and free resets read and write the existing star field', () => {
  const source = read('core/ethereal.js');
  const start = source.indexOf('export function resetForStar');
  const end = source.indexOf('export function getStarPowerGainPerSecond', start);
  const star = { id: 0, isUnlocked: true, config: { name: '红色', saveKey: 'red', resetReq: 1e25 } };
  const context = vm.createContext({
    Decimal, DC: { D0: new Decimal(0) },
    player: { endgame: { ethereal: { stars: { red: new Decimal(7) }, power: new Decimal(1e29), sector: 2 } } },
    Currency: { etherealPower: { value: new Decimal(1e29), lt: () => false } },
    EtherealStars: { all: [star] }, Ethereal: { allStarBoost: new Decimal(1), starGeneration: () => new Decimal(1) },
  });
  vm.runInContext(strip(source.slice(start, end)), context);
  context.resetForStar(0);
  assert.equal(context.player.endgame.ethereal.stars.red.toString(), '107');
  context.freeStarReset(0, 1000);
  assert.equal(context.player.endgame.ethereal.stars.red.toString(), '207');
  assert.deepEqual(Object.keys(context.player.endgame.ethereal.stars), ['red']);
});

test('background animation selection uses subtab keys after names change', () => {
  const globals = { BlobSnowflakes: {}, Hadrons: {}, Stars: {}, TachyonParticles: {},
    Theme: { currentName: () => 'Normal' }, player: { options: { animations: {
    hadrons: true, stars: true, tachyonParticles: true,
  } } }, Tabs: { current: { translated: { key: 'collider', name: 'not the old title' } } } };
  const view = component('components/BackgroundAnimations.vue', globals);
  const state = { $viewModel: { subtab: 'translated' } };
  view.methods.update.call(state);
  assert.equal(state.animateHadrons, true);
  assert.equal(state.animateStars, false);
  globals.Tabs.current.translated.key = 'ethereal';
  view.methods.update.call(state);
  assert.equal(state.animateStars, true);
});

test('classic subtab styling is keyed by the parent ID rather than its title', () => {
  const view = component('components/ui-modes/classic/ClassicSubtabButton.vue');
  const classes = view.computed.classObject.call({ parentKey: 'cdexpansion', universe: 0 });
  assert.equal(classes['o-tab-btn--cd-expansion'], true);
  assert.equal(classes['o-tab-btn--infinity'], false);
});

test('all template IDs dispatch even when the UI title is no longer English', () => {
  const context = vm.createContext({});
  vm.runInContext(`${strip(read('core/automator/script-templates.js'))}\nthis.Template = ScriptTemplate;`, context);
  const methods = {
    climbEP: 'templateClimbEP', grindEternities: 'templateGrindEternities',
    grindInfinities: 'templateGrindInfinities', completeEC: 'templateDoEC', unlockDilation: 'templateUnlockDilation',
  };
  for (const [id, method] of Object.entries(methods)) {
    context.Template.prototype[method] = function(params) { this.lines.push(params.expected); };
    const template = new context.Template({ expected: id, displayName: '中文标题' }, id);
    assert.equal(template.lines[0], id);
  }
});

test('localized notation labels leave saved names, lookup, and numerical formatting unchanged', () => {
  const en = JSON.parse(read('locales/en/notations.json'));
  const zh = JSON.parse(read('locales/zh-CN/notations.json'));
  let locale = en;
  const context = vm.createContext({
    ADNotations: require('adnot-beport-small'), ADLNotations: require('adnot-beport-large'),
    player: { options: {} }, ui: {}, GameUI: { initialized: false, notify: { success() {} } },
    EventHub: { logic: { on() {} } }, GAME_EVENT: {}, t: key => locale[key],
  });
  vm.runInContext(`${strip(read('core/notations.js'))}\nthis.small = Notations; this.large = LNotations;`, context);
  const original = context.small.all.map(notation => notation.name);
  const formatted = context.small.all[0].format(new Decimal('5e130'), 2, 2);
  for (const notation of [...context.small.all, ...context.large.all]) assert.equal(notation.displayName, notation.name);
  locale = zh;
  for (const [collection, field] of [[context.small, 'notation'], [context.large, 'lnotation']]) {
    for (const notation of collection.all) {
      assert.ok(notation.displayName);
      notation.setAsCurrent();
      assert.equal(context.player.options[field], notation.name);
      assert.equal(collection.find(context.player.options[field]), notation);
    }
  }
  assert.equal(context.small.all[0].displayName, '科学');
  assert.deepEqual(context.small.all.map(notation => notation.name), original);
  assert.equal(context.small.all[0].format(new Decimal('5e130'), 2, 2), formatted);
});

test('tab display names localize while canonical names, keys, and IDs stay fixed', () => {
  let chinese = false;
  const context = vm.createContext({
    player: { options: { lastOpenSubtab: { 1: 0 } } }, translate: key => chinese ? '选项' : 'Options',
  });
  const source = read('core/tabs.js').split('export const Tab =')[0];
  vm.runInContext(`${strip(source)}\nthis.TabState = TabState;`, context);
  const tab = new context.TabState({ key: 'options', id: 1, name: 'Options', nameKey: 'tabs.options.name', subtabs: [] });
  assert.equal(tab.displayName, 'Options');
  chinese = true;
  assert.equal(tab.displayName, '选项');
  assert.equal(tab.name, 'Options');
  assert.equal(tab.key, 'options');
  assert.equal(tab.id, 1);
});
