import { canStartEndgameChallenge } from "./endgame-challenge";
import { boundedPositivePower, boundedPositiveProduct } from "./finite-decimal";

export const Universes = {
  get areUnlocked() {
    for (let u = 1; u < 9; u++) {
      if (this.isUnlocked(u)) return true;
    }
    return false;
  },
  isUnlocked(id) {
    let unlocked;
    switch (id) {
      case 1:
        unlocked = player.celestials.pelle.divinities.gte(13);
        break;
      case 2:
        unlocked = NormalChallenge(11).isCharged;
        break;
      case 3:
        unlocked = false;
        break;
      case 4:
        // Entry and rewards are not implemented yet.
        unlocked = false;
        break;
      case 5:
        unlocked = false;
        break;
      case 6:
        unlocked = false;
        break;
      case 7:
        unlocked = false;
        break;
      case 8:
        unlocked = false;
        break;
      default:
        unlocked = false;
        break;
    }
    return unlocked;
  },
  get ephemeralLightToGalGen() {
    return player.disablePostReality ? DC.D1 : player.universes.ephemeralLight.max(1).pow(0.0625);
  },
  get ephemeralLightToDilation() {
    return player.disablePostReality ? DC.D1 : player.universes.ephemeralLight.max(1).pow(2 / 3);
  },
  get stellarAugmentersToGrayStarEffectiveness() {
    return player.disablePostReality ? DC.D1 : player.universes.stellarAugmenters.div(2000).add(1);
  }
};

export function tryEnterUniverse(id) {
  if (!Universes.isUnlocked(id) || !canStartEndgameChallenge()) return false;
  let name;
  switch (id) {
    case 1:
      name = "Transient";
      break;
    case 2:
      name = "Tangible";
      break;
    case 3:
      name = "Dark";
      break;
    case 4:
      name = "Stelliferous";
      break;
    case 5:
      name = "Transitory";
      break;
    case 6:
      name = "Decaying";
      break;
    case 7:
      name = "Endless";
      break;
    case 8:
      name = "Terminal";
      break;
    default:
      name = "";
      break;
  }
  if (player.options.confirmations.universes) {
    Modal.enterUniverse.show({ name, number: id });
  } else {
    return enterUniverse(id);
  }
  return true;
}

export function enterUniverse(id) {
  if (!Universes.isUnlocked(id) || !canStartEndgameChallenge()) return false;
  Endgame.resetNoReward();
  clearCelestialRuns();
  player.universes.current = id;
  recalculateAllGlyphs();
  Tab.dimensions.antimatter.show(false);
  return true;
}

export function exitUniverse(id) {
  if (![1, 2].includes(id) || player.universes.current !== id) return false;
  const peak = id === 1 ? player.universes.highestTransientAntimatter : player.universes.highestTangibleMatter;
  const reward = boundedPositivePower(peak.max(1e10).log10().log10(), 3);
  Endgame.resetNoReward();
  player.universes.current = 0;
  if (id === 1) {
    player.universes.relativisticParticles = DC.D0;
    player.universes.ephemeralLight = player.universes.ephemeralLight.max(reward);
  } else {
    player.universes.molecularMass = DC.D0;
    player.universes.stellarAugmenters = player.universes.stellarAugmenters.max(reward);
  }
  recalculateAllGlyphs();
  return true;
}

export function getRelativisticParticlesPerSecond() {
  if (player.universes.current !== 1) return DC.D0;
  return boundedPositivePower(boundedPositiveProduct(player.antimatter.max(10).log10(),
    Time.thisEndgameRealTime.totalSeconds), 2.5);
}

export function getMolecularMassPerSecond() {
  if (player.universes.current !== 2) return DC.D0;
  return boundedPositivePower(boundedPositiveProduct(player.antimatter.max(10).log10(),
    Time.thisEndgameRealTime.totalSeconds), 2);
}

export function universesUI(id) {
  let color;
  switch (id) {
    case 0:
      color = "o-tab-btn--universes";
      break;
    case 1:
      color = "o-tab-btn--universes__transient";
      break;
    case 2:
      color = "o-tab-btn--universes__tangible";
      break;
    case 3:
      color = "";
      break;
    case 4:
      color = "";
      break;
    case 5:
      color = "";
      break;
    case 6:
      color = "";
      break;
    case 7:
      color = "";
      break;
    case 8:
      color = "";
      break;
    default:
      color = "";
      break;
  }
  return color;
}
