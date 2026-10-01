'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const Decimal = require('break_eternity.js');

const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
const finite = value => [value.sign, value.layer, value.mag].every(Number.isFinite);

function contextFor(count) {
  const context = vm.createContext({
    Decimal,
    DC: {
      D0: new Decimal(0), D1: new Decimal(1), D2: new Decimal(2), NUMMAX: new Decimal(Number.MAX_VALUE),
      ENUMMAX: new Decimal('10^^10'), BEMAX: new Decimal('10^^9000000000000000')
    },
    player: {
      break2: true,
      disablePostReality: false,
      celestials: { pelle: {
        divinities: new Decimal(count),
        records: { totalEndgameAntimatter: Decimal.pow10(9e16) }
      } },
      endgame: { celestialPoints: new Decimal(0), doomedParticles: new Decimal(0) },
      records: { bestDoomedAntimatterThisDivinity: new Decimal(1) }
    },
    Pelle: { isDoomed: true, quotes: { divinity: { show() {} } } },
    Alpha: { isDestroyed: true },
    Achievement: () => ({ isUnlocked: true }),
    EndgameMastery: () => ({ effectOrDefault: () => 1 }),
    Endgame: { newEndgame() {} },
    Currency: {},
    DecimalCurrency: class {
      add(amount) { this.value = this.value.add(amount); }
      eq(amount) { return this.value.eq(amount); }
    }
  });
  vm.runInContext(read('core/finite-decimal.js').replace(/^export /gm, ''), context);
  return context;
}

function evaluateFunction(context, file, name) {
  const match = read(file).match(new RegExp(`export function ${name}\\(\\) \\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `Missing ${name}`);
  vm.runInContext(`${match[0].replace('export ', '')}\nthis.${name} = ${name};`, context);
  return context[name];
}

test('Divinity counter increments as Decimal and persists beyond native Number range', () => {
  const context = contextFor(1024);
  const currency = read('core/currency.js').match(/Currency\.divinities = new class extends DecimalCurrency \{[\s\S]*?\n\}\(\);/);
  assert.ok(currency);
  vm.runInContext(currency[0], context);
  const reset = evaluateFunction(context, 'core/endgame.js', 'divinityReset');
  reset();
  assert.ok(context.player.celestials.pelle.divinities.eq(1025));
  reset();
  assert.ok(context.player.celestials.pelle.divinities.eq(1026));
  context.Currency.divinities.value = new Decimal('1e20');
  assert.ok(context.player.celestials.pelle.divinities.eq('1e20'));
  const saved = JSON.parse(JSON.stringify({ divinities: context.Currency.divinities.value }));
  assert.ok(new Decimal(saved.divinities).eq('1e20'));
  assert.match(read('core/storage/decimal-migrations.js'),
    /player\.celestials\.pelle\.divinities = new Decimal\(player\.celestials\.pelle\.divinities\)/);
});

test('CP, DP, and Time Dimension threshold remain finite past native power overflow', () => {
  const context = contextFor(24);
  const cp = evaluateFunction(context, 'game.js', 'gainedCelestialPoints');
  const dp = evaluateFunction(context, 'game.js', 'gainedDoomedParticles');
  const getter = read('core/dimensions/time-dimension.js').match(/  get OVERFLOW_SQUARED\(\) \{[\s\S]*?\n  \},/);
  assert.ok(getter);
  vm.runInContext(`this.timeDimensions = ({${getter[0].replace(/,\s*$/, '')}});`, context);
  const originalPowEffectsOf = Decimal.prototype.powEffectsOf;
  Decimal.prototype.powEffectsOf = function() { return this; };
  try {
    for (const count of [24, 1023, 1024, 1075, 10000, '1e20']) {
      context.player.celestials.pelle.divinities = new Decimal(count);
      for (const result of [cp(), dp(), context.timeDimensions.OVERFLOW_SQUARED]) {
        assert.ok(result instanceof Decimal, `count ${count}`);
        assert.ok(finite(result), `count ${count}: ${result}`);
        assert.ok(result.lte(context.DC.BEMAX), `count ${count}`);
      }
    }
  } finally {
    Decimal.prototype.powEffectsOf = originalPowEffectsOf;
  }
});

test('AD compression keeps its Divinity exponent below Infinity', () => {
  const source = read('core/dimensions/antimatter-dimension.js');
  assert.doesNotMatch(source, /Math\.pow\(2, player\.celestials\.pelle\.divinities\)/);
  const context = contextFor(1075);
  const exponent = vm.runInContext(
    'boundedPositiveProduct(0.16, boundedPositivePower(0.5, player.celestials.pelle.divinities))', context);
  assert.ok(finite(exponent));
  assert.ok(exponent.gt(0));
  assert.ok(exponent.lt(1e-300));
});

test('Chaos Rift cap remains finite at very high Divinity counts', () => {
  const context = contextFor('1e20');
  const effect = read('core/secret-formula/celestials/rifts.js')
    .match(/    effect: totalFill => \{\n      const divinities = [\s\S]*?\n    \},/);
  assert.ok(effect);
  vm.runInContext(`this.chaos = ({${effect[0].replace(/,\s*$/, '')}});`, context);
  const result = context.chaos.effect(1);
  assert.ok(finite(result));
  assert.ok(result.lte(context.DC.BEMAX));
});

test('Chapter 3 unlocks accept Decimal Divinity counts without implicit conversion', () => {
  const context = contextFor(0);
  context.NormalChallenge = () => ({ isCharged: false });
  context.GalacticPowers = { stelliferousUniverse: { isUnlocked: false } };
  vm.runInContext(read('core/universes.js').replace(/^export /gm, '') + '\nthis.Universes = Universes;', context);
  const requirements = [...read('core/secret-formula/achievements/normal-achievements.js')
    .matchAll(/checkRequirement: (\(\) => player\.celestials\.pelle\.divinities[^,]+),/g)]
    .map(match => vm.runInContext(`(${match[1]})`, context));
  assert.equal(requirements.length, 2);
  const originalValueOf = Decimal.prototype.valueOf;
  Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };
  try {
    for (const [count, ten, thirteen] of [[0, false, false], [9, false, false], [10, true, false],
      [12, true, false], [13, true, true], ['1e1000', true, true]]) {
      context.player.celestials.pelle.divinities = new Decimal(count);
      assert.equal(requirements[0](), ten);
      assert.equal(requirements[1](), thirteen);
      assert.equal(context.Universes.areUnlocked, thirteen);
    }
  } finally {
    Decimal.prototype.valueOf = originalValueOf;
  }
});
