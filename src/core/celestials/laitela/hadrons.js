import {
  boundedPositivePower,
  boundedPositiveProduct,
  boundedPositiveQuotient,
  boundedPositiveSum,
} from "../../finite-decimal";

function hadronEffectivenessCap() {
  return boundedPositiveProduct(boundedPositiveSum(
    boundedPositiveProduct(100, Accelerators.emptiness.effectValue2),
    EndgameMastery(251).effectOrDefault(0)), DivinityMilestone.serpentPower.isReached ? 2 : 1);
}

function softenedHadronTime(baseTime, divisor = 1) {
  let time = boundedPositiveProduct(new Decimal(baseTime).div(divisor), Hadrons.speedFactor);
  time = time.gte(100) ? boundedPositiveSum(time.sub(100).sqrt(), 100) : time;
  return time;
}

export const Hadrons = {
  updateTotals() {
    const hadrons = this.hadrons;
    const waves = player.compression.totalElectromagneticWaves;
    for (const [total, base] of [["trueTotal", "total"], ["totalLight", "light"],
      ["totalDark", "dark"], ["totalExotic", "exotic"]]) {
      hadrons[total] = boundedPositiveSum(hadrons[base], waves);
    }
  },
  get hadrons() {
    return player.celestials.laitela.hadrons;
  },
  get timeFactor() {
    return DualityUpgrade(15).isBought ? Time.thisEndgameRealTime._ms.div(36000) : DC.D0;
  },
  get speedFactor() {
    let factor = Effects.productDecimal(Achievement(235), Achievement(247));
    factor = boundedPositiveProduct(factor,
      DivinityMilestone.firstDivine.isReached && !player.disablePostReality ? 1.25 : 1);
    factor = boundedPositiveProduct(factor,
      DivinityMilestone.divineDimensions.isReached && !player.disablePostReality ? 1.25 : 1);

    const conversionDenominator = new Decimal(1).sub(DivineDimensions.conversionFormula3);
    factor = boundedPositiveQuotient(factor, conversionDenominator);

    const exoticBase = DivinityMilestone.finalRebirth.isReached && !player.disablePostReality
      ? 1.05
      : (DivinityMilestone.pelleQoL.isReached && !player.disablePostReality ? 1.04 : 1.025);
    factor = boundedPositiveProduct(factor, boundedPositivePower(exoticBase, this.hadrons.totalExotic));
    factor = boundedPositiveProduct(factor,
      DivinityMilestone.celestialSurge.isReached && !player.disablePostReality ? 4 : 1);
    factor = boundedPositiveProduct(factor,
      DivinityMilestone.finalRebirth.isReached && !player.disablePostReality ? 2 : 1);
    factor = boundedPositiveProduct(factor,
      DivinityMilestone.ascendedSurge.isReached && !player.disablePostReality ? 4 : 1);
    return factor;
  },
  get singularityMultiplier() {
    const time = softenedHadronTime(boundedPositiveProduct(this.timeFactor, 4));
    if (!DualityUpgrade(15).isBought || player.disablePostReality) return DC.D1;
    let exponent = boundedPositiveProduct(this.hadrons.totalLight, time.min(hadronEffectivenessCap()));
    exponent = boundedPositiveProduct(exponent, 10);
    return boundedPositivePower(10, exponent);
  },
  get darkMatterCapMultiplier() {
    const time = softenedHadronTime(boundedPositiveProduct(this.timeFactor, 2));
    if (!DualityUpgrade(16).isBought || player.disablePostReality) return DC.D1;
    let exponent = boundedPositiveProduct(this.hadrons.totalLight, time.min(hadronEffectivenessCap()));
    exponent = boundedPositiveProduct(exponent, 100);
    return boundedPositivePower(10, exponent);
  },
  get darkEnergyAscensionBoost() {
    const time = softenedHadronTime(this.timeFactor);
    return DualityUpgrade(17).isBought && !player.disablePostReality
      ? boundedPositiveProduct(this.hadrons.totalLight, time.min(hadronEffectivenessCap()))
      : DC.D0;
  },
  get entropyFormulaBoost() {
    const time = softenedHadronTime(this.timeFactor, 2);
    if (!DualityUpgrade(18).isBought || player.disablePostReality) return DC.D1;
    const base = boundedPositiveSum(
      boundedPositiveProduct(Decimal.log10(time.max(1).min(hadronEffectivenessCap())), 2), 1);
    return boundedPositivePower(base, this.hadrons.totalLight);
  },
  get continuumMultiplier() {
    const time = softenedHadronTime(this.timeFactor, 5);
    if (!DualityUpgrade(19).isBought || player.disablePostReality) return DC.D1;
    const darkHadronFactor = boundedPositiveSum(1, DualityUpgrade(21).effectOrDefault(0));
    const logFactor = Decimal.log10(time.max(1).min(hadronEffectivenessCap())).div(10);
    const base = boundedPositiveSum(boundedPositiveProduct(logFactor, darkHadronFactor), 1);
    return boundedPositivePower(base, this.hadrons.totalDark);
  }
};
