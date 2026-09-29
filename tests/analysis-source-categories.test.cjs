const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const source = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');

function setup() {
  const DC = { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') };
  const icons = { trophy: { symbol: 'original trophy' }, upgrade: { symbol: 'original upgrade' } };
  const trace = {
    infinitytotalTimeMult: { type: 'multiply', before: new Decimal(1), after: new Decimal(2), value: new Decimal(2) },
    infinitythisInfinityTimeMult: { type: 'multiply', before: new Decimal(2), after: new Decimal(6), value: new Decimal(3) },
    achievement183: { type: 'power', before: new Decimal(6), after: new Decimal(36), value: new Decimal(2) },
  };
  const evaluate = (_, omitted = new Set()) => {
    let value = new Decimal(1);
    for (const [key, t] of Object.entries(trace)) {
      if (omitted.has(key)) continue;
      value = t.type === 'power' ? value.pow(t.value) : value.times(t.value);
    }
    return value;
  };
  const breakdown = { tierTrace: tier => tier === 1 ? trace : {}, evaluate };
  const context = vm.createContext({ Decimal, DC, Set,
    AntimatterDimensionBreakdown: breakdown, InfinityDimensionBreakdown: {}, TimeDimensionBreakdown: {},
    MultiplierTabIcons: new Proxy({}, { get: () => () => ({}) }),
    formatX: value => `×${value}`, formatPow: value => `^${value}`,
  });
  vm.runInContext(source('core/finite-decimal.js'), context);
  vm.runInContext(source('core/secret-formula/multiplier-tab/ordered-breakdown.js'), context);
  vm.runInContext(source('core/secret-formula/multiplier-tab/dimension-source-groups.js') +
    '\nglobalThis.install = installDimensionSourceGroups;', context);
  const values = { classicinfinityUpgrade: { name: 'Infinity Upgrades', icon: icons.upgrade },
    classicachievement: { name: 'Achievements', icon: icons.trophy } };
  for (const key of Object.keys(trace)) values[key] = { name: key, sourceKey: key };
  const tree = { AD_total: [Object.keys(trace).map(key => `AD_${key}`), [], []] };
  for (let tier = 1; tier <= 8; tier++) tree[`AD_total_${tier}`] = [[], []];
  context.install('AD', values, tree);
  return { values, tree, icons, evaluate, context, DC, trace };
}

test('mixed original categories retain both raw multipliers and per-tier powers', () => {
  const { values, trace } = setup();
  trace.infinitythisInfinityTimeMult.type = 'power';
  const group = values.sourceinfinityUpgrade.transformValue(1).forMode('all');
  assert.match(group.display, /×2/);
  assert.match(group.display, /\^3 per tier/);
  assert.ok(values.sourceinfinityUpgrade.transformValue(1).forMode('multiplier').value.eq(2));
  assert.ok(values.sourceinfinityUpgrade.transformValue(1).forMode('exponent').value.eq(3));
});

test('top-level rows retain original categories and icons; sources are expanded beneath them', () => {
  const { values, tree, icons } = setup();
  assert.deepEqual(Array.from(tree.AD_total[0]), ['AD_sourceachievement', 'AD_sourceinfinityUpgrade']);
  assert.equal(tree.AD_sourceinfinityUpgrade[0].length, 2);
  assert.equal(values.sourceinfinityUpgrade.icon, icons.upgrade);
  assert.equal(values.sourceachievement.icon, icons.trophy);
});

test('category removal replays all members together, and split views select their own operations', () => {
  const { values } = setup();
  const upgrades = values.sourceinfinityUpgrade.transformValue(1).forMode('all');
  assert.ok(upgrades.value.eq(6));
  assert.ok(upgrades.finalWith.div(upgrades.finalWithout).eq(36));
  assert.equal(values.sourceinfinityUpgrade.transformValue(1).forMode('exponent'), null);
  const achievement = values.sourceachievement.transformValue(1).forMode('exponent');
  assert.ok(achievement.value.eq(2));
  assert.ok(achievement.finalWith.div(achievement.finalWithout).eq(6));
});

test('fractional celestial nerfs never turn a finite input into max', () => {
  const { context, DC } = setup();
  for (const input of [new Decimal('1e1000'), new Decimal('ee1000'), new Decimal('eee1000')]) {
    for (const exponent of [0.55, 0.5, 0.01]) {
      const result = context.boundedPositivePower(input, exponent);
      assert.ok(result.lte(input));
      assert.ok(result.lt(DC.BEMAX));
      assert.ok(Decimal.isFinite(result));
    }
  }
});
