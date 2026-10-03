import { boundedPositiveValue, boundedPositiveSum, finiteNumber } from "../finite-decimal";

// Run after defaults and Decimal migration. Repair representational limits and
// conflicting modes without replacing progress or unknown save fields.
export function normalizeChapter3Save(save) {
  const count = (value, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Math.max(min, Math.floor(finiteNumber(value, min, max)));
  const slab = save.celestials.slabdrill;
  slab.stage = count(slab.stage, 0, 11);
  slab.core.chaosCores = count(slab.core.chaosCores);
  slab.core.lastFound = Math.max(0, finiteNumber(slab.core.lastFound, 0, Date.now()));
  slab.serpentinePower = boundedPositiveValue(slab.serpentinePower);
  if (slab.isDestroyed) slab.isCursed = false;
  if (!slab.isCursed) slab.core.isActive = false;

  const compression = save.compression;
  for (const key of ["hawkingRadiation", "thermalRadiation", "nextThreshold",
    "baseElectromagneticWaves", "totalElectromagneticWaves"]) {
    compression[key] = boundedPositiveValue(compression[key]);
  }
  for (const id of [1, 2, 3]) compression.rebuyables[id] = count(compression.rebuyables[id], 0,
    id === 2 ? 250 : Number.MAX_SAFE_INTEGER);
  const universes = save.universes;
  for (const key of ["highestTransientAntimatter", "relativisticParticles", "ephemeralLight",
    "highestTangibleMatter", "molecularMass", "stellarAugmenters"]) {
    universes[key] = boundedPositiveValue(universes[key]);
  }
  if (![1, 2].includes(universes.current)) universes.current = 0;
  const endgame = save.endgame;
  endgame.ascension = count(endgame.ascension, 0, 9);
  endgame.ascensionTimer = Math.max(0, finiteNumber(endgame.ascensionTimer));
  const overcharge = endgame.overcharge;
  overcharge.level = count(overcharge.level, 1, Math.max(1, Math.min(4, endgame.ascension - 5)));
  for (const [key, cap] of [["bi", 9], ["eter", 6], ["chall", 32], ["ts", 62]]) {
    overcharge.completions[key] = count(overcharge.completions[key], 0, cap);
  }
  const collider = endgame.largeHadronCollider;
  collider.powerCores = count(collider.powerCores, 1);
  for (const accelerator of Object.values(collider.accelerators)) {
    accelerator.fill = Math.max(0, finiteNumber(accelerator.fill, 0, 1));
  }
  for (let row = 0; row < 3; row++) {
    if (!Array.isArray(save.endgameMasteries.preferredPaths[row])) save.endgameMasteries.preferredPaths[row] = [];
  }
  if (slab.isCursed || (slab.isDestroyed && !slab.hasBoughtNinthDimension)) {
    collider.void.isRunning = false;
    compression.active = false;
    universes.current = 0;
    overcharge.isRunning = false;
  } else if (collider.void.isRunning) {
    compression.active = false;
    universes.current = 0;
    overcharge.isRunning = false;
  } else if (universes.current !== 0) {
    compression.active = false;
    overcharge.isRunning = false;
  } else if (compression.active) overcharge.isRunning = false;
  // Older offline ticks could skip the quote which commits the transition.
  if (slab.isWarping && !slab.isCursed && slab.warpTick >= 3000) slab.warpTick = 2000;
  if (slab.isGoodbye && slab.isCursed && slab.stage === 10 && slab.goodbyeTick >= 2000) slab.goodbyeTick = 1000;
  const hadrons = save.celestials.laitela.hadrons;
  for (const [total, base] of [["trueTotal", "total"], ["totalLight", "light"],
    ["totalDark", "dark"], ["totalExotic", "exotic"]]) {
    hadrons[total] = boundedPositiveSum(hadrons[base], compression.totalElectromagneticWaves);
  }
}
