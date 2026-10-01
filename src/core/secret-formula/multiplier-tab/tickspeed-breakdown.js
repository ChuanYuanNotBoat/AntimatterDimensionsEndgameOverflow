import {
  addOrderedFinalImpacts,
  addOrderedTraceMismatch,
  addOrderedTransform,
  createOrderedTransformCache,
} from "./ordered-breakdown";
import { boundedPositivePower, boundedPositiveProduct } from "../../finite-decimal";
import { MultiplierTabHelper } from "./helper-functions";

const MIN_TICKSPEED_INTERVAL = () => new Decimal(DC.BEMAX).recip();

function clampTickspeedInterval(value) {
  const interval = new Decimal(value);
  if ([interval.sign, interval.layer, interval.mag].some(Number.isNaN)) return new Decimal(DC.BEMAX);
  if (![interval.sign, interval.layer, interval.mag].every(Number.isFinite)) {
    return interval.sign > 0 ? new Decimal(DC.BEMAX) : MIN_TICKSPEED_INTERVAL();
  }
  return Decimal.clamp(interval, MIN_TICKSPEED_INTERVAL(), DC.BEMAX);
}

function boundedEffectProduct(initial, sources) {
  let result = new Decimal(initial);
  for (const source of sources) {
    if (!source) continue;
    // The callback is synchronous and deliberately folds each effect into the product.
    // eslint-disable-next-line no-loop-func
    source.applyEffect(effect => {
      result = boundedPositiveProduct(result, effect);
    });
  }
  return result;
}

function rateFromInterval(interval) {
  return boundedPositiveProduct(DC.E3, clampTickspeedInterval(interval).recip());
}

// A diagnostic reproduction of Tickspeed.baseValue/current, in src/core/tickspeed.js.
// Only the statistics tool calls the optional galaxy-count argument to the game function.
// It is important to operate on the *interval* and only invert at display time: galaxy
// strength is an exponent of the per-purchase interval, not a free-standing x multiplier.
function snapshot() {
  const galaxyDetails = {};
  const galaxyCount = effectiveBaseGalaxies(null, galaxyDetails);
  return {
    galaxyCount,
    galaxyDetails,
    noGalaxyMultiplier: getTickSpeedMultiplier(DC.D0),
    galaxyMultiplier: getTickSpeedMultiplier(galaxyCount),
    baseInterval: boundedEffectProduct(DC.E3,
      [Achievement(36), Achievement(45), Achievement(66), Achievement(83)]),
  };
}

function trace(skipKey = null, steps = null, inputs = snapshot(), producingTiers = null) {
  const { galaxyCount, noGalaxyMultiplier, galaxyMultiplier, baseInterval } = inputs;
  const boughtValue = Laitela.continuumActive ? Tickspeed.continuumValue : player.totalTickBought;
  const bought = skipKey === "purchased" || skipKey === "upgrades" ? DC.D0 : boughtValue;
  const free = skipKey === "free" || skipKey === "upgrades" ? DC.D0 : player.totalTickGained;
  const rawUpgrades = bought.add(free);
  const totalUpgrades = skipKey === "equalizer" ? rawUpgrades : CMilestones.tickspeedEqualizer(bought, free);
  let interval = clampTickspeedInterval(baseInterval);
  let rate = rateFromInterval(interval);

  function intervalStep(key, type, nextInterval, display = "", value = undefined) {
    if (skipKey === key) return;
    const safeInterval = clampTickspeedInterval(nextInterval);
    const nextRate = rateFromInterval(safeInterval);
    if (steps) addOrderedTransform(steps, key, type, rate, nextRate, {
      display: typeof display === "function" ? display() : display, value
    });
    interval = safeInterval;
    rate = nextRate;
  }

  if (steps) addOrderedTransform(steps, "base", "formula", DC.D1, rate, {
    display: "1000 ms / (1000 ms × active achievement effects)", alwaysShow: true
  });

  const rateBeforeUpgrades = rate;
  intervalStep("purchased", "multiply",
    boundedPositiveProduct(interval, boundedPositivePower(noGalaxyMultiplier, bought)),
    () => `${format(bought, 2, 2)} purchased or continuum upgrades; no-galaxy factor ${format(noGalaxyMultiplier, 2, 3)}`,
    boundedPositivePower(noGalaxyMultiplier.recip(), bought));
  intervalStep("free", "multiply",
    boundedPositiveProduct(interval, boundedPositivePower(noGalaxyMultiplier, free)),
    () => `${format(free, 2, 2)} free upgrades from Time Shards`,
    boundedPositivePower(noGalaxyMultiplier.recip(), free));
  intervalStep("equalizer", "formula",
    boundedPositiveProduct(baseInterval, boundedPositivePower(noGalaxyMultiplier, totalUpgrades)),
    () => `${format(rawUpgrades, 2, 2)} raw upgrades → ${format(totalUpgrades, 2, 2)} equalized upgrades`);
  if (steps) addOrderedTransform(steps, "upgrades", "multiply", rateBeforeUpgrades, rate, {
    display: `${Laitela.continuumActive ? "Continuum" : "Purchased"}: ${format(bought, 2, 2)}; ` +
      `free: ${format(free, 2, 2)}; total: ${format(totalUpgrades, 2, 2)}; ` +
      `per-upgrade interval without galaxies: ${format(noGalaxyMultiplier, 2, 3)}`,
    value: boundedPositivePower(noGalaxyMultiplier.recip(), totalUpgrades), alwaysShow: true
  });

  // Keep the current purchases when removing galaxies; galaxy strength changes the
  // multiplier applied by EVERY upgrade, not the number of upgrades.
  const currentGalaxyMultiplier = skipKey === "galaxies" ? noGalaxyMultiplier : galaxyMultiplier;
  intervalStep("galaxies", "multiply",
    boundedPositiveProduct(baseInterval, boundedPositivePower(currentGalaxyMultiplier, totalUpgrades)),
    () => `${format(galaxyCount, 2, 2)} effective galaxies; per-upgrade interval ${format(noGalaxyMultiplier, 2, 3)} → ${format(galaxyMultiplier, 2, 3)}`,
    boundedPositivePower(noGalaxyMultiplier.div(currentGalaxyMultiplier), totalUpgrades));

  let poweredMultiplier = boundedPositivePower(currentGalaxyMultiplier, totalUpgrades);
  Ra.unlocks.tickspeedPower.applyEffect(power => {
    poweredMultiplier = boundedPositivePower(poweredMultiplier, power);
  });
  intervalStep("raPower", "power", boundedPositiveProduct(baseInterval, poweredMultiplier),
    "Ra Tickspeed Power applies to the upgrade multiplier, not the base interval",
    Ra.unlocks.tickspeedPower.effectOrDefault(1));

  if (Effarig.isRunning && skipKey !== "effarig") {
    // Effarig overrides the powered base interval entirely. The dilation upgrade
    // does not apply during this branch of the gameplay getter.
    intervalStep("effarig", "override", Effarig.tickspeed);
  } else {
    let poweredInterval = interval;
    DilationUpgrade.tickspeedPower.applyEffect(power => {
      poweredInterval = boundedPositivePower(poweredInterval, power);
    });
    intervalStep("dilationPower", "power", poweredInterval, "",
      DilationUpgrade.tickspeedPower.effectOrDefault(1));
  }
  if (SlabdrillUnlocks.infinity.isUnlocked) {
    intervalStep("slabdrillInfinity", "power", boundedPositivePower(interval, 0.42), "Slabdrill Infinity unlock", 0.42);
  }
  if (SlabdrillUnlocks.replicanti.isUnlocked) {
    intervalStep("slabdrillReplicanti", "power", boundedPositivePower(interval, 0.42), "Slabdrill Replicanti unlock", 0.42);
  }
  if (player.dilation.active || (PelleStrikes.dilation.hasStrike && !PelleStrikes.dilation.isDestroyed())) {
    intervalStep("dilation", "formula", dilatedValueOf(interval));
  }
  if (player.compression.active) intervalStep("compression", "formula", compressedMultiplier(interval));
  if (player.endgame.overcharge.isRunning) {
    intervalStep("overcharge", "formula", dilateMultiplier(interval, Ascension.overchargePenalty));
  }
  const count = producingTiers ?? MultiplierTabHelper.activeDimCount("AD");
  const result = boundedPositivePower(rate, count);
  if (steps) addOrderedTransform(steps, "dimensionExponent", "power", rate, result, {
    value: count, display: `${count} producing AD tiers`, alwaysShow: true
  });
  return result;
}

function build() {
  const steps = {};
  const inputs = snapshot();
  const result = trace(null, steps, inputs);
  addOrderedFinalImpacts(steps, skip => trace(skip, null, inputs), result, ["base", "dimensionExponent"]);
  addOrderedTraceMismatch(steps, result,
    boundedPositivePower(Tickspeed.perSecond, MultiplierTabHelper.activeDimCount("AD")),
    "Gameplay Tickspeed differs from the diagnostic formula; inspect src/core/tickspeed.js");
  return steps;
}

const getTrace = createOrderedTransformCache(build, 150);
const sourceCache = createOrderedTransformCache(() => {
  const total = boundedPositivePower(Tickspeed.perSecond, MultiplierTabHelper.activeDimCount("AD"));
  const result = {};
  const inputs = snapshot();
  for (const key of ["antimatter", "generated", "replicanti", "tachyon", "galactic"]) {
    const source = inputs.galaxyDetails.sources.find(item => item.key === key);
    const omitted = effectiveBaseGalaxies(key);
    const without = { ...inputs, galaxyCount: omitted,
      galaxyMultiplier: getTickSpeedMultiplier(omitted) };
    const sourceWithout = trace(null, null, without);
    result[key] = {
      type: "multiply",
      before: sourceWithout,
      after: total,
      value: boundedPositivePower(10, total.clampMin(MIN_TICKSPEED_INTERVAL()).log10()
        .sub(sourceWithout.clampMin(MIN_TICKSPEED_INTERVAL()).log10())),
      // The count is a real source even when removing it rounds to the same
      // total beside a much larger Galaxy Generator. Do not use impact as a visibility gate.
      alwaysShow: source.raw.gt(0) || source.effective.gt(0),
      finalWith: total,
      finalWithout: sourceWithout,
      display: `${source.name}: raw ${format(source.raw, 2, 2)}, adjusted ${format(source.effective, 2, 2)}; count without source ${format(omitted, 2, 2)} → ${format(inputs.galaxyCount, 2, 2)}.`,
    };
  }
  return result;
}, 180);

// The ordinary Tickspeed page intentionally displays the product across producing AD tiers.
// Antimatter uses one AD1 rate; expose the very same interval trace with exponent 1.
const perDimensionTrace = createOrderedTransformCache(() => {
  const steps = {};
  const inputs = snapshot();
  const result = trace(null, steps, inputs, 1);
  addOrderedFinalImpacts(steps, skip => trace(skip, null, inputs, 1), result, ["base", "dimensionExponent"]);
  addOrderedTraceMismatch(steps, result, Tickspeed.perSecond,
    "One-rate Tickspeed diagnostic differs from the gameplay interval");
  return steps;
}, 150);

export const TickspeedBreakdown = {
  transform: key => getTrace(key),
  perDimensionTransform: key => perDimensionTrace(key),
  galaxySource: key => sourceCache(key),
};
