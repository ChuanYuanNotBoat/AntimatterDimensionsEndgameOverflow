import { t } from "../../../i18n";
import { boundedPositiveProduct } from "../../finite-decimal";
import { MultiplierTabIcons } from "./icons";
import { addOrderedTransform, addOrderedFinalImpacts, aggregateOrderedTransforms,
  createOrderedTransformCache } from "./ordered-breakdown";

const definitions = {
  CD: {
    dimension: tier => CelestialDimension(tier),
    unlocked: () => PlayerProgress.endgameUnlocked(),
    tierUnlocked: tier => CelestialDimension(tier).isUnlocked,
    producing: tier => CelestialDimension(tier).isProducing,
    evaluate: (tier, observer) => celestialDimensionMultiplier(tier, observer),
    groups: {
      common: ["endgame11", "celestialEternity", "mastery191", "ethereal"],
      purchase: ["purchaseBase", "purchaseBuff", "purchasePower"]
    },
    roots: ["slabMultiplier", "slabEthereal", "slabDisabled", "common", "purchase", "singularity", "ra",
      "alphaDecay", "dimboost", "antimatter", "synergy", "mastery302", "achievementConversion"]
  },
  DD: {
    dimension: tier => DivineDimension(tier),
    unlocked: () => DivinityMilestone.divineDimensions.isReached,
    // Divine dimensions have no per-tier unlock flags; all eight rows are available after the milestone.
    tierUnlocked: () => true,
    producing: tier => DivineDimension(tier).isProducing &&
      (!player.celestials.pelle.divinity.isProducingEnergy || DivinityUpgrade.divineL2U10.isBought ||
        (tier > 1 && DivinityUpgrade.divineL1U9.isBought)),
    evaluate: (tier, observer) => divineDimensionMultiplier(tier, observer),
    groups: {
      common: ["divineL1U3", "divineL1U6", "divineL2U1", "divineL2U9", "mastery192",
        "hadron", "accelerator", "stars", "starPower"],
      stars: ["starPower"],
      purchase: ["purchaseBase", "purchaseBuff"]
    },
    roots: ["common", "purchase", "pelleQoL", "emptiness", "divineL2U7", "divineL3U5", "divineL4U1",
      "divineL4U3", "divineL5U3", "mastery211", "singularity", "duality26", "mastery303",
      "finalRebirth", "achievementConversion"]
  }
};

function dimensionAnalysis(resource, definition) {
  const activeTiers = () => Array.from({ length: 8 }, (_, index) => index + 1)
    .filter(tier => definition.unlocked() && definition.tierUnlocked(tier) && definition.producing(tier));
  const evaluate = (tier, skip = null, steps = {}) => {
    const skipKeys = new Set(skip instanceof Set ? skip : skip ? [skip] : []);
    for (const key of [...skipKeys]) for (const child of definition.groups[key] ?? []) skipKeys.add(child);
    return definition.evaluate(tier, { steps, skip: skipKeys });
  };
  const caches = Array.from({ length: 9 }, (_, tier) => createOrderedTransformCache(() => {
    if (tier === 0 || !definition.unlocked() || !definition.tierUnlocked(tier)) return {};
    const raw = {};
    const final = evaluate(tier, null, raw);
    const steps = {};
    for (const [key, value] of Object.entries(raw)) addOrderedTransform(steps, key, value.type,
      value.before, value.after, { value: value.value, alwaysShow: key === "slabDisabled" });
    addOrderedFinalImpacts(steps, key => evaluate(tier, key), final, []);
    return steps;
  }));
  const aggregate = createOrderedTransformCache(() => {
    const traces = activeTiers().map(tier => ({ tier, trace: caches[tier]() }));
    const result = {};
    for (const key of new Set(traces.flatMap(item => Object.keys(item.trace)))) {
      const items = traces.map(item => ({ tier: item.tier, transform: item.trace[key] }));
      const direct = aggregateOrderedTransforms(items, resource, false);
      if (!direct) continue;
      direct.aggregateScope = t("analysis.expansion.scope", { resource, count: formatInt(traces.length) });
      let final;
      const finalImpact = () => (final ??= aggregateOrderedTransforms(items, resource, true));
      Object.defineProperties(direct, {
        finalWith: { enumerable: true, get: () => finalImpact().finalWith },
        finalWithout: { enumerable: true, get: () => finalImpact().finalWithout }
      });
      result[key] = direct;
    }
    return result;
  });
  const transform = (key, tier) => (tier ? caches[tier](key) : aggregate(key));
  const values = {
    total: {
      name: tier => {
        const name = t(`navigation.dimensions.${resource === "CD" ? "celestial" : "divine"}`);
        return tier ? t("analysis.expansion.dimensionTier", { resource: name, tier: formatInt(tier) })
          : t("analysis.expansion.dimensionOverall", { resource: name });
      },
      isActive: tier => definition.unlocked() && (!tier || definition.tierUnlocked(tier)),
      isOrdered: true,
      icon: tier => MultiplierTabIcons.DIMENSION(resource, tier),
      overlay: [MultiplierTabIcons.DIMENSION(resource).symbol],
      multValue: tier => tier ? definition.dimension(tier).multiplier : activeTiers()
        .reduce((mult, current) => boundedPositiveProduct(mult, definition.dimension(current).multiplier), DC.D1),
      transformValue: tier => ({ type: "formula", before: DC.D1,
        after: values.total.multValue(tier), alwaysShow: true }),
      displayOverride: tier => formatX(values.total.multValue(tier), 2, 2)
    }
  };
  const allKeys = new Set([...definition.roots, ...Object.values(definition.groups).flat()]);
  for (const key of allKeys) values[key] = {
    name: () => t(`analysis.expansion.${resource}.${key}`),
    isActive: tier => definition.unlocked() && (!tier || definition.tierUnlocked(tier)),
    isOrdered: true,
    transformValue: tier => transform(key, tier),
    icon: key.startsWith("slab") ? MultiplierTabIcons.SLABDRILL :
      key.startsWith("purchase") ? MultiplierTabIcons.PURCHASE(resource) : MultiplierTabIcons.DIMENSION(resource)
  };
  const tree = {};
  for (const tier of [null, 1, 2, 3, 4, 5, 6, 7, 8]) {
    const suffix = tier ? `_${tier}` : "";
    const roots = definition.roots.map(key => `${resource}_${key}${suffix}`);
    tree[`${resource}_total${suffix}`] = tier ? [roots, roots] :
      [roots, Array.from({ length: 8 }, (_, index) => `${resource}_total_${index + 1}`), roots];
    for (const [key, children] of Object.entries(definition.groups)) {
      // stars is already inside common; keep its derived power in the nested panel only.
      const leaves = key === "common" ? children.filter(child => child !== "starPower") : children;
      tree[`${resource}_${key}${suffix}`] = [leaves.map(child => `${resource}_${child}${suffix}`)];
    }
  }
  return { values, tree, activeTiers };
}

export const CelestialDimensionAnalysis = dimensionAnalysis("CD", definitions.CD);
export const DivineDimensionAnalysis = dimensionAnalysis("DD", definitions.DD);
