const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { read, Decimal } = require('./helpers/chapter3-gameplay.cjs');

function ninthDimension(amount) {
  const source = read('core/dimensions/antimatter-dimension.js');
  const context = vm.createContext({ Decimal, DC: { NUMMAX: new Decimal(Number.MAX_VALUE), E9E15: new Decimal('1e9000000000000000') },
    player: { break: true }, Laitela: { continuumActive: false }, Slabdrill: { isCursed: true, isDestroyed: false },
    onBuyDimension() {} });
  const getters = ['costUntil10', 'howManyCanBuy', 'isAffordable', 'isAffordableUntil10']
    .map(name => source.match(new RegExp(`get ${name}\\(\\) \\{[\\s\\S]*?\\n  \\}`))[0]);
  const dimension = vm.runInContext(`({ ${getters.join(',')} })`, context);
  Object.assign(dimension, { tier: 9, cost: new Decimal(100), boughtBefore10: 3, remainingUntil10: 7,
    currencyAmount: new Decimal(amount), bought: new Decimal(3), amount: new Decimal(3),
    isAvailableForPurchase: true, challengeCostBump() {} });
  context.AntimatterDimension = () => dimension;
  for (const name of ['buyManyDimension', 'buyAsManyAsYouCanBuy']) {
    vm.runInContext(source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`))[0], context);
  }
  return { dimension, context };
}

for (const [amount, expectedCount, affordable] of [['1e5', 0, false], ['1e8', 1, true], ['1e12', 3, true], ['1e20', 7, true]]) {
  test(`AD9 affordability and partial purchases account for already bought units at ${amount}`, () => {
    const { dimension, context } = ninthDimension(amount);
    assert.equal(dimension.howManyCanBuy, expectedCount);
    assert.equal(dimension.isAffordable, affordable);
    assert.ok(dimension.costUntil10.eq(Decimal.pow(100, 3 + Math.max(expectedCount, 1))));
    assert.equal(dimension.isAffordableUntil10, expectedCount === 7);
    assert.equal(context.buyAsManyAsYouCanBuy(9), affordable);
    assert.ok(dimension.bought.eq(3 + expectedCount));
    assert.ok(dimension.amount.eq(3 + expectedCount));
    assert.ok(dimension.currencyAmount.eq(affordable ? 0 : amount));
  });
}

test('AD9 full ten-purchase batch charges its exponential total and rejects insufficient funds', () => {
  for (const amount of ['1e12', '1e20']) {
    const { dimension, context } = ninthDimension(amount);
    assert.equal(context.buyManyDimension(9), amount === '1e20');
    assert.ok(dimension.bought.eq(amount === '1e20' ? 10 : 3));
    assert.ok(dimension.currencyAmount.eq(amount === '1e20' ? 0 : amount));
  }
});

test('Slabdrill ending timer waits at two minutes until AD9 production starts', () => {
  const source = read('game.js');
  const start = source.indexOf('if (Slabdrill.isCursed && player.celestials.slabdrill.goodbyeTick >= 50000)');
  const end = source.indexOf('\n  }', start) + 4;
  const statement = source.slice(start, end);
  for (const [amount, expected] of [[0, 120000], [1, 915000]]) {
    const player = { celestials: { slabdrill: { goodbyeTick: 50000 } } };
    vm.runInNewContext(statement, { player, Slabdrill: { isCursed: true }, realDiff: 865000,
      AntimatterDimension: () => ({ amount: new Decimal(amount) }) });
    assert.equal(player.celestials.slabdrill.goodbyeTick, expected);
  }
});
