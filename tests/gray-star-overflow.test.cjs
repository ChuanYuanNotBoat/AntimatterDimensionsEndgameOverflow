'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('./helpers/chapter3-vm.cjs');
const test = require('node:test');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src/core', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };

function world(amount) {
  const formatted = [];
  const context = vm.createContext({
    Decimal, window: {},
    DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') },
    Universes: {stellarAugmentersToGrayStarEffectiveness:new Decimal(1)},
    player: { disablePostReality: false, endgame: { ethereal: { stars: { gray: new Decimal(amount) } } } },
    format: value => {
      assert.ok(Decimal.isFinite(value));
      formatted.push(value);
      return value.toString();
    },
  });
  vm.runInContext(read('finite-decimal.js').replace(/^export /gm, ''), context);
  vm.runInContext(read('format.js'), context);
  context.formatDecimalPercents = context.window.formatDecimalPercents;
  context.formatPercents = context.window.formatPercents;
  vm.runInContext(read('secret-formula/endgame/stars.js').replace(/^import\s+[^;]+;\n/gm, '').replace('export const stars =', 'this.stars ='), context);
  return { context, formatted };
}

test('Gray Star percentages keep ordinary values and full screenshot-scale effects', () => {
  for (const amount of [0, 1, '1e100', 'eeee1000', Decimal.fromComponents(1, 10, 2.078e266)]) {
    const { context, formatted } = world(amount);
    const reward = context.stars.gray.effect();
    const text = context.stars.gray.description(reward);
    assert.doesNotMatch(text, /NaN|Infinity/u);
    assert.ok(text.endsWith('%'));
    assert.ok(formatted[0].eq(reward), 'the percentage must show the full reward without a Number cap');
    if (amount === 0) assert.equal(text, 'Increase the effectiveness of all other stars by 0%');
  }
});

test('disabled post-Reality Gray Stars still display a zero bonus', () => {
  const { context } = world('eeee1000');
  context.player.disablePostReality = true;
  assert.equal(context.stars.gray.description(context.stars.gray.effect()),
    'Increase the effectiveness of all other stars by 0%');
});
