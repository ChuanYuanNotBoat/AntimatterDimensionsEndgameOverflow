const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src/core', file), 'utf8').replace(/\r\n/g, '\n');
const DC = { D0: new Decimal(0), D1: new Decimal(1), BEMAX: new Decimal('10^^9000000000000000') };

function setup(c) {
  const context = vm.createContext({ Decimal, DC, Math });
  context.Math.clamp ??= (value, low, high) => Math.min(high, Math.max(low, value));
  vm.runInContext(read('finite-decimal.js').replace(/^export /gm, ''), context);
  const dilation = read('dilation.js').match(/export function dilateMultiplier\(value, mag\) \{[\s\S]*?\n\}/)[0];
  vm.runInContext(dilation.replace('export ', ''), context);
  const methods = ['antimatterEqualizer', 'tickspeedEqualizer'].map(name =>
    read('large-hadron-collider.js').match(new RegExp(`  ${name}\\([^]*?\\n  \\},`))[0]);
  vm.runInContext(`this.milestones = { c: ${c}, ${methods.join('\n')} };`, context);
  return context;
}

test('Chapter 3 equalizers retain ordinary formulas throughout their unlock ranges', () => {
  for (const c of [0, 0.7, 0.8, 0.9, 1]) {
    const context = setup(c);
    const multiplier = new Decimal(1e4), tick = new Decimal(1e6);
    const product = multiplier.times(tick);
    const expected = Decimal.pow(context.dilateMultiplier(multiplier.pow(tick.log10())
      .root(product.log10()), Math.clamp((c - 0.7) * 10 / 3, 0, 1)).max(10), product.log10());
    const actual = context.milestones.antimatterEqualizer(multiplier, tick);
    assert.ok(actual.div(expected).sub(1).abs().lt(1e-10));
    const bought = new Decimal(40), free = new Decimal(60);
    const expectedTicks = bought.times(free).div(bought.add(free))
      .pow(Math.clamp((c - 0.85) * 20 / 3, 0, 1)).times(bought.add(free));
    assert.ok(context.milestones.tickspeedEqualizer(bought, free).div(expectedTicks).sub(1).abs().lt(1e-10));
  }
});

test('Chapter 3 equalizers keep zero and extreme finite inputs finite', () => {
  for (const c of [0, 0.85, 1]) {
    const context = setup(c);
    assert.ok(context.milestones.tickspeedEqualizer(DC.D0, DC.D0).eq(0));
    assert.ok(context.milestones.antimatterEqualizer(DC.D0, DC.BEMAX).eq(0));
    for (const result of [context.milestones.tickspeedEqualizer(DC.BEMAX, DC.BEMAX),
      context.milestones.antimatterEqualizer(DC.BEMAX, DC.BEMAX)]) {
      assert.ok([result.sign, result.layer, result.mag].every(Number.isFinite));
      assert.ok(result.lte(DC.BEMAX));
    }
  }
});
