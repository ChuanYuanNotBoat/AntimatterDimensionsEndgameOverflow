'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src/core', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };

function world({ reduction = 1, modifier = 1, scale = 1, discount = 0, distant = 100, remote = 800 } = {}) {
  const effect = value => ({ effectOrDefault: () => value });
  const context = vm.createContext({
    Decimal, Math, console,
    DC: { D0: new Decimal(0), D1: new Decimal(1), NUMMAX: new Decimal(Number.MAX_VALUE),
      BEMAX: new Decimal('10^^9000000000000000') },
    player: { galaxies: new Decimal(0), disablePostReality: false },
    RealityUpgrade: () => effect(remote),
    GalacticPowers: {
      remoteGalaxyScale: { isUnlocked: false },
      remoteGalaxyPower: { isUnlocked: true, reward: new Decimal(reduction) },
      galaxyScaling: { isUnlocked: true, reward: new Decimal(scale) },
      galaxyEmpowerment1: { isUnlocked: false }, galaxyEmpowerment2: { isUnlocked: false },
    },
    Effects: { min: initial => initial, sum: value => value?.discount ?? 0 },
    BreakEternityUpgrade: { galaxyScaleDelay: effect(0) },
    InfinityUpgrade: { resetBoost: { discount } },
    InfinityChallenge: () => ({ isCompleted: false }), NormalChallenge: () => ({ isRunning: false }),
    EternityChallenge: () => ({ isRunning: false, reward: {} }),
    Alpha: { isRunning: false },
    AlphaUnlocks: { powerGalaxies: { effects: { buff: effect(1) } } },
    TimeStudy: id => effect(id === 302 ? new Decimal(distant).sub(100) : 0),
    GlyphSacrifice: { power: { effectValue: new Decimal(0) } },
    GlyphAlteration: { isAdded: () => modifier !== 1 },
    getSecondaryGlyphEffect: () => new Decimal(modifier),
  });
  vm.runInContext(read('finite-decimal.js').replace(/^export /gm, ''), context);
  vm.runInContext(read('galaxy.js').split('\nfunction galaxyReset()')[0]
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\nthis.Galaxy = Galaxy;', context);
  return context;
}

function finite(value) {
  assert.ok(value instanceof Decimal);
  assert.ok([value.sign, value.layer, value.mag].every(Number.isFinite));
}

function maximalAffordable(context, budget) {
  const currency = new Decimal(budget);
  const target = context.Galaxy.buyableGalaxies(currency);
  finite(target);
  if (currency.lt(context.Galaxy.requirement.amount)) {
    assert.ok(target.eq(context.player.galaxies));
    return target;
  }
  assert.ok(context.Galaxy.requirementAt(target.sub(1)).amount.lte(currency), 'last granted Galaxy must be affordable');
  if (target.add(1).gt(target) && target.lt(context.DC.BEMAX)) {
    assert.ok(context.Galaxy.requirementAt(target).amount.gt(currency), 'next Galaxy must be unaffordable');
  }
  return target;
}

test('ordinary AG prices retain normal, distant and remote cost formulas', () => {
  const context = world();
  for (const galaxies of [0, 1, 99, 100, 101, 799, 800, 801, 1000]) {
    const equivalent = Math.min(800, galaxies);
    const distance = Math.max(equivalent - 100 + 1, 0);
    const expected = Math.floor((80 + equivalent * 60 + distance * (distance + 1)) *
      (galaxies >= 800 ? Math.pow(1.002, galaxies - 800 + 1) : 1));
    assert.equal(context.Galaxy.requirementAt(new Decimal(galaxies)).amount.toNumber(), expected);
  }
});

test('bulk purchases match forward prices with Glyph discounts, reset discounts and flooring', () => {
  for (const modifier of [1, 0.25, 1e-20]) {
    for (const discount of [0, 9]) {
      const context = world({ modifier, discount });
      for (const budget of [1, 79, 80, 140, 200, 6020, 6082, 75262, 1e8]) maximalAffordable(context, budget);
    }
  }
  assert.ok(world({ modifier: 0.25 }).Galaxy.buyableGalaxies(new Decimal(80)).eq(5));
});

test('remote scaling survives reductions that native Numbers round to zero', () => {
  const context = world({ reduction: '1e-400' });
  assert.equal(context.Galaxy.remoteGalaxyStrength, 1, 'reproduces the unrepresentable addition to 1');
  assert.ok(context.Galaxy.remoteGalaxyLogStrength.gt(0));
  const low = context.Galaxy.requirementAt(new Decimal('1e400')).amount;
  const high = context.Galaxy.requirementAt(new Decimal('1e403')).amount;
  finite(low); finite(high);
  assert.ok(low.gt(context.Galaxy.requirementAt(new Decimal(800)).amount));
  assert.ok(high.gt(low.times(7)), 'a tiny growth rate times a huge count still increases prices');
  const target = maximalAffordable(context, '1e100');
  assert.ok(target.gt('1e400'));
});

test('quadratic inverse avoids cancellation at huge distant thresholds', () => {
  const context = world({ distant: 'ee100', remote: 'eee100', scale: '1e-400' });
  const target = maximalAffordable(context, 'ee110');
  assert.ok(target.gt('ee100'));
});

test('extreme scaling reductions keep AG prices growing with purchased Galaxies', () => {
  const context = world({ scale: 0 });
  assert.ok(context.Galaxy.costMult.eq(1));
  assert.ok(context.Galaxy.requirementAt(new Decimal(10)).amount.gt(80));
  const target = maximalAffordable(context, 1000);
  assert.ok(target.gt(100));
  const extreme = world({ scale: '1e-1000' });
  assert.ok(extreme.Galaxy.requirementAt(new Decimal('1e400')).amount.gt('1e400'));
});

test('Galactic Power retains a positive Decimal remote reduction beyond the Number range', () => {
  const context = world();
  context.Currency = { galacticPower: { value: Decimal.fromComponents(1, 11, 266.31765) } };
  vm.runInContext(read('secret-formula/endgame/galactic-power.js').replace(/^import .*;\n/gm, '')
    .replace('export const galacticPowerRewards =', 'this.rewards ='), context);
  const reduction = context.rewards.remoteGalaxyPower.effect();
  finite(reduction);
  assert.ok(reduction.gt(0));
  assert.equal(reduction.toNumber(), 0);
  context.player.disablePostReality = true;
  assert.ok(context.rewards.remoteGalaxyPower.effect().eq(1));
});

test('AG confirmation keeps dimension budgets beyond native Number range', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/modals/prestige/AntimatterGalaxyModal.vue'), 'utf8');
  assert.doesNotMatch(source, /dim\.totalAmount\.toNumber\(\)/);
});
