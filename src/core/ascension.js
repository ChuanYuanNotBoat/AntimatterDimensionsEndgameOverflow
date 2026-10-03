import { canStartEndgameChallenge } from "./endgame-challenge";

const OVERCHARGE_ENERGIES = [null, "bi", "eter", "chall", "ts"];
const OVERCHARGE_CAPS = [0, 9, 6, 32, 62];

export class AscensionState {
  constructor(config) {
    this.config = config;
  }

  get id() {
    return this.config.id;
  }

  get zeroIndex() {
    return this.config.zeroIndex;
  }

  get timeToReach() {
    if (Currency.divineEnergy.value.lte(1)) return new Decimal(DC.BEMAX);
    const indexValue = Decimal.log(Currency.divineEnergy.value.max(1).log10().div(this.zeroIndex.log10()), 1.04);
    const indexRaise = Decimal.pow(0.5, indexValue);
    return indexRaise.times(86400000);
  }

  get timeRemaining() {
    return this.timeToReach.sub(player.endgame.ascensionTimer);
  }

  get isUnlocked() {
    return (player.endgame.ascension >= this.id + 1) && !player.disablePostReality;
  }
}

export const Ascensions = mapGameDataToObject(
  GameDatabase.endgame.ascensions,
  config => (config.isBaseResource
    ? new AscensionState(config)
    : new AscensionState(config))
);

export const Ascension = {
  get isUnlocked() {
    return ResurgenceUpgrade.unl4.isBought;
  },
  get nextAscension() {
    return Ascensions.all.find(x => !x.isUnlocked);
  },
  get overchargePenalty() {
    return [1, 0.72, 0.525, 0.375, 0.125][player.endgame.overcharge.level];
  }
};

export function tryAscend() {
  if (!Ascension.isUnlocked || !Ascension.nextAscension || player.disablePostReality) return;
  if (Ascension.nextAscension.timeRemaining.gt(0)) return;
  Ascension.nextAscension.config.onUnlock?.();
  player.endgame.ascension++;
  player.endgame.ascensionTimer = 0;
  TabNotification.ascension.clearTrigger();
  TabNotification.ascension.tryTrigger();
};

export function tryEnterOvercharge() {
  if (!Ascensions.ocA.isUnlocked || !canStartEndgameChallenge()) return false;
  if (player.options.confirmations.overcharge) {
    Modal.enterOvercharge.show();
  } else {
    return enterOvercharge();
  }
  return true;
}

export function enterOvercharge() {
  const level = player.endgame.overcharge.level;
  if (!Ascensions.ocA.isUnlocked || !canStartEndgameChallenge() || !Number.isInteger(level) ||
      level < 1 || level > Math.min(4, player.endgame.ascension - 5)) return false;
  Endgame.resetNoReward();
  clearCelestialRuns();
  player.endgame.overcharge.isRunning = true;
  recalculateAllGlyphs();
  Tab.dimensions.antimatter.show(false);
  if (player.endgame.overcharge.level >= 4) {
    Modal.message.show(`The rewards for this feature are not yet implemented. Please wait for updates.`, {}, 3);
  }
  return true;
}

export function getOverchargeEnergyGain() {
  const overcharge = player.endgame.overcharge;
  const key = OVERCHARGE_ENERGIES[overcharge.level];
  if (!key || !overcharge.isRunning || Currency.eternityPoints.lt("1e4000")) return 0;
  const current = overcharge.completions[key];
  if (!Number.isSafeInteger(current) || current < 0) throw new Error("Invalid Overcharge energy count");
  const remaining = Math.max(0, OVERCHARGE_CAPS[overcharge.level] - current);
  return Currency.eternityPoints.value.log10().div(4000).log(1.1).add(1).sub(current)
    .floor().clamp(0, remaining).toNumber();
}

export function exitOvercharge() {
  const overcharge = player.endgame.overcharge;
  if (!overcharge.isRunning || !OVERCHARGE_ENERGIES[overcharge.level]) return false;
  const key = OVERCHARGE_ENERGIES[overcharge.level];
  const reward = getOverchargeEnergyGain();
  Endgame.resetNoReward();
  overcharge.isRunning = false;
  overcharge.completions[key] += reward;
  recalculateAllGlyphs();
  return true;
}
