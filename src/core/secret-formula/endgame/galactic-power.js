import { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } from "../../finite-decimal";

// The RG reward and free-Galaxy reward feed the gameplay galaxy count. Both
// must remain Decimal when their empowered exponents exceed JS Number range.
function empoweredGalacticReward(base) {
  let result = new Decimal(base);
  if (GalacticPowers.galaxyEmpowerment1.isUnlocked) {
    result = boundedPositivePower(result, GalacticPowers.galaxyEmpowerment1.reward);
  }
  if (GalacticPowers.galaxyEmpowerment2.isUnlocked) {
    result = boundedPositivePower(result, GalacticPowers.galaxyEmpowerment2.reward);
  }
  return result;
}

export const galacticPowerRewards = {
  galaxyStrength: {
    id: 1,
    galacticPower: 0,
    reward: "Increase Galaxy Strength",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const cappedBase = Decimal.min(
        boundedPositiveSum(boundedPositivePower(gpLog.div(10), 3), 1), 30000);
      const lateGameFactor = gpLog.div(Decimal.log10(DC.NUMMAX)).max(1);
      return empoweredGalacticReward(boundedPositiveProduct(cappedBase, lateGameFactor));
    },
    formatEffect: value => `Galaxies are ${Decimal.gte(value, 11)
      ? formatX(value, 2, 2)
      : formatPercents(new Decimal(value).sub(1), 2, 2)} stronger`
  },
  remoteGalaxyScale: {
    id: 2,
    galacticPower: 1e10,
    reward: "Delay Remote Galaxy Scaling",
    effect: () => {
      if (player.disablePostReality) return DC.D0;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const cappedBase = Decimal.min(boundedPositivePower(boundedPositiveProduct(gpLog, 5), 2), 2.5e6);
      const lateGameFactor = boundedPositivePower(gpLog.div(Decimal.log10(DC.NUMMAX)).max(1), 2);
      return empoweredGalacticReward(boundedPositiveProduct(cappedBase, lateGameFactor));
    },
    formatEffect: value => `Remote Galaxy Scaling is delayed by ${formatHybridLarge(value, 3)} Galaxies`
  },
  remoteGalaxyPower: {
    id: 3,
    galacticPower: 1e20,
    reward: "Weaken Remote Galaxy Scaling",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      let result = DC.D1.sub(boundedPositiveProduct(boundedPositivePower(gpLog, 0.5), 0.05)).max(0.1);
      result = result.div(gpLog.div(Decimal.log10(DC.NUMMAX)).max(1));
      if (GalacticPowers.galaxyEmpowerment1.isUnlocked) {
        result = boundedPositivePower(result, new Decimal(GalacticPowers.galaxyEmpowerment1.reward).recip());
      }
      if (GalacticPowers.galaxyEmpowerment2.isUnlocked) {
        result = boundedPositivePower(result, new Decimal(GalacticPowers.galaxyEmpowerment2.reward).recip());
      }
      return Decimal.clamp(result, 0, 1);
    },
    formatEffect: value => `Remote Galaxy Scaling is ${formatDecimalPercents(DC.D1.sub(value), 2)} weaker`
  },
  galGenInstability1: {
    id: 4,
    galacticPower: 1e50,
    reward: "Delay the first Galaxy Generator Instability Threshold",
    effect: () => {
      if (player.disablePostReality) return DC.D0;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const normalized = gpLog.div(Decimal.log10(DC.NUMMAX));
      const cappedBase = Decimal.min(boundedPositivePower(10, boundedPositiveProduct(normalized, 50)), 1e50);
      const exponent = empoweredGalacticReward(normalized).max(1);
      return boundedPositivePower(cappedBase, exponent);
    },
    formatEffect: value => `The first Galaxy Generator Instability Threshold is delayed by ${formatX(value, 2, 2)} Galaxies`
  },
  replicantiGalaxies: {
    id: 5,
    galacticPower: 1e100,
    reward: "Multiply Replicanti Galaxy gain",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const cappedBase = Decimal.min(
        boundedPositiveSum(boundedPositivePower(gpLog.div(100), 1.25), 1), 6);
      const lateGameFactor = boundedPositivePower(
        gpLog.div(Decimal.log10(DC.NUMMAX)).max(1), 0.5);
      return empoweredGalacticReward(boundedPositiveProduct(cappedBase, lateGameFactor));
    },
    formatEffect: value => `Gain ${formatX(value, 2, 2)} more Replicanti Galaxies`
  },
  tachyonGalaxies: {
    id: 6,
    galacticPower: 1e150,
    reward: "Decrease the Tachyon Galaxy Threshold Multiplier",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const cappedBase = Decimal.min(
        boundedPositiveSum(boundedPositivePower(gpLog.div(200), 3), 1), 5);
      const lateGameFactor = boundedPositivePower(
        gpLog.div(Decimal.log10(DC.NUMMAX)).max(1), 0.5);
      return empoweredGalacticReward(boundedPositiveProduct(cappedBase, lateGameFactor));
    },
    formatEffect: value => `Apply a ${format(value, 2, 2)}th root to the Tachyon Galaxy Threshold Multiplier`
  },
  galGenInstability2: {
    id: 7,
    galacticPower: 1e200,
    reward: "Decrease the power of the second Galaxy Generator Instability Magnitude",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      const cappedBase = Decimal.min(
        boundedPositiveSum(boundedPositivePower(gpLog.div(100), 1.5).div(10), 1), 1.6);
      const lateGameFactor = boundedPositivePower(
        gpLog.div(Decimal.log10(DC.NUMMAX)).max(1), 0.25);
      return empoweredGalacticReward(boundedPositiveProduct(cappedBase, lateGameFactor));
    },
    formatEffect: value => `Apply a ${format(value, 2, 2)}th root to the second Galaxy Generator Instability Magnitude`
  },
  etherealUnlock: {
    id: 8,
    galacticPower: Number.MAX_VALUE,
    reward: "Unlock the Ethereal"
  },
  galacticAscension: {
    id: 9,
    galacticPower: new Decimal("1e7800"),
    reward: "Galaxy types now multiply each other instead of add if they are above zero"
  },
  galaxyEmpowerment1: {
    id: 10,
    galacticPower: new Decimal("1e10000"),
    reward: "Increase the effect of all above Galactic Powers exponentially",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpPlusOne = boundedPositiveSum(Currency.galacticPower.value, 1);
      const base = Decimal.log10(boundedPositiveSum(Decimal.log10(gpPlusOne), 1)).div(4);
      return GalacticPowers.galaxyEmpowerment2.isUnlocked
        ? boundedPositivePower(base, GalacticPowers.galaxyEmpowerment2.reward)
        : base;
    },
    formatEffect: value => `The above Galactic Powers are ${Decimal.gte(value, 11)
      ? formatX(value, 2, 2)
      : formatPercents(new Decimal(value).sub(1), 2, 2)} stronger`
  },
  celestialGalaxyEmpowerment: {
    id: 11,
    galacticPower: new Decimal("1e15000"),
    reward: "Increase the power of Celestial Galaxies",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpLog = Decimal.log10(boundedPositiveSum(Currency.galacticPower.value, 1));
      let result = boundedPositivePower(gpLog.div(15000), 5);
      if (GalacticPowers.galaxyEmpowerment2.isUnlocked) {
        result = boundedPositivePower(result, GalacticPowers.galaxyEmpowerment2.reward);
      }
      return result;
    },
    formatEffect: value => `Celestial Galaxies are ${Decimal.gte(value, 11)
      ? formatX(value, 2, 2)
      : formatPercents(new Decimal(value).sub(1), 2, 2)} stronger`
  },
  freeGalaxies: {
    id: 12,
    galacticPower: new Decimal("1e25000"),
    reward: "Gain free Galaxies",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      let result = boundedPositivePower(Currency.galacticPower.value.div("1e25000"), 0.001);
      if (GalacticPowers.galaxyEmpowerment2.isUnlocked) {
        result = boundedPositivePower(result, GalacticPowers.galaxyEmpowerment2.reward);
      }
      return result;
    },
    formatEffect: value => `${formatHybridLarge(value, 3)} free Galaxies`
  },
  galaxyScaling: {
    id: 13,
    galacticPower: new Decimal("1e40000"),
    reward: () => `Reduce the base cost scaling of ${player.universes.current === 2 ? "Matter" : "Antimatter"} Galaxies`,
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpPlusOne = boundedPositiveSum(Currency.galacticPower.value, 1);
      const exponentBase = Decimal.log10(Decimal.log10(gpPlusOne).div(40000)).add(1);
      let result = boundedPositivePower(0.9, boundedPositivePower(exponentBase, 2).sub(1).max(0));
      if (GalacticPowers.galaxyEmpowerment2.isUnlocked) {
        result = boundedPositivePower(result, GalacticPowers.galaxyEmpowerment2.reward);
      }
      return result;
    },
    formatEffect: value => `${player.universes.current === 2 ? "Matter" : "Antimatter"} Galaxy cost scaling is reduced by ${formatDecimalPercents(DC.D1.sub(value), 2)}`
  },
  galaxyGenerationEmpowerment: {
    id: 14,
    galacticPower: new Decimal("1e66000"),
    reward: "Empower Galaxy Generation",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpPlusOne = boundedPositiveSum(Currency.galacticPower.value, 1);
      const base = boundedPositiveSum(
        Decimal.log10(Decimal.log10(gpPlusOne).div(66000)), 1);
      return GalacticPowers.galaxyEmpowerment2.isUnlocked
        ? boundedPositivePower(base, GalacticPowers.galaxyEmpowerment2.reward)
        : base;
    },
    formatEffect: value => `Galaxy Generation is empowered by ${formatPow(value, 2, 3)}`
  },
  galaxyEmpowerment2: {
    id: 15,
    galacticPower: new Decimal("1e100000"),
    reward: "Increase the effect of all above Galactic Powers exponentially",
    effect: () => {
      if (player.disablePostReality) return DC.D1;
      const gpPlusOne = boundedPositiveSum(Currency.galacticPower.value, 1);
      return boundedPositiveSum(
        Decimal.log10(Decimal.log10(gpPlusOne).div(100000)), 1);
    },
    formatEffect: value => `The above Galactic Powers are ${Decimal.gte(value, 11)
      ? formatX(value, 2, 2)
      : formatPercents(new Decimal(value).sub(1), 2, 2)} stronger`
  },
  stelliferousUniverse: {
    id: 16,
    galacticPower: DC.NUMMAX.pow(1000),
    reward: "Unlock the Stelliferous Universe"
  }
};
