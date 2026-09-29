const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const source = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');

function world(cp) {
  const neutral = { isBought: false, applyEffect() {} };
  const effect = value => ({ applyEffect: apply => apply(value) });
  const context = vm.createContext({ Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') },
    Currency: { celestialPoints: { value: new Decimal(cp) } },
    player: { break: true, disablePostReality: false, records: { thisInfinity: { maxAM: new Decimal(cp) } } },
    Achievement: () => effect(307.8), TimeStudy: () => effect(280),
    GlyphAlteration: { isAdded: () => false }, Pelle: { isDoomed: false, isDisabled: () => false },
    AlphaUnlocks: { infinity: { effects: { buff: { effectOrDefault: () => 1 } } } },
    AlchemyResource: { exponential: { amount: 0 } }, Ascensions: { ipA: { isUnlocked: false } },
  });
  vm.runInContext(source('core/finite-decimal.js'), context);
  vm.runInContext(source('core/game-mechanics/effects.js') + '\nthis.Effects = Effects;', context);
  const masteries = source('core/secret-formula/endgame/endgame-masteries.js');
  const mastery = masteries.slice(masteries.indexOf('id: 151,')).match(/effect: (\(\) => \{[\s\S]*?\n    \}),/)[1];
  vm.runInContext(`this.divisorEffect = ${mastery};`, context);
  context.EndgameMastery = id => id === 151 ? effect(context.divisorEffect()) : neutral;
  vm.runInContext(source('core/secret-formula/multiplier-tab/ordered-breakdown.js'), context);
  const ip = source('core/secret-formula/multiplier-tab/infinity-point-breakdown.js');
  vm.runInContext(ip.slice(0, ip.indexOf('function pelleTimeStudyMult')), context);
  return context;
}

test('IP formula improvement stays Decimal at ordinary and extreme celestial point values', () => {
  const ordinary = world(1e20);
  const expected = 280 / (Math.log10(Math.log10(1e20) + 1) / 20 + 1);
  assert.ok(ordinary.divisorEffect().sub(expected).abs().lt(1e-10));
  const extreme = world(Decimal.fromComponents(1, 9, 266.31765));
  const divisors = extreme.ipDivisors();
  assert.ok(divisors.improved.gt(0), 'formula divisor must not underflow through Number conversion');
  const improved = extreme.ipFromDivisor(divisors.improved);
  const compensated = extreme.ipFromDivisor(divisors.final);
  assert.ok(improved.lt(extreme.DC.BEMAX));
  assert.ok(compensated.lt(extreme.DC.BEMAX));
  assert.ok(Decimal.isFinite(improved) && Decimal.isFinite(compensated));
});

test('finite huge negative impacts and tiny nonzero divisors use the large-number formatter', () => {
  const context = vm.createContext({ Decimal, window: {}, isEND: () => false,
    Notations: { current: { format: value => `ordinary:${value}` } },
    LNotations: { current: { formatLDecimal: value => `large:${value}` } } });
  const code = source('core/format.js');
  vm.runInContext(code.slice(code.indexOf('window.format ='), code.indexOf('window.formatInt =')), context);
  const huge = new Decimal('eeee1000');
  assert.equal(context.window.format(huge.neg()), `-large:${huge}`);
  assert.equal(context.window.format(huge.recip()), `1/(large:${huge})`);
  assert.equal(context.window.format(huge.recip().neg()), `-1/(large:${huge})`);
  assert.equal(context.window.format(0), 'ordinary:0');
  assert.equal(context.window.format(12), 'ordinary:12');
});
