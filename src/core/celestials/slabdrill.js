import { boundedPositivePower, boundedPositiveProduct } from "../finite-decimal";
import { canStartEndgameChallenge } from "../endgame-challenge";
import { BitUpgradeState } from "../game-mechanics";
import { GameDatabase } from "../secret-formula/game-database";

import { Quotes } from "./quotes";

import { matchOnlyDeepmerge } from "@/utility/deepmerge";

export const Slabdrill = {
  displayName: "Slabdrill",
  possessiveName: "Slabdrill's",
  get isCursed() {
    return player.celestials.slabdrill.isCursed;
  },
  get isUnlocked() {
    return Slabdrill.isCursed || Slabdrill.isDestroyed;
  },
  get isDestroyed() {
    return player.celestials.slabdrill.isDestroyed;
  },
  get isAwaitingNinthDimension() {
    return this.isDestroyed && !player.celestials.slabdrill.hasBoughtNinthDimension;
  },
  get isPausedForNinthDimension() {
    if (!this.isAwaitingNinthDimension) return false;
    const ninthDimension = AntimatterDimension(9);
    return ninthDimension.isAvailableForPurchase && ninthDimension.isAffordable;
  },
  updatePelleDomainPause() {
    if (!this.isAwaitingNinthDimension) return;
    // A save can lose its starting antimatter or still lack a purchase unlock.
    // Keep production and autobuyers running until the first AD9 is buyable.
    GameEnd.creditsEverClosed = this.isPausedForNinthDimension;
  },
  get currentStage() {
    return player.celestials.slabdrill.stage;
  },
  get power() {
    return player.celestials.slabdrill.serpentinePower;
  },
  get cores() {
    return player.celestials.slabdrill.core.chaosCores;
  },
  get powerCap() {
    return boundedPositivePower(10, this.cores);
  },
  powerPerSecond(diff) {
    if (!Number.isFinite(diff) || diff <= 0) return DC.D0;
    const fraction = -Math.expm1(-Math.LN2 * diff / 666000);
    return boundedPositiveProduct(this.powerCap.sub(this.power).max(0), fraction);
  },
  get coreActive() {
    return player.celestials.slabdrill.core.isActive;
  },
  get huntChance() {
    return this.huntChanceFactors.final.toNumber();
  },
  get huntChanceFactors() {
    const cores = Decimal.pow10(-this.cores);
    const stage = Decimal.pow10(this.currentStage);
    const antimatter = player.antimatter.max(10).log10().log10().pow(3).add(1);
    const dilation = new Decimal(SlabdrillUnlocks.dilation.isUnlocked ? 16 : 1);
    const reality = SlabdrillUnlocks.reality.isUnlocked ? Slabdrill.slabPowers.chaosCores().times(66) : DC.D1;
    // Preserve the gameplay operation order; the display reads this same result without rolling a hunt.
    const raw = cores.times(stage).times(antimatter).div(10000).times(dilation).times(reality);
    return { cores, stage, antimatter, dilation, reality, raw, final: raw.clamp(0, 1) };
  },
  get huntInterval() {
    return 1000 * Math.pow(0.75, this.currentStage);
  },
  slabPowers: {
    adMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(2, Slabdrill.power.pow(0.5)),
    dbMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : Slabdrill.power.max(1).log10().add(1).pow(4),
    galMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : Slabdrill.power.max(1).log10().pow(2).div(100).add(1),
    adPow: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : Slabdrill.power.max(1).log10().div(100).add(1),
    ipMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(2, Slabdrill.power.div(100).add(1).pow(0.4)),
    idMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(2, Slabdrill.power.div(1000).add(1).pow(0.5)),
    repSpeed: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(Slabdrill.power.div(1e6).add(1), 2),
    tdMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(2, Slabdrill.power.div(1e7).add(1).pow(0.3)),
    epMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(2, Slabdrill.power.div(1e9).add(1).pow(0.4)),
    infMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : Slabdrill.power.div(1e10).add(1).pow(0.75),
    dtMult: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : boundedPositivePower(Slabdrill.power.div(1e12).add(1), 2),
    chaosCores: () => player.dilation.active || !Slabdrill.isCursed ? DC.D1 : Slabdrill.power.div(1e15).add(1).log10().add(1).pow(7)
  },
  realityWarp() {
    if (!canStartEndgameChallenge(true) || this.isDestroyed) return false;
    player.disablePostReality = true;
    Endgame.resetNoReward();
    disChargeAllPerkUpgrades();
    disChargeAll();
    disChargeAllBreakUpgrades();
    disChargeAllEternityUpgrades();
    player.endgame.overcharge.allowComplex = false;
    AutomatorBackend.stop();
    clearCelestialRuns();
    player.celestials.slabdrill.isCursed = true;
    recalculateAllGlyphs();
    Tab.dimensions.antimatter.show(false);
    return true;
  },
  warpToPelleDomain() {
    if (!this.isCursed || this.isDestroyed || this.coreActive || this.currentStage < this.layerReqs.length) return false;
    player.celestials.slabdrill.isCursed = false;
    player.celestials.slabdrill.isDestroyed = true;
    player.celestials.slabdrill.isWarping = false;
    player.celestials.slabdrill.isGoodbye = false;
    clearCelestialRuns();
    player.disablePostReality = false;
    player.celestials.slabdrill.core.chaosCores = 0;
    player.celestials.slabdrill.serpentinePower = DC.D0;
    for (let alch = 0; alch < 5; alch++) {
      player.celestials.ra.alchemy[alch].bestPreDoom = 0;
      player.celestials.ra.alchemy[alch].amount = 0;
    }
    player.celestials.ra.alchemy[10].bestPreDoom = 0;
    player.celestials.ra.alchemy[10].amount = 0;
    player.celestials.effarig.relicShards = DC.D0;
    Endgame.resetNoReward(true);
    player.endgame.overcharge.allowComplex = true;
    recalculateAllGlyphs();
    AutomatorBackend.stop();
    Tab.dimensions.antimatter.show(false);
    player.break = true;
    Currency.antimatter.bumpTo(AntimatterDimension(9).cost);
    this.updatePelleDomainPause();
    return true;
  },
  advanceLayer() {
    if (this.isCursed && this.currentStage < this.layerReqs.length) player.celestials.slabdrill.stage++;
  },
  hunt() {
    const core = player.celestials.slabdrill.core;
    const now = Date.now();
    if (!this.isCursed || !core.isActive || !Number.isSafeInteger(core.chaosCores) ||
        core.chaosCores >= Number.MAX_SAFE_INTEGER || now - core.lastFound < this.huntInterval) return false;
    if (Math.random() < this.huntChance) core.chaosCores++;
    core.lastFound = now;
    return true;
  },
  enterCore() {
    if (!this.isCursed || this.coreActive) return false;
    player.celestials.slabdrill.records = matchOnlyDeepmerge(player, player.celestials.slabdrill.records, "eternityChalls");
    finishProcessReality({ reset: true });
    const cache = Object.keys(GameCache);
    for (let c = 0; c < cache.length; c++) {
      GameCache[cache[c]].invalidate();
    }
    player.celestials.slabdrill.core.isActive = true;
    player.break = true;
    Tab.dimensions.antimatter.show(true);
    return true;
  },
  exitCore() {
    if (!this.isCursed || !this.coreActive) return false;
    player.celestials.slabdrill.core.isActive = false;
    finishProcessReality({ reset: true });
    player = matchOnlyDeepmerge(player.celestials.slabdrill.records, player, "eternityChalls");
    GameStorage.loadPlayerObject(player);
    for (let a = 0; a < 8; a++) {
      if (player.auto.antimatterDims.all[a].isUnlocked) {
        Currency.antimatter.add(new Decimal(Autobuyer.antimatterDimension(a + 1).cost));
        Autobuyer.antimatterDimension(a + 1).purchase();
      }
    }
    const cache = Object.keys(GameCache);
    for (let c = 0; c < cache.length; c++) {
      GameCache[cache[c]].invalidate();
    }
    return true;
  },
  get layerReqs() {
    return ["Perform a Dimension Boost", "Create a Galaxy", "Reach Infinity", "Break Infinity", "Complete Infinity Challenge 4",
            "Unlock Replicanti", "Reach Eternity", "Purchase Time Study 181", "Complete Eternity Challenge 10", "Dilate Time",
            "Reach Reality"];
  },
  get nextLayer() {
    return this.layerReqs[this.currentStage];
  },
  quotes: Quotes.slabdrill,
  symbol: "⁹δ"
};

class SlabdrillUnlockState extends BitUpgradeState {
  get bits() { return player.celestials.slabdrill.unlockBits; }
  set bits(value) { player.celestials.slabdrill.unlockBits = value; }

  get requirement() {
    return this.config.requirement;
  }

  get name() {
    return this.config.name;
  }

  get nerfDescription() {
    return this.config.nerfDescription;
  }

  get buffDescription() {
    return this.config.buffDescription;
  }

  get isUnlocked() {
    return player.celestials.slabdrill.stage >= this.requirement && Slabdrill.isCursed;
  }
}

export const SlabdrillUnlocks = mapGameDataToObject(
  GameDatabase.celestials.slabdrill.unlocks,
  config => new SlabdrillUnlockState(config)
);
