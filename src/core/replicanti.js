import {
  boundedPositivePower,
  boundedPositiveProduct,
  boundedPositiveQuotient,
  boundedPositiveSum,
  boundedPositiveValue,
  isFiniteDecimal,
  minimumPositiveDecimal,
} from "./finite-decimal";

// Slowdown parameters for replicanti growth, interval will increase by scaleFactor for every scaleLog10
// OoM past the cap (default is 308.25 (log10 of 1.8e308), 1.2, Number.MAX_VALUE)
export const ReplicantiGrowth = {
  get scaleLog10() {
    return Math.log10(Number.MAX_VALUE);
  },
  get scaleFactor() {
    if (Replicanti.amount.gte(DC.E9E15)) return EndgameMastery(272).effectOrDefault(10);
    if (PelleStrikes.eternity.hasStrike && !PelleStrikes.eternity.isDestroyed() && Replicanti.amount.gte(DC.E2000)) return 10;
    if (Pelle.isDoomed) return 2;
    if (Alpha.isRunning) return AlphaUnlocks.timestudy192.effects.nerf.effectOrDefault(1.2);
    return AlchemyResource.cardinality.effectValue;
  }
};

export function replicantiMultToPower(value) {
  return Decimal.log10(Decimal.log10(value.max(1)).add(1)).div(100).add(1).toNumber();
};

export const ReplicantiMultipliers = {
  get idMult() {
    return replicantiMult();
  },
  get idPow() {
    return replicantiMultToPower(this.idMult);
  },
  get tdMult() {
    return DilationUpgrade.tdMultReplicanti.effectOrDefault(DC.D1);
  },
  get tdPow() {
    return replicantiMultToPower(this.tdMult);
  },
  get dtMult() {
    return Decimal.clampMin(
      boundedPositiveProduct(Decimal.log10(boundedPositiveSum(Replicanti.amount, 1)),
        getAdjustedGlyphEffect("replicationdtgain")), 1);
  },
  get dtPow() {
    return replicantiMultToPower(this.dtMult);
  },
  get ipMult() {
    let result = Replicanti.amount;
    AlchemyResource.exponential.applyEffect(power => {
      result = boundedPositivePower(result, power);
    });
    return result;
  },
  get ipPow() {
    return replicantiMultToPower(this.ipMult);
  },
  get deMult() {
    return SingularityMilestone.replDESingBoost.effectOrDefault(Decimal.pow(Decimal.log2(Replicanti.amount.add(1)), 10).add(1));
  },
  get dePow() {
    return replicantiMultToPower(this.deMult);
  }
};

// Internal function to add RGs; called both from within the fast replicanti code and from the function
// used externally. Only called in cases of automatic RG and does not actually modify replicanti amount
function addReplicantiGalaxies(newGalaxiesNum) {
  let newGalaxies = new Decimal(newGalaxiesNum);
  if (newGalaxies.gt(0)) {
    player.replicanti.galaxies = player.replicanti.galaxies.add(newGalaxies);
    player.requirementChecks.eternity.noRG = false;
    const keepResources = Pelle.isDoomed
      ? PelleUpgrade.replicantiGalaxyEM40.canBeApplied
      : EternityMilestone.replicantiNoReset.isReached;
    if (!keepResources) {
      player.dimensionBoosts = DC.D0;
      softReset(0, true, true);
    }
  }
}

// Function called externally for gaining RGs, which adjusts replicanti amount before calling the function
// which actually adds the RG. Called externally both automatically and manually
export function replicantiGalaxy(auto) {
  if (RealityUpgrade(6).isLockingMechanics) {
    if (!auto) RealityUpgrade(6).tryShowWarningModal();
    return;
  }
  if (!Replicanti.galaxies.canBuyMore) return;
  const galaxyGain = Replicanti.galaxies.gain;
  if (galaxyGain.lt(1)) return;
  player.replicanti.timer = 0;
  Replicanti.amount = Achievement(126).isUnlocked
    ? boundedPositivePower(10, boundedPositiveSum(Replicanti.amount, 1).log10()
      .sub(new Decimal(LOG10_MAX_VALUE).times(galaxyGain)))
    : DC.D1;
  addReplicantiGalaxies(galaxyGain);
}

// Only called on manual RG requests
export function replicantiGalaxyRequest() {
  if (!Replicanti.galaxies.canBuyMore) return;
  if (RealityUpgrade(6).isLockingMechanics) RealityUpgrade(6).tryShowWarningModal();
  else if (player.options.confirmations.replicantiGalaxy) Modal.replicantiGalaxy.show();
  else replicantiGalaxy(false);
}

// Produces replicanti quickly below e308, will auto-bulk-RG if production is fast enough
// Returns the remaining unused gain factor
function fastReplicantiBelow308(log10GainFactor, isAutobuyerActive) {
  const shouldBuyRG = isAutobuyerActive && !RealityUpgrade(6).isLockingMechanics;
  const capAtCurrentLimit = () => {
    if (shouldBuyRG) {
      addReplicantiGalaxies(Replicanti.galaxies.max.sub(player.replicanti.galaxies));
    }
    Replicanti.amount = replicantiCap();
    // Basically we've used nothing.
    return log10GainFactor;
  };

  if (!Decimal.isFinite(log10GainFactor)) throw new Error("Invalid Replicanti logarithmic gain");
  // Keep the existing high-gain shortcut ahead of the power calculation. The
  // shortcut was already the intended behavior, but Decimal.pow can become
  // non-finite before the old post-calculation check gets a chance to run.
  if (log10GainFactor.gt(Number.MAX_VALUE)) return capAtCurrentLimit();

  const currentLog = boundedPositiveSum(Replicanti.amount, 1).log10();
  if (!Decimal.isFinite(currentLog)) throw new Error("Invalid Replicanti amount logarithm");
  const uncappedExponent = log10GainFactor.plus(currentLog);
  if (!Decimal.isFinite(uncappedExponent) || uncappedExponent.gt(Number.MAX_VALUE)) {
    return capAtCurrentLimit();
  }

  // More than e308 galaxies per tick causes the game to die, and I don't think it's worth the performance hit of
  // Decimalifying the entire calculation.  And yes, this can and does actually happen super-lategame.
  const uncappedAmount = DC.E1.pow(uncappedExponent);
  // Checking for uncapped equaling zero is because Decimal.pow returns zero for overflow for some reason
  if (!Decimal.isFinite(uncappedAmount) || uncappedAmount.eq(0)) return capAtCurrentLimit();

  if (!shouldBuyRG) {
    const remainingGain = log10GainFactor.minus(replicantiCap().log10().sub(currentLog)).clampMin(0);
    Replicanti.amount = Decimal.min(uncappedAmount, replicantiCap());
    return remainingGain;
  }

  const gainNeededPerRG = DC.NUMMAX.log10();
  const replicantiExponent = log10GainFactor.add(currentLog);
  const toBuy = Decimal.floor(Decimal.min(new Decimal(replicantiExponent.div(gainNeededPerRG)),
    Replicanti.galaxies.max.sub(player.replicanti.galaxies)));
  const maxUsedGain = gainNeededPerRG.times(toBuy).add(replicantiCap().log10()).sub(Replicanti.amount.log10());
  const remainingGain = log10GainFactor.minus(maxUsedGain).clampMin(0);
  Replicanti.amount = Decimal.pow10(replicantiExponent.sub(gainNeededPerRG.times(toBuy)))
    .clampMax(replicantiCap());
  addReplicantiGalaxies(toBuy);
  return remainingGain;
}

// When the amount is exactly the cap, there are two cases: the player can go
// over cap (in which case interval should be as if over cap) or the player
// has just crunched and is still at cap due to "Is this safe?" reward
// (in which case interval should be as if not over cap). This is why we have
// the overCapOverride parameter, to tell us which case we are in.
export function getReplicantiInterval(overCapOverride, intervalIn) {
  let interval = new Decimal(intervalIn || player.replicanti.interval);
  const amount = Replicanti.amount;
  const overCap = overCapOverride === undefined ? amount.gt(replicantiCap()) : overCapOverride;

  if ((TimeStudy(133).isBought && !Achievement(138).isUnlocked) || overCap) {
    interval = boundedPositiveProduct(interval, 10);
  }

  if (overCap) {
    let increases = amount.log10().sub(replicantiCap().log10()).div(ReplicantiGrowth.scaleLog10);
    if (PelleStrikes.eternity.hasStrike && !PelleStrikes.eternity.isDestroyed() && amount.gte(DC.E2000)) {
      increases = increases.sub(
        Decimal.log10(5).times(new Decimal(2000).sub(replicantiCap().log10())).div(ReplicantiGrowth.scaleLog10));
    }
    interval = boundedPositiveProduct(interval,
      boundedPositivePower(ReplicantiGrowth.scaleFactor, increases));
  }

  interval = boundedPositiveQuotient(interval, totalReplicantiSpeedMult(overCap));
  if (V.isRunning) interval = boundedPositivePower(interval, 2);
  BreakEternityUpgrade.replicantiIntervalPow.applyEffect(power => {
    interval = boundedPositivePower(interval, power);
  });
  if (Alpha.isRunning) {
    interval = boundedPositivePower(interval, AlphaUnlocks.replicanti.effects.nerf.effectOrDefault(1));
  }
  if (!player.disablePostReality) {
    interval = boundedPositivePower(interval, AlphaUnlocks.replicanti.effects.buff.effectOrDefault(1));
  }
  if (getSecondaryGlyphEffect("replicationdtgain").neq(0) && ResurgenceUpgrade.repSurge.isBought &&
      !player.disablePostReality) {
    interval = boundedPositivePower(interval, boundedPositiveQuotient(1, ReplicantiMultipliers.dtPow));
  }

  return Decimal.clamp(interval, minimumPositiveDecimal(), DC.BEMAX);
}

// This only counts the "external" multipliers - that is, it doesn't count any speed changes due to being over the cap.
// These multipliers are separated out largely for two reasons - more "dynamic" multipliers (such as overcap scaling
// and celestial nerfs) interact very weirdly and the game balance relies on this behavior, and we also use this same
// value in the multiplier tab too
export function totalReplicantiSpeedMult(overCap) {
  let totalMult = DC.D1;
  // Keep this product finite at the Decimal representation boundary. This does
  // not introduce a gameplay cap; it only avoids constructing Infinity before
  // the interval code has a chance to use the existing maximum Decimal value.
  const multiply = factor => {
    totalMult = boundedPositiveProduct(totalMult, factor);
  };
  const multiplyEffect = effectSource => effectSource.applyEffect(multiply);

  // These are the only effects active in Pelle - the function shortcuts everything else if we're in Pelle
  multiply(PelleRifts.decay.effectValue);
  multiply(Pelle.specialGlyphEffect.replication);
  multiply(ShopPurchase.replicantiPurchases.currentMult);
  if (Pelle.isDisabled("replicantiIntervalMult")) {
    let pelleRep = DC.D1;
    const multiplyPelle = factor => {
      pelleRep = boundedPositiveProduct(pelleRep, factor);
    };
    const multiplyPelleEffect = effectSource => effectSource.applyEffect(multiplyPelle);
    if (PelleAchievementUpgrade.achievement81.canBeApplied) multiplyPelle(Effects.product(Achievement(81)));
    if (PelleDestructionUpgrade.timestudy62.canBeApplied) multiplyPelle(Effects.product(TimeStudy(62)));
    if (PelleDestructionUpgrade.timestudy213.canBeApplied) multiplyPelle(Effects.product(TimeStudy(213)));
    if (PelleRealityUpgrade.replicativeAmplifier.canBeApplied) multiplyPelleEffect(RealityUpgrade(2));
    if (PelleRealityUpgrade.cosmicallyDuplicate.canBeApplied) multiplyPelleEffect(RealityUpgrade(6));
    if (PelleRealityUpgrade.replicativeRapidity.canBeApplied) multiplyPelleEffect(RealityUpgrade(23));
    if (PelleDestructionUpgrade.timestudy132.canBeApplied) multiplyPelle(3);
    if (PelleAchievementUpgrade.achievement134.canBeApplied && !overCap) multiplyPelle(2);
    if (PelleDestructionUpgrade.destroyedGlyphEffects.canBeApplied) {
      multiplyPelle(getAdjustedGlyphEffect("replicationspeed"));
    }
    if (PelleCelestialUpgrade.raTeresa3.canBeApplied) {
      multiplyPelle(Decimal.clampMin(
        Decimal.log10(Replicanti.amount.add(1)).times(getSecondaryGlyphEffect("replicationdtgain")), 1));
    }
    if (PelleCelestialUpgrade.raV3.canBeApplied) {
      multiplyPelleEffect(Ra.unlocks.continuousTTBoost.effects.replicanti);
    }
    if (PelleAlchemyUpgrade.alchemyReplication.canBeApplied) multiplyPelleEffect(AlchemyResource.replication);
    multiply(pelleRep);
    return totalMult;
  }

  const preRealityEffects = Effects.productDecimal(
    Achievement(81),
    TimeStudy(62),
    TimeStudy(213),
  );
  multiply(preRealityEffects);
  multiplyEffect(RealityUpgrade(6));
  multiplyEffect(RealityUpgrade(23));
  multiplyEffect(RealityUpgrade(2));
  if (TimeStudy(132).isBought) {
    multiply((Perk.studyPassive.isBought && !player.disablePostReality) ? 3 : 1.5);
  }

  if (!overCap && Achievement(134).isUnlocked && !player.disablePostReality) {
    multiply(2);
  }
  multiply(getAdjustedGlyphEffect("replicationspeed"));
  if (GlyphAlteration.isAdded("replication")) {
    multiply(ReplicantiMultipliers.dtMult);
  }
  multiplyEffect(AlchemyResource.replication);
  multiplyEffect(Ra.unlocks.continuousTTBoost.effects.replicanti);

  if (LHC.voidRunning) multiplyEffect(NullUpgrade.replicantiSpeedMult);

  return totalMult;
}

export function replicantiCap() {
  if (!(EffarigUnlock.infinity.canBeApplied ||
      (Pelle.isDoomed && PelleCelestialUpgrade.replicantiCapIncrease.canBeApplied))) return DC.NUMMAX;
  const powered = boundedPositivePower(Currency.infinitiesTotal.value, TimeStudy(31).isBought ? 120 : 30).clampMin(1);
  return boundedPositiveProduct(powered, DC.NUMMAX);
}

// eslint-disable-next-line complexity
export function replicantiLoop(diff) {
  if (!player.replicanti.unl) return;
  const replicantiBeforeLoop = Replicanti.amount;
  PerformanceStats.start("Replicanti");
  EventHub.dispatch(GAME_EVENT.REPLICANTI_TICK_BEFORE);
  // This gets the pre-cap interval (above the cap we recalculate the interval).
  const interval = getReplicantiInterval(false);
  const isUncapped = Replicanti.isUncapped;
  const areRGsBeingBought = Replicanti.galaxies.areBeingBought;

  // Figure out how many ticks to calculate for and roll over any leftover time to the next tick. The rollover
  // calculation is skipped if there's more than 100 replicanti ticks per game tick to reduce round-off problems.
  let tickCount = Decimal.divide(new Decimal(diff).plus(player.replicanti.timer), interval);
  if (tickCount.lt(100)) player.replicanti.timer = tickCount.minus(tickCount.floor()).times(interval).toNumber();
  else player.replicanti.timer = 0;
  tickCount = tickCount.floor();

  const singleTickAvg = Replicanti.amount.times(player.replicanti.chance);
  // Note that code inside this conditional won't necessarily run every game tick; when game ticks are slower than
  // replicanti ticks, then tickCount will look like [0, 0, 0, 1, 0, 0, ...] on successive game ticks
  if (tickCount.gte(100) || (singleTickAvg.gte(10) && tickCount.gte(1))) {
    // Fast gain: If we're doing a very large number of ticks or each tick produces a lot, then continuous growth
    // every replicanti tick is a good approximation and less intensive than distribution samples. This path will
    // always happen above 1000 replicanti due to how singleTickAvg is calculated, so the over-cap math is only
    // present on this path
    let postScale = Math.log10(ReplicantiGrowth.scaleFactor) / ReplicantiGrowth.scaleLog10;
    if (V.isRunning) {
      postScale *= 2;
    }

    // Note that remainingGain is in log10 terms.
    let remainingGain = tickCount.times(Decimal.ln(player.replicanti.chance.add(1))).times(LOG10_E);
    // It is intended to be possible for both of the below conditionals to trigger.
    if (!isUncapped || Replicanti.amount.lte(replicantiCap())) {
      // Some of the gain is "used up" below e308, but if replicanti are uncapped
      // then some may be "left over" for increasing replicanti beyond their cap.
      remainingGain = fastReplicantiBelow308(remainingGain, areRGsBeingBought);
    }
    if (isUncapped && Replicanti.amount.gte(replicantiCap()) && remainingGain.gt(0)) {
      // Recalculate the interval (it may have increased due to additional replicanti, or,
      // far less importantly, decreased due to Reality Upgrade 6 and additional RG).
      // Don't worry here about the lack of e2000 scaling in Pelle on the first tick
      // (with replicanti still under e2000) causing a huge replicanti jump;
      // there's code later to stop replicanti from increasing by more than e308
      // in a single tick in Pelle.
      const intervalRatio = getReplicantiInterval(true).div(interval);
      remainingGain = remainingGain.div(intervalRatio);
      // Cardinality approaches a scale factor of 1 and rounds to exactly 1 at
      // extreme levels. lim[p->0] ln(1 + gain*p)/p = gain; dividing by p=0
      // would otherwise inject NaN into saved Replicanti and all dependent systems.
      const gain = remainingGain.div(LOG10_E);
      const scaledGain = postScale === 0
        ? gain
        : gain.times(postScale).add(1).ln().div(postScale);
      const totalLog = scaledGain.add(Replicanti.amount.clampMin(1).ln());
      // pow10 keeps the established finite Decimal boundary, rather than
      // allowing an unrepresentable exp() result into player state.
      Replicanti.amount = boundedPositivePower(10, totalLog.div(Math.LN10));
    }
  } else if (tickCount.gt(1)) {
    // Multiple ticks but "slow" gain: This happens at low replicanti chance and amount with a fast interval, which
    // can happen often in early cel7. In this case we "batch" ticks together as full doubling events and then draw
    // from a Poisson distribution for how many times to do that. Any leftover ticks are used as binomial samples
    const batchTicks = Decimal.floor(tickCount.times(Decimal.log2(player.replicanti.chance.add(1)))).toNumber();
    const binomialTicks = tickCount.toNumber() - batchTicks / Decimal.log2(player.replicanti.chance.add(1)).toNumber();

    Replicanti.amount = Replicanti.amount.times(DC.D2.pow(poissonDistribution(batchTicks)));
    for (let t = 0; t < Math.floor(binomialTicks); t++) {
      const reproduced = binomialDistribution(Replicanti.amount, player.replicanti.chance.toNumber());
      Replicanti.amount = Replicanti.amount.plus(reproduced);
    }

    // The batching might use partial ticks; we add the rest back to the timer so it gets used next loop
    const leftover = binomialTicks - Math.floor(binomialTicks);
    player.replicanti.timer += interval.times(leftover).toNumber();
  } else if (tickCount.eq(1)) {
    // Single tick: Take a single binomial sample to properly simulate replicanti growth with randomness
    const reproduced = binomialDistribution(Replicanti.amount, player.replicanti.chance.toNumber());
    Replicanti.amount = Replicanti.amount.plus(reproduced);
  }

  if (!isUncapped) Replicanti.amount = Decimal.min(replicantiCap(), Replicanti.amount);

  if (Pelle.isDoomed && boundedPositiveSum(Replicanti.amount, 1).log10()
    .sub(replicantiBeforeLoop.clampMin(1).log10()).gt(308)) {
    Replicanti.amount = boundedPositiveProduct(replicantiBeforeLoop, 1e308);
  }

  if (Replicanti.amount.lt(DC.E9E15)) Replicanti.amount = Decimal.min(DC.E9E15, Replicanti.amount);

  if (areRGsBeingBought && Replicanti.amount.gte(DC.NUMMAX)) {
    const buyer = Autobuyer.replicantiGalaxy;
    const isAuto = buyer.canTick && buyer.isEnabled;
    // There might be a manual and auto tick simultaneously; pass auto === true iff the autobuyer is ticking and
    // we aren't attempting to manually buy RG, because this controls modals appearing or not
    replicantiGalaxy(isAuto && !Replicanti.galaxies.isPlayerHoldingR);
  }
  player.records.thisReality.maxReplicanti = player.records.thisReality.maxReplicanti
    .clampMin(Replicanti.amount);
  EventHub.dispatch(GAME_EVENT.REPLICANTI_TICK_AFTER);
  PerformanceStats.end();
}

export function replicantiMult() {
  return Decimal.pow(Decimal.log2(Replicanti.amount.clampMin(1)), 2)
    .plusEffectOf(TimeStudy(21))
    .timesEffectOf(TimeStudy(102))
    .clampMin(1)
    .pow(getAdjustedGlyphEffect("replicationpow"));
}

/** @abstract */
class ReplicantiUpgradeState {
  /** @abstract */
  get id() { throw new NotImplementedError(); }
  /** @abstract */
  get value() { throw new NotImplementedError(); }

  /** @abstract */
  set value(value) { throw new NotImplementedError(); }

  /** @abstract */
  get nextValue() { throw new NotImplementedError(); }

  /** @abstract */
  get rawValue() { throw new NotImplementedError(); }

  /** @abstract */
  get cost() { throw new NotImplementedError(); }
  /** @abstract */
  set cost(value) { throw new Error("Use baseCost to set cost"); }

  /** @abstract */
  get costIncrease() { throw new NotImplementedError(); }

  /** @abstract */
  get costThreshold() { throw new NotImplementedError(); }

  /** @abstract */
  get costExponent() { throw new NotImplementedError(); }

  get baseCost() { return this.cost; }
  /** @abstract */
  set baseCost(value) { throw new NotImplementedError(); }

  get cap() { return undefined; }
  get isCapped() { return false; }

  /** @abstract */
  get autobuyerMilestone() { throw new NotImplementedError(); }

  get canBeBought() {
    return !this.isCapped && Currency.infinityPoints.gte(this.cost) && player.eterc8repl !== 0;
  }

  purchase() {
    if (!this.canBeBought) return;
    Currency.infinityPoints.subtract(this.cost);
    if (this.rawValue.gte(this.costThreshold)) {
      const scaledCount = this.rawValue.sub(this.costThreshold);
      const currentExponent = boundedPositivePower(this.costExponent, scaledCount);
      const nextExponent = boundedPositivePower(this.costExponent, boundedPositiveSum(scaledCount, 1));
      const exponent = boundedPositiveProduct(currentExponent, nextExponent);
      this.baseCost = boundedPositiveProduct(this.baseCost,
        boundedPositivePower(this.costIncrease, exponent));
    } else {
      this.baseCost = boundedPositiveProduct(this.baseCost, this.costIncrease);
    }
    this.value = this.nextValue;
    if (EternityChallenge(8).isRunning) player.eterc8repl--;
    GameUI.update();
  }

  autobuyerTick() {
    while (this.canBeBought) {
      this.purchase();
    }
  }
}

export const ReplicantiUpgrade = {
  chance: new class ReplicantiChanceUpgrade extends ReplicantiUpgradeState {
    get id() { return 1; }

    get value() { return player.replicanti.chance; }
    set value(value) { player.replicanti.chance = value; }

    get nextValue() {
      return this.decimalNearestPercent(this.value.add(0.01));
    }

    get rawValue() {
      return this.value.times(100);
    }

    get cost() {
      return player.replicanti.chanceCost.dividedByEffectOf(PelleRifts.vacuum.milestones[1]);
    }

    get baseCost() { return player.replicanti.chanceCost; }
    set baseCost(value) { player.replicanti.chanceCost = value; }

    get costIncrease() { return 1e15; }

    get costThreshold() { return 100; }

    get costExponent() { return 1.0002; }

    get cap() {
      if (Alpha.isDestroyed) return DC.BEMAX;
      // Chance never goes over 100%.
      return DC.D1;
    }

    get isCapped() {
      return this.decimalNearestPercent(this.value).gte(this.cap);
    }

    get autobuyerMilestone() {
      return EternityMilestone.autobuyerReplicantiChance;
    }

    autobuyerTick() {
      // Fixed price increase of 1e15. Keep the affordability estimate and all
      // geometric-cost terms inside the finite Decimal domain.
      let affordableRatio = boundedPositiveProduct(Currency.infinityPoints.value, this.costIncrease - 1);
      affordableRatio = boundedPositiveQuotient(affordableRatio, this.cost);
      affordableRatio = boundedPositiveSum(affordableRatio, 1);
      let N = affordableRatio.log(this.costIncrease);
      N = Decimal.round((Decimal.min(Decimal.floor(N).times(0.01)
        .add(this.value.min(this.costThreshold / 100)), this.costThreshold / 100)
        .sub(this.value.min(this.costThreshold / 100))).times(100));

      const preThresholdPower = boundedPositivePower(this.costIncrease,
        this.rawValue.min(this.costThreshold).sub(1).max(0));
      const seriesPower = boundedPositivePower(this.costIncrease, N);
      const seriesFactor = boundedPositiveQuotient(seriesPower.sub(1).max(0), this.costIncrease - 1).max(1);
      let totalCost = boundedPositiveProduct(
        boundedPositiveProduct(DC.E150, preThresholdPower), seriesFactor);

      let threshold = boundedPositiveProduct(DC.E150,
        boundedPositivePower(this.costIncrease, this.costThreshold - 2));
      PelleRifts.vacuum.milestones[1].applyEffect(effect => {
        threshold = boundedPositiveQuotient(threshold, effect);
      });
      const aboveThreshold = this.cost.gt(threshold) && Alpha.isDestroyed;
      const affordableAboveThreshold = Decimal.floor(
        boundedPositiveQuotient(Currency.infinityPoints.value, threshold).max(1e15)
          .log(this.costIncrease).log(this.costExponent).add(1));
      if (aboveThreshold) {
        N = N.add(affordableAboveThreshold.add(1).sub(this.value.times(100).sub(this.costThreshold - 1)));
        totalCost = boundedPositiveProduct(threshold,
          boundedPositivePower(this.costIncrease,
            boundedPositivePower(this.costExponent, affordableAboveThreshold)));
      }
      if (!isFiniteDecimal(N) || N.lte(0)) return;
      Currency.infinityPoints.subtract(totalCost);

      let costGain = boundedPositiveProduct(DC.E150,
        boundedPositivePower(this.costIncrease,
          boundedPositiveSum(this.rawValue, N).min(this.costThreshold).sub(1).max(0)));
      if (aboveThreshold) {
        costGain = boundedPositiveProduct(costGain,
          boundedPositivePower(this.costIncrease,
            boundedPositivePower(this.costExponent, affordableAboveThreshold)));
      }
      this.baseCost = costGain;
      this.value = this.decimalNearestPercent(
        boundedPositiveSum(N.times(0.01), this.value)).min(this.cap);
    }

    // Rounding errors suck
    nearestPercent(x) {
      return Math.round(100 * x) / 100;
    }
    decimalNearestPercent(x) {
      return Decimal.round(x.times(100)).div(100);
    }
  }(),
  interval: new class ReplicantiIntervalUpgrade extends ReplicantiUpgradeState {
    get id() { return 2; }

    get value() { return player.replicanti.interval; }
    set value(value) { player.replicanti.interval = value; }

    get nextValue() {
      return Decimal.max(this.value.times(0.9), this.cap);
    }

    get rawValue() {
      return Decimal.round(DC.E3.div(this.value).log(1 / 0.9).add(0.1));
    }

    get cost() {
      return player.replicanti.intervalCost.dividedByEffectOf(PelleRifts.vacuum.milestones[1]);
    }

    get baseCost() { return player.replicanti.intervalCost; }
    set baseCost(value) { player.replicanti.intervalCost = value; }

    get costIncrease() { return 1e10; }

    get costThreshold() { return Math.ceil(Decimal.log(1000 / Effects.min(50, TimeStudy(22)), 1 / 0.9).toNumber()); }

    get costExponent() { return 1.0002; }

    get cap() {
      if (Alpha.isDestroyed) return DC.D1.div(DC.BEMAX);
      return new Decimal(Effects.min(50, TimeStudy(22)));
    }

    get isCapped() {
      return this.value.lte(this.cap);
    }

    get autobuyerMilestone() {
      return EternityMilestone.autobuyerReplicantiInterval;
    }

    autobuyerTick() {
      // Fixed price increase of 1e10. Use bounded arithmetic so a BEMAX IP
      // balance cannot turn the inverse estimate into Infinity/NaN after Reality.
      let affordableRatio = boundedPositiveProduct(Currency.infinityPoints.value, this.costIncrease - 1);
      affordableRatio = boundedPositiveQuotient(affordableRatio, this.cost);
      affordableRatio = boundedPositiveSum(affordableRatio, 1);
      let N = affordableRatio.log(this.costIncrease);
      N = Decimal.round(Decimal.min(Decimal.floor(N).add(this.rawValue.min(this.costThreshold)),
        this.costThreshold).sub(this.rawValue.min(this.costThreshold)));

      const preThresholdPower = boundedPositivePower(this.costIncrease,
        this.rawValue.min(this.costThreshold));
      const seriesPower = boundedPositivePower(this.costIncrease, N);
      const seriesFactor = boundedPositiveQuotient(seriesPower.sub(1).max(0), this.costIncrease - 1).max(1);
      let totalCost = boundedPositiveProduct(
        boundedPositiveProduct(DC.E140, preThresholdPower), seriesFactor);

      let threshold = boundedPositiveProduct(DC.E140,
        boundedPositivePower(this.costIncrease, this.costThreshold - 1));
      PelleRifts.vacuum.milestones[1].applyEffect(effect => {
        threshold = boundedPositiveQuotient(threshold, effect);
      });
      const aboveThreshold = this.cost.gt(threshold) && Alpha.isDestroyed;
      const affordableAboveThreshold = Decimal.floor(
        boundedPositiveQuotient(Currency.infinityPoints.value, threshold).max(1e10)
          .log(this.costIncrease).log(this.costExponent).add(1));
      if (aboveThreshold) {
        N = N.add(affordableAboveThreshold.add(1).sub(this.rawValue.sub(this.costThreshold)));
        totalCost = boundedPositiveProduct(threshold,
          boundedPositivePower(this.costIncrease,
            boundedPositivePower(this.costExponent, affordableAboveThreshold)));
      }
      if (!isFiniteDecimal(N) || N.lte(0)) return;
      Currency.infinityPoints.subtract(totalCost);

      let costGain = boundedPositiveProduct(DC.E140,
        boundedPositivePower(this.costIncrease,
          boundedPositiveSum(this.rawValue, N).min(this.costThreshold)));
      if (aboveThreshold) {
        costGain = boundedPositiveProduct(costGain,
          boundedPositivePower(this.costIncrease,
            boundedPositivePower(this.costExponent, affordableAboveThreshold)));
      }
      this.baseCost = costGain;
      this.value = boundedPositiveProduct(this.value, boundedPositivePower(0.9, N));
    }

    applyModifiers(value) {
      return getReplicantiInterval(undefined, value);
    }
  }(),
  galaxies: new class ReplicantiGalaxiesUpgrade extends ReplicantiUpgradeState {
    get id() { return 3; }

    get value() { return player.replicanti.boughtGalaxyCap; }
    set value(value) { player.replicanti.boughtGalaxyCap = new Decimal(value); }

    get nextValue() {
      return this.value.add(1);
    }

    get rawValue() {
      return this.value;
    }

    get cost() {
      return this.baseCost.dividedByEffectsOf(TimeStudy(233), PelleRifts.vacuum.milestones[1]);
    }

    get baseCost() { return player.replicanti.galCost; }
    set baseCost(value) { player.replicanti.galCost = value; }

    get distantRGStart() {
      return boundedPositiveProduct(
        boundedPositiveSum(100, GlyphSacrifice.replication.effectValue),
        Effects.productDecimal(BreakEternityUpgrade.replicantiGalaxyPower));
    }

    get remoteRGStart() {
      return boundedPositiveProduct(
        boundedPositiveSum(1000, GlyphSacrifice.replication.effectValue),
        Effects.productDecimal(BreakEternityUpgrade.replicantiGalaxyPower));
    }

    get contingentRGStart() {
      return 1000000;
    }

    get costIncrease() {
      const galaxies = boundedPositiveValue(this.value, "Replicanti Galaxy count");
      let increase = EternityChallenge(6).isRunning
        ? boundedPositiveProduct(boundedPositivePower(2, galaxies), 2)
        : boundedPositiveProduct(boundedPositivePower(5, galaxies), 25);
      if (galaxies.gte(this.distantRGStart)) {
        increase = boundedPositiveProduct(increase,
          boundedPositivePower(50, boundedPositiveSum(galaxies.sub(this.distantRGStart), 5)));
      }
      if (galaxies.gte(this.remoteRGStart)) {
        const remoteCount = boundedPositiveSum(galaxies.sub(this.remoteRGStart), 1);
        increase = boundedPositiveProduct(increase,
          boundedPositivePower(5, boundedPositivePower(remoteCount, 2)));
      }
      if (galaxies.gte(this.contingentRGStart)) {
        const contingentPower = boundedPositivePower(1.0002, galaxies.sub(this.contingentRGStart));
        increase = boundedPositivePower(increase, contingentPower);
      }
      return increase;
    }

    get costThreshold() { return Infinity; }

    get costExponent() { return 1; }

    get autobuyerMilestone() {
      return EternityMilestone.autobuyerReplicantiMaxGalaxies;
    }

    get extra() {
      return TimeStudy(131).effectOrDefault(DC.D0).add(PelleRifts.decay.milestones[2].effectOrDefault(0));
    }

    bulkPurchaseCalc() {
      // Copypasted constants
      const logBase = new Decimal(170);
      const logBaseIncrease = EternityChallenge(6).isRunning ? DC.D2 : new Decimal(25);
      const logCostScaling = EternityChallenge(6).isRunning ? DC.D2 : DC.D5;
      // Reuse the bounded gameplay thresholds instead of reproducing them with raw
      // add/times chains; at extreme sacrifice values those duplicate formulas can overflow.
      const distantReplicatedGalaxyStart = this.distantRGStart;
      const remoteReplicatedGalaxyStart = this.remoteRGStart;
      const contingentReplicatedGalaxyStart = DC.E6;
      const logDistantScaling = new Decimal(50);
      const logRemoteScaling = DC.D5;
      const extraIncrements = DC.D5;
      const contingentScalingFactor = 1.0002;

      let availableIP = boundedPositiveProduct(
        Currency.infinityPoints.value, TimeStudy(233).effectOrDefault(1));
      PelleRifts.vacuum.milestones[1].applyEffect(effect => {
        availableIP = boundedPositiveProduct(availableIP, effect);
      });
      const cur = availableIP.max(1).log10();

      if (logBase.gt(cur)) return;
      let a = logCostScaling.div(2);
      let b = logBaseIncrease.sub(logCostScaling.div(2));
      let c = logBase.sub(cur);
      if (decimalQuadraticSolution(a, b, c).floor().lte(distantReplicatedGalaxyStart)) {
        // eslint-disable-next-line consistent-return
        return decimalQuadraticSolution(a, b, c).floor().add(1);
      }
      a = logCostScaling.add(logDistantScaling).div(2);
      // eslint-disable-next-line max-len
      b = logBaseIncrease.sub(logCostScaling.div(2)).sub(logDistantScaling.times(distantReplicatedGalaxyStart)).add(logDistantScaling.times(4.5));
      // eslint-disable-next-line max-len
      c = cur.neg().add(170).add(distantReplicatedGalaxyStart.pow(2).times(logDistantScaling).div(2)).sub(distantReplicatedGalaxyStart.times(4.5).times(logDistantScaling));
      if (decimalQuadraticSolution(a, b, c).floor().lte(remoteReplicatedGalaxyStart)) {
        // eslint-disable-next-line consistent-return
        return decimalQuadraticSolution(a, b, c).floor().add(1);
      }
      a = logRemoteScaling.div(3);

      b = logCostScaling.add(logDistantScaling).div(2).sub(logRemoteScaling.mul(remoteReplicatedGalaxyStart))
        .add(logRemoteScaling.div(2));

      c = logBaseIncrease.sub(logCostScaling.div(2)).sub(distantReplicatedGalaxyStart.times(logDistantScaling))
        .add(logDistantScaling.times(4.5)).add(remoteReplicatedGalaxyStart.pow(2).mul(logRemoteScaling))
        .sub(remoteReplicatedGalaxyStart.mul(logRemoteScaling));

      const d = cur.neg().add(170).add(distantReplicatedGalaxyStart.pow(2).mul(logDistantScaling).div(2))
        .sub(distantReplicatedGalaxyStart.mul(4.5).mul(logDistantScaling))
        .sub(remoteReplicatedGalaxyStart.pow(3).mul(logRemoteScaling).div(3))
        .add(remoteReplicatedGalaxyStart.pow(2).mul(logRemoteScaling).div(2))
        .sub(remoteReplicatedGalaxyStart.mul(logRemoteScaling).div(6));

      if (decimalCubicSolutionX(a, b, c, d).floor().lte(contingentReplicatedGalaxyStart)) {
        // eslint-disable-next-line consistent-return
        return decimalCubicSolutionX(a, b, c, d).floor().add(1);
      }

      const numDistant = contingentReplicatedGalaxyStart.sub(distantReplicatedGalaxyStart).max(0);
      const numRemote = contingentReplicatedGalaxyStart.sub(remoteReplicatedGalaxyStart).max(0);
      const logCostAtContingent = logBase.add(contingentReplicatedGalaxyStart.times(logBaseIncrease)).add(
        (contingentReplicatedGalaxyStart.times(contingentReplicatedGalaxyStart.sub(1)).div(2)).times(logCostScaling)).add(
        logDistantScaling.times(numDistant).times(numDistant.add(extraIncrements.times(2)).sub(1)).div(2)).add(
        logRemoteScaling.times(numRemote).times(numRemote.add(1)).times(numRemote.times(2).add(1)).div(6));
      const adjustedCostLog = count => {
        let cost = this.baseCostAfterCount(count);
        TimeStudy(233).applyEffect(effect => {
          cost = boundedPositiveQuotient(cost, effect);
        });
        PelleRifts.vacuum.milestones[1].applyEffect(effect => {
          cost = boundedPositiveQuotient(cost, effect);
        });
        return cost.max(1).log10();
      };
      const onePurchaseFallback = () => (this.canBeBought ? this.value.add(1) : undefined);

      const initialRatio = boundedPositiveQuotient(cur.max(1), logCostAtContingent.max(1)).max(1);
      let simpleEstimate = new Decimal(Decimal.log(initialRatio, contingentScalingFactor))
        .add(contingentReplicatedGalaxyStart);
      if (!isFiniteDecimal(simpleEstimate)) {
        console.warn("Replicanti Galaxy bulk inverse produced a non-finite initial estimate; buying one safely");
        return onePurchaseFallback();
      }

      let estimatedCost = adjustedCostLog(simpleEstimate);
      let n = 0;
      while (n < 25 && (cur.gte(adjustedCostLog(simpleEstimate.add(1))) || cur.lt(estimatedCost))) {
        const correctionRatio = boundedPositiveQuotient(cur.max(minimumPositiveDecimal()),
          estimatedCost.max(minimumPositiveDecimal()));
        const correction = new Decimal(Decimal.log(correctionRatio.max(minimumPositiveDecimal()),
          contingentScalingFactor));
        if (!isFiniteDecimal(correction)) {
          console.warn("Replicanti Galaxy bulk inverse correction became non-finite; buying one safely");
          return onePurchaseFallback();
        }
        simpleEstimate = simpleEstimate.add(correction);
        if (!isFiniteDecimal(simpleEstimate) || simpleEstimate.lt(0)) return onePurchaseFallback();
        estimatedCost = adjustedCostLog(simpleEstimate);
        n++;
      }

      let x = 0;
      if (cur.gte(estimatedCost) && cur.lt(adjustedCostLog(simpleEstimate.add(1)))) return simpleEstimate.add(1);
      if (cur.lt(estimatedCost)) {
        while (x < 50 && cur.lt(estimatedCost)) {
          simpleEstimate = simpleEstimate.sub(1);
          if (simpleEstimate.lt(0)) return onePurchaseFallback();
          estimatedCost = adjustedCostLog(simpleEstimate);
          x++;
        }
        return simpleEstimate.add(1);
      }
      if (cur.gte(adjustedCostLog(simpleEstimate.add(1)))) {
        while (x < 50 && cur.gte(adjustedCostLog(simpleEstimate.add(1)))) {
          simpleEstimate = simpleEstimate.add(1);
          if (!isFiniteDecimal(simpleEstimate)) return onePurchaseFallback();
          estimatedCost = adjustedCostLog(simpleEstimate);
          x++;
        }
        return simpleEstimate.add(1);
      }

      console.warn("Replicanti Galaxy bulk inverse did not converge; buying one safely");
      return onePurchaseFallback();
    }

    autobuyerTick() {
      // This isn't a hot enough autobuyer to worry about doing an actual inverse.
      const bulk = this.bulkPurchaseCalc();
      if (!bulk || bulk.floor().sub(this.value).lte(0)) return;
      Currency.infinityPoints.subtract(this.baseCostAfterCount(this.value).sub(1));
      this.value = this.value.add(bulk.sub(this.value));
      this.baseCost = this.baseCostAfterCount(this.value);
    }

    baseCostAfterCount(countNum) {
      const count = boundedPositiveValue(countNum, "Replicanti Galaxy purchase count");
      const logBase = 170;
      const logBaseIncrease = EternityChallenge(6).isRunning ? 2 : 25;
      const logCostScaling = EternityChallenge(6).isRunning ? 2 : 5;
      const distantReplicatedGalaxyStart = this.distantRGStart;
      const remoteReplicatedGalaxyStart = this.remoteRGStart;
      const contingentReplicatedGalaxyStart = 1000000;

      let logCost = new Decimal(logBase);
      logCost = boundedPositiveSum(logCost, boundedPositiveProduct(count, logBaseIncrease));
      const triangular = boundedPositiveQuotient(
        boundedPositiveProduct(count, count.sub(1).max(0)), 2);
      logCost = boundedPositiveSum(logCost, boundedPositiveProduct(triangular, logCostScaling));

      if (count.gt(distantReplicatedGalaxyStart)) {
        const logDistantScaling = 50;
        // When distant scaling kicks in, the price increase jumps by a few extra steps.
        // So, the difference between successive scales goes 5, 5, 5, 255, 55, 55, ...
        const extraIncrements = 5;
        const numDistant = count.sub(distantReplicatedGalaxyStart);
        const distantSeries = boundedPositiveQuotient(
          boundedPositiveProduct(numDistant,
            boundedPositiveSum(numDistant, 2 * extraIncrements - 1)), 2);
        logCost = boundedPositiveSum(logCost,
          boundedPositiveProduct(logDistantScaling, distantSeries));
      }

      if (count.gt(remoteReplicatedGalaxyStart)) {
        const logRemoteScaling = 5;
        const numRemote = count.sub(remoteReplicatedGalaxyStart);
        // x(x+1)(2x+1)/6, evaluated with bounded factors so an intermediate
        // product cannot poison the final exponent with NaN/Infinity.
        let remoteSeries = boundedPositiveProduct(numRemote, boundedPositiveSum(numRemote, 1));
        remoteSeries = boundedPositiveProduct(remoteSeries,
          boundedPositiveSum(boundedPositiveProduct(numRemote, 2), 1));
        remoteSeries = boundedPositiveQuotient(remoteSeries, 6);
        logCost = boundedPositiveSum(logCost,
          boundedPositiveProduct(logRemoteScaling, remoteSeries));
      }

      if (count.gt(contingentReplicatedGalaxyStart)) {
        const numContingent = count.sub(contingentReplicatedGalaxyStart);
        const contingentScale = boundedPositivePower(1.0002, numContingent);
        logCost = boundedPositiveProduct(logCost, contingentScale);
      }

      return boundedPositivePower(10, logCost);
    }
  }(),
};

export const Replicanti = {
  get areUnlocked() {
    return player.replicanti.unl;
  },
  reset(force = false) {
    const unlocked = force && !(LHC.voidRunning && NullUpgrade.repUnl.isBought) ? false : EternityMilestone.unlockReplicanti.isReached;
    player.replicanti = {
      unl: unlocked,
      amount: unlocked ? DC.D1 : DC.D0,
      timer: 0,
      chance: DC.D1.div(100),
      chanceCost: DC.E150,
      interval: DC.E3,
      intervalCost: DC.E140,
      boughtGalaxyCap: DC.D0,
      galaxies: DC.D0,
      galCost: DC.E170,
    };
  },
  unlock(freeUnlock = false) {
    if (Alpha.isRunning && Alpha.currentStage < 9) return;
    const cost = DC.E140.dividedByEffectOf(PelleRifts.vacuum.milestones[1]);
    if (player.replicanti.unl) return;
    if (freeUnlock || Currency.infinityPoints.gte(cost)) {
      if (!freeUnlock) Currency.infinityPoints.subtract(cost);
      player.replicanti.unl = true;
      player.replicanti.timer = 0;
      Replicanti.amount = DC.D1;
    }
    if (Alpha.isRunning && Alpha.currentStage === 9) {
      Alpha.advanceLayer();
      Alpha.quotes.replicanti.show();
    }
  },
  get amount() {
    return player.replicanti.amount;
  },
  set amount(value) {
    player.replicanti.amount = value;
  },
  get chance() {
    return ReplicantiUpgrade.chance.value;
  },
  galaxies: {
    isPlayerHoldingR: false,
    get multiplication() {
      return new Decimal(GalacticPowers.replicantiGalaxies.isUnlocked ?
        GalacticPowers.replicantiGalaxies.reward : 1);
    },
    get bought() {
      return player.replicanti.galaxies;
    },
    get extra() {
      // The Galactic Power reward can exceed Number.MAX_VALUE. Keep it as
      // Decimal and avoid evaluating (Infinity - 1) in JS arithmetic.
      const multiplier = this.multiplication;
      const studyBonus = new Decimal().plusEffectsOf(TimeStudy(225), TimeStudy(226)).add(Effarig.bonusRG);
      const scaledBonus = boundedPositiveProduct(
        boundedPositiveProduct(studyBonus, TimeStudy(303).effectOrDefault(1)), multiplier);
      const boughtBonus = boundedPositiveProduct(this.bought, multiplier.sub(1).max(0));
      return Decimal.floor(boundedPositiveSum(scaledBonus, boughtBonus));
    },
    get total() {
      return boundedPositiveSum(this.bought, this.extra);
    },
    get max() {
      return ReplicantiUpgrade.galaxies.value.add(ReplicantiUpgrade.galaxies.extra);
    },
    get canBuyMore() {
      if (!Replicanti.amount.gte(DC.NUMMAX)) return false;
      return this.bought.lt(this.max);
    },
    get areBeingBought() {
      const buyer = Autobuyer.replicantiGalaxy;
      // If the confirmation is enabled, we presume the player wants to confirm each Replicanti Galaxy purchase
      return (buyer.canTick && buyer.isEnabled) ||
        (!player.options.confirmations.replicantiGalaxy && this.isPlayerHoldingR);
    },
    get gain() {
      if (!this.canBuyMore) return DC.D0;
      if (Achievement(126).isUnlocked) {
        const maxGain = Replicanti.galaxies.max.sub(player.replicanti.galaxies);
        const logReplicanti = Replicanti.amount.add(1).log10();
        return Decimal.min(maxGain, Decimal.floor(logReplicanti.div(LOG10_MAX_VALUE)));
      }
      return DC.D1;
    },
  },
  get isUncapped() {
    return TimeStudy(192).isBought || PelleRifts.vacuum.milestones[1].canBeApplied;
  }
};
