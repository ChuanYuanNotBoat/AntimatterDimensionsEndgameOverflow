<script>
import wordShift from "@/core/word-shift";

import ReplicantiUpgradeButton, { ReplicantiUpgradeButtonSetup } from "./ReplicantiUpgradeButton";
import PrimaryButton from "@/components/PrimaryButton";
import ReplicantiGainText from "./ReplicantiGainText";
import ReplicantiGalaxyButton from "./ReplicantiGalaxyButton";

export default {
  name: "ReplicantiTab",
  components: {
    PrimaryButton,
    ReplicantiGainText,
    ReplicantiUpgradeButton,
    ReplicantiGalaxyButton,
  },
  data() {
    return {
      isUnlocked: false,
      isUnlockAffordable: false,
      isInEC8: false,
      ec8Purchases: 0,
      amount: new Decimal(),
      mult: new Decimal(),
      hasTDMult: false,
      multTD: new Decimal(),
      hasDTMult: false,
      multDT: new Decimal(),
      hasIPMult: false,
      multIP: new Decimal(),
      hasDEMult: false,
      multDE: new Decimal(),
      hasSTMult: false,
      multST: new Decimal(),
      hasPow: false,
      pow: 0,
      hasTDPow: false,
      powTD: 0,
      hasDTPow: false,
      powDT: 0,
      hasIPPow: false,
      powIP: 0,
      hasDEPow: false,
      powDE: 0,
      hasSTPow: false,
      powST: 0,
      hasRaisedCap: false,
      replicantiCap: new Decimal(),
      distantRG: 0,
      remoteRG: 0,
      contingentRG: 0,
      isContingent: false,
      effarigInfinityBonusRG: 0,
      isUncapped: false,
      nextEffarigRGThreshold: 0,
      canSeeGalaxyButton: false,
      unlockCost: new Decimal(),
      scrambledText: "",
      maxReplicanti: new Decimal(),
      estimateToMax: 0,
    };
  },
  computed: {
    isDoomed: () => Pelle.isDoomed,
    replicantiChanceSetup() {
      const isCursed = SlabdrillUnlocks.replicanti.isUnlocked;
      return new ReplicantiUpgradeButtonSetup(
        ReplicantiUpgrade.chance,
        value => `Replicate chance: ${isCursed ? formatDecimalPercents(value, 1, 1) : formatDecimalPercents(value)}`,
        cost => `+${isCursed ? formatPercents(0.001, 1, 1) : formatPercents(0.01)} Costs: ${format(cost)} IP`
      );
    },
    replicantiIntervalSetup() {
      const upgrade = ReplicantiUpgrade.interval;
      function formatInterval(interval) {
        const actualInterval = upgrade.applyModifiers(interval);
        const intervalNum = actualInterval.toNumber();
        if (
          Number.isFinite(intervalNum) &&
          intervalNum > 1 &&
          upgrade.isCapped
        ) {
          // Checking isCapped() prevents text overflow when formatted as "__ ➜ __"
          return TimeSpan.fromMilliseconds(new Decimal(intervalNum)).toStringShort(false);
        }
        if (actualInterval.lt(0.01)) return `< ${format(0.01, 2, 2)}ms`;
        if (actualInterval.gt(1000))
          return `${format(actualInterval.div(1000), 2, 2)}s`;
        return `${format(actualInterval, 2, 2)}ms`;
      }
      return new ReplicantiUpgradeButtonSetup(
        upgrade,
        value => `Interval: ${formatInterval(value)}`,
        cost =>
          `➜ ${formatInterval(upgrade.nextValue)} Costs: ${format(cost)} IP`
      );
    },
    maxGalaxySetup() {
      const upgrade = ReplicantiUpgrade.galaxies;
      return new ReplicantiUpgradeButtonSetup(
        upgrade,
        value => {
          const extra = upgrade.extra;
          const description = this.$t("replicanti.maxGalaxies", { amount: formatHybridLarge(value, 3) });
          return extra.gt(0)
            ? `${description}<br>${formatHybridLarge(value, 3)} + ${formatHybridLarge(extra, 3)} = ${formatHybridLarge(value.add(extra), 3)}`
            : description;
        },
        cost => `+${formatInt(1)} Costs: ${format(cost)} IP`
      );
    },
    capMultText() {
      const mult = this.replicantiCap.div(DC.NUMMAX);
      return TimeStudy(31).canBeApplied
        ? this.$t("replicanti.capMultiplier", { base: formatX(mult.pow(1 / TimeStudy(31).effectValue), 2), after: formatX(mult, 2) })
        : formatX(mult, 2);
    },
    boostRows() {
      const rows = [{ type: "infinity", mult: this.mult, pow: this.pow, hasPow: this.hasPow }];
      if (this.hasTDMult) rows.push({ type: "time", mult: this.multTD, pow: this.powTD, hasPow: this.hasTDPow });
      if (this.hasDTMult) rows.push({
        type: GlyphAlteration.isAdded("replication") ? "dilatedTimeSpeed" : "dilatedTime",
        mult: this.multDT, pow: this.powDT, hasPow: this.hasDTPow
      });
      if (this.hasIPMult) rows.push({ type: "infinityPoints", mult: this.multIP, pow: this.powIP, hasPow: this.hasIPPow });
      if (this.hasDEMult) rows.push({ type: "darkEnergy", mult: this.multDE, pow: this.powDE, hasPow: this.hasDEPow });
      if (this.hasSTMult) rows.push({ type: "spaceTheorems", mult: this.multST, pow: this.powST, hasPow: this.hasSTPow });
      return rows.map(row => ({ ...row, id: `replicanti.boost.${row.type}.${row.hasPow ? "power" : "multiplier"}` }));
    },
    hasMaxText: () => PlayerProgress.realityUnlocked() && !Pelle.isDoomed,
    toMaxTooltip() {
      if (this.amount.lte(this.replicantiCap)) return null;
      return this.estimateToMax.lt(0.01)
        ? "Currently Increasing"
        : TimeSpan.fromSeconds(this.estimateToMax).toStringShort();
    }
  },
  methods: {
    update() {
      this.isUnlocked = Replicanti.areUnlocked;
      this.unlockCost = new Decimal(1e140).dividedByEffectOf(PelleRifts.vacuum.milestones[1]);
      if (this.isDoomed) this.scrambledText = this.vacuumText();
      if (!this.isUnlocked) {
        this.isUnlockAffordable = Currency.infinityPoints.gte(this.unlockCost);
        return;
      }
      this.isInEC8 = EternityChallenge(8).isRunning;
      if (this.isInEC8) {
        this.ec8Purchases = player.eterc8repl;
      }
      this.amount.copyFrom(Replicanti.amount);
      this.mult.copyFrom(ReplicantiMultipliers.idMult);
      this.hasTDMult = DilationUpgrade.tdMultReplicanti.isBought;
      this.multTD.copyFrom(ReplicantiMultipliers.tdMult);
      this.hasDTMult = getAdjustedGlyphEffect("replicationdtgain").neq(0) && !Pelle.isDoomed;
      this.multDT.copyFrom(ReplicantiMultipliers.dtMult);
      this.hasIPMult = !player.disablePostReality && AlchemyResource.exponential.amount > 0 && !this.isDoomed;
      this.multIP.copyFrom(ReplicantiMultipliers.ipMult);
      this.hasDEMult = !player.disablePostReality && Alpha.currentStage >= 21;
      this.multDE.copyFrom(ReplicantiMultipliers.deMult);
      this.hasSTMult = CompressionUpgrade.stMultReplicanti.isBought;
      this.multST.copyFrom(ReplicantiMultipliers.stMult);
      this.hasPow = ResurgenceUpgrade.repSurge.isBought && !player.disablePostReality;
      this.pow = ReplicantiMultipliers.idPow;
      this.hasTDPow = ResurgenceUpgrade.repSurge.isBought && DilationUpgrade.tdMultReplicanti.isBought && !player.disablePostReality;
      this.powTD = ReplicantiMultipliers.tdPow;
      this.hasDTPow = ResurgenceUpgrade.repSurge.isBought && getAdjustedGlyphEffect("replicationdtgain").neq(0) && !Pelle.isDoomed && !player.disablePostReality;
      this.powDT = ReplicantiMultipliers.dtPow;
      this.hasIPPow = ResurgenceUpgrade.repSurge.isBought && !player.disablePostReality && AlchemyResource.exponential.amount > 0 && !this.isDoomed;
      this.powIP = ReplicantiMultipliers.ipPow;
      this.hasDEPow = ResurgenceUpgrade.repSurge.isBought && !player.disablePostReality && Alpha.currentStage >= 21;
      this.powDE = ReplicantiMultipliers.dePow;
      this.hasSTPow = ResurgenceUpgrade.repSurge.isBought & !player.disablePostReality && CompressionUpgrade.stMultReplicanti.isBought;
      this.powST = ReplicantiMultipliers.stPow;
      this.isUncapped = PelleRifts.vacuum.milestones[1].canBeApplied;
      this.hasRaisedCap = (EffarigUnlock.infinity.isUnlocked && !this.isUncapped) || (Pelle.isDoomed && PelleCelestialUpgrade.replicantiCapIncrease.canBeApplied);
      this.replicantiCap.copyFrom(replicantiCap());
      this.distantRG = ReplicantiUpgrade.galaxies.distantRGStart;
      this.remoteRG = ReplicantiUpgrade.galaxies.remoteRGStart;
      this.contingentRG = ReplicantiUpgrade.galaxies.contingentRGStart;
      this.isContingent = Replicanti.galaxies.bought.gte(this.contingentRG);
      this.effarigInfinityBonusRG = Effarig.bonusRG;
      this.nextEffarigRGThreshold = DC.NUMMAX.pow(
        new Decimal(Effarig.bonusRG).add(2)
      );
      this.canSeeGalaxyButton =
        Replicanti.galaxies.max.gte(1) || PlayerProgress.eternityUnlocked();
      this.maxReplicanti.copyFrom(player.records.thisReality.maxReplicanti);
      this.estimateToMax = this.calculateEstimate();
    },
    vacuumText() {
      return wordShift.wordCycle(PelleRifts.vacuum.name);
    },
    // This is copied out of a short segment of ReplicantiGainText with comments and unneeded variables stripped
    calculateEstimate() {
      const updateRateMs = player.options.updateRate;
      const logGainFactorPerTick = Decimal.divide(getGameSpeedupForDisplay().times(updateRateMs).times(
        (Decimal.ln(player.replicanti.chance.add(1)))), getReplicantiInterval());
      const postScale = Math.log10(ReplicantiGrowth.scaleFactor) / ReplicantiGrowth.scaleLog10;
      const nextMilestone = this.maxReplicanti;
      const coeff = Decimal.divide(updateRateMs / 1000, logGainFactorPerTick.times(postScale));
      return coeff.times(nextMilestone.divide(this.amount).pow(postScale).minus(1));
    }
  },
};
</script>

<template>
  <div class="l-replicanti-tab">
    <br>
    <PrimaryButton
      v-if="!isUnlocked"
      :enabled="isUnlockAffordable"
      class="o-primary-btn--replicanti-unlock"
      onclick="Replicanti.unlock();"
    >
      <LocalizedText id="ade.498b0d81cbc24c29">
        <template #p0><br></template>
        <template #p1>{{ $legacyText(_s(format(unlockCost))) }}</template>
      </LocalizedText>
    </PrimaryButton>
    <template v-else>
      <div
        v-if="isDoomed"
        class="modified-cap"
      >
        {{ $t('ade.afd89ac862dd97e8', { p0: $legacyText(_s(scrambledText)) }) }}
      </div>
      <div
        v-else-if="hasRaisedCap"
        class="modified-cap"
      >
        <LocalizedText id="ade.9a72b954caac3702">
          <template #p0><br></template>
          <template #p1>{{ $legacyText(_s(format(replicantiCap,2))) }}</template>
          <template #p2>{{ $legacyText(_s(capMultText)) }}</template>
          <template #p3><br></template>
          <template #p4>{{ $t('replicanti.extraGalaxies', { amount: formatHybridLarge(effarigInfinityBonusRG, 3) }) }}</template>
          <template #p5>{{ $legacyText(_s(format(nextEffarigRGThreshold,2))) }}</template>
        </LocalizedText>
      </div>
      <p class="c-replicanti-description">
        {{ $t('ade.9f717812b3aa8e61') }}
        <span class="c-replicanti-description__accent">{{ $legacyText(_s(format(amount, 2, 0))) }}</span>
        {{ $t('ade.725ceb7988129483') }}
        <br>
        <span
          v-for="(boost, index) in boostRows"
          :key="boost.type"
        >
          <br v-if="index > 0">
          <LocalizedText :id="boost.id">
            <template #p0><span class="c-replicanti-description__accent">{{ boost.type === 'infinityPoints' ? formatX(boost.mult) : formatX(boost.mult, 2, 2) }}</span></template>
            <template v-if="boost.hasPow" #p1><span class="c-replicanti-description__accent">{{ formatPow(boost.pow, 2, 3) }}</span></template>
          </LocalizedText>
        </span>
      </p>
      <div
        v-if="hasMaxText"
        class="c-replicanti-description"
      >
        <LocalizedText id="ade.d65e6452b9bc7772">
          <template #p0><span
          v-tooltip="toMaxTooltip"
          class="max-accent"
        >{{ $legacyText(_s(format(maxReplicanti, 2))) }}</span></template>
        </LocalizedText>
      </div>
      <br>
      <div v-if="isInEC8">
        {{ $t('ade.e4e425979e5a13b3', { p0: $legacyText(_s(quantifyInt("purchase",ec8Purchases))) }) }}
      </div>
      <div class="l-replicanti-upgrade-row">
        <ReplicantiUpgradeButton :setup="replicantiChanceSetup" />
        <ReplicantiUpgradeButton :setup="replicantiIntervalSetup" />
        <ReplicantiUpgradeButton :setup="maxGalaxySetup" />
      </div>
      <div>
        <LocalizedText id="ade.ff86e1431a9a73d9">
          <template #p0><br></template>
          <template #p1>{{ $legacyText(_s(formatInt(distantRG))) }}</template>
          <template #p2>{{ $legacyText(_s(formatInt(remoteRG))) }}</template>
        </LocalizedText>
      </div>
      <br>
      <div
        v-if="isContingent"
        class="contingency-text"
      >
        <LocalizedText id="ade.f7716856298b4c2e">
          <template #p0><br></template>
          <template #p1>{{ $legacyText(_s(formatInt(contingentRG))) }}</template>
        </LocalizedText>
      </div>
      <br><br>
      <ReplicantiGainText />
      <br>
      <ReplicantiGalaxyButton v-if="canSeeGalaxyButton" />
    </template>
  </div>
</template>

<style scoped>
.max-accent {
  color: var(--color-accent);
  text-shadow: 0 0 0.2rem var(--color-reality-dark);
  cursor: default;
}

.modified-cap {
  margin: -0.8rem 0 0.8rem;
  font-weight: bold;
}

.contingency-text {
  color: var(--color-pelle--base);
  text-shadow: 0 0 0.2rem var(--color-pelle--base);
  cursor: default;
}
</style>
