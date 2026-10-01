'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
Decimal.prototype.valueOf = () => { throw new Error('Implicit conversion from Decimal to number'); };

function product(rewards, doomed) {
  const source = read('core/celestials/pelle/pelle.js');
  const getter = source.match(/  get antimatterProductionDilation\(\) \{[\s\S]*?\n  \},/);
  assert.ok(getter);
  const context = vm.createContext({
    Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') },
    DivineDimensions: { conversionFormula2: rewards[0] },
    Accelerators: { cosmic: { effectValue2: rewards[1] } },
    EndgameMastery: id => ({ effectOrDefault: () => id === 301 ? (rewards[4] ?? 1) : rewards[2] }),
    SingularityMilestone: { singAMDoomDilation: { effectOrDefault: () => rewards[3] } },
  });
  vm.runInContext(read('core/finite-decimal.js').replace(/^export /gm, ''), context);
  vm.runInContext(`this.pelle = ({${getter[0].replace(/,\s*$/, '')}});`, context);
  context.pelle.isDoomed = doomed;
  return { actual: context.pelle.antimatterProductionDilation, maximum: context.DC.BEMAX };
}

test('Doom AD1 multiplier keeps ordinary product and huge Decimal values finite', () => {
  const ordinary = product([2, 3, 4, 5], true);
  assert.ok(ordinary.actual.eq(120));
  assert.ok(product([2, 3, 4, 5, 7], true).actual.eq(840));
  assert.ok(product([2, 3, 4, 5], false).actual.eq(1));
  const huge = Decimal.fromComponents(1, 10, 266.31765);
  const extreme = product([huge, huge, huge, huge], true);
  assert.ok(extreme.actual instanceof Decimal);
  assert.ok([extreme.actual.sign, extreme.actual.layer, extreme.actual.mag].every(Number.isFinite));
  assert.ok(extreme.actual.gt(Number.MAX_VALUE));
  assert.ok(extreme.actual.lte(extreme.maximum));
});

test('gameplay and prestige header share the safe Doom multiplier', () => {
  for (const file of ['core/dimensions/antimatter-dimension.js',
    'components/ui-modes/HeaderPrestigeGroup.vue']) {
    const source = read(file);
    assert.match(source, /\.times\(Pelle\.antimatterProductionDilation\)/);
    assert.doesNotMatch(source, /const pelleOnly =/);
  }
  assert.match(read('components/GlyphComponent.vue'), /realityGlyphBoost: \{\s*type: \[Number, Decimal\]/);
});
