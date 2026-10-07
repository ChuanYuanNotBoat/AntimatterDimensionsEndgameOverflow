import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";
import { analysisStep } from "./analysis-steps";

function multiplyEffects(value, entries, observer) {
  let result = value;
  for (const [key, effect] of entries) effect.applyEffect(factor => {
    result = analysisStep(observer, key, "multiply", result, boundedPositiveProduct(result, factor), factor);
  });
  return result;
}

export function realityMachineMultiplier(observer = null) {
  let result = new Decimal(ShopPurchase.RMPurchases.currentMult);
  result = analysisStep(observer, "shop", "override", DC.D1, result);
  result = multiplyEffects(result, [["perkShop", PerkShopUpgrade.rmMult]], observer);
  const glyph = getAdjustedGlyphEffect("effarigrm");
  result = analysisStep(observer, "glyph", "multiply", result, boundedPositiveProduct(result, glyph), glyph);
  const achievement = Achievement(167).effectOrDefault(1);
  return analysisStep(observer, "achievement167", "multiply", result,
    boundedPositiveProduct(result, achievement), achievement);
}

export function uncappedRealityMachines(observer = null) {
  let epLog = boundedPositiveSum(boundedPositiveSum(player.records.thisReality.maxEP, gainedEternityPoints()), 1).log10();
  epLog = analysisStep(observer, "epInput", "override", DC.D1, epLog);
  if (!PlayerProgress.realityUnlocked()) {
    if (epLog.gt(8000)) epLog = analysisStep(observer, "epHardcap", "hardcap", epLog, new Decimal(8000));
    if (epLog.gt(6000)) epLog = analysisStep(observer, "epSoftcap", "softcap", epLog,
      epLog.sub(epLog.sub(6000).times(0.75)));
  }
  let gain = boundedPositivePower(DC.E3, epLog.div(4000).sub(1));
  if (gain.gte(1) && gain.lt(10)) gain = new Decimal(27).div(4000).times(epLog).sub(26);
  gain = analysisStep(observer, "base", "override", DC.D1, gain);
  const multiplier = observer ? realityMachineMultiplier(observer) : MachineHandler.realityMachineMultiplier;
  gain = analysisStep(observer, "multipliers", "multiply", gain, boundedPositiveProduct(gain, multiplier), multiplier);
  const teresa = Teresa.rmMultiplier;
  gain = analysisStep(observer, "teresa", "multiply", gain, boundedPositiveProduct(gain, teresa), teresa);
  if (EndgameMastery(143).isBought) {
    const power = EndgameMastery(143).effectOrDefault(1);
    gain = analysisStep(observer, "mastery143", "power", gain, gain.powEffectsOf(EndgameMastery(143)), power);
  }
  const divine = DivineDimensions.conversionFormula2;
  gain = analysisStep(observer, "divinity", "power", gain, boundedPositivePower(gain, divine), divine);
  const surge = ResurgenceUpgrade.rmSurge.isBought && !player.disablePostReality ? player.realities : 1;
  gain = analysisStep(observer, "rmSurge", "multiply", gain, boundedPositiveProduct(gain, surge), surge);
  CompressionUpgrade.entanglementSplit.applyEffect(power => {
    gain = analysisStep(observer, "compression", "power", gain, boundedPositivePower(gain, power), power);
  });
  return analysisStep(observer, "rounding", "floor", gain, gain.floor());
}

function imaginaryMachineBase(observer) {
  let rmLog = boundedPositiveSum(MachineHandler.uncappedRM, 1).log10();
  rmLog = analysisStep(observer, "rmInput", "override", DC.D1, rmLog);
  let base = boundedPositivePower(Decimal.clampMin(rmLog.sub(1000), 0), 2);
  base = analysisStep(observer, "imThreshold", "formula", rmLog, base);
  const late = boundedPositivePower(Decimal.clampMin(rmLog.sub(100000), 1), 0.2);
  base = analysisStep(observer, "imLateBase", "multiply", base, boundedPositiveProduct(base, late), late);
  const adaptiveExponent = Decimal.log10(Decimal.max(rmLog, 1)).div(7.5);
  const adaptive = boundedPositivePower(Decimal.clampMin(rmLog.div(1000000000), 1), adaptiveExponent);
  return analysisStep(observer, "imAdaptiveBase", "multiply", base,
    boundedPositiveProduct(base, adaptive), adaptive);
}

function imaginaryMachineExponent(observer) {
  const rmLog = boundedPositiveSum(MachineHandler.uncappedRM, 1).log10();
  let power = multiplyEffects(DC.D1, [["mastery144", EndgameMastery(144)],
    ["raIM", Ra.unlocks.imaginaryMachines], ["raEP", Ra.unlocks.imaginaryMachineEternityPower]], observer);
  const late = boundedPositiveSum(Decimal.max(Decimal.log10(Decimal.max(rmLog, 1)).sub(45), 0).div(10), 1);
  power = analysisStep(observer, "imLatePower", "multiply", power, boundedPositiveProduct(power, late), late);
  const green = EtherealStars.green.reward;
  power = analysisStep(observer, "green", "multiply", power, boundedPositiveProduct(power, green), green);
  const divine = DivineDimensions.conversionFormula2;
  power = analysisStep(observer, "divinity", "multiply", power, boundedPositiveProduct(power, divine), divine);
  return multiplyEffects(power, [["imSurge", ResurgenceUpgrade.imSurge],
    ["machineSurge", ResurgenceUpgrade.machineSurge], ["compression", CompressionUpgrade.entanglementSplit]], observer);
}

export function uncappedImaginaryMachineCapacity(observer = null) {
  if (Pelle.isDoomed) return analysisStep(observer, "pelle", "override", DC.D1, new Decimal(1.6e15));
  const base = analysisStep(observer, "imBase", "override", DC.D1, imaginaryMachineBase(observer));
  const power = imaginaryMachineExponent(observer);
  return analysisStep(observer, "imPower", "power", base, boundedPositivePower(base, power), power);
}

export function uncappedDualMachineCapacity(observer = null) {
  const uncappedRM = MachineHandler.uncappedRM;
  const base = analysisStep(observer, "dmBase", "override", DC.D1,
    Decimal.clampMin(MachineHandler.uncappedIM.add(1).log10().sub(1000), 0));
  let power = Decimal.clampMin(Decimal.log10(Currency.realityMachines.value.add(1).log10().add(1)).sub(3).min(2).times(
    Decimal.log10(Currency.realityMachines.value.add(1).log10().add(1)).div(5).max(1).pow(0.5)), 1);
  power = analysisStep(observer, "dmRMExponent", "override", DC.D1, power);
  const progression = Decimal.clampMin(Decimal.log10(Decimal.log10(Decimal.log10(uncappedRM.add(1)).add(1)).add(1)).sub(
    1.75).times(12).min(0.6).add(1), 1).add(Decimal.clampMin(Decimal.log10(Decimal.log10(Decimal.log10(
    uncappedRM.add(1)).add(1)).add(1)).sub(1.8).times(4).min(0.6), 0)).add(Decimal.clampMin(
    Decimal.log10(Decimal.log10(Decimal.log10(uncappedRM.add(1)).add(1)).add(1)).sub(1.95).times(2), 0));
  power = analysisStep(observer, "dmProgression", "multiply", power, power.times(progression), progression);
  const milestone = DivinityMilestone.firstDivine.isReached && !player.disablePostReality ? 1.1 : 1;
  power = analysisStep(observer, "firstDivine", "multiply", power, power.times(milestone), milestone);
  const divine = DivineDimensions.conversionFormula2;
  power = analysisStep(observer, "divinity", "multiply", power, power.times(divine), divine);
  power = multiplyEffects(power, [["machineSurge", ResurgenceUpgrade.machineSurge],
    ["mastery213", EndgameMastery(213)], ["compression", CompressionUpgrade.entanglementSplit],
    ["mastery223", EndgameMastery(223)]], observer);
  const cap = analysisStep(observer, "dmPower", "power", base, boundedPositivePower(base, power), power);
  return analysisStep(observer, "representation", "hardcap", cap, Decimal.min(cap, DC.BEMAX));
}

// Current caps depend on the recorded peak. Projected caps use today's formula,
// without updating those records or the glyph set which earned them.
export function machineCapacity(type, projected = false, observer = null) {
  const imaginary = type === "IM";
  const hardcap = imaginary ? MachineHandler.hardcapIM : MachineHandler.hardcapDM;
  let cap;
  if (projected) {
    cap = imaginary ? uncappedImaginaryMachineCapacity(observer) : uncappedDualMachineCapacity(observer);
    if (!imaginary || !Pelle.isDoomed) {
      cap = analysisStep(observer, "baseHardcap", "hardcap", cap, Decimal.min(cap, hardcap));
    }
  } else {
    cap = analysisStep(observer, "storedCapacity", "override", DC.D1,
      imaginary ? player.reality.iMCap : player.reality.jMCap);
  }
  const upgrade = (imaginary ? ImaginaryUpgrade(13) : DualityUpgrade(13)).effectOrDefault(1);
  cap = analysisStep(observer, "capacityUpgrade", "multiply", cap, boundedPositiveProduct(cap, upgrade), upgrade);
  return analysisStep(observer, "capacityHardcap", "hardcap", cap, Decimal.min(cap, hardcap));
}
