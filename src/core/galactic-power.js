import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "./finite-decimal";

export class GalacticPowerState {
  constructor(config) {
    this.config = config;
  }

  get id() {
    return this.config.id;
  }

  get reward() {
    return this.config.effect();
  }

  get unlockGP() {
    return this.config.galacticPower;
  }

  get isUnlocked() {
    return Currency.galacticPower.gte(this.unlockGP) && (ResurgenceUpgrade.unl3.isBought ? true : this.id <= 8);
  }
}

export const GalacticPowers = mapGameDataToObject(
  GameDatabase.endgame.galacticPowers,
  config => (config.isBaseResource
    ? new GalacticPowerState(config)
    : new GalacticPowerState(config))
);

export const GalacticPower = {
  get isUnlocked() {
    return SingularityMilestone.galacticPower.isUnlocked || Currency.galacticPower.gt(0);
  },
  get nextPower() {
    const power = GalacticPowers.all.find(x => !x.isUnlocked);
    return (power?.id > 8 && !ResurgenceUpgrade.unl3.isBought) ? undefined : power;
  },
  get nextPowerUnlockGP() {
    return this.nextPower?.unlockGP;
  },
  get freeGalaxies() {
    return GalacticPowers.freeGalaxies.isUnlocked ? GalacticPowers.freeGalaxies.reward : DC.D0;
  }
};

export function getGalacticPowerGainPerSecond() {
  const allGalaxies = actualBaseGalaxiesWithoutGeneration();
  const galaxyFactor = Decimal.max(allGalaxies.div(100000), 1);
  const celestialMatter = boundedPositiveSum(player.endgame.celestialMatter, 1);
  const imaginaryMachines = boundedPositiveSum(player.reality.imaginaryMachines, 1);
  const celMatterFactor = Decimal.max(
    boundedPositivePower(Decimal.log10(celestialMatter).div(10), 4), 1);
  const imaginaryFactor = Decimal.max(
    boundedPositivePower(Decimal.log10(imaginaryMachines), 2.5), 1);

  let base = boundedPositiveProduct(galaxyFactor, celMatterFactor);
  base = boundedPositiveProduct(base, imaginaryFactor).div(1e7);

  const galaxyExponent1 = Decimal.max(Decimal.min(boundedPositivePower(allGalaxies.div(1680000), 6.4), 4), 1);
  const galaxyExponent2 = Decimal.max(Decimal.min(boundedPositivePower(allGalaxies.div(1960000), 15), 5), 1);
  const galaxyExponent3 = Decimal.max(Decimal.min(boundedPositivePower(allGalaxies.div(2160000), 5), 1.6), 1);
  const galaxyExponent4 = Decimal.max(Decimal.min(boundedPositivePower(allGalaxies.div(4500000), 0.75), 1.25), 1);
  const galaxyExponent5 = Decimal.max(Decimal.min(boundedPositivePower(allGalaxies.div(6000000), 0.5), 2.5), 1);

  let exponent = boundedPositiveProduct(galaxyExponent1, galaxyExponent2);
  exponent = boundedPositiveProduct(exponent, galaxyExponent3);
  exponent = boundedPositiveProduct(exponent, galaxyExponent4);
  exponent = boundedPositiveProduct(exponent, galaxyExponent5);

  for (const source of [EndgameMastery(291), EndgameMastery(292), EndgameMastery(293), DualityUpgrade(29)]) {
    source.applyEffect(value => { exponent = boundedPositiveProduct(exponent, value); });
  }
  exponent = boundedPositiveProduct(exponent, NormalChallenge(10).chargedEffect);
  return Pelle.isDoomed ? DC.D0 : boundedPositivePower(base, exponent);
}
