const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('./helpers/chapter3-vm.cjs');
const test = require('node:test');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src/core', file), 'utf8').replace(/\r\n/g, '\n');
const DC = Object.fromEntries([0, 1, 2, 5].map(value => ['D' + value, new Decimal(value)]));
DC.E6 = new Decimal(1e6);
DC.BEMAX = new Decimal('10^^9000000000000000');
const finiteSource = read('finite-decimal.js').replace(/^export /gm, '');

function world() {
  const context = vm.createContext({ Decimal, DC, Math, console,
    EffarigUnlock: { endgame: { canBeApplied: true } },
    ALTERATION_TYPE: { ADDITION: 1, BOOST: 2, EMPOWER: 3 },
    GlyphAlteration: { sacrificeBoost: () => new Decimal(0), isEmpowered: () => false },
  });
  vm.runInContext(finiteSource, context);
  const source = read('secret-formula/reality/glyph-effects.js');
  vm.runInContext(source.slice(source.indexOf('export const GlyphCombiner'))
    .replace(/^export /gm, '') + '\nthis.glyphs = glyphEffects;', context);
  return context;
}

function checkFinite(value) {
  assert.ok(value instanceof Decimal);
  assert.ok([value.sign, value.layer, value.mag].every(Number.isFinite));
  assert.ok(value.lt(DC.BEMAX));
}

test('Y glyph preserves ordinary effects in both original and endgame formulas', () => {
  const context = world();
  const level = new Decimal(12000), strength = 3.5;
  for (const endgame of [false, true]) {
    context.EffarigUnlock.endgame.canBeApplied = endgame;
    const expected = {
      realityglyphlevel: endgame ? 800 : Math.floor(Math.sqrt(12000 * 90)),
      realitygalaxies: 1 + (12000 / (endgame ? 50000 : 100000)) ** (endgame ? 0.6 : 0.5),
      realityrow1pow: 1 + (endgame ? (12000 / 100000) ** 1.5 : 12000 / 125000),
    };
    for (const [id, value] of Object.entries(expected)) {
      const actual = context.glyphs[id].effect(level, strength);
      checkFinite(actual);
      assert.ok(actual.sub(value).abs().lt(1e-10), `${id}: ordinary formula changed`);
    }
  }
});

test('Y and E effects and their combinations stay finite beyond native Number range', () => {
  const context = world();
  for (const [type, level] of [['reality', Number.MAX_VALUE], ['reality', 'ee400'],
    ['effarig', 'ee266.3537'], ['effarig', 'eee1000']]) {
    for (const [id, effect] of Object.entries(context.glyphs).filter(([id]) => id.startsWith(type))) {
      const value = effect.effect(new Decimal(level), 8.5);
      checkFinite(value);
      checkFinite(effect.combine([value, value]));
    }
  }
  const amplifier = context.glyphs.realityrow1pow.effect(new Decimal(Number.MAX_VALUE), 8.5);
  assert.ok(amplifier.gt(Number.MAX_VALUE));
  assert.ok(context.glyphs.realityrow1pow.combine([new Decimal(2), new Decimal(3)]).eq(4));
});

test('Reality sacrifice boosts retain Decimal logarithms and all altered effects stay finite', () => {
  const context = world();
  const boostBody = read('celestials/ra/ra.js').match(/  sacrificeBoost\(type\) \{([\s\S]*?)\n  \}/)[1];
  const calculateBoost = new Function('Decimal', 'GlyphSacrificeHandler', 'type', boostBody);
  for (const sacrifice of ['1e64', 'eeee266.31765']) {
    const boost = calculateBoost.call({ getSacrificePower: () => new Decimal(sacrifice),
      boostingThreshold: new Decimal(1e60) }, Decimal, { maxSacrificeForEffects: DC.BEMAX }, 'replication');
    checkFinite(boost);
    assert.ok(boost.eq(new Decimal(sacrifice).div(1e60).max(1).log10().div(2)));
    context.GlyphAlteration.sacrificeBoost = () => boost;
    for (const endgame of [false, true]) {
      context.EffarigUnlock.endgame.canBeApplied = endgame;
      for (const id of ['timeetermult', 'replicationpow', 'infinitypow', 'powerdimboost',
        'dilationgalaxyThreshold', 'effarigachievement']) {
        const effect = context.glyphs[id];
        const value = effect.effect(new Decimal(1200), 3.5);
        checkFinite(value);
        const combined = effect.combine([value, value]);
        checkFinite(combined.value ?? combined);
      }
    }
  }
});

test('Decimal alteration formulas preserve ordinary Infinity and Dilation effects', () => {
  const context = world();
  for (const endgame of [false, true]) {
    context.EffarigUnlock.endgame.canBeApplied = endgame;
    for (const boost of [0, 2, 150]) {
      context.GlyphAlteration.sacrificeBoost = () => new Decimal(boost);
      const expectedPower = 1200 ** (endgame ? 0.3 : 0.21) * (endgame ? 3.5 : 3.5 ** 0.4) /
        (endgame ? 50 : 75) + Math.min(boost / 50, 2.5) +
        (Math.max(Math.log10(boost) - Math.log10(125), 0) + 1) ** (endgame ? 2.5 : 2) - 1 +
        (endgame ? 1 : 1.007);
      assert.ok(context.glyphs.infinitypow.effect(new Decimal(1200), 3.5).sub(expectedPower).abs().lt(1e-10));
      const weakening = 1 - 1200 ** (endgame ? 0.4 : 0.17) * (endgame ? 3.5 : 3.5 ** 0.35) / 100 -
        boost / (endgame ? 40 : 50);
      const threshold = Math.max(weakening, 0.1) / Math.max(1, Math.abs(weakening - 1.1));
      assert.ok(context.glyphs.dilationgalaxyThreshold.effect(new Decimal(1200), 3.5).sub(threshold).abs().lt(1e-10));
    }
  }
});

test('first-row Reality amplifier uses the entire Decimal exponent', () => {
  const context = world();
  context.player = { disablePostReality: false, reality: { rebuyables: { 1: 10 } } };
  context.ImaginaryUpgrade = () => ({ effectOrDefault: () => 0 });
  let glyphPower = new Decimal(2);
  context.getAdjustedGlyphEffect = () => glyphPower;
  const source = read('secret-formula/reality/reality-upgrades.js');
  vm.runInContext(source.slice(source.indexOf('const rebuyable'), source.indexOf('export const')) +
    '\nthis.makeRebuyable = rebuyable;', context);
  const upgrade = context.makeRebuyable({ id: 1, effect: 3 });
  assert.ok(upgrade.effect().div(Decimal.pow(3, 20)).sub(1).abs().lt(1e-12));
  glyphPower = context.glyphs.realityrow1pow.effect(new Decimal(Number.MAX_VALUE), 8.5);
  checkFinite(upgrade.effect());
  assert.ok(upgrade.effect().log10().div(glyphPower.times(10 * Math.log10(3))).sub(1).abs().lt(1e-12));
});

test('IP and EP secondary Glyph powers keep ordinary and extreme logarithms in Decimal', () => {
  const context = world();
  for (const [id, baseDivisor, endgameDivisor] of [['timeEP', 1000, 100], ['infinityIP', 1800, 150]]) {
    for (const endgame of [false, true]) {
      context.EffarigUnlock.endgame.canBeApplied = endgame;
      const conversion = context.glyphs[id].conversion;
      const ordinary = conversion(new Decimal(1e100));
      assert.ok(ordinary.sub(1 + (endgame ? Math.log10(101) / endgameDivisor : 100 / baseDivisor))
        .abs().lt(1e-12));
      const huge = conversion(context.glyphs[id].effect(new Decimal('eee266.31765'), 8.5));
      checkFinite(huge);
      assert.ok(huge.gt(Number.MAX_VALUE));
    }
  }
});

function galaxyWorld(ip, discount) {
  const context = world();
  const effect = value => ({ effectOrDefault: fallback => value ?? fallback,
    applyEffect: callback => { if (value != null) callback(value); } });
  Object.assign(context, {
    window: {}, ReplicantiUpgradeState: class {},
    Currency: { infinityPoints: { value: new Decimal(ip) } },
    player: { replicanti: { boughtGalaxyCap: new Decimal(1e6), galCost: new Decimal(1) } },
    TimeStudy: id => effect(id === 233 ? new Decimal(discount) : null),
    PelleRifts: { vacuum: { milestones: { 1: effect(null) } } },
    EternityChallenge: () => ({ isRunning: false }),
    GlyphSacrifice: { replication: { effectValue: new Decimal(0) } },
    BreakEternityUpgrade: { replicantiGalaxyPower: effect(new Decimal(1)) },
    Effects: { productDecimal: () => new Decimal(1) },
  });
  const math = read('math.js');
  vm.runInContext(math.slice(math.indexOf('window.decimalQuadraticSolution ='), math.indexOf('/**\n * @typedef')),
    context);
  Object.assign(context, context.window);
  const source = read('replicanti.js');
  vm.runInContext('this.upgrade = ' + source.slice(source.indexOf('new class ReplicantiGalaxiesUpgrade'),
    source.indexOf('\n};\n\nexport const Replicanti =')).replace(/,\s*$/, '') + ';', context);
  return context;
}

test('Replicanti Galaxy bulk inverse applies the price discount once', () => {
  for (const [ip, discount] of [['e1e14', 'e1e14'], ['eee266.24019', 'eee266.24019']]) {
    const context = galaxyWorld(ip, discount);
    const count = context.upgrade.bulkPurchaseCalc();
    checkFinite(count);
    assert.ok(count.lt(new Decimal(ip).log10()));
    const costLog = context.upgrade.baseCostAfterCount(count.sub(1)).log10();
    const budgetLog = new Decimal(ip).times(discount).log10();
    assert.ok(costLog.div(budgetLog).lte(1.000001), 'bulk result must be affordable');
  }
});

test('achievement and Replicanti resurgence conversions retain huge Decimal powers', () => {
  const context = world();
  const achievement = read('achievements/normal-achievement.js').match(/  powerConv\(power\) \{([\s\S]*?)\n  \}/)[1];
  const replicanti = read('replicanti.js').match(/export function replicantiMultToPower\(value\) \{([\s\S]*?)\n\}/)[1];
  for (const body of [achievement, replicanti]) {
    const fn = new Function('Decimal', 'power', 'value', body);
    const huge = new Decimal('eeee1000');
    checkFinite(fn(Decimal, huge, huge));
    assert.ok(fn(Decimal, huge, huge).gt(Number.MAX_VALUE));
  }
});
