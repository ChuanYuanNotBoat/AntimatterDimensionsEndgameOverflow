const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const strip = code => code.replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');
Decimal.prototype.valueOf = () => { throw new Error('Implicit Decimal conversion'); };

function setup({ delta = 100, bestTime = 50, alpha = false, destroyed = true } = {}) {
  const effect = value => ({ applyEffect: callback => callback(new Decimal(value)) });
  const infinities = { value: new Decimal(0) };
  const context = vm.createContext({ Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1), E9E15: new Decimal('9e15'),
      BEMAX: new Decimal('10^^9000000000000000') },
    Math: Object.assign(Object.create(Math), { clamp: (x, low, high) => Math.min(Math.max(x, low), high) }),
    RealityUpgrade: id => ({ isBought: false, ...effect(id === 5 ? 2 : 3) }),
    BreakInfinityUpgrade: { infinitiedGen: { isBought: true } },
    Pelle: { isDoomed: false },
    EternityChallenge: () => ({ isRunning: false }),
    Alpha: { isRunning: alpha, isDestroyed: destroyed },
    Time: { deltaTimeMs: new Decimal(delta), unscaledDeltaTime: { totalMilliseconds: new Decimal(delta) } },
    Ra: { unlocks: { continuousTTBoost: { effects: { infinity: effect(4) } } } },
    getAdjustedGlyphEffect: () => new Decimal(5),
    EffarigUnlock: { eternity: { isUnlocked: false } },
    Currency: { infinities },
    player: { disablePostReality: false, partInfinitied: 0, records: { bestInfinity: { time: new Decimal(bestTime) } } },
  });
  vm.runInContext(strip(read('core/finite-decimal.js')), context);
  const source = read('game.js');
  const start = source.indexOf('function passivePrestigeGen(realDiff) {');
  const end = source.indexOf('\nfunction applyAutoUnlockPerks()', start);
  vm.runInContext(`${source.slice(start, end)}\nthis.run = passivePrestigeGen;`, context);
  return { context, infinities };
}

test('passive Infinity generation keeps ordinary values and the Alpha real-time route', () => {
  for (const alpha of [false, true]) {
    const { context, infinities } = setup({ alpha });
    context.run();
    assert.equal(infinities.value.toNumber(), 120);
    assert.equal(context.player.partInfinitied, 0);
  }
});

test('zero elapsed time with a zero best-Infinity record cannot generate 0/0', () => {
  for (const alpha of [false, true]) {
    const { context, infinities } = setup({ delta: 0, bestTime: 0, alpha });
    assert.doesNotThrow(() => context.run());
    assert.ok(infinities.value.eq(0));
    assert.ok(context.player.partInfinitied === 0);
  }
});

test('positive elapsed time and zero or tiny best-Infinity records saturate before division', () => {
  for (const bestTime of [0, new Decimal('10^^9000000000000000').recip()]) {
    const { context, infinities } = setup({ delta: '10^^9000000000000000', bestTime });
    assert.doesNotThrow(() => context.run());
    assert.ok(infinities.value.eq(context.DC.BEMAX));
    assert.equal(context.player.partInfinitied, 0);
  }
});

test('finite imported times above the declared ceiling are bounded before arithmetic', () => {
  const { context, infinities } = setup({ delta: Decimal.fromComponents(1, 1.62e268, 100), bestTime: 50 });
  assert.doesNotThrow(() => context.run());
  assert.ok(infinities.value.eq(context.DC.BEMAX));
});

test('an invalid best-Infinity record stays diagnostic rather than granting a capped reward', () => {
  const { context, infinities } = setup({ bestTime: NaN });
  assert.throws(() => context.run(), /Invalid Decimal operand/);
  assert.ok(infinities.value.eq(0));
});
