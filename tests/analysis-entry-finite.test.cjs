const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/components/tabs/statistics/breakdown-entry-info.js'), 'utf8')
  .replace(/^import .*;\s*/gm, '')
  .replace(/^export /gm, '');

function entries(values) {
  const context = vm.createContext({
    Vue: { observable: value => value },
    Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('1e1000') },
    GameDatabase: { multiplierTabValues: { X: values }, multiplierTabTree: {} },
  });
  vm.runInContext(`${source}\nglobalThis.create = createEntryInfo;`, context);
  return context.create;
}

test('tiny active multipliers and exponents remain visible', () => {
  const create = entries({
    tiny: { name: 'Tiny', isActive: true, multValue: new Decimal('1e-200') },
    power: { name: 'Power', isActive: true, powValue: new Decimal('1e1000') },
  });
  const tiny = create('X_tiny');
  const power = create('X_power');
  tiny.update();
  power.update();
  assert.equal(tiny.data.isVisible, true);
  assert.equal(power.data.isVisible, true);
  assert.equal(tiny.data.mult.eq('1e-200'), true);
  assert.equal(power.data.pow.eq('1e1000'), true);
});

test('saturated transform still shows a real source value', () => {
  const create = entries({
    saturated: {
      name: 'Saturated', isActive: true,
      transformValue: () => ({ type: 'multiply', before: new Decimal('1e1000'),
        after: new Decimal('1e1000'), value: new Decimal('1e-200') })
    }
  });
  const entry = create('X_saturated');
  entry.update();
  assert.equal(entry.data.isVisible, true);
  assert.equal(entry.data.transformBefore.eq(entry.data.transformAfter), true);
});

test('invalid source arithmetic is marked and never stored as NaN', () => {
  const create = entries({
    invalid: { name: 'Invalid', isActive: true, multValue: () => new Decimal(NaN) },
    infinite: { name: 'Infinite', isActive: true, multValue: () => new Decimal(Infinity) },
  });
  const invalid = create('X_invalid');
  const infinite = create('X_infinite');
  invalid.update();
  infinite.update();
  assert.equal(invalid.data.invalidValue, true);
  assert.equal(invalid.data.isVisible, true);
  assert.equal(invalid.data.mult.eq(1), true);
  assert.equal(infinite.data.invalidValue, true);
  assert.equal(infinite.data.mult.eq('1e1000'), true);
});

test('classic AD getters survive ordered step name collisions', () => {
  const adSource = fs.readFileSync(path.join(__dirname, '..', 'src/core/secret-formula/multiplier-tab/antimatter-dimensions.js'), 'utf8')
    .replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({
    AD_ORDERED_LABELS: { dimboost: 'Dimboost' }, AD_ORDERED_GROUPS: [],
    MultiplierTabIcons: new Proxy({}, { get: () => () => ({}) }),
    DimBoost: { multiplierToNDTier: () => new Decimal(2) },
  });
  vm.runInContext(`${adSource}\nglobalThis.values = AD;`, context);
  assert.equal(context.values.classicdimboost.multValue(1).eq(2), true);
  assert.equal(context.values.dimboost.multValue, undefined);
  assert.equal(typeof context.values.dimboost.transformValue, 'function');
});

test('aggregate rows preserve multiplier values and per-tier exponents even at saturation', () => {
  const core = file => fs.readFileSync(path.join(__dirname, '..', 'src/core', file), 'utf8')
    .replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');
  const maximum = new Decimal('10^^9000000000000000');
  const context = vm.createContext({ Decimal, DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: maximum } });
  vm.runInContext(core('finite-decimal.js'), context);
  vm.runInContext(`${core('secret-formula/multiplier-tab/ordered-breakdown.js')}\nglobalThis.aggregate = aggregateOrderedTransforms;`, context);
  const item = (tier, type, value) => ({ tier, transform: {
    type, before: maximum, after: maximum, value: new Decimal(value)
  } });
  const mult = context.aggregate([item(1, 'multiply', 2), item(2, 'multiply', 3)], 'AD', false);
  assert.equal(mult.type, 'multiply');
  assert.equal(mult.value.eq(6), true);
  assert.equal(mult.alwaysShow, true);
  const power = context.aggregate([item(1, 'power', 4), item(2, 'power', 4)], 'AD', false);
  assert.equal(power.type, 'power');
  assert.equal(power.value.eq(4), true);
});
