const assert = require('node:assert/strict');
const test = require('node:test');
const { setup, Decimal, read } = require('./helpers/chapter3-gameplay.cjs');

test('v2.0.1 Compression effects switch off inside post-Reality-disabled runs', () => {
  const w = setup();
  w.player.compression.thermalRadiation = new Decimal('1e10');
  for (const id of [6, 7, 8]) {
    const config = w.context.GameDatabase.endgame.compression;
    const upgrade = Object.values(config).find(x => x.id === id);
    assert.ok(upgrade.effect().gt(1));
    w.player.disablePostReality = true;
    assert.ok(upgrade.effect().eq(1));
    w.player.disablePostReality = false;
  }
});

test('v2.0.1 Hadron timing changes retain finite arithmetic and the upstream rates', () => {
  const w = setup();
  w.context.DualityUpgrade = () => ({ isBought: true, effectOrDefault: x => x });
  w.context.DivinityMilestone = new Proxy({}, { get: () => ({ isReached: false }) });
  w.context.DivineDimensions = { conversionFormula3: 0 };
  w.context.Accelerators = { emptiness: { effectValue2: 1 } };
  w.context.Time.thisEndgameRealTime._ms = new Decimal(36000);
  w.load('core/celestials/laitela/hadrons.js');
  w.run('Hadrons.updateTotals(); this.hadrons = Hadrons;');
  const speed = Decimal.pow(1.025, 2);
  const time = speed.times(6);
  assert.ok(w.context.hadrons.singularityMultiplier.eq_tolerance(Decimal.pow10(time.times(50)), 1e-12));
  assert.ok(w.context.hadrons.darkEnergyAscensionBoost.eq_tolerance(speed.times(5 / 3).times(5), 1e-12));
});

test('v2.0.1 Galactic Power gain applies its new softcap without losing overflow protection', () => {
  const w = setup();
  w.DC.E1E6 = new Decimal('1e1000000');
  w.player.endgame.celestialMatter = new Decimal(0);
  w.player.reality = { imaginaryMachines: new Decimal(0) };
  w.context.Pelle = { isDoomed: false };
  w.context.actualBaseGalaxiesWithoutGeneration = () => new Decimal(1000000);
  w.context.NormalChallenge = () => ({ chargedEffect: 1 });
  w.context.DualityUpgrade = () => ({ applyEffect() {} });
  w.run(read('core/galactic-power.js').match(/export function getGalacticPowerGainPerSecond\(\) \{[\s\S]*?\n\}/)[0].replace('export ', ''));
  assert.ok(w.context.getGalacticPowerGainPerSecond().eq_tolerance(1e-6, 1e-12));
  w.player.endgame.celestialMatter = w.DC.BEMAX;
  const gain = w.context.getGalacticPowerGainPerSecond();
  assert.ok([gain.sign, gain.layer, gain.mag].every(Number.isFinite));
  w.context.Pelle.isDoomed = true;
  assert.ok(w.context.getGalacticPowerGainPerSecond().eq(0));
});
