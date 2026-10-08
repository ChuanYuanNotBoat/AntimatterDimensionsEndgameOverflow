import { RebuyableMechanicState, SetPurchasableMechanicState } from "./game-mechanics";
import { canStartEndgameChallenge } from "./endgame-challenge";
import { finiteDecimal, isFiniteDecimal, boundedPositivePower, boundedPositiveProduct,
  boundedPositiveSum, boundedSignedProduct } from "./finite-decimal";
import { analysisStep } from "./analysis-steps";

export function startCompressionRequest() {
  if (!PlayerProgress.compressionUnlocked()) return false;
  if (player.compression.active) {
    if (!player.options.confirmations.compression) return exitCompression();
    Modal.exitCompression.show();
  } else {
    if (!canStartEndgameChallenge()) return false;
    if (!player.options.confirmations.compression) return enterCompression();
    Modal.enterCompression.show();
  }
  return true;
}

export function enterCompression() {
  if (!PlayerProgress.compressionUnlocked() || !canStartEndgameChallenge()) return false;
  Endgame.resetNoReward();
  clearCelestialRuns();
  player.compression.active = true;
  recalculateAllGlyphs();
  Tab.dimensions.antimatter.show(false);
  return true;
}

export function exitCompression() {
  if (!player.compression.active) return false;
  rewardHR();
  Endgame.resetNoReward();
  player.compression.active = false;
  recalculateAllGlyphs();
  return true;
}

const COMP_UPG_NAMES = [
  null, "trGain", "waveThreshold", "hrGain", "doubleWaves", "stMultReplicanti",
  "adMultTR", "adBigMultTR", "entanglementSplit", "compressionPenalty", "esGenerator"
];

export function buyCompressionUpgrade(id, bulk = 1) {
  if (GameEnd.creditsEverClosed || !Number.isInteger(id) || id < 1 || id > 10 ||
      !PlayerProgress.compressionUnlocked()) return false;
  const upgrade = CompressionUpgrade[COMP_UPG_NAMES[id]];
  if (id > 3) {
    if (player.compression.upgrades.has(id) || !Currency.thermalRadiation.purchase(upgrade.cost)) return false;
    player.compression.upgrades.add(id);
    if (id === 4) updateElectromagneticWaves();
    return true;
  }
  const current = player.compression.rebuyables[id];
  const cap = Math.min(Number.MAX_SAFE_INTEGER, upgrade.purchaseCap);
  if (!Number.isSafeInteger(current) || current < 0 || current >= cap ||
      !(bulk > 0) || (!Number.isFinite(bulk) && bulk !== Infinity)) return false;
  const limit = Math.min(cap - current, Math.floor(bulk));
  const budget = finiteDecimal(Currency.thermalRadiation.value, "Compression purchase budget");
  if (budget.lt(0)) throw new Error("Negative Compression purchase budget");
  const price = count => Decimal.sumGeometricSeries(count,
    upgrade.config.initialCost, upgrade.config.increment, current);
  // Search actual total prices. An inverse converted to Number can be Infinity or lose purchases.
  let affordable = 0;
  let upper = limit;
  while (affordable < upper) {
    const middle = affordable + Math.ceil((upper - affordable) / 2);
    const cost = price(middle);
    if (isFiniteDecimal(cost) && cost.gt(0) && cost.lte(budget)) affordable = middle;
    else upper = middle - 1;
  }
  if (affordable === 0 || !Currency.thermalRadiation.purchase(price(affordable))) return false;
  player.compression.rebuyables[id] += affordable;
  if (id === 2) {
    Currency.thermalRadiation.reset();
    player.compression.nextThreshold = DC.E3;
    player.compression.baseElectromagneticWaves = DC.D0;
    player.compression.totalElectromagneticWaves = DC.D0;
  }
  return true;
}

export function updateElectromagneticWaves() {
  const thresholdMult = getElectroWaveMult();
  const radiation = Currency.thermalRadiation.value;
  if (radiation.gte(1000)) {
    let earned = radiation.log10().sub(3).div(Math.log10(thresholdMult)).floor().add(1);
    // Correct logarithm rounding at exact thresholds without looping over earned waves.
    for (let i = 0; i < 2; i++) {
      const next = earned.add(1);
      if (next.eq(earned)) break;
      if (radiation.gte(Decimal.pow(thresholdMult, earned).times(1000))) earned = next;
      else if (earned.gt(0) && radiation.lt(Decimal.pow(thresholdMult, earned.sub(1)).times(1000))) {
        earned = earned.sub(1);
      } else break;
    }
    player.compression.baseElectromagneticWaves = player.compression.baseElectromagneticWaves.max(earned);
  }
  player.compression.nextThreshold = boundedPositiveProduct(1000,
    boundedPositivePower(thresholdMult, player.compression.baseElectromagneticWaves));
  player.compression.totalElectromagneticWaves = boundedPositiveProduct(
    player.compression.baseElectromagneticWaves, Effects.max(1, CompressionUpgrade.doubleWaves));
}

export function getElectroWaveMult(thresholdUpgrade) {
  // This specifically needs to be an undefined check because sometimes thresholdUpgrade is zero
  const upgrade = thresholdUpgrade === undefined ? CompressionUpgrade.waveThreshold.effectValue : thresholdUpgrade;
  const thresholdMult = Decimal.pow10(upgrade).toNumber();
  return (1 + thresholdMult * 0.9);
}

function radiationEffects(initial, entries, observer) {
  let result = initial;
  for (const [key, effect] of entries) effect.applyEffect(factor => {
    result = analysisStep(observer, key, "multiply", result, boundedPositiveProduct(result, factor), factor);
  });
  return result;
}

export function getThermalRadiationGainPerSecond(observer = null) {
  const base = analysisStep(observer, "base", "override", DC.D1, new Decimal(Currency.hawkingRadiation.value));
  const trRate = radiationEffects(base, [["trGain", CompressionUpgrade.trGain],
    ["mastery281", EndgameMastery(281)], ["mastery282", EndgameMastery(282)],
    ["mastery283", EndgameMastery(283)], ["achievement276", Achievement(276)]], observer);
  const serpent = DivinityMilestone.serpentPower.isReached ? 10 : 1;
  return analysisStep(observer, "serpent", "multiply", trRate, boundedPositiveProduct(trRate, serpent), serpent);
}

export function getNextThermalRadiationGainPerSecond() {
  const trRate = radiationEffects(boundedPositiveSum(Currency.hawkingRadiation.value, getHawkingRadiationGain(true)),
    [["trGain", CompressionUpgrade.trGain], ["mastery281", EndgameMastery(281)],
      ["mastery282", EndgameMastery(282)], ["mastery283", EndgameMastery(283)],
      ["achievement276", Achievement(276)]], null);
  return boundedPositiveProduct(trRate, DivinityMilestone.serpentPower.isReached ? 10 : 1);
}

export function hawkingRadiationMultiplier(observer = null) {
  const upgrades = radiationEffects(DC.D1, [["hrGain", CompressionUpgrade.hrGain],
    ["achievement276", Achievement(276)]], observer);
  const burst = DivinityMilestone.powerBurst.isReached ? 10 : 1;
  const serpent = DivinityMilestone.serpentPower.isReached ? 10 : 1;
  const milestones = analysisStep(observer, "burst", "multiply", DC.D1, new Decimal(burst), burst);
  const combined = analysisStep(observer, "serpent", "multiply", milestones, milestones.times(serpent), serpent);
  return boundedPositiveProduct(upgrades, combined);
}

export function rewardHR() {
  Currency.hawkingRadiation.bumpTo(getHR(player.records.totalEndgameAntimatter, true));
}

// This function exists to apply Teresa-25 in a consistent way; TP multipliers can be very volatile and
// applying the reward only once upon unlock promotes min-maxing the upgrade by unlocking dilation with
// TP multipliers as large as possible. Applying the reward to a base TP value and letting the multipliers
// act dynamically on this fixed base value elsewhere solves that issue
export function getBaseHR(antimatter, requireInfinity, observer = null) {
  const input = analysisStep(observer, "antimatterInput", "override", DC.D1, new Decimal(antimatter));
  if ((!Player.canCrunch && requireInfinity) || Decimal.lt(input, Decimal.pow10(308))) {
    return analysisStep(observer, "base", "override", DC.D1, DC.D0);
  }
  const log = analysisStep(observer, "antimatterLog", "formula", input, Decimal.log10(input));
  const exponent = analysisStep(observer, "exponent", "formula", log,
    Decimal.log10(log.div(308)).sqrt().times(2));
  return analysisStep(observer, "base", "override", DC.D1, boundedPositivePower(10, exponent));
}

// Returns the TP that would be gained this run
export function getHR(antimatter, requireInfinity, observer = null) {
  const base = getBaseHR(antimatter, requireInfinity, observer);
  const multiplier = hawkingRadiationMultiplier(observer);
  return analysisStep(observer, "multipliers", "multiply", base, boundedPositiveProduct(base, multiplier), multiplier);
}

// Returns the amount of TP gained, subtracting out current TP; used for displaying gained TP, text on the
// "exit dilation" button (saying whether you need more antimatter), and in last 10 eternities
export function getHawkingRadiationGain(requireInfinity) {
  return getHR(Currency.antimatter.value, requireInfinity).minus(Currency.hawkingRadiation.value).clampMin(0);
}

// Returns the minimum antimatter needed in order to gain more TP; used only for display purposes
export function getHawkingRadiationReq() {
  let effectiveHR = Currency.hawkingRadiation.value.dividedBy(hawkingRadiationMultiplier());
  return Decimal.pow10(Decimal.pow10(effectiveHR.max(1).log10().div(2).pow(2)).times(308));
}

export function getThermalRadiationTimeEstimate(goal) {
  const currentTRGain = getThermalRadiationGainPerSecond();
  const nextTRGain = getNextThermalRadiationGainPerSecond();
  const currentTR = Currency.thermalRadiation.value;
  if (currentTRGain.eq(0)) return null;
  let timeString = `${TimeSpan.fromSeconds(Decimal.sub(goal, currentTR)
    .div(currentTRGain).toNumber()).toTimeEstimate()}`;
  if (nextTRGain.gt(currentTRGain) && player.compression.active) timeString += ` ➜ ${TimeSpan.fromSeconds(Decimal.sub(goal, currentTR)
    .div(nextTRGain).toNumber()).toTimeEstimate()}`;
  return timeString;
}

export function compressedMultiplier(value) {
  if (value.lte(0)) return new Decimal(0);
  const log10 = value.log10();
  const antimatterPenalty = player.antimatter.max(10).log10().log10().div(500).min(0.01);
  const timePenalty = Decimal.pow(CompressionUpgrade.compressionPenalty.isBought ? 0.98 : 0.99, Time.thisEndgameRealTime.totalHours.cbrt());
  const compressionPenalty = boundedPositivePower(antimatterPenalty, timePenalty);
  return boundedPositivePower(10, boundedSignedProduct(Decimal.sign(log10),
    boundedPositivePower(Decimal.abs(log10), compressionPenalty)));
}

class CompressionUpgradeState extends SetPurchasableMechanicState {
  get currency() {
    return Currency.thermalRadiation;
  }

  get set() {
    return player.compression.upgrades;
  }

  onPurchased() {
    if (this.id === 4) updateElectromagneticWaves();
  }
}

class RebuyableCompressionUpgradeState extends RebuyableMechanicState {
  get currency() {
    return Currency.thermalRadiation;
  }

  get boughtAmount() {
    return player.compression.rebuyables[this.id];
  }

  set boughtAmount(value) {
    player.compression.rebuyables[this.id] = value;
  }

  get isCapped() {
    return !Number.isSafeInteger(this.boughtAmount) ||
      this.boughtAmount >= Math.min(Number.MAX_SAFE_INTEGER, this.purchaseCap);
  }

  get purchaseCap() {
    return this.config.purchaseCap(player.compression.rebuyables[this.id]);
  }

  purchase(bulk) {
    return buyCompressionUpgrade(this.config.id, bulk);
  }
}

export const CompressionUpgrade = mapGameDataToObject(
  GameDatabase.endgame.compression,
  config => (config.rebuyable
    ? new RebuyableCompressionUpgradeState(config)
    : new CompressionUpgradeState(config))
);

export const CompressionUpgrades = {
  rebuyable: [
    CompressionUpgrade.trGain,
    CompressionUpgrade.waveThreshold,
    CompressionUpgrade.hrGain,
  ],
  fromId: id => CompressionUpgrade.all.find(x => x.id === Number(id))
};
