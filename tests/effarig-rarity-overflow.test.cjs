'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('./helpers/chapter3-vm.cjs');
const test = require('node:test');
const Decimal = require('break_eternity.js');

const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };

function world(shards = 0) {
  const unlock = (value = 0, active = true) => ({
    canBeApplied: active,
    effectOrDefault: fallback => active ? value : fallback,
  });
  const context = vm.createContext({
    Decimal, Math, Date,
    DecimalCurrency: class {},
    DC: { D0: new Decimal(0), D1: new Decimal(1), E9: new Decimal(1e9) },
    Currency: { relicShards: { value: new Decimal(shards) } },
    player: { disablePostReality: false, celestials: { effarig: { run: false } },
      records: { bestReality: { glyphLevel: new Decimal(12000) } } },
    EffarigUnlock: { maxRarityBoost: { isUnlocked: true }, glyphGenerationBoost: { isUnlocked: true } },
    Ra: { unlocks: {
      rarityBuff: unlock(), realityGlyphRarity: unlock(),
      maxGlyphRarityAndShardSacrificeBoost: unlock(1, false),
      extraGlyphChoicesAndRelicShardRarityAlwaysMax: unlock(0, false),
    } },
    EndgameMilestone: { startRa: { isReached: false } },
    GlyphSacrifice: { effarig: { effectValue: new Decimal(0) } },
    Effects: { sum: () => 0, max: value => value },
    Achievement: () => ({}), RealityUpgrade: () => ({}),
    GlyphEffects: { all: [], timespeed: { bitmaskIndex: 20 } },
    EndgameMastery: () => ({ effectOrDefault: () => 1 }),
    makeGlyphEffectBitmask: () => 0,
    rarityToStrength: rarity => rarity / 40 + 1,
  });
  vm.runInContext(read('core/extensions.js').match(/Decimal\.prototype\.copyFrom = function\(decimal\) \{[\s\S]*?\n\};/)[0], context);
  const effarig = read('core/celestials/effarig.js');
  vm.runInContext(effarig.slice(effarig.indexOf('export const EFFARIG_STAGES'),
    effarig.indexOf('\nclass EffarigUnlockState'))
    .replace(/^export /gm, '').replace('quotes: Quotes.effarig,', '') + '\nthis.Effarig = Effarig;', context);
  vm.runInContext(read('core/secret-formula/celestials/ra.js').replace(/^import .*;\n/gm, '')
    .replace('export const ra =', 'this.ra ='), context);
  vm.runInContext(read('core/glyphs/glyph-generator.js').replace(/^import .*;\n/gm, '')
    .replace('export const GlyphGenerator =', 'this.GlyphGenerator ='), context);
  return context;
}

function finite(value) {
  assert.ok(value instanceof Decimal, 'unbounded boosts must retain Decimal precision');
  assert.ok([value.sign, value.layer, value.mag].every(Number.isFinite));
}

test('ordinary Relic Shard rarity and sacrifice formulas retain their values', () => {
  for (const shards of [0, 1, 1e100, '1e4750']) {
    const context = world(shards);
    const boost = 15 * (Math.pow(context.Currency.relicShards.value.add(10).log10().log10().toNumber() + 1, 1.5) - 1);
    const cap = Math.max((Math.pow(boost / 100, 3) - 2.5) * 40, 0);
    for (const [actual, expected] of [[context.Effarig.maxRarityBoost, boost],
      [context.Effarig.rarityCapIncrease, cap],
      [context.ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effect(), 1 + boost / 100]]) {
      finite(actual);
      assert.ok(Math.abs(actual.toNumber() - expected) <= Math.max(1, expected) * 1e-12);
    }
  }
});

test('screenshot-scale and larger Relic Shards keep full rarity and sacrifice powers', () => {
  for (const shards of ['eeee1000', Decimal.fromComponents(1, 10, 2.078e266), '10^^1000']) {
    const context = world(shards);
    for (const boost of [context.Effarig.maxRarityBoost, context.Effarig.rarityCapIncrease,
      context.ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effect()]) {
      finite(boost);
      assert.ok(boost.gt(Number.MAX_VALUE), 'huge finite boosts must not saturate at the native Number limit');
    }
    assert.ok(context.Effarig.rarityCapIncrease.eq(
      context.Effarig.maxRarityBoost.div(100).pow(3).sub(2.5).times(40).max(0)));
  }
});

test('rarity cap unlock and post-Reality restrictions still apply', () => {
  const context = world('eeee1000');
  context.EffarigUnlock.maxRarityBoost.isUnlocked = false;
  assert.ok(Decimal.eq(context.Effarig.rarityCapIncrease, 0));
  context.EffarigUnlock.maxRarityBoost.isUnlocked = true;
  context.player.disablePostReality = true;
  assert.ok(Decimal.eq(context.Effarig.rarityCapIncrease, 0));
});

test('random rarity remains finite at huge boosts even when the random factor is zero', () => {
  for (const shards of [0, 1e100, Decimal.fromComponents(1, 10, 2.078e266)]) {
    for (const factor of [0, 0.25, 1]) {
      const context = world(shards);
      context.GlyphGenerator.gaussianBellCurve = () => 1.5;
      let calls = 0;
      const strength = context.GlyphGenerator.randomStrength({ uniform: () => { calls++; return factor; } });
      assert.ok(Number.isFinite(strength));
      assert.ok(strength >= 1 && strength <= 8.5);
      assert.equal(calls, 1, 'preserve the random seed advancement');
      if (shards === 0) assert.equal(strength, 1.5);
      if (factor === 0) assert.equal(strength, 1.5, 'zero random factor must not produce 0 * Infinity');
    }
  }
});

test('ordinary cap contributions and guaranteed max rarity are preserved', () => {
  const context = world();
  context.Ra.unlocks.rarityBuff.effectOrDefault = () => 20;
  context.GlyphSacrifice.effarig.effectValue = new Decimal(130);
  context.Ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.canBeApplied = true;
  assert.equal(context.GlyphGenerator.randomStrength({}), 4.75);
  context.Currency.relicShards.value = new Decimal('eeee1000');
  assert.equal(context.GlyphGenerator.randomStrength({}), 8.5);
});

test('special Glyph generation and loaded Glyph recalculation retain the 300% cap', () => {
  const context = world('eeee1000');
  context.GlyphGenerator.generateRealityEffects = () => [];
  for (const glyph of [context.GlyphGenerator.realityGlyph(new Decimal(12000)),
    context.GlyphGenerator.doomedGlyph('power'), context.GlyphGenerator.endgameGlyph('power'),
    context.GlyphGenerator.omniGlyph('power')]) {
    assert.equal(glyph.strength, 8.5);
  }
  const source = read('core/glyphs/glyph-core.js');
  vm.runInContext(source.slice(source.indexOf('export function calculateGlyph'),
    source.indexOf('\nexport function getRarity')).replace('export ', '') +
    '\nthis.calculateGlyph = calculateGlyph;', context);
  for (const [strength, expected] of [[3.5, 3.5], [10, 8.5]]) {
    const glyph = { level: new Decimal(1200), rawLevel: new Decimal(1200), strength };
    context.calculateGlyph(glyph);
    assert.equal(glyph.strength, expected);
  }
});

test('Effarig panel updates and formats finite Decimal percentages without coercion', () => {
  const context = world(Decimal.fromComponents(1, 10, 2.078e266));
  const source = read('components/tabs/celestial-effarig/EffarigTab.vue');
  Object.assign(context, { EffarigUnlockButton: {}, EffarigRunUnlockReward: {}, CelestialQuoteHistory: {} });
  vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*;\n/gm, '')
    .replace('export default', 'this.component ='), context);
  const state = context.component.data();
  context.Ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effectOrDefault = () =>
    context.ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effect();
  context.EffarigUnlock.run = { isUnlocked: true };
  context.Achievement = () => ({ isUnlocked: true });
  context.V = { isFlipped: false };
  context.Time = { thisRealityRealTime: { totalMinutes: 1 } };
  context.simulatedRealityCount = () => new Decimal(0);
  Object.defineProperty(context.Effarig, 'shardsGained', { value: new Decimal(1) });
  context.component.methods.update.call(state);
  for (const value of [state.shardRarityBoost, state.shardMaxRarityIncrease, state.shardPower]) finite(value);
  context.window = {};
  vm.runInContext(read('core/format.js'), context);
  const formattedValues = [];
  context.format = value => { finite(value); formattedValues.push(value); return value.toString(); };
  context.isEND = () => false;
  for (const value of [state.shardRarityBoost, state.shardMaxRarityIncrease]) {
    assert.doesNotMatch(context.window.formatDecimalPercents(value, 2), /NaN|Infinity/u);
  }
  assert.ok(formattedValues[0].eq(context.Effarig.maxRarityBoost));
  assert.ok(formattedValues[1].eq(context.Effarig.rarityCapIncrease));
  context.player.disablePostReality = true;
  context.component.methods.update.call(state);
  assert.ok(state.shardPower.eq(1));
  assert.ok(state.shardMaxRarityIncrease.eq(0));
  context.player.disablePostReality = false;
  context.Ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effectOrDefault = fallback => fallback;
  context.component.methods.update.call(state);
  assert.ok(state.shardPower.eq(1));
});
