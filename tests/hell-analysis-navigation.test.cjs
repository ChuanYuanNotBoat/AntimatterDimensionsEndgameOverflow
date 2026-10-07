'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');

test('the existing Hell button cycles through AD, AD analysis and Slabdrill without changing progression', () => {
  const ui = { view: { tab: 'dimensions', subtab: 'antimatter' } };
  const player = { options: { multiplierTab: { currTab: 3 } },
    celestials: { slabdrill: { isCursed: true, stage: 4, core: { isActive: true, chaosCores: 7 } } } };
  const before = JSON.stringify(player.celestials);
  const target = (tab, subtab) => ({ show(manual) {
    assert.equal(manual, true);
    Object.assign(ui.view, { tab, subtab });
  } });
  const context = vm.createContext({ player, ui, PrimaryButton: {}, Date,
    Tab: { dimensions: { antimatter: target('dimensions', 'antimatter') },
      statistics: { multipliers: target('statistics', 'multipliers') },
      celestials: { slabdrill: target('celestials', 'slabdrill') } } });
  vm.runInContext(read('components/tabs/statistics/multiplier-tab-navigation.js').replace(/^export /gm, ''), context);
  const source = read('components/ui-modes/CursedHeader.vue');
  vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*;\n/gm, '').replace('export default', 'this.component ='), context);
  const instance = {};
  for (const [key, method] of Object.entries(context.component.methods)) instance[key] = method.bind(instance);
  for (const [tab, subtab] of [['statistics', 'multipliers'], ['celestials', 'slabdrill'], ['dimensions', 'antimatter']]) {
    instance.changeTabs();
    assert.deepEqual(ui.view, { tab, subtab });
  }
  assert.equal(player.options.multiplierTab.currTab, 2);
  assert.equal(JSON.stringify(player.celestials), before);
  assert.equal((source.match(/<PrimaryButton\b/gu) ?? []).length, 2);
});

test('nonzero multiplier formatting cannot round a penalty to zero, while true zero stays zero', () => {
  Decimal.prototype.valueOf = () => { throw new Error('Implicit Decimal conversion'); };
  const context = vm.createContext({ Decimal, window: {},
    format: (value, places, under) => new Decimal(value).toNumber().toFixed(under ?? places ?? 0) });
  const source = read('core/format.js');
  vm.runInContext(source.slice(source.indexOf('window.formatX ='), source.indexOf('window.formatPow =')), context);
  assert.equal(context.window.formatX(new Decimal(0), 2, 2), '×0.00');
  assert.equal(context.window.formatX(new Decimal(657.21), 2, 2), '×657.21');
  assert.equal(context.window.formatX(new Decimal(0.0002), 2, 2), '×1/(5000.00)');
  assert.notEqual(context.window.formatX(new Decimal('1e-200'), 2, 2), '×0.00');
});

test('Slabdrill analysis sources share the existing celestial emblem and representative color', () => {
  const normalIcon = { color: 'unchanged' };
  const context = vm.createContext({ reality: { glyphTypes: { power: { color: '#test' } } },
    multiplierTabValues: {
      AD: { slabCore: { icon: normalIcon }, purchase: { icon: normalIcon } },
      ID: { slabMultiplier: { icon: normalIcon } },
      EP: { slabSoftcap2000: { icon: normalIcon }, timeStudy: { icon: normalIcon } },
    } });
  vm.runInContext(read('core/secret-formula/multiplier-tab/icons.js')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const values = read('core/secret-formula/multiplier-tab/values.js');
  vm.runInContext(values.slice(values.indexOf('// Use the celestial')), context);
  for (const [resource, key] of [['AD','slabCore'], ['ID','slabMultiplier'], ['EP','slabSoftcap2000']]) {
    const icon = context.multiplierTabValues[resource][key].icon;
    assert.equal(icon.color, 'var(--color-slabdrill--base)');
    assert.equal(icon.symbol, '<b>⁹δ</b>');
  }
  assert.equal(context.multiplierTabValues.AD.purchase.icon, normalIcon);
});
