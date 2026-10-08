const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const root = path.resolve(__dirname, '..');
const DC = { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') };
const source = fs.readFileSync(path.join(root, 'src/components/tabs/statistics/MultiplierBreakdownEntry.vue'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import[\s\S]*?;\s*/gm, '').replace('export default', 'module.exports =');

function entry(key, mult, pow = 1) {
  return { key, name: key, isActive: true, _hasTransform: false,
    mult: new Decimal(mult), pow: new Decimal(pow),
    data: { mult: new Decimal(mult), pow: new Decimal(pow), isVisible: true, lastVisibleAt: Date.now() } };
}

function panel(entries, mode = 'all', total = 1) {
  const context = { module: { exports: {} }, Decimal, DC,
    BreakdownEntryInfo: class {}, PrimaryToggleButton: {}, MultiplierBreakdownTotal: {}, GameplayLimitSummary: {},
    starResourceForEntry: () => null, getResourceEntryInfoGroups: () => [], PercentageRollingAverage: class {},
    player: { options: { multiplierTab: { replacePowers: false } } },
    format: value => String(value), formatX: value => `×${value}`, formatPow: value => `^${value}`,
    formatPercents: value => `${value * 100}%`,
  };
  vm.runInNewContext(source, context);
  const options = context.module.exports;
  const instance = { ...options.data(), entries, resource: { key: 'X_total', mult: new Decimal(total) },
    $legacyText: value => value,
    valueMode: mode, usesOrdered: false, impactMode: false, _modeMatches: new Map(),
    rollingAverage: { average: [], add(point) { this.average = point ?? []; }, clear() { this.average = []; } },
  };
  for (const [key, method] of Object.entries(options.methods)) instance[key] = method.bind(instance);
  return instance;
}

function assertFiniteLayout(instance) {
  for (const value of [...instance.percentList, ...instance.legacyBarOffsets, ...instance.legacyBarHeights]) {
    assert.equal(Number.isFinite(value), true);
  }
}

test('canceling factors and zero totals keep their rows without NaN percentages', () => {
  for (const total of [1, 0]) {
    const instance = panel([entry('boost', 2), entry('nerf', 0.5)], 'all', total);
    instance.calculatePercents();
    assertFiniteLayout(instance);
    assert.ok(instance.lastNotEmptyAt > 0);
    assert.equal(instance.shouldShowEntry(instance.entries[0]), true);
    assert.equal(instance.shouldShowEntry(instance.entries[1]), true);
  }
});

test('large exponent products never leak Number overflow into bars', () => {
  const instance = panel([entry('one', 'ee500', 'ee100'), entry('two', 'ee600', 'ee200')], 'all', DC.BEMAX);
  instance.calculatePercents();
  assertFiniteLayout(instance);
});

test('multiplier and exponent products are calculated independently and display only the selected value', () => {
  const rows = [entry('one', 4, 3), entry('two', 2, 2)];
  const multipliers = panel(rows, 'multiplier');
  multipliers.calculatePercents();
  assert.ok(multipliers.selectedEffect.sub(8).abs().lt(1e-12));
  assert.ok(Math.abs(multipliers.legacyBarHeights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.match(multipliers.entryString(0), /×4/);
  assert.doesNotMatch(multipliers.entryString(0), /\^3/);
  const powers = panel(rows, 'exponent');
  powers.calculatePercents();
  assert.ok(powers.selectedEffect.sub(6).abs().lt(1e-12));
  assert.match(powers.entryString(0), /\^3/);
  assert.doesNotMatch(powers.entryString(0), /×4/);
});

test('zero exponents produce a zero combined exponent with finite layout', () => {
  const instance = panel([entry('zero', 2, 0), entry('other', 4, 2)], 'exponent');
  instance.calculatePercents();
  assert.equal(instance.selectedEffect.eq(0), true);
  assertFiniteLayout(instance);
});

test('ordered multiplier view remains readable when a much larger exponent dominates Overall', () => {
  const rows = [entry('mult', 1), entry('power', 1)];
  for (const [index, type, before, after, value] of [
    [0, 'multiply', 1, 2, 2], [1, 'power', 2, 'ee500', 'ee100']
  ]) {
    const row = rows[index];
    row._hasTransform = true;
    row.transform = { type };
    row.getTransform = () => row.transform;
    Object.assign(row.data, { hasTransform: true, transformType: type,
      transformBefore: new Decimal(before), transformAfter: new Decimal(after), transformValue: new Decimal(value) });
  }
  const instance = panel(rows, 'multiplier', 'ee500');
  instance.usesOrdered = true;
  instance.calculatePercents();
  assert.equal(instance.percentList[0], 1);
  assert.equal(instance.percentList[1], 0);
  assert.ok(instance.selectedEffect.sub(2).abs().lt(1e-12));
  assert.equal(instance.shouldShowEntry(rows[0]), true);
  assert.equal(instance.shouldShowEntry(rows[1]), false);
});

test('ordered calculation retains the ratio of values below one', () => {
  const row = entry('small', 1);
  row._hasTransform = true;
  row.transform = { type: 'multiply' };
  row.getTransform = () => row.transform;
  Object.assign(row.data, { hasTransform: true, transformType: 'multiply',
    transformBefore: new Decimal(0.5), transformAfter: new Decimal(0.1), transformValue: new Decimal(0.2) });
  const instance = panel([row], 'multiplier', 0.1);
  instance.usesOrdered = true;
  instance.calculatePercents();
  assert.equal(instance.percentList[0], -1);
  assert.ok(instance.selectedEffect.sub(0.2).abs().lt(1e-12));
});

test('a half-power nerf occupies half the OoM budget, including grouped losses', () => {
  const row = entry('category', 1);
  row._hasTransform = true;
  row.getTransform = () => ({ type: 'formula' });
  Object.assign(row.data, { hasTransform: true, transformType: 'formula',
    transformBefore: new Decimal(1), transformAfter: new Decimal('1e50'),
    transformHasImpactBudget: true, transformPositiveImpact: new Decimal(100),
    transformNegativeImpact: new Decimal(50) });
  const instance = panel([row]);
  instance.usesOrdered = true;
  instance.calculatePercents();
  assert.equal(instance.orderedPathPercentList[0], 1);
  assert.equal(instance.orderedPathNerfPercentList[0], 0.5);
  assert.equal(instance.percentList[0], 0.5);
  assert.match(instance.orderedPathStyle(0).background, /50%/);
});

test('neutral glyph transforms are hidden even in the exponent view', () => {
  const row = entry('AD_glyphPower', 1);
  row._hasTransform = true;
  row.getTransform = () => ({ type: 'power' });
  Object.assign(row.data, { isVisible: false, hasTransform: true, transformType: 'power' });
  const instance = panel([row], 'exponent');
  assert.equal(instance.shouldShowEntry(row), false);
});
