import { t } from "../../../i18n";
import { analysisStep } from "../../analysis-steps";
import { uncappedRealityMachines, machineCapacity } from "../../machine-formulas";
import { boundedPositiveProduct, boundedPositiveSum } from "../../finite-decimal";
import { MultiplierTabIcons } from "./icons";
import { addOrderedTransform, addOrderedFinalImpacts, createOrderedTransformCache } from "./ordered-breakdown";

export const machineAnalysisUnlocked = type => {
  if (type === "IM") return PlayerProgress.endgameUnlocked() || MachineHandler.isIMUnlocked;
  if (type === "DM") return MachineHandler.isDMUnlocked;
  return PlayerProgress.endgameUnlocked() || PlayerProgress.realityUnlocked() || TimeStudy.reality.isBought;
};

export function realityCountEstimate() {
  const batch = boundedPositiveSum(simulatedRealityCount(false), 1);
  const probability = Achievement(154).effectOrDefault(0);
  return {
    batch, probability,
    expected: realityCountReward(batch, boundedPositiveProduct(batch, probability)),
    minimum: probability === 1 ? boundedPositiveProduct(batch, 2) : batch,
    maximum: probability > 0 ? boundedPositiveProduct(batch, 2) : batch
  };
}

function realityMachines(observer) {
  let gain = uncappedRealityMachines(observer);
  const hardcap = MachineHandler.hardcapRM;
  gain = analysisStep(observer, "hardcap", "hardcap", gain, gain.clampMax(hardcap));
  const batch = boundedPositiveSum(simulatedRealityCount(false), 1);
  gain = analysisStep(observer, "batch", "multiply", gain, boundedPositiveProduct(gain, batch), batch);
  if (Currency.realityMachines.gte(hardcap)) gain = analysisStep(observer, "fullCapacity", "override", gain, DC.D0);
  else {
    const credited = Decimal.min(boundedPositiveSum(Currency.realityMachines.value, gain), hardcap)
      .sub(Currency.realityMachines.value).max(0);
    gain = analysisStep(observer, "remainingCapacity", "hardcap", gain, credited);
  }
  return gain;
}

function expectedRealityCount(observer) {
  const batch = boundedPositiveSum(simulatedRealityCount(false, observer), 1);
  const tracedBatch = analysisStep(observer, "batch", "multiply", DC.D1, batch, batch);
  return realityCountReward(tracedBatch,
    boundedPositiveProduct(tracedBatch, Achievement(154).effectOrDefault(0)), observer);
}

const definitions = {
  RM: {
    unlocked: () => machineAnalysisUnlocked("RM"), evaluate: realityMachines,
    roots: ["base", "multipliers", "teresa", "mastery143", "divinity", "rmSurge", "compression",
      "rounding", "hardcap", "batch", "remainingCapacity", "fullCapacity"],
    groups: { base: ["epInput", "epHardcap", "epSoftcap"],
      multipliers: ["shop", "perkShop", "glyph", "achievement167"] },
    icon: () => MultiplierTabIcons.MACHINE("RM")
  },
  IM: {
    unlocked: () => machineAnalysisUnlocked("IM"),
    evaluate: (observer, projected) => machineCapacity("IM", projected, observer),
    roots: ["storedCapacity", "capacityUpgrade", "capacityHardcap"],
    projectedRoots: ["pelle", "imBase", "imPower", "baseHardcap", "capacityUpgrade", "capacityHardcap"],
    groups: { imBase: ["rmInput", "imThreshold", "imLateBase", "imAdaptiveBase"],
      imPower: ["mastery144", "raIM", "raEP", "imLatePower", "green", "divinity",
        "imSurge", "machineSurge", "compression"] },
    icon: () => MultiplierTabIcons.MACHINE("IM")
  },
  DM: {
    unlocked: () => machineAnalysisUnlocked("DM"),
    evaluate: (observer, projected) => machineCapacity("DM", projected, observer),
    roots: ["storedCapacity", "capacityUpgrade", "capacityHardcap"],
    projectedRoots: ["dmBase", "dmPower", "representation", "baseHardcap", "capacityUpgrade", "capacityHardcap"],
    groups: { dmPower: ["dmRMExponent", "dmProgression", "firstDivine", "divinity", "machineSurge",
      "mastery213", "compression", "mastery223"] },
    icon: () => MultiplierTabIcons.MACHINE("DM")
  },
  realities: {
    unlocked: () => machineAnalysisUnlocked("RM"), evaluate: expectedRealityCount,
    roots: ["batch", "achievement154"],
    groups: { batch: ["alchemy", "amplification", "partial", "simulatedFloor"] },
    icon: () => MultiplierTabIcons.UPGRADE("reality")
  },
  endgames: {
    unlocked: () => PlayerProgress.endgameUnlocked(), evaluate: observer => gainedEndgames(observer),
    roots: ["enslaved", "alpha", "firstDivine", "divinity"], groups: {},
    icon: () => ({ symbol: "<b>✯</b>", color: "var(--color-endgame)" })
  }
};

function rewardAnalysis(resource, definition) {
  const evaluate = (skip, projected, raw = {}) => {
    const keys = new Set(skip instanceof Set ? skip : skip ? [skip] : []);
    for (const key of keys) for (const child of definition.groups[key] ?? []) keys.add(child);
    return definition.evaluate({ steps: raw, skip: keys }, projected);
  };
  const build = projected => {
    const raw = {};
    const value = evaluate(null, projected, raw);
    const steps = {};
    for (const [key, step] of Object.entries(raw)) addOrderedTransform(steps, key, step.type,
      step.before, step.after, { value: step.value,
        alwaysShow: ["base", "storedCapacity", "imBase", "dmBase", "fullCapacity", "pelle"].includes(key) });
    addOrderedFinalImpacts(steps, key => evaluate(key, projected), value,
      ["base", "storedCapacity", "imBase", "dmBase", "epInput", "rmInput", "fullCapacity"]);
    return { steps, value };
  };
  const current = createOrderedTransformCache(() => build(false));
  const projected = createOrderedTransformCache(() => build(true));
  const snapshot = mode => (mode === "projected" ? projected() : current());
  const values = {};
  const makeTotal = mode => ({
    name: () => t(`analysis.expansion.${resource}.${mode === "projected" ? "projected" : "total"}`),
    isActive: definition.unlocked, isBase: true, isOrdered: true,
    icon: definition.icon, overlay: [definition.icon().symbol],
    multValue: () => snapshot(mode).value ?? DC.D1,
    displayOverride: () => format(snapshot(mode).value ?? 1, 2, 2),
    transformValue: () => ({ type: "formula", before: DC.D1,
      after: snapshot(mode).value ?? DC.D1, alwaysShow: true })
  });
  values.total = makeTotal();
  if (definition.projectedRoots) values.projectedTotal = makeTotal("projected");
  const allKeys = new Set([...definition.roots, ...(definition.projectedRoots ?? []),
    ...Object.values(definition.groups).flat()]);
  for (const key of allKeys) values[key] = {
    name: () => t(`analysis.expansion.${resource}.${key}`),
    isActive: definition.unlocked, isOrdered: true, icon: definition.icon,
    transformValue: mode => snapshot(mode).steps?.[key] ?? null
  };
  const tree = { [`${resource}_total`]: [definition.roots.map(key => `${resource}_${key}`)] };
  if (definition.projectedRoots) {
    tree[`${resource}_projectedTotal`] = [definition.projectedRoots.map(key => `${resource}_${key}_projected`)];
  }
  for (const suffix of ["", "_projected"]) for (const [key, children] of Object.entries(definition.groups)) {
    tree[`${resource}_${key}${suffix}`] = [children.map(child => `${resource}_${child}${suffix}`)];
  }
  return { values, tree };
}

export const ExpansionRewardAnalyses = Object.fromEntries(Object.entries(definitions)
  .map(([resource, definition]) => [resource, rewardAnalysis(resource, definition)]));
