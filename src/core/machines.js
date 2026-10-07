import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";
import { realityMachineMultiplier, uncappedRealityMachines, uncappedImaginaryMachineCapacity,
  uncappedDualMachineCapacity, machineCapacity } from "./machine-formulas";

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
    CompressionUpgrade.entanglementSplit.applyEffect(power => { result = boundedPositivePower(result, power); });
    return result;
  },

  get hardcapRM() {
    const base = this.baseHardcapRM;
    if (!Alpha.isDestroyed || base.eq(0)) return base;
    let exponent = boundedPositiveSum(this.uncappedRM.div(base), 1).log10();
    exponent = boundedPositiveSum(exponent, 1).log10();
    exponent = boundedPositiveSum(exponent, 1).log10();
    exponent = boundedPositiveSum(exponent, 1);
    return boundedPositiveProduct(boundedPositivePower(base, exponent), Teresa.rmMultiplier);
  },

  get distanceToRMCap() {
    return this.hardcapRM.minus(Currency.realityMachines.value);
  },

  get realityMachineMultiplier() {
    return realityMachineMultiplier();
  },

  get uncappedRM() {
    return uncappedRealityMachines();
  },

  get gainedRealityMachines() {
    return this.uncappedRM.clampMax(this.hardcapRM);
  },

  get isIMUnlocked() {
    return Currency.realityMachines.value.gte(this.hardcapRM) || Currency.imaginaryMachines.gt(0);
  },

  get baseIMCap() {
    if (Pelle.isDoomed) return this.uncappedIM;
    return Decimal.min(this.uncappedIM, this.hardcapIM);
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
    CompressionUpgrade.entanglementSplit.applyEffect(value => {
      exponent = boundedPositiveProduct(exponent, value);
    });
    return boundedPositivePower(base, exponent);
  },

  get hardcapIM() {
    const base = this.baseHardcapIM;
    if (!Alpha.isDestroyed || base.eq(0)) return base;
    const exponent = this.uncappedIM.div(base).add(1).log10().add(1).log10().add(1).log10().add(1);
    return boundedPositivePower(base, exponent);
  },

  get uncappedIM() {
    return uncappedImaginaryMachineCapacity();
  },

  get currentIMCap() {
    return machineCapacity("IM");
  },

  // This is iM cap based on in-game values at that instant, may be lower than the actual cap
  get projectedIMCap() {
    return machineCapacity("IM", true);
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
    return this.uncappedDM.min(this.hardcapDM);
  },

  get baseDMHardcap() {
    return DC.E1000;
  },

  get baseHardcapDM() {
    return this.baseDMHardcap;
  },

  get hardcapDM() {
    return this.baseHardcapDM;
  },

  get uncappedDM() {
    return uncappedDualMachineCapacity();
  },

  get currentDMCap() {
    return machineCapacity("DM");
  },

  // This is jM cap based on in-game values at that instant, may be lower than the actual cap
  get projectedDMCap() {
    return machineCapacity("DM", true);
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
