const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };
const DC = Object.fromEntries(Object.entries({ D0: 0, D1: 1, E1: 10, E2: 100, E10: 1e10,
  E9E15: 'e9e15', BEMAX: '10^^9000000000000000' }).map(([key, value]) => [key, new Decimal(value)]));
const finite = value => [value.sign, value.layer, value.mag].every(Number.isFinite);

function setup({ budget = 1000, discounted = false, count = 0, allowed = true } = {}) {
  const payments = [];
  const player = { endgames: 1, universes: { current: 0 } };
  const context = vm.createContext({ Decimal, DC, player, GAME_EVENT: { GAME_TICK_AFTER: 'tick' },
    DualityUpgrade: () => ({ isBought: discounted }),
    CelestialDimension: () => ({ baseAmount: DC.D1 }),
    Modal: { message: { show() { throw new Error('Unexpected purchase warning'); } } }
  });
  vm.runInContext(read('core/finite-decimal.js').replace(/^export /gm, ''), context);
  vm.runInContext(read('utility/deepmerge.js').replace(/^export /gm, ''), context);
  const defaults = read('core/player.js').match(/  endgameMasteries: \{[^]*?\n  \},/)[0];
  vm.runInContext(`this.defaults = { ${defaults} };`, context);
  // Exercise the same conversion used when loading a save with the old numeric counts.
  player.endgameMasteries = context.deepmergeAll([context.defaults.endgameMasteries,
    { ggBought: count, cpBought: count, dpBought: count }]);
  const currency = () => ({
    value: new Decimal(budget),
    gte(price) { return this.value.gte(price); },
    purchase(price) {
      assert.ok(finite(price) && price.gt(0), 'every payment must have a finite, positive price');
      if (!allowed || !this.gte(price)) return false;
      payments.push({ price, budget: this.value });
      // Match Currency.purchase: spending is negligible above this precision threshold.
      if (price.lt(DC.E9E15)) this.value = this.value.sub(price).max(0);
      return true;
    }
  });
  context.Currency = { galaxyGeneratorGalaxies: currency(), celestialPoints: currency(), doomedParticles: currency(),
    endgameSkills: {
      get value() { return player.endgameMasteries.skills; },
      add(amount) { player.endgameMasteries.skills = context.boundedPositiveSum(this.value, amount); }
    }
  };
  vm.runInContext(read('core/endgame-skills.js').replace(/^import \{[^]*?\} from .*;\n/gm, '')
    .replace(/^export /gm, '') + '\nthis.types = EndgameSkillPurchaseType; this.skills = EndgameSkills;', context);
  return { context, player, payments, types: context.types, skills: context.skills };
}

for (const type of ['gg', 'cp', 'dp']) {
  test(`${type}: buy max at the first price pays for exactly one skill`, () => {
    const w = setup({ budget: type === 'gg' ? 1e10 : 1 });
    assert.equal(w.types[type].purchase(true), true);
    assert.ok(w.types[type].amount.eq(1));
    assert.ok(w.context.Currency.endgameSkills.value.eq(1));
    assert.equal(w.payments.length, 1);
    assert.ok(w.payments[0].price.eq(w.types[type].costBase));
  });

  for (const discounted of type === 'gg' ? [false, true] : [false]) {
    test(`${type}${discounted ? ' with Duality 27' : ''}: ordinary bulk matches seven individual purchases`, () => {
      const ratio = type === 'gg' ? (discounted ? 1.1 : 100) : 10;
      const base = type === 'gg' ? 1e10 : 1;
      const budget = Decimal.sumGeometricSeries(7, base, ratio, 2).times(1.01);
      const bulk = setup({ budget, discounted, count: 2 });
      const singles = setup({ budget, discounted, count: 2 });
      assert.equal(bulk.types[type].purchase(true), true);
      for (let i = 0; i < 7; i++) assert.equal(singles.types[type].purchase(false), true);
      assert.ok(bulk.types[type].amount.eq(9));
      assert.ok(singles.types[type].amount.eq(9));
      assert.ok(bulk.context.Currency.endgameSkills.value.eq(7));
      assert.ok(bulk.types[type].currency.value.div(singles.types[type].currency.value).sub(1).abs().lt(1e-10));
      assert.equal(bulk.types[type].purchase(false), false);
    });

    for (const [name, budget] of [
      ['Number boundary', new Decimal('e9e15')],
      ['beyond Number range', new Decimal('ee400')],
      ['screenshot range', Decimal.fromComponents(1, 15, 2.078e266)],
      ['Decimal ceiling', DC.BEMAX]
    ]) {
      test(`${type}${discounted ? ' with Duality 27' : ''}: ${name} buys a finite Decimal count`, () => {
        const w = setup({ budget, discounted, count: 1234567 });
        assert.ok(w.types[type].bulkPossible instanceof Decimal);
        assert.equal(w.types[type].purchase(true), true);
        assert.ok(finite(w.types[type].amount) && w.types[type].amount.gt(1234568));
        assert.ok(w.context.Currency.endgameSkills.value.eq(w.types[type].amount.sub(1234567)));
        assert.ok(finite(w.types[type].cost));
        assert.ok(finite(w.skills.totalPurchased()));
        for (const payment of w.payments) assert.ok(payment.price.lte(payment.budget));
        if (budget.gte('ee400')) {
          assert.ok(w.types[type].amount.gt(Number.MAX_VALUE));
          const before = new Decimal(w.context.Currency.endgameSkills.value);
          assert.equal(w.types[type].purchase(true), false);
          assert.equal(w.types[type].purchase(false), false);
          assert.ok(w.context.Currency.endgameSkills.value.eq(before), 'no repeated reward at unchanged precision');
        }
      });
    }
  }
}

test('refused and locked purchases do not modify counts or skills', () => {
  const refused = setup({ budget: 'ee400', allowed: false });
  assert.equal(refused.skills.buyMax(), 0);
  assert.ok(refused.skills.totalPurchased().eq(0));
  assert.ok(refused.context.Currency.endgameSkills.value.eq(0));
  const locked = setup({ budget: 'ee400' });
  locked.player.endgames = 0;
  assert.equal(locked.skills.buyMax(), 0);
  assert.equal(locked.payments.length, 0);
});

test('Decimal purchase counts survive save round trips and reset to Decimal zero', () => {
  const w = setup({ budget: 'ee400' });
  assert.equal(w.skills.buyMax(), 3);
  const saved = JSON.parse(JSON.stringify(w.player.endgameMasteries));
  const restored = w.context.deepmergeAll([w.context.defaults.endgameMasteries, saved]);
  for (const type of ['gg', 'cp', 'dp']) {
    assert.ok(restored[`${type}Bought`] instanceof Decimal);
    assert.ok(restored[`${type}Bought`].eq(w.types[type].amount));
    w.types[type].reset();
    assert.ok(w.types[type].amount instanceof Decimal && w.types[type].amount.eq(0));
  }
});

test('Grandmastery retains its ordinary reward and accepts purchased counts beyond Number range', () => {
  const w = setup();
  const achievement = read('core/secret-formula/achievements/normal-achievements.js')
    .match(/  \{\n    id: 231,[^]*?\n  \},/)[0];
  w.context.EndgameSkills = w.skills;
  w.context.Pelle = { isDoomed: false };
  w.context.Achievement = () => ({ isUnlocked: false });
  vm.runInContext(`this.achievement = (${achievement.replace(/,\s*$/, '')});`, w.context);
  for (const count of [0, 1000, 2000, 8000]) {
    w.types.cp.amount = new Decimal(count);
    const expected = 1 + (Math.min(count, 2000) + Math.max(Math.log2(count / 2000), 0) * 1000) / 100000;
    assert.ok(new Decimal(w.context.achievement.effect()).sub(expected).abs().lt(1e-12));
    assert.equal(w.context.achievement.checkRequirement(), count >= 1000);
  }
  w.types.cp.amount = Decimal.fromComponents(1, 15, 2.078e266);
  assert.ok(finite(w.context.achievement.effect()));
  assert.ok(w.context.achievement.effect().gt(Number.MAX_VALUE));
  assert.equal(w.context.achievement.checkRequirement(), true);
  assert.ok(w.context.achievement.progress().eq(1));
});
