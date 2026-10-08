import { AntimatterDimensionBreakdown } from "./antimatter-dimension-breakdown";
import { InfinityDimensionBreakdown } from "./infinity-dimension-breakdown";
import { TimeDimensionBreakdown } from "./time-dimension-breakdown";
import { aggregateOrderedTransforms, createOrderedTransformCache } from "./ordered-breakdown";
import { MultiplierTabIcons } from "./icons";
import { boundedSignedProduct, boundedPositiveProduct } from "../../finite-decimal";

const breakdowns = { AD: AntimatterDimensionBreakdown, ID: InfinityDimensionBreakdown, TD: TimeDimensionBreakdown };

// Categories follow the original source names, while their values and source
// removal use the complete gameplay trace, including all later expansion effects.
function categoryFor(key) {
  if (/^charged(idMult|tdMult)/u.test(key)) return "eternityUpgrade";
  if (/cursed/iu.test(key)) return "nerfCursed";
  if (/^(vNerf|effarig|alphaNerf|alphaPowerNerf|alphaNerfPower)$/u.test(key)) return key;
  if (/^(pelleNerf|pelleStrikePower|pelleStrike)$/u.test(key)) return "nerfPelle";
  if (/^ic4Nerf$/u.test(key)) return "nerfIC";
  if (/^(purchases|purchase)$/u.test(key)) return "purchase";
  if (/dimboost/iu.test(key)) return "dimboost";
  if (/sacrifice/iu.test(key)) return "sacrifice";
  if (/^achievementMultiplier$/u.test(key)) return "achievementMult";
  if (/achievement/iu.test(key)) return "achievement";
  if (/^(ec11InfinityPower|infinityPower|ec9InfinityPower)$/u.test(key)) return "infinityPower";
  if (/^(break(?!Eternity)|breakInfinitied)/u.test(key)) return "breakInfinityUpgrade";
  if (/^(infinity(total|this)|tierInfinity|unspentIP)/u.test(key)) return "infinityUpgrade";
  if (/^(infinityChallenge|ic4Reward)/u.test(key)) return "infinityChallenge";
  if (/TimeStudy|timeStudy/u.test(key)) return "timeStudy";
  if (/^(eternityChallenge|tierEC)/u.test(key)) return "eternityChallenge";
  if (/^eternityUpgrade/u.test(key)) return "eternityUpgrade";
  if (/Glyph|glyph/u.test(key)) return "glyph";
  if (/^(alchemy|commonAlchemy|raMomentum)/u.test(key)) return "alchemy";
  if (/^(shop|commonIAP)/u.test(key)) return "iap";
  if (/^pelle|commonPelle/u.test(key)) return "pelle";
  if (/^commonReplicanti$/u.test(key)) return "replicanti";
  if (/^commonImaginary|imaginaryPower/u.test(key)) return "imaginaryUpgrade";
  if (/^commonReality/u.test(key)) return "realityUpgrade";
  if (/^commonNull|^nullUpgrade/u.test(key)) return "nullUpgrade";
  if (/^vPower$/u.test(key)) return "v";
  if (/^dilationUpgrade$/u.test(key)) return "dilationUpgrade";
  if (/^void/u.test(key)) return "void";
  if (/^ra/u.test(key)) return "ra";
  if (/^singularity/u.test(key)) return "singularity";
  // New mechanics retain their own named source instead of a miscellaneous group.
  return key;
}

function extraIcon(key, resource) {
  if (/^slab/iu.test(key)) return MultiplierTabIcons.SLABDRILL;
  if (/Infinity/u.test(key)) return MultiplierTabIcons.INFINITY_POWER;
  if (/^(effarig|glyph)/u.test(key)) return MultiplierTabIcons.GENERIC_GLYPH;
  if (/^v/u.test(key)) return MultiplierTabIcons.GENERIC_V;
  if (/^dilation/u.test(key)) return MultiplierTabIcons.UPGRADE("dilation");
  if (/^breakEternity|^alpha/u.test(key)) return MultiplierTabIcons.UPGRADE("eternity");
  if (/^ra|^singularity|^void|^ethereal|^overcharge/u.test(key)) return MultiplierTabIcons.UPGRADE("reality");
  return MultiplierTabIcons.DIMENSION(resource);
}

function sourceTransform(resource, breakdown, tiers, sources, mode) {
  const desired = { multiplier: "multiply", exponent: "power" }[mode] ?? null;
  const selected = tiers.map(tier => {
    const trace = breakdown.tierTrace(tier);
    const candidates = sources.flatMap(key => (desired === "power" && key === "purchase"
      ? ["purchaseImaginaryPower", "purchaseSingularityPower"] : [key]));
    const keys = candidates.filter(key => {
      const step = trace[key];
      if (!step || (desired && step.type !== desired)) return false;
      // Identity effects are inactive sources even when floating arithmetic left
      // a tiny difference between the recorded before/after values.
      return step.alwaysShow || !["multiply", "power"].includes(step.type) ||
        step.value === undefined || !Decimal.eq(step.value, 1);
    });
    const transforms = keys.map(key => ({ tier, transform: trace[key] }));
    return { tier, keys, transforms };
  }).filter(item => item.transforms.length);
  const direct = aggregateOrderedTransforms(selected.flatMap(item => item.transforms), resource, false);
  if (!direct) return null;
  if (direct.type === "power") {
    const powers = selected.map(item => item.transforms.reduce((product, { transform }) =>
      boundedSignedProduct(product, transform.value ?? 1), DC.D1));
    // Multiple powers within one category compose per tier. Across tiers they
    // remain separate powers, rather than becoming a fictitious cross-tier exponent.
    if (powers.every(power => power.eq(powers[0]))) direct.value = powers[0];
    else {
      delete direct.value;
      direct.display = `Per-tier powers: ${selected.map((item, i) =>
        `${resource}${item.tier} ${formatPow(powers[i], 2, 3)}`).join("; ")}`;
    }
  }
  if (direct.type === "formula") {
    const multipliers = selected.flatMap(item => item.transforms)
      .filter(item => item.transform.type === "multiply");
    const powers = selected.map(item => item.transforms.filter(part => part.transform.type === "power")
      .reduce((product, part) => boundedSignedProduct(product, part.transform.value ?? 1), DC.D1));
    const labels = [];
    if (multipliers.length) labels.push(formatX(multipliers.reduce((product, item) =>
      boundedPositiveProduct(product, item.transform.value ?? 1), DC.D1), 2, 2));
    if (powers.some(power => power.neq(1))) {
      labels.push(powers.every(power => power.eq(powers[0]))
        ? `${formatPow(powers[0], 2, 3)} per tier`
        : `Per-tier powers: ${selected.map((item, i) =>
          `${resource}${item.tier} ${formatPow(powers[i], 2, 3)}`).join("; ")}`);
    }
    if (labels.length) direct.display = labels.join("; ");
  }
  // A category counterfactual removes all its sources together. Adding individual
  // removals is incorrect when sources interact (TS31, purchase powers, softcaps).
  let final;
  const getFinal = () => {
    final ??= aggregateOrderedTransforms(selected.map(item => ({ tier: item.tier, transform: {
      type: "formula", before: 1, after: 1,
      finalWith: breakdown.evaluate(item.tier),
      finalWithout: breakdown.evaluate(item.tier, new Set(item.keys)),
    } })), resource, true);
    return final;
  };
  Object.defineProperties(direct, {
    finalWith: { enumerable: true, get: () => getFinal().finalWith },
    finalWithout: { enumerable: true, get: () => getFinal().finalWithout },
  });
  return direct;
}

export function installDimensionSourceGroups(resource, values, tree) {
  const prefix = `${resource}_`;
  const tierCount = resource === "AD" ? 9 : 8;
  const original = { ...values };
  const roots = tree[`${resource}_total`][0];
  const calculationGroups = new Set(["commonEffects", "tierEffects", "powers", "voidPowers",
    "commonAchievements", "commonTimeStudies", "commonInfinityChallenges", "commonEternityChallenges",
    "commonEternityUpgrades", "preDilationPowers", "postDilationPowers"]);
  function flatten(key) {
    const prop = key.split("_")[1];
    // Purchases include a derived per-purchase multiplier; its internal inputs
    // are alternatives to that factor and must not be counted twice.
    if (!calculationGroups.has(prop)) return [key];
    const children = tree[key]?.[0];
    return children?.length ? children.flatMap(flatten) : [key];
  }
  const leaves = roots.flatMap(flatten);
  const categories = new Map();
  for (const leaf of leaves) {
    const prop = leaf.split("_")[1];
    const source = values[prop].sourceKey ?? prop;
    const category = categoryFor(source);
    const legacy = original[resource === "AD" ? `classic${category}` : category];
    const icon = legacy?.icon ?? extraIcon(category, resource);
    if (resource === "AD") values[prop].icon = icon;
    if (!categories.has(category)) categories.set(category, { legacy, icon, leaves: [], sources: [] });
    categories.get(category).leaves.push(leaf);
    categories.get(category).sources.push(source);
  }
  const categoryKeys = [];
  const originalOrder = ["purchase", "dimboost", "sacrifice", "achievementMult", "achievement", "infinityUpgrade",
    "breakInfinityUpgrade", "infinityPower", "replicanti", "infinityChallenge", "timeStudy", "eternityUpgrade",
    "eternityChallenge", "dilationUpgrade", "realityUpgrade", "glyph", "v", "alchemy", "imaginaryUpgrade", "pelle", "iap"];
  const order = category => {
    const index = originalOrder.indexOf(category);
    return index < 0 ? originalOrder.length : index;
  };
  for (const [category, group] of [...categories].sort(([a], [b]) => order(a) - order(b))) {
    const prop = `source${category}`;
    const key = `${prefix}${prop}`;
    categoryKeys.push(key);
    const caches = new Map();
    const transform = tier => {
      const cacheKey = tier ?? 0;
      if (!caches.has(cacheKey)) caches.set(cacheKey, createOrderedTransformCache(() => {
        const tiers = tier ? [tier] : Array.from({ length: tierCount }, (_, i) => i + 1)
          .filter(t => Object.keys(breakdowns[resource].tierTrace(t)).length);
        const modes = new Map();
        return { forMode: mode => {
          if (!modes.has(mode)) modes.set(mode,
            sourceTransform(resource, breakdowns[resource], tiers, group.sources, mode));
          return modes.get(mode);
        } };
      }));
      return caches.get(cacheKey)();
    };
    values[prop] = {
      name: group.legacy?.name ?? ({ void: "Void and Divinity powers", ra: "Ra powers",
        singularity: "Singularity milestones" }[category] ?? original[group.leaves[0].split("_")[1]].name),
      icon: group.icon, isActive: true, isOrdered: true, transformValue: transform,
    };
    tree[key] = [group.leaves];
    for (let tier = 1; tier <= tierCount; tier++) tree[`${key}_${tier}`] = [group.leaves.map(leaf => `${leaf}_${tier}`)];
  }
  tree[`${resource}_total`][0] = categoryKeys;
  tree[`${resource}_total`][2] = categoryKeys;
  for (let tier = 1; tier <= tierCount; tier++) {
    const base = resource === "AD" ? [] : [`${resource}_baseAmount_${tier}`];
    tree[`${resource}_total_${tier}`][0] = [...base, ...categoryKeys.map(key => `${key}_${tier}`)];
    tree[`${resource}_total_${tier}`][1] = [...base, ...categoryKeys.map(key => `${key}_${tier}`)];
  }
}
