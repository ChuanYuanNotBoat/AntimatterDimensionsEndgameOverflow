import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";

// Tickspeed is stored as an interval. A mathematically tiny positive interval must never
// underflow to literal zero, because 1000 / 0 would turn the production rate non-finite.
const MIN_TICKSPEED_INTERVAL = () => new Decimal(DC.BEMAX).recip();

function clampTickspeedInterval(value) {
  const interval = new Decimal(value);
  if (Decimal.isNaN(interval)) throw new Error("Invalid Tickspeed interval");
  return Decimal.clamp(interval, MIN_TICKSPEED_INTERVAL(), DC.BEMAX);
}

function boundedEffectProduct(initial, sources) {
  let result = new Decimal(initial);
  for (const source of sources) {
    if (!source) continue;
    source.applyEffect(effect => {
      result = boundedPositiveProduct(result, effect);
    });
  }
  return result;
}

// Optional source exclusion is used only by the stats breakdown for exact marginal
// effective-count comparisons; the default path is unchanged for gameplay.
export function effectiveBaseGalaxies(excludedSource = null, details = null) {
  const alternationBase = Decimal.max(0, boundedPositiveSum(Replicanti.amount, 1).log10().div(1e6));
  const alternation = boundedPositiveSum(
    boundedPositiveProduct(alternationBase, AlchemyResource.alternation.effectValue), 1);

  let galaxies = excludedSource === "antimatter" ? DC.D0 : player.galaxies;
  if (!player.disablePostReality && Alpha.currentStage >= 3) {
    galaxies = boundedPositiveProduct(galaxies, alternation);
  }

  let generatedGalaxies = excludedSource === "generated" ? DC.D0 : GalaxyGenerator.galaxies;
  if (!player.disablePostReality && Alpha.currentStage >= 3) {
    generatedGalaxies = boundedPositiveProduct(generatedGalaxies, alternation);
  }

  // Note that this already includes the "50% more" active path effect
  let replicantiGalaxies = Replicanti.galaxies.bought;
  const activePathFactor = boundedPositiveSum(1, Effects.sum(TimeStudy(132), TimeStudy(133)));
  replicantiGalaxies = boundedPositiveProduct(replicantiGalaxies, activePathFactor);

  // "extra" galaxies unaffected by the passive/idle boosts come from studies 225/226 and Effarig Infinity
  replicantiGalaxies = boundedPositiveSum(replicantiGalaxies, Replicanti.galaxies.extra);
  const nonActivePathReplicantiGalaxies = Decimal.min(Replicanti.galaxies.bought,
    ReplicantiUpgrade.galaxies.value);

  // Effects.sum is intentional here - if EC8 is not completed,
  // this value should not be contributed to total replicanti galaxies
  replicantiGalaxies = boundedPositiveSum(replicantiGalaxies,
    boundedPositiveProduct(nonActivePathReplicantiGalaxies, Effects.sum(EternityChallenge(8).reward)));

  if (!player.disablePostReality && Alpha.currentStage >= 3) {
    replicantiGalaxies = boundedPositiveProduct(replicantiGalaxies, alternation);
  }
  if (excludedSource === "replicanti") replicantiGalaxies = DC.D0;

  // Source detail is collected only on demand by the statistics page. It uses the
  // values produced by this exact gameplay path, not independently reproduced formulas.
  if (details !== null) {
    details.replicantiBought = new Decimal(Replicanti.galaxies.bought);
    details.replicantiExtra = new Decimal(Replicanti.galaxies.extra);
  }

  let freeGalaxies = excludedSource === "tachyon" ? DC.D0 : player.dilation.totalTachyonGalaxies;
  freeGalaxies = boundedPositiveProduct(freeGalaxies, alternation);

  let extraGalaxies = excludedSource === "galactic" ? DC.D0 : GalacticPower.freeGalaxies;
  if (!player.disablePostReality && Alpha.currentStage >= 3) {
    extraGalaxies = boundedPositiveProduct(extraGalaxies, alternation);
  }

  if (details !== null) {
    details.ascension = GalacticPowers.galacticAscension.isUnlocked;
    details.sources = [
      { key: "antimatter", name: "Antimatter Galaxies", raw: new Decimal(player.galaxies), effective: galaxies },
      { key: "generated", name: "Galaxy Generator", raw: new Decimal(GalaxyGenerator.galaxies), effective: generatedGalaxies },
      { key: "replicanti", name: "Replicanti Galaxies", raw: new Decimal(Replicanti.galaxies.bought), effective: replicantiGalaxies },
      { key: "tachyon", name: "Tachyon Galaxies", raw: new Decimal(player.dilation.totalTachyonGalaxies), effective: freeGalaxies },
      { key: "galactic", name: "Galactic Power reward #12", raw: new Decimal(GalacticPower.freeGalaxies), effective: extraGalaxies,
        unlocked: GalacticPowers.freeGalaxies.isUnlocked },
    ];
  }

  const sources = [galaxies, generatedGalaxies, replicantiGalaxies, freeGalaxies, extraGalaxies];
  if (GalacticPowers.galacticAscension.isUnlocked) {
    return sources.reduce((total, value) => boundedPositiveProduct(total, new Decimal(value).max(1)), DC.D1);
  }
  return sources.reduce((total, value) => boundedPositiveSum(total, value), DC.D0);
}

export function getTickSpeedMultiplier(galaxyCount = null) {
  if (InfinityChallenge(3).isRunning) return DC.D1;
  if (Ra.isRunning) return DC.C1D1_1245;

  let galaxies = galaxyCount === null ? effectiveBaseGalaxies() : new Decimal(galaxyCount);
  const effects = boundedEffectProduct(DC.D1, [
    InfinityUpgrade.galaxyBoost,
    InfinityUpgrade.galaxyBoost.chargedEffect,
    BreakInfinityUpgrade.galaxyBoost,
    TimeStudy(212),
    TimeStudy(232),
    Achievement(86),
    Achievement(178),
    Achievement(193),
    EndgameMastery(52),
    InfinityChallenge(5).reward,
    PelleUpgrade.galaxyPower,
    PelleRifts.decay.milestones[1],
    BreakInfinityUpgrade.galaxyBoost.chargedEffect
  ]);

  if (galaxies.lt(3)) {
    // Magic numbers are to retain balancing from before while displaying
    // them now as positive multipliers rather than negative percentages
    let baseMultiplier = DC.D1.div(1.1245);
    if (player.galaxies.eq(1)) baseMultiplier = DC.D1.div(1.11888888);
    if (player.galaxies.eq(2)) baseMultiplier = DC.D1.div(1.11267177);
    if (NormalChallenge(5).isRunning) {
      baseMultiplier = DC.D1.div(1.08);
      if (player.galaxies.eq(1)) baseMultiplier = DC.D1.div(1.07632);
      if (player.galaxies.eq(2)) baseMultiplier = DC.D1.div(1.072);
    }
    const perGalaxy = boundedPositiveProduct(0.02, effects);
    if (Pelle.isDoomed && !PelleDestructionUpgrade.disableGalaxyNerf.canBeApplied) {
      galaxies = boundedPositiveProduct(galaxies, 0.5);
    }
    galaxies = boundedPositiveProduct(galaxies, Pelle.specialGlyphEffect.power);
    return DC.D0_01.clampMin(baseMultiplier.sub(boundedPositiveProduct(galaxies, perGalaxy)));
  }

  let baseMultiplier = new Decimal(0.8);
  if (NormalChallenge(5).isRunning) baseMultiplier = new Decimal(0.83);

  galaxies = galaxies.sub(2);
  galaxies = boundedPositiveProduct(galaxies, effects);
  galaxies = boundedPositiveProduct(galaxies, getAdjustedGlyphEffect("cursedgalaxies"));
  galaxies = boundedPositiveProduct(galaxies, getAdjustedGlyphEffect("realitygalaxies"));
  galaxies = boundedPositiveProduct(galaxies,
    boundedPositiveSum(1, ImaginaryUpgrade(9).effectOrDefault(0)));

  if (Pelle.isDoomed && !PelleDestructionUpgrade.disableGalaxyNerf.canBeApplied) {
    galaxies = boundedPositiveProduct(galaxies, 0.5);
  }
  if (Pelle.isDoomed) {
    EndgameMastery(51).applyEffect(effect => {
      galaxies = boundedPositiveProduct(galaxies, effect);
    });
  }
  if (GalacticPowers.galaxyStrength.isUnlocked) {
    galaxies = boundedPositiveProduct(galaxies, GalacticPowers.galaxyStrength.reward);
  }

  galaxies = boundedEffectProduct(galaxies, [DualityUpgrade(9), DualityUpgrade(23), DualityUpgrade(24)]);

  if (LHC.voidRunning) {
    Accelerators.cosmic._milestones[0].applyEffect(effect => {
      galaxies = boundedPositiveProduct(galaxies, effect);
    });
  }

  ResurgenceUpgrade.synergy4.applyEffect(effect => {
    galaxies = boundedPositiveProduct(galaxies, effect);
  });
  galaxies = boundedPositiveProduct(galaxies, Pelle.specialGlyphEffect.power);

  if (Alpha.isRunning) {
    galaxies = boundedPositiveProduct(galaxies, AlphaUnlocks.firstGalaxy.effects.nerf.effectOrDefault(1));
  }
  if (Alpha.isRunning && Alpha.currentStage >= 6) {
    galaxies = boundedPositiveProduct(galaxies, 2);
  }

  const perGalaxy = DC.D0_965;
  const galaxyInterval = boundedPositivePower(perGalaxy, galaxies.sub(2));
  return clampTickspeedInterval(boundedPositiveProduct(galaxyInterval, baseMultiplier));
}

export function buyTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable) return false;

  if (NormalChallenge(9).isRunning) {
    Tickspeed.multiplySameCosts();
  }
  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  Currency.antimatter.subtract(Tickspeed.cost);
  player.totalTickBought = player.totalTickBought.add(1);
  player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
  player.requirementChecks.permanent.singleTickspeed++;
  if (NormalChallenge(2).isRunning) player.chall2Pow = 0;
  GameUI.update();
  return true;
}

export function buyMaxTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable) return;
  let boughtTickspeed = false;

  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  if (NormalChallenge(9).isRunning) {
    const goal = Player.infinityGoal;
    let cost = Tickspeed.cost;
    while (Currency.antimatter.gt(cost) && cost.lt(goal)) {
      Tickspeed.multiplySameCosts();
      Currency.antimatter.subtract(cost);
      player.totalTickBought = player.totalTickBought.add(1);
      boughtTickspeed = true;
      cost = Tickspeed.cost;
    }
  } else {
    const purchases = Tickspeed.costScale.getMaxBoughtDecimal(player.totalTickBought, Currency.antimatter.value, 1);
    if (purchases === null) {
      return;
    }
    Currency.antimatter.subtract(Decimal.pow10(purchases.logPrice));
    player.totalTickBought = player.totalTickBought.add(purchases.quantity);
    boughtTickspeed = true;
  }

  if (boughtTickspeed) {
    player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
    if (NormalChallenge(2).isRunning) player.chall2Pow = 0;
  }
}

export function resetTickspeed() {
  player.totalTickBought = DC.D0;
  player.chall9TickspeedCostBumps = DC.D0;
}

export const Tickspeed = {

  get isUnlocked() {
    return AntimatterDimension(2).bought.gt(0) || EternityMilestone.unlockAllND.isReached ||
      PlayerProgress.realityUnlocked();
  },

  get isAvailableForPurchase() {
    return this.isUnlocked &&
      !EternityChallenge(9).isRunning &&
      !Laitela.continuumActive &&
      (player.break || this.cost.lt(DC.NUMMAX));
  },

  get isAffordable() {
    return Currency.antimatter.gte(this.cost);
  },

  get multiplier() {
    return getTickSpeedMultiplier();
  },

  get current() {
    let tickspeed;
    if (Effarig.isRunning) {
      tickspeed = clampTickspeedInterval(Effarig.tickspeed);
    } else {
      tickspeed = this.baseValue;
      DilationUpgrade.tickspeedPower.applyEffect(power => {
        tickspeed = clampTickspeedInterval(boundedPositivePower(tickspeed, power));
      });
    }

    if (player.dilation.active || (PelleStrikes.dilation.hasStrike && !PelleStrikes.dilation.isDestroyed())) {
      tickspeed = clampTickspeedInterval(dilatedValueOf(tickspeed));
    }
    if (player.endgame.overcharge.isRunning) {
      tickspeed = clampTickspeedInterval(
        dilateMultiplier(tickspeed, Math.pow(0.72, player.endgame.overcharge.level)));
    }
    return clampTickspeedInterval(tickspeed);
  },

  get cost() {
    return this.costScale.calculateCostDecimal(player.totalTickBought.add(player.chall9TickspeedCostBumps));
  },

  get costScale() {
    return new ExponentialCostScaling({
      baseCost: 1000,
      baseIncrease: 10,
      costScale: Player.tickSpeedMultDecrease,
      scalingCostThreshold: Number.MAX_VALUE
    });
  },

  get continuumValue() {
    if (!this.isUnlocked) return DC.D0;
    return this.costScale.getContinuumValue(Currency.antimatter.value, 1).times(Laitela.matterExtraPurchaseFactor);
  },

  get baseValue() {
    const baseInterval = boundedEffectProduct(DC.E3, [
      Achievement(36),
      Achievement(45),
      Achievement(66),
      Achievement(83)
    ]);

    let upgradeInterval = boundedPositivePower(getTickSpeedMultiplier(), this.totalUpgrades);
    upgradeInterval = clampTickspeedInterval(upgradeInterval);
    Ra.unlocks.tickspeedPower.applyEffect(power => {
      upgradeInterval = clampTickspeedInterval(boundedPositivePower(upgradeInterval, power));
    });

    return clampTickspeedInterval(boundedPositiveProduct(baseInterval, upgradeInterval));
  },

  get totalUpgrades() {
    let boughtTickspeed;
    if (Laitela.continuumActive) boughtTickspeed = this.continuumValue;
    else boughtTickspeed = player.totalTickBought;
    return new Decimal(boughtTickspeed).add(player.totalTickGained);
  },

  get perSecond() {
    return boundedPositiveProduct(DC.E3, this.current.recip());
  },

  multiplySameCosts() {
    for (const dimension of AntimatterDimensions.all) {
      if (dimension.cost.max(1).log10().floor().eq(this.cost.max(1).log10().floor())) dimension.costBumps = dimension.costBumps.add(1);
    }
  }
};


export const FreeTickspeed = {
  BASE_SOFTCAP: 300000,
  GROWTH_RATE: 6e-6,
  GROWTH_EXP: 2,
  multToNext: 1.33,

  get amount() {
    return player.totalTickGained;
  },

  get softcap() {
    let softcap = FreeTickspeed.BASE_SOFTCAP;
    if (Enslaved.has(ENSLAVED_UNLOCKS.FREE_TICKSPEED_SOFTCAP) && !player.disablePostReality) {
      softcap += 100000;
    }
    return softcap;
  },

  fromShards(shards) {
    const alphaMult = Alpha.isRunning ? AlphaUnlocks.ec11Bulk.effects.nerfB.effectOrDefault(1.33) : 1.33;
    const tickmult = Decimal.min(Effects.min(1.33, TimeStudy(171)), alphaMult).sub(1).times(
      Decimal.max(getAdjustedGlyphEffect("cursedtickspeed"), 1)).add(1);
    const logTickmult = Decimal.ln(tickmult);
    const logShards = Decimal.max(1, shards).ln();
    const uncapped = Decimal.max(0, logShards.div(logTickmult));
    const exponentIncrease = new Decimal(FreeTickspeed.GROWTH_EXP).pow(Penteracts.softcapReduction());
    if (uncapped.lte(FreeTickspeed.softcap)) {
      this.multToNext = tickmult;
      return {
        newAmount: Decimal.ceil(uncapped),
        nextShards: Decimal.pow(tickmult, Decimal.ceil(uncapped))
      };
    }
    // Log of (cost - cost up to softcap)
    const priceToCap = new Decimal(FreeTickspeed.softcap).times(logTickmult);
    // In the following we're implicitly applying the function (ln(x) - priceToCap) / logTickmult to all costs,
    // so, for example, if the cost is 1 that means it's actually exp(priceToCap) * tickmult.
    const desiredCost = logShards.sub(priceToCap).div(logTickmult);
    const costFormulaCoefficient = new Decimal(FreeTickspeed.GROWTH_RATE).div(exponentIncrease).div(logTickmult).times(
      boundedPositivePower(Effects.productDecimal(EndgameMastery(103)), 2));
    // In the following we're implicitly subtracting softcap from bought,
    // so, for example, if bought is 1 that means it's actually softcap + 1.
    // The first term (the big one) is the asymptotically more important term (since FreeTickspeed.GROWTH_EXP > 1),
    // but is small initially. The second term allows us to continue the pre-cap free tickspeed upgrade scaling
    // of tickmult per upgrade.
    const boughtToCost = bought => costFormulaCoefficient.times(Decimal.pow(
      Decimal.max(bought, 0), exponentIncrease)).add(bought);
    const derivativeOfBoughtToCost = x => new Decimal(exponentIncrease).times(costFormulaCoefficient).times(Decimal.pow(
      Decimal.max(x, 0), exponentIncrease.sub(1))).add(1);
    const newtonsMethod = bought => bought.sub(boughtToCost(bought).sub(desiredCost).div(derivativeOfBoughtToCost(bought)));
    let oldApproximation;
    let approximation = Decimal.min(
      desiredCost,
      Decimal.pow(desiredCost.div(costFormulaCoefficient), DC.D1.div(exponentIncrease))
    );
    let counter = 0;
    // The bought formula is concave upwards. We start with an over-estimate; when using newton's method,
    // this means that successive iterations are also over-etimates. Thus, we can just check for continued
    // progress with the approximation < oldApproximation check. The counter is a fallback.
    do {
      oldApproximation = approximation;
      approximation = newtonsMethod(approximation);
    } while (approximation.lt(oldApproximation) && ++counter < 100);
    const purchases = Decimal.floor(approximation);
    // This undoes the function we're implicitly applying to costs (the "+ 1") is because we want
    // the cost of the next upgrade.
    const next = Decimal.exp(priceToCap.add(boughtToCost(purchases.add(1)).times(logTickmult)));
    this.multToNext = Decimal.exp(boughtToCost(purchases.add(1)).sub(boughtToCost(purchases)).times(logTickmult));
    return {
      newAmount: purchases.add(FreeTickspeed.softcap),
      nextShards: next,
    };
  }

};
