const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const strip = code => code.replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '');
Decimal.prototype.valueOf = () => { throw new Error('Implicit Decimal conversion'); };

test('actual C Tesseract equalizer preserves finite mathematics, zero and Number overflow boundaries', () => {
  const code = read('core/large-hadron-collider.js');
  const context = vm.createContext({ Decimal, DC: { D0: new Decimal(0), D1: new Decimal(1),
    BEMAX: new Decimal('10^^9000000000000000') }, LHC: { hadronC: 0.8 },
    Math: Object.assign(Object.create(Math), { clamp: (x, low, high) => Math.min(Math.max(x, low), high) }) });
  vm.runInContext(strip(read('core/finite-decimal.js')), context);
  vm.runInContext(`${strip(code.slice(code.indexOf('export const CMilestones ='),
    code.indexOf('class PowerCoreState')))}\nthis.CMilestones = CMilestones;`, context);
  for (const c of [0, 0.5, 0.6, 0.8, 1]) {
    context.LHC.hadronC = c;
    assert.equal(context.CMilestones.tesseractEqualizer(0, 0), 0);
    for (const [bought, free] of [[10, 0], [0, 10], [10, 20], [1e100, 1e100]]) {
      const power = Math.min(Math.max((c - 0.5) * 2, 0), 1);
      const expected = Math.pow(Math.max(bought, 1) * Math.max(free, 1) / (bought + free), power) * (bought + free);
      const actual = context.CMilestones.tesseractEqualizer(bought, free);
      assert.ok(Math.abs(actual / expected - 1) < 1e-12);
    }
    assert.ok(Number.isFinite(context.CMilestones.tesseractEqualizer(Number.MAX_VALUE, Number.MAX_VALUE)));
  }
});

test('TS232 formats Decimal galaxy strength without implicit native arithmetic', () => {
  const source = read('core/secret-formula/eternity/time-studies/normal-time-studies.js');
  const study = source.slice(source.indexOf('    id: 232,'), source.indexOf('    id: 233,'));
  const formatter = study.match(/formatEffect: ([^\r\n]+)/)[1];
  const context = { formatDecimalPercents: value => `${value.times(100).toString()}%` };
  vm.runInNewContext(`this.format = ${formatter};`, context);
  assert.equal(context.format(new Decimal(1.25)), '+25%');
});

test('singularity milestone initializes its render mode and Metro flag before update', () => {
  const code = read('components/tabs/celestial-laitela/SingularityMilestoneComponent.vue')
    .match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[^\n]*\n/gm, '').replace('export default', 'this.component =');
  const context = { Decimal, SINGULARITY_MILESTONE_RESOURCE: { SINGULARITIES: 0, CONDENSE_COUNT: 1,
    MANUAL_TIME: 2, AUTO_TIME: 3 }, quantify: (_, value) => value.toString() };
  vm.runInNewContext(code, context);
  const state = context.component.data();
  assert.equal(state.isMetro, false);
  assert.equal(state.milestoneMode, 0);
  state.singularitiesPerCondense = new Decimal(1);
  assert.doesNotThrow(() => context.component.computed.progressDisplay.call(state));
});

test('Replicanti state explanation uses Decimal percentages', () => {
  const context = { Decimal, player: { universes: { current: 0 }, replicanti: { chance: new Decimal(0.1) } },
    Slabdrill: { isCursed: false }, SlabdrillUnlocks: new Proxy({}, { get: () => ({ isUnlocked: false }) }),
    getReplicantiInterval: () => new Decimal(100), Replicanti: { amount: new Decimal(10) },
    replicantiCap: () => new Decimal(100), format: value => value.toString(),
    formatDecimalPercents: value => `${value.times(100)}%` };
  vm.runInNewContext(strip(read('core/secret-formula/multiplier-tab/state-audit.js')), context);
  assert.match(context.multiplierStateNotes('replicanti')[0], /chance per tick: 10%/);
});
