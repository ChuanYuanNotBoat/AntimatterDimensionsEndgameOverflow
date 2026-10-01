import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";

export const GALAXY_TYPE = {
  NORMAL: 0,
  DISTANT: 1,
  REMOTE: 2
};

class GalaxyRequirement {
  constructor(tier, amount) {
    this.tier = tier;
    this.amount = amount;
  }

  get isSatisfied() {
    const dimension = AntimatterDimension(this.tier);
    return dimension.totalAmount.gte(this.amount);
  }
}

export class Galaxy {
  static get baseRemoteStart() {
    return RealityUpgrade(21).effectOrDefault(800);
  }
  
  static get remoteStart() {
    const extraDelay = GalacticPowers.remoteGalaxyScale.isUnlocked ? GalacticPowers.remoteGalaxyScale.reward : 0;
    let start = boundedPositiveSum(this.baseRemoteStart, Effects.sum(BreakEternityUpgrade.galaxyScaleDelay));
    start = boundedPositiveSum(start, extraDelay);
    return boundedPositiveProduct(
      start, player.disablePostReality ? 1 : AlphaUnlocks.powerGalaxies.effects.buff.effectOrDefault(1));
  }

  static get remoteGalaxyStrength() {
    const reduction = GalacticPowers.remoteGalaxyPower.isUnlocked ? GalacticPowers.remoteGalaxyPower.reward : 1;
    return new Decimal(reduction).times(0.002).add(1).toNumber();
  }

  static get remoteGalaxyLogStrength() {
    const reduction = GalacticPowers.remoteGalaxyPower.isUnlocked ? GalacticPowers.remoteGalaxyPower.reward : DC.D1;
    const increase = new Decimal(reduction).times(0.002);
    const nativeIncrease = increase.toNumber();
    // Adding an extremely small reduction to 1 rounds away the entire remote scaling.
    // log1p retains it; below the Number range its continuous limit is x / ln(10).
    return nativeIncrease === 0
      ? increase.times(Math.LOG10E)
      : new Decimal(Math.log1p(nativeIncrease)).times(Math.LOG10E);
  }

  static get requirement() {
    return this.requirementAt(player.galaxies);
  }

  /**
   * Figure out what galaxy number we can buy up to
   * @param {Decimal} currency Either dim 8 or dim 6, depends on current challenge
   * @returns {Decimal} Max number of galaxies (total)
   */
  static buyableGalaxies(currency, currGal = player.galaxies) {
    const pow = GlyphAlteration.isAdded("power") ? getSecondaryGlyphEffect("powerpow") : DC.D1;
    const distantStart = Galaxy.costScalingStart;
    const scale = Galaxy.costMult;
    const valid = value => Decimal.isFinite(value) && Decimal.gte(value, 0);
    if (!valid(currency) || !valid(distantStart) || !valid(scale) || !valid(pow)) {
      throw new Error("Invalid input to Antimatter Galaxy bulk calculation");
    }
    if (currency.lt(Galaxy.requirementAt(currGal).amount)) return new Decimal(currGal);
    if (pow.eq(0)) return new Decimal(DC.BEMAX);

    // RequirementAt floors the final discounted cost. Invert its strict upper
    // bound, including both discounts, rather than dividing an already floored cost.
    const discount = Effects.sum(InfinityUpgrade.resetBoost) + (InfinityChallenge(5).isCompleted ? 1 : 0);
    const budget = currency.floor().add(1).div(pow).add(discount);
    const remoteStart = Galaxy.remoteStart;
    const firstScale = Decimal.min(distantStart, remoteStart);
    let target;
    if (currency.lt(Galaxy.requirementAt(firstScale).amount)) {
      target = budget.sub(Galaxy.baseCost).div(scale).ceil();
    } else if (currency.lt(Galaxy.requirementAt(remoteStart).amount)) {
      // Solve in the distance from the distant threshold. Expanding the
      // quadratic in the total count subtracts enormous, almost equal terms.
      const available = budget.sub(Galaxy.baseCost).sub(scale.times(distantStart.sub(1))).max(0);
      const b = scale.add(1);
      const distance = available.times(2).div(b.pow(2).add(available.times(4)).sqrt().add(b));
      target = distantStart.sub(1).add(distance).ceil();
    } else {
      const logStrength = Galaxy.remoteGalaxyLogStrength;
      if (logStrength.eq(0)) return new Decimal(DC.BEMAX);
      const base = Galaxy.scalingCostAt(remoteStart);
      const distance = budget.div(base).log10().div(logStrength);
      target = remoteStart.sub(1).add(distance).ceil();
    }

    if (!valid(target)) throw new Error("Invalid Antimatter Galaxy bulk result");
    target = Decimal.clamp(target, new Decimal(currGal).add(1), DC.BEMAX);
    // Correct rounding at integer boundaries and check the forward price before
    // granting any bulk purchase. Above Decimal precision, +/-1 can be unchanged.
    for (let adjustment = 0; adjustment < 8; adjustment++) {
      if (Galaxy.requirementAt(target.sub(1)).amount.gt(currency)) {
        const lower = target.sub(1);
        if (lower.eq(target)) return new Decimal(currGal).add(1);
        target = lower;
      } else if (target.lt(DC.BEMAX) && Galaxy.requirementAt(target).amount.lte(currency)) {
        const higher = target.add(1);
        if (higher.eq(target)) return target;
        target = higher;
      } else {
        return target;
      }
    }
    return Galaxy.requirementAt(target.sub(1)).amount.lte(currency) ? target : new Decimal(currGal).add(1);
  }

  static scalingCostAt(galaxies) {
    const equivGal = Decimal.min(Galaxy.remoteStart, galaxies);
    let amount = boundedPositiveSum(Galaxy.baseCost, boundedPositiveProduct(equivGal, Galaxy.costMult));
    const type = Galaxy.typeAt(galaxies);

    if (type === GALAXY_TYPE.DISTANT || type === GALAXY_TYPE.REMOTE) {
      const galaxyCostScalingStart = this.costScalingStart;
      const galaxiesAfterDistant = Decimal.clampMin(equivGal.sub(galaxyCostScalingStart).add(1), 0);
      const distantCost = boundedPositiveSum(
        boundedPositivePower(galaxiesAfterDistant, 2), galaxiesAfterDistant);
      amount = boundedPositiveSum(amount, distantCost);
    }

    return amount;
  }

  static requirementAt(galaxies) {
    let amount = Galaxy.scalingCostAt(galaxies);
    if (Galaxy.typeAt(galaxies) === GALAXY_TYPE.REMOTE) {
      const remoteExponent = new Decimal(galaxies).sub(Galaxy.remoteStart).add(1);
      const remoteCost = boundedPositivePower(10,
        boundedPositiveProduct(Galaxy.remoteGalaxyLogStrength, remoteExponent));
      amount = boundedPositiveProduct(amount, remoteCost);
    }

    amount = amount.sub(Effects.sum(InfinityUpgrade.resetBoost));
    if (InfinityChallenge(5).isCompleted) amount = amount.sub(1);

    if (GlyphAlteration.isAdded("power")) {
      amount = boundedPositiveProduct(amount, getSecondaryGlyphEffect("powerpow"));
    }

    // A vanishing secondary Power-glyph modifier can otherwise floor costs to
    // zero, making the inverse logarithm divide by zero. Costs are positive.
    amount = Decimal.floor(amount).max(1);
    const tier = Galaxy.requiredTier;
    return new GalaxyRequirement(tier, amount);
  }

  static get costMult() {
    // Galactic Power may drive its multiplier arbitrarily close to zero; the base AG price must still grow.
    return boundedPositiveProduct(
      Effects.min(NormalChallenge(10).isRunning ? 90 : 60, TimeStudy(42)),
      GalacticPowers.galaxyScaling.isUnlocked ? GalacticPowers.galaxyScaling.reward : 1).times(Slabdrill.isCursed ? 7.5 : 1).max(1);
  }

  static get baseCost() {
    return Slabdrill.isCursed ? new Decimal(650) : (NormalChallenge(10).isRunning ? new Decimal(99) : new Decimal(80));
  }

  static get requiredTier() {
    return Slabdrill.isCursed
      ? Math.max(Math.min(Math.floor((player.celestials.slabdrill.goodbyeTick - 30000) / 1000), 8), 1)
      : (NormalChallenge(10).isRunning ? 6 : 8);
  }

  static get canBeBought() {
    if (EternityChallenge(6).isRunning && !Enslaved.isRunning) return false;
    if (NormalChallenge(8).isRunning || InfinityChallenge(7).isRunning) return false;
    if ((player.records.thisInfinity.maxAM.gt(Player.infinityGoal) &&
       (!player.break || Player.isInAntimatterChallenge)) && (!Alpha.isRunning || player.antimatter.gte(DC.NUMMAX))) return false;
    return true;
  }

  static get lockText() {
    if (this.canBeBought) return null;
    if (EternityChallenge(6).isRunning) return "Locked (Eternity Challenge 6)";
    if (InfinityChallenge(7).isRunning) return "Locked (Infinity Challenge 7)";
    if (InfinityChallenge(1).isRunning) return "Locked (Infinity Challenge 1)";
    if (NormalChallenge(8).isRunning) return `Locked (8th ${player.universes.current === 2 ? "Matter" : "Antimatter"} Dimension
      Autobuyer Challenge)`;
    return null;
  }

  static get costScalingStart() {
    if (SlabdrillUnlocks.galaxy.isUnlocked) return boundedPositiveSum(GlyphSacrifice.power.effectValue,
      BreakEternityUpgrade.galaxyScaleDelay.effectOrDefault(0));
    const extraDelay = Alpha.isRunning ? 0 : BreakEternityUpgrade.galaxyScaleDelay.effectOrDefault(0);
    let start = new Decimal(Alpha.isRunning ? AlphaUnlocks.powerGalaxies.effects.nerf.effectOrDefault(100) : 100);
    start = boundedPositiveSum(start, TimeStudy(302).effectOrDefault(0));
    start = boundedPositiveSum(start, GlyphSacrifice.power.effectValue);
    start = boundedPositiveSum(start, Effects.sum(TimeStudy(223), TimeStudy(224), EternityChallenge(5).reward));
    start = boundedPositiveSum(start, extraDelay);
    return boundedPositiveProduct(
      start, player.disablePostReality ? 1 : AlphaUnlocks.powerGalaxies.effects.buff.effectOrDefault(1));
  }

  static get type() {
    return this.typeAt(player.galaxies);
  }

  static typeAt(galaxies) {
    if (new Decimal(galaxies).gte(Galaxy.remoteStart)) {
      return GALAXY_TYPE.REMOTE;
    }
    if (EternityChallenge(5).isRunning || new Decimal(galaxies).gte(this.costScalingStart)) {
      return GALAXY_TYPE.DISTANT;
    }
    return GALAXY_TYPE.NORMAL;
  }
}

function galaxyReset() {
  EventHub.dispatch(GAME_EVENT.GALAXY_RESET_BEFORE);
  player.galaxies = player.galaxies.add(1);
  if ((!Achievement(143).isUnlocked || ((Pelle.isDoomed && !PelleAchievementUpgrade.achievement143.canBeApplied) &&
    !PelleUpgrade.galaxyNoResetDimboost.canBeApplied)) || (player.disablePostReality && !(Alpha.isRunning && Alpha.currentStage >= 20) &&
    !(LHC.voidRunning && NullUpgrade.limerick2.isBought))) {
    player.dimensionBoosts = new Decimal(0);
  }
  softReset(0);
  if (Notations.current === Notation.emoji) player.requirementChecks.permanent.emojiGalaxies++;
  // This is specifically reset here because the check is actually per-galaxy and not per-infinity
  player.requirementChecks.infinity.noSacrifice = true;
  EventHub.dispatch(GAME_EVENT.GALAXY_RESET_AFTER);
}

export function manualRequestGalaxyReset(bulk) {
  if (!Galaxy.canBeBought || !Galaxy.requirement.isSatisfied) return;
  if (GameEnd.creditsEverClosed) return;
  if (RealityUpgrade(7).isLockingMechanics && player.galaxies.gt(0)) {
    RealityUpgrade(7).tryShowWarningModal();
    return;
  }
  if (player.options.confirmations.antimatterGalaxy) {
    Modal.antimatterGalaxy.show({ bulk: bulk && EternityMilestone.autobuyMaxGalaxies.isReached });
    return;
  }
  requestGalaxyReset(bulk);
}

// All galaxy reset requests, both automatic and manual, eventually go through this function; therefore it suffices
// to restrict galaxy count for RUPG7's requirement here and nowhere else
export function requestGalaxyReset(bulk, limit = DC.BEMAX) {
  if (Alpha.isRunning && player.galaxies.eq(0) && Alpha.currentStage < 2) return;
  const restrictedLimit = RealityUpgrade(7).isLockingMechanics ? new Decimal(1) : limit;
  if (EternityMilestone.autobuyMaxGalaxies.isReached && bulk) return maxBuyGalaxies(restrictedLimit);
  if (player.galaxies.gte(restrictedLimit) || !Galaxy.canBeBought || !Galaxy.requirement.isSatisfied) return false;
  Tutorial.turnOffEffect(TUTORIAL_STATE.GALAXY);
  galaxyReset();
  if (Alpha.isRunning && player.galaxies.gte(1) && Alpha.currentStage === 2) {
    Alpha.advanceLayer();
    Alpha.quotes.galaxy.show();
  }
  if (Slabdrill.isCursed && player.celestials.slabdrill.stage === 1) {
    player.reality.glyphs.sac.power = DC.D0;
    player.reality.glyphs.sac.infinity = DC.D0;
    player.reality.glyphs.sac.replication = DC.D0;
    player.reality.glyphs.sac.time = DC.D0;
    player.reality.glyphs.sac.dilation = DC.D0;
    player.reality.glyphs.sac.effarig = DC.D0;
    player.reality.glyphs.sac.reality = DC.D0;
    Slabdrill.advanceLayer();
    Slabdrill.quotes.galaxy.show();
  }
  return true;
}

function maxBuyGalaxies(limit = DC.BEMAX) {
  if (player.galaxies.gte(limit) || !Galaxy.canBeBought) return false;
  // Check for ability to buy one galaxy (which is pretty efficient)
  const req = Galaxy.requirement;
  if (!req.isSatisfied) return false;
  const dim = AntimatterDimension(req.tier);
  const newGalaxies = Decimal.clampMax(
    Galaxy.buyableGalaxies(Decimal.round(dim.totalAmount)),
    limit);
  if (!Decimal.isFinite(newGalaxies) || newGalaxies.lte(player.galaxies)) return false;
  if (Notations.current === Notation.emoji) {
    const remaining = Number.MAX_VALUE - player.requirementChecks.permanent.emojiGalaxies;
    player.requirementChecks.permanent.emojiGalaxies +=
      Decimal.min(newGalaxies.sub(player.galaxies), remaining).toNumber();
  }
  // Galaxy count is incremented by galaxyReset(), so add one less than we should:
  player.galaxies = newGalaxies.sub(1);
  galaxyReset();
  if (Enslaved.isRunning && player.galaxies.gt(1)) EnslavedProgress.c10.giveProgress();
  Tutorial.turnOffEffect(TUTORIAL_STATE.GALAXY);
  return true;
}
