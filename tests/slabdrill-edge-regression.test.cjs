'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { setup, read, Decimal } = require('./helpers/chapter3-gameplay.cjs');

for (const [cursed, challenge] of [[true, 4], [true, 1], [false, 4], [false, 1]]) {
  test(`dimension purchase hook resets the correct currency in ${cursed ? 'Slabdrill' : 'normal'} challenge ${challenge}`, () => {
    const calls = [];
    const player = { speedrun: { isActive: false }, chall2Pow: 1,
      records: { thisInfinity: { time: new Decimal(100), lastBuyTime: new Decimal(0) } },
      requirementChecks: { eternity: {}, infinity: {} } };
    const context = vm.createContext({ player, Decimal,
      Tutorial: { turnOffEffect() {} }, TUTORIAL_STATE: { DIM1: 1, DIM2: 2 },
      Achievement: () => ({ unlock() {}, tryUnlock() {} }),
      NormalChallenge: id => ({ isRunning: challenge === 4 && id === 4 }),
      InfinityChallenge: id => ({ isRunning: challenge === 1 && id === 1 }),
      Slabdrill: { isCursed: cursed, isDestroyed: false },
      AntimatterDimensions: { resetAmountUpToTier: tier => calls.push(['dimensions', tier]) },
      Currency: { antimatter: { reset: () => calls.push(['antimatter']) } } });
    vm.runInContext(read('core/dimensions/antimatter-dimension.js')
      .match(/function onBuyDimension\([\s\S]*?\n\}/)[0], context);
    assert.doesNotThrow(() => context.onBuyDimension(1));
    assert.deepEqual(calls, cursed ? [['dimensions', 0], ['antimatter']] : [['dimensions', 0]]);
    assert.equal(player.postC4Tier, 1);
    assert.ok(player.records.thisInfinity.lastBuyTime.eq(100));
  });
}

test('partial Slabdrill exit repairs the global restriction without discarding progress', () => {
  const w = setup();
  Object.assign(w.player.celestials.slabdrill, { isDestroyed: true, isCursed: true, isWarping: true,
    isGoodbye: true, hasBoughtNinthDimension: true, stage: 11 });
  w.player.disablePostReality = true;
  w.player.celestials.alpha = { stage: 28, run: false };
  w.context.normalizeChapter3Save(w.player);
  assert.equal(w.player.disablePostReality, false);
  assert.equal(w.player.celestials.slabdrill.stage, 11);
  assert.equal(w.player.celestials.slabdrill.hasBoughtNinthDimension, true);
  const before = JSON.stringify(w.player);
  w.context.normalizeChapter3Save(w.player);
  assert.equal(JSON.stringify(w.player), before);
});

for (const run of ['alpha', 'effarig', 'teresa', 'void', 'curse']) {
  test(`save repair preserves the restriction for an active ${run} run`, () => {
    const w = setup();
    w.player.celestials.slabdrill.isDestroyed = run !== 'curse';
    w.player.celestials.slabdrill.hasBoughtNinthDimension = true;
    w.player.disablePostReality = true;
    if (run === 'void') w.player.endgame.largeHadronCollider.void.isRunning = true;
    else if (run === 'curse') w.player.celestials.slabdrill.isCursed = true;
    else w.player.celestials[run] = { run: true };
    w.context.normalizeChapter3Save(w.player);
    assert.equal(w.player.disablePostReality, true);
  });
}

test('Slabdrill purchase counts cannot produce negative normal cost scaling', () => {
  const context = vm.createContext({ player: { infinityRebuyables: [23, 22, 10] } });
  vm.runInContext(read('core/secret-formula/infinity/break-infinity-upgrades.js').split('export const')[0], context);
  for (const [id, maximum] of [[0, 8], [1, 7]]) {
    context.config = { id, maxUpgrades: () => maximum, costIncrease: () => 2, initialCost: () => 1 };
    const upgrade = vm.runInContext('rebuyable(config)', context);
    assert.equal(upgrade.effect(), maximum);
    assert.ok(10 - upgrade.effect() > 1);
    assert.equal(context.player.infinityRebuyables[id], id === 0 ? 23 : 22);
    context.config.maxUpgrades = () => id === 0 ? 23 : 22;
    assert.equal(upgrade.effect(), id === 0 ? 23 : 22);
  }
});

test('IC3 static reward stays finite at extreme valid purchase counts', () => {
  const w = setup();
  w.context.Laitela = { continuumActive: false };
  w.player.galaxies = new Decimal('1e300');
  w.player.totalTickBought = new Decimal('1e400');
  w.load('core/secret-formula/challenges/infinity-challenges.js');
  for (const cursed of [false, true]) {
    w.player.celestials.slabdrill.isCursed = cursed;
    const value = w.run('infinityChallenges.find(item => item.id === 3).reward.effect()');
    assert.ok([value.sign, value.layer, value.mag].every(Number.isFinite));
  }
});

test('Alpha cap scaling handles zero reward and zero base cap without dividing zero by zero', () => {
  const w = setup();
  w.context.Alpha = { isDestroyed: true };
  w.context.Teresa = { rmMultiplier: w.DC.D1 };
  for (const type of ['RM', 'IM']) {
    const method = read('core/machines.js').match(new RegExp(`get hardcap${type}\\(\\) \\{[\\s\\S]*?\\n  \\}`))[0];
    const machine = w.run(`({ baseHardcap${type}: DC.D0, uncapped${type}: DC.D0, ${method} })`);
    assert.ok(machine[`hardcap${type}`].eq(0));
  }
});
