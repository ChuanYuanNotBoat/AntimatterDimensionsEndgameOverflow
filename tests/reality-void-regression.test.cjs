'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');

const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };

function rewards(perkPoints, simulatedRealities, achievementRealities = 0) {
  const context = vm.createContext({
    Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') },
    DecimalCurrency: class {},
    Currency: {
      realityMachines: { value: new Decimal(0), gte: () => false },
      realities: { value: new Decimal(10) },
      relicShards: { value: new Decimal(0) },
    },
    player: {
      reality: { perkPoints: new Decimal(perkPoints) },
      records: { thisReality: { time: new Decimal(60000), realTime: 60000 } },
    },
    MachineHandler: { hardcapRM: new Decimal('1e1000'), projectedIMCap: new Decimal(0) },
    Achievement: () => ({ effectOrDefault: () => 0 }),
    binomialDistribution: () => new Decimal(achievementRealities),
    updateRealityRecords() {},
    addRealityTime() {},
    TeresaUnlocks: { effarig: { canBeApplied: true } },
    Teresa: { isRunning: false },
    Effarig: { isRunning: false },
    Enslaved: { boostReality: false, isRunning: false },
    V: { isRunning: false },
  });
  vm.runInContext(read('core/finite-decimal.js').replace(/^export /gm, ''), context);
  const currency = read('core/currency.js');
  vm.runInContext(currency.slice(currency.indexOf('Currency.perkPoints ='),
    currency.indexOf('\nCurrency.relicShards =')), context);
  const reality = read('core/reality.js');
  vm.runInContext(read('core/analysis-steps.js').replace(/^export /gm, ''), context);
  vm.runInContext(reality.match(/export function realityCountReward\([\s\S]*?\n\}/)[0]
    .replace(/^export /, ''), context);
  vm.runInContext(reality.slice(reality.indexOf('function giveRealityRewards('),
    reality.indexOf('// Due to simulated realities')), context);
  context.props = {
    simulatedRealities: new Decimal(simulatedRealities),
    gainedRM: new Decimal(2),
    gainedShards: new Decimal(3),
    gainedGlyphLevel: { actualLevel: new Decimal(1200) },
  };
  return context;
}

test('manual Reality settles Decimal Perk Points and the remaining rewards without coercion', () => {
  const env = rewards(10, 9, 2);
  assert.doesNotThrow(() => env.giveRealityRewards(env.props));
  assert.ok(env.Currency.perkPoints.value instanceof Decimal);
  assert.ok(env.Currency.perkPoints.value.eq(22));
  assert.ok(env.Currency.realities.value.eq(22));
  assert.ok(env.Currency.realityMachines.value.eq(20));
  assert.ok(env.Currency.relicShards.value.eq(30));
});

test('Perk Point rewards retain values above the native Number limit', () => {
  const env = rewards('1e350', '1e400');
  env.giveRealityRewards(env.props);
  assert.ok(env.Currency.perkPoints.value.eq(new Decimal('1e350').add('1e400')));
  assert.ok(env.Currency.perkPoints.value.gt(Number.MAX_VALUE));
});

test('Perk Point totals stay finite at the game Decimal ceiling', () => {
  const env = rewards('10^^9000000000000000', '10^^9000000000000000');
  env.giveRealityRewards(env.props);
  assert.ok(env.Currency.perkPoints.value.eq(env.DC.BEMAX));
  assert.ok([env.Currency.perkPoints.value.sign, env.Currency.perkPoints.value.layer,
    env.Currency.perkPoints.value.mag].every(Number.isFinite));
});

function voidRun({ running = true, mode = 1, credits = false } = {}) {
  const context = vm.createContext({
    player: { endgame: { largeHadronCollider: { void: { isRunning: running, mode, nullified: true } } } },
    GameEnd: { creditsEverClosed: credits },
    resets: 0,
  });
  context.Endgame = { resetNoReward: () => { context.resets++; } };
  const source = read('core/large-hadron-collider.js');
  const getters = source.match(/  get voidRunning\(\) \{[\s\S]*?\n  get nullifiedVoidRunning\(\) \{[\s\S]*?\n  \},/)[0];
  vm.runInContext(`this.LHC = {\n${getters}\n};`, context);
  const exit = source.match(/export function exitNullifiedVoid\(\) \{[\s\S]*?\n\}/)[0];
  vm.runInContext(exit.replace('export ', ''), context);
  return context;
}

test('Nullified Void exits once using the live run state', () => {
  const env = voidRun();
  assert.equal(env.exitNullifiedVoid(), true);
  assert.equal(env.player.endgame.largeHadronCollider.void.isRunning, false);
  assert.equal(env.player.endgame.largeHadronCollider.void.nullified, true);
  assert.equal(env.resets, 1);
  assert.equal(env.exitNullifiedVoid(), false);
  assert.equal(env.resets, 1);
});

test('Nullified Void exit rejects inactive, ordinary Void, and credits states without resetting', () => {
  for (const options of [{ running: false }, { mode: 0 }, { credits: true }]) {
    const env = voidRun(options);
    assert.equal(env.exitNullifiedVoid(), false);
    assert.equal(env.resets, 0);
    assert.equal(env.player.endgame.largeHadronCollider.void.isRunning, options.running ?? true);
  }
});
