import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";

function imaginaryMachineBase() {
  const rmLog = boundedPositiveSum(MachineHandler.uncappedRM, 1).log10();
  let base = boundedPositivePower(Decimal.clampMin(rmLog.sub(1000), 0), 2);
  base = boundedPositiveProduct(base,
    boundedPositivePower(Decimal.clampMin(rmLog.sub(100000), 1), 0.2));
  const adaptiveExponent = Decimal.log10(Decimal.max(rmLog, 1)).div(7.5);
  base = boundedPositiveProduct(base,
    boundedPositivePower(Decimal.clampMin(rmLog.div(1000000000), 1), adaptiveExponent));
  return base;
}

function imaginaryMachineExponent() {
  const rmLog = boundedPositiveSum(MachineHandler.uncappedRM, 1).log10();
  let exponent = Effects.productDecimal(
    EndgameMastery(144), Ra.unlocks.imaginaryMachines, Ra.unlocks.imaginaryMachineEternityPower);
  const lateFactor = boundedPositiveSum(
    Decimal.max(Decimal.log10(Decimal.max(rmLog, 1)).sub(45), 0).div(10), 1);
  exponent = boundedPositiveProduct(exponent, lateFactor);
  exponent = boundedPositiveProduct(exponent, EtherealStars.green.reward);
  exponent = boundedPositiveProduct(exponent, DivineDimensions.conversionFormula2);
  exponent = exponent.timesEffectsOf(ResurgenceUpgrade.imSurge, ResurgenceUpgrade.machineSurge);
  return exponent;
}

export const MachineHandler = {
  get baseRMCap() { return DC.E1000; },

  get baseHardcapRM() {
    let effectMultipliers = DC.D1;
    if (ExpansionPack.teresaPack.isBought && !player.disablePostReality) {
      effectMultipliers = effectMultipliers.timesEffectsOf(PerkShopUpgrade.rmMult);
    }
    if (ExpansionPack.teresaPack.isBought && !player.disablePostReality && !Alpha.isDestroyed) {
      effectMultipliers = boundedPositiveProduct(effectMultipliers, Teresa.rmMultiplier);
    }
    if (EffarigUnlock.endgame.canBeApplied) {
      effectMultipliers = boundedPositiveProduct(effectMultipliers, getAdjustedGlyphEffect("effarigrm"));
    }
    const smallBoost = DC.D1.timesEffectsOf(EndgameMastery(153));
    let largeBoost = DC.D1.timesEffectsOf(SingularityMilestone.rmCap, Ra.unlocks.realityMachineCap);
    largeBoost = boundedPositiveProduct(largeBoost, DivineDimensions.conversionFormula2);
    largeBoost = largeBoost.timesEffectOf(ResurgenceUpgrade.machineSurge);
    let base = boundedPositiveProduct(this.baseRMCap, effectMultipliers);
    base = boundedPositiveProduct(base,
      boundedPositivePower(ImaginaryUpgrade(6).effectOrDefault(1), smallBoost));
    let result = boundedPositivePower(base, largeBoost);
    if (ResurgenceUpgrade.rmSurge.isBought && !player.disablePostReality) {
      result = boundedPositiveProduct(result, player.realities);
    }
    return result;
  },

  get hardcapRM() {
    if (!Alpha.isDestroyed) return this.baseHardcapRM;
    let exponent = boundedPositiveSum(this.uncappedRM.div(this.baseHardcapRM), 1).log10();
    exponent = boundedPositiveSum(exponent, 1).log10();
    exponent = boundedPositiveSum(exponent, 1).log10();
    exponent = boundedPositiveSum(exponent, 1);
    return boundedPositiveProduct(boundedPositivePower(this.baseHardcapRM, exponent), Teresa.rmMultiplier);
  },

  get distanceToRMCap() {
    return this.hardcapRM.minus(Currency.realityMachines.value);
  },

  get realityMachineMultiplier() {
    let result = new Decimal(ShopPurchase.RMPurchases.currentMult).timesEffectOf(PerkShopUpgrade.rmMult);
    result = boundedPositiveProduct(result, getAdjustedGlyphEffect("effarigrm"));
    return boundedPositiveProduct(result, Achievement(167).effectOrDefault(1));
  },

  get uncappedRM() {
    let log10FinalEP = boundedPositiveSum(
      boundedPositiveSum(player.records.thisReality.maxEP, gainedEternityPoints()), 1).log10();
    if (!PlayerProgress.realityUnlocked()) {
      if (log10FinalEP.gt(8000)) log10FinalEP = new Decimal(8000);
      if (log10FinalEP.gt(6000)) log10FinalEP = log10FinalEP.sub((log10FinalEP.sub(6000)).times(0.75));
    }
    let rmGain = boundedPositivePower(DC.E3, log10FinalEP.div(4000).sub(1));
    // Increase base RM gain if <10 RM
    if (rmGain.gte(1) && rmGain.lt(10)) rmGain = new Decimal(27).div(4000).times(log10FinalEP).sub(26);
    rmGain = boundedPositiveProduct(rmGain, this.realityMachineMultiplier);
    rmGain = boundedPositiveProduct(rmGain, Teresa.rmMultiplier);
    if (EndgameMastery(143).isBought) {
      rmGain = rmGain.powEffectsOf(EndgameMastery(143));
    }
    rmGain = boundedPositivePower(rmGain, DivineDimensions.conversionFormula2);
    rmGain = boundedPositiveProduct(rmGain,
      ResurgenceUpgrade.rmSurge.isBought && !player.disablePostReality ? player.realities : 1);
    return rmGain.floor();
  },

  get gainedRealityMachines() {
    return this.uncappedRM.clampMax(this.hardcapRM);
  },

  get isIMUnlocked() {
    return Currency.realityMachines.value.gte(this.hardcapRM) || Currency.imaginaryMachines.gt(0);
  },

  get baseIMCap() {
    if (Pelle.isDoomed) return new Decimal(1.6e15);
    return Decimal.min(boundedPositivePower(imaginaryMachineBase(), imaginaryMachineExponent()), this.hardcapIM);
  },

  get baseIMHardcap() {
    return DC.E1000;
  },

  get baseHardcapIM() {
    const base = boundedPositiveProduct(this.baseIMHardcap, DualityUpgrade(6).effectOrDefault(1));
    let exponent = boundedPositiveProduct(EtherealStars.green.reward, DivineDimensions.conversionFormula2);
    ResurgenceUpgrade.imSurge.applyEffect(value => {
      exponent = boundedPositiveProduct(exponent, value);
    });
    ResurgenceUpgrade.machineSurge.applyEffect(value => {
      exponent = boundedPositiveProduct(exponent, value);
    });
    return boundedPositivePower(base, exponent);
  },

  get hardcapIM() {
    if (!Alpha.isDestroyed) return this.baseHardcapIM;
    const exponent = this.uncappedIM.div(this.baseHardcapIM).add(1).log10().add(1).log10().add(1).log10().add(1);
    return boundedPositivePower(this.baseHardcapIM, exponent);
  },

  get uncappedIM() {
    return Pelle.isDoomed
      ? new Decimal(1.6e15)
      : boundedPositivePower(imaginaryMachineBase(), imaginaryMachineExponent());
  },

  get currentIMCap() {
    return Decimal.min(boundedPositiveProduct(player.reality.iMCap,
      ImaginaryUpgrade(13).effectOrDefault(1)), this.hardcapIM);
  },

  // This is iM cap based on in-game values at that instant, may be lower than the actual cap
  get projectedIMCap() {
    return Decimal.min(boundedPositiveProduct(this.baseIMCap,
      ImaginaryUpgrade(13).effectOrDefault(1)), this.hardcapIM);
  },

  // Use iMCap to store the base cap; applying multipliers separately avoids some design issues the 3xTP upgrade has
  updateIMCap() {
    if (this.uncappedRM.gte(this.baseRMCap)) {
      if (this.baseIMCap.gt(player.reality.iMCap)) {
        player.records.bestReality.iMCapSet = Glyphs.copyForRecords(Glyphs.active.filter(g => g !== null));
        player.reality.iMCap = this.baseIMCap;
      }
    }
  },

  // Time in seconds to reduce the missing amount by a factor of two
  get scaleTimeForIM() {
    return 60 / ImaginaryUpgrade(20).effectOrDefault(1);
  },

  gainedImaginaryMachines(diff) {
    return (this.currentIMCap.sub(Currency.imaginaryMachines.value)).times(
      new Decimal(1).sub(Decimal.pow(2, new Decimal(0).sub(diff).div(1000).div(this.scaleTimeForIM))));
  },

  estimateIMTimer(cost) {
    const imCap = this.currentIMCap;
    if (imCap.lte(cost)) return Infinity;
    const currentIM = Currency.imaginaryMachines.value;
    // This is doing log(a, 1/2) - log(b, 1/2) where a is % left to imCap of cost and b is % left to imCap of current
    // iM. log(1 - x, 1/2) should be able to estimate the time taken for iM to increase from 0 to imCap * x since every
    // fixed interval the difference between current iM to max iM should decrease by a factor of 1/2.
    return Decimal.max(0, new Decimal(Decimal.log2(imCap.div(imCap.sub(cost)))).sub(
      Decimal.log2(imCap.div(imCap.sub(currentIM))))).times(this.scaleTimeForIM);
  },

  get isDMUnlocked() {
    return Currency.imaginaryMachines.value.gte(this.hardcapIM) || Currency.dualMachines.gt(0);
  },

  get baseDMCap() {
    const cap = Decimal.pow(Decimal.clampMin(this.uncappedIM.add(1).log10().sub(1000), 0), Decimal.clampMin(
      Decimal.log10(Currency.realityMachines.value.add(1).log10().add(1)).sub(3).min(2).times(
      Decimal.log10(Currency.realityMachines.value.add(1).log10().add(1)).div(5).max(1).pow(0.5)), 1).times(
      Decimal.clampMin(Decimal.log10(Decimal.log10(Decimal.log10(this.uncappedRM.add(1)).add(1)).add(1)).sub(
      1.75).times(12).min(0.6).add(1), 1).add(Decimal.clampMin(Decimal.log10(Decimal.log10(Decimal.log10(
      this.uncappedRM.add(1)).add(1)).add(1)).sub(1.8).times(4).min(0.6), 0)).add(Decimal.clampMin(
      Decimal.log10(Decimal.log10(Decimal.log10(this.uncappedRM.add(1)).add(1)).add(1)).sub(1.95).times(2), 0))).times(
      DivinityMilestone.firstDivine.isReached && !player.disablePostReality ? 1.1 : 1).times(
      DivineDimensions.conversionFormula2).timesEffectsOf(
      ResurgenceUpgrade.machineSurge, EndgameMastery(213))).timesEffectOf(
      EndgameMastery(223));
    // Dual Machine caps are stored as Decimal values; retain the formula until
    // it reaches the type's existing finite representation boundary.
    return Decimal.min(cap, DC.BEMAX);
  },

  get currentDMCap() {
    return boundedPositiveProduct(player.reality.jMCap, DualityUpgrade(13).effectOrDefault(1));
  },

  // This is jM cap based on in-game values at that instant, may be lower than the actual cap
  get projectedDMCap() {
    return boundedPositiveProduct(this.baseDMCap, DualityUpgrade(13).effectOrDefault(1));
  },

  // Use DMCap to store the base cap; applying multipliers separately avoids some design issues the 3xTP upgrade has
  updateDMCap() {
    if (this.uncappedIM.gte(this.baseIMCap)) {
      if (this.baseDMCap.gt(player.reality.jMCap)) {
        player.reality.jMCap = this.baseDMCap;
      }
    }
  },

  // Time in seconds to reduce the missing amount by a factor of two
  get scaleTimeForDM() {
    return ((600 / DualityUpgrade(20).effectOrDefault(1)) / (DivinityUpgrade.divineL1U10.isBought ? 2 : 1)) /
      EndgameMastery(233).effectOrDefault(1);
  },

  gainedDualMachines(diff) {
    return (this.currentDMCap.sub(Currency.dualMachines.value)).times(
      new Decimal(1).sub(Decimal.pow(2, new Decimal(0).sub(diff).div(1000).div(this.scaleTimeForDM))));
  },

  estimateDMTimer(cost) {
    const jmCap = this.currentDMCap;
    if (jmCap.lte(cost)) return Infinity;
    const currentDM = Currency.dualMachines.value;
    // This is doing log(a, 1/2) - log(b, 1/2) where a is % left to jmCap of cost and b is % left to jmCap of current
    // jM. log(1 - x, 1/2) should be able to estimate the time taken for jM to increase from 0 to jmCap * x since every
    // fixed interval the difference between current jM to max jM should decrease by a factor of 1/2.
    return Decimal.max(0, new Decimal(Decimal.log2(jmCap.div(jmCap.sub(cost)))).sub(
      Decimal.log2(jmCap.div(jmCap.sub(currentDM))))).times(this.scaleTimeForDM);
  }
};
