'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replace(/\r\n/g, '\n');
const strip = code => code.replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');
Decimal.prototype.valueOf = () => { throw new Error('Implicit Decimal conversion'); };

function setup({ destroyed = true, bought = false, antimatter = '5e130', available = true } = {}) {
  const context = vm.createContext({
    Decimal,
    DC: { D0: new Decimal(0), D1: new Decimal(1) },
    player: {
      antimatter: new Decimal(antimatter), break: true,
      celestials: { slabdrill: { isDestroyed: destroyed, hasBoughtNinthDimension: bought } },
    },
    GameEnd: { creditsEverClosed: true },
    Quotes: { slabdrill: {} },
  });
  context.AntimatterDimension = () => ({
    cost: new Decimal('ee100'),
    isAvailableForPurchase: available,
    get isAffordable() { return context.player.break && context.player.antimatter.gte(this.cost); }
  });
  const source = read('core/celestials/slabdrill.js');
  vm.runInContext(`${strip(source.slice(0, source.indexOf('class SlabdrillUnlockState')))}
    this.Slabdrill = Slabdrill;`, context);
  return context;
}

test('the reported low-resource save keeps running without any starter resource grant', () => {
  const env = setup();
  assert.equal(env.Slabdrill.isAwaitingNinthDimension, true);
  assert.equal(env.Slabdrill.isPausedForNinthDimension, false);
  env.Slabdrill.updatePelleDomainPause();
  assert.equal(env.GameEnd.creditsEverClosed, false);
  assert.ok(env.player.antimatter.eq('5e130'));
  assert.equal(env.player.celestials.slabdrill.hasBoughtNinthDimension, false);
});

test('pause starts only when AD9 is both unlocked and affordable, and releases if its cost cannot be met', () => {
  for (const options of [{ antimatter: 'ee100', available: false }, { antimatter: '5e130' }]) {
    const env = setup(options);
    env.Slabdrill.updatePelleDomainPause();
    assert.equal(env.GameEnd.creditsEverClosed, false);
    assert.equal(env.Slabdrill.isPausedForNinthDimension, false);
  }
  const env = setup({ antimatter: 'ee100' });
  env.Slabdrill.updatePelleDomainPause();
  assert.equal(env.GameEnd.creditsEverClosed, true);
  assert.equal(env.Slabdrill.isPausedForNinthDimension, true);
  env.player.antimatter = new Decimal(10);
  env.Slabdrill.updatePelleDomainPause();
  assert.equal(env.GameEnd.creditsEverClosed, false);
  env.player.antimatter = new Decimal('ee200');
  env.player.break = false;
  env.Slabdrill.updatePelleDomainPause();
  assert.equal(env.GameEnd.creditsEverClosed, false);
});

test('ordinary, cursed and completed Domain saves are unaffected by the AD9 pause sync', () => {
  for (const options of [{ destroyed: false }, { bought: true }]) {
    const env = setup(options);
    env.player.celestials.slabdrill.isCursed = !options.destroyed;
    env.GameEnd.creditsEverClosed = false;
    env.Slabdrill.updatePelleDomainPause();
    assert.ok(env.player.antimatter.eq('5e130'));
    assert.equal(env.GameEnd.creditsEverClosed, false);
  }
});

function gameLoopPrefix(env) {
  const p = env.player;
  p.introFrozen = true;
  p.introTick = 90000;
  p.hasSeenIntro = true;
  p.endgame = { credits: false, creditsTick: 0 };
  p.lastUpdate = 1;
  p.flux = { fluxTime: 0 };
  p.celestials.slabdrill.goodbyeTick = 50000;
  p.celestials.slabdrill.isGoodbye = false;
  let updates = 0;
  const events = [];
  let delta;
  env.PerformanceStats = { start() {}, end() {} };
  env.EventHub = { dispatch: event => events.push(event) };
  env.GAME_EVENT = { GAME_TICK_BEFORE: 'before', GAME_TICK_AFTER: 'after' };
  env.GameUI = { update: () => updates++ };
  env.DeltaTimeState = { update: (real, game) => { delta = [real, game]; } };
  env.Speedrun = { isPausedAtStart: () => false };
  const code = read('game.js');
  const start = code.indexOf('export function gameLoop(');
  const end = code.indexOf('\n  if (!GameStorage.ignoreBackupTimer)', start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(`${strip(code.slice(start, end))}
    return { productionDiff: diff, realDiff };
  } this.tick = gameLoop;`, env);
  return { get updates() { return updates; }, events, get delta() { return delta; } };
}

test('affordable waiting ticks refresh UI and the timestamp without zero-time production or autobuyers', () => {
  const env = setup({ antimatter: 'ee100' });
  const capture = gameLoopPrefix(env);
  assert.equal(env.tick(33), undefined);
  assert.equal(capture.updates, 1);
  assert.deepEqual(capture.events, ['before', 'after']);
  assert.equal(capture.delta[0], 0);
  assert.ok(capture.delta[1].eq(0));
  assert.ok(env.player.lastUpdate > 1);
});

test('unaffordable or locked AD9 reaches production with the full requested time delta', () => {
  for (const options of [{ antimatter: '5e130' }, { antimatter: 'ee100', available: false }]) {
    const env = setup(options);
    const capture = gameLoopPrefix(env);
    const result = env.tick(33);
    assert.ok(result.productionDiff.eq(33));
    assert.equal(result.realDiff, 33);
    assert.equal(env.GameEnd.creditsEverClosed, false);
    assert.equal(capture.updates, 0);
  }
});
