<script>
import wordShift from "@/core/word-shift";

import AcceleratorsPanel from "./AcceleratorsPanel";
import NullUpgradesTabComponent from "./NullUpgradesTabComponent";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "LargeHadronColliderTab",
  components: {
    AcceleratorsPanel,
    NullUpgradesTabComponent,
    PrimaryButton
  },
  data() {
    return {
      hasAccelerator: false,
      canSeeEntropy1: false,
      canSeeEntropy2: false,
      entropyCorrupted: false,
      textShift: [],
      hadronSpeed: 0,
      accelPower: 1,
      amSoftcap: new Decimal(),
      amSoftcap2: new Decimal(),
      amHardcap: new Decimal(),
      isRunning: false,
      highestAntimatter: new Decimal(),
      nullMatter: new Decimal(),
      nullPerSecond: new Decimal(),
      nullified: false,
      voidMode: 0,
      nullParticles: new Decimal(),
      nullParticlesPerSecond: new Decimal(),
      nullParticleEffect: new Decimal(),
      hasC: false,
      c: 0,
      milestonesReached: 0,
      nextAt: 0,
      tessEqual: 0,
      antiEqual: new Decimal(),
      tickEqual: new Decimal(),
      bh1Improve: new Decimal(),
      bh2Improve: new Decimal(),
      potencyImprove: new Decimal(),
      isFlipped: false
    };
  },
  computed: {
    hadronSpeedText() {
      if (this.hadronSpeed === 0) return `Your Hadrons are stationary`;
      if (this.hadronSpeed >= 149896229) return `Your Hadrons are moving
        at ${formatHybridLarge(this.hadronSpeed, 3)} m/s (${format(this.c, 5, 5)}C)`;
      if (this.hadronSpeed >= 1000) return `Your Hadrons are moving at ${formatHybridLarge(this.hadronSpeed, 3)} m/s`;
      return `Your Hadrons are moving at ${format(this.hadronSpeed, 3, 3)} m/s`;
    },
    modeDisplay() {
      return this.voidMode === 0
        ? "Void Mode: Normal"
        : "Void Mode: Nullified";
    },
    voidText() {
      return this.isRunning ? "[Exit the Void.]" : "[Enter the Void.]";
    },
    runButtonOuterClass() {
      return {
        "l-void-run-button": true,
        "c-void-run-button": true,
        "c-void-run-button--running": this.isRunning,
        "c-void-run-button--not-running": !this.isRunning,
      };
    },
    nextDisplay() {
      return this.milestonesReached >= 5 ? "There are no more milestones to be reached!" :
        `Next C Milestone at ${format(this.nextAt, 2, 2)}C.`;
    }
  },
  methods: {
    update() {
      this.hasAccelerator = Accelerators.all.some(a => a.isUnlocked);
      this.canSeeEntropy1 = player.records.totalAntimatterOutsideDoom.gte(Decimal.pow10(1e200)) && !Slabdrill.isCursed;
      this.canSeeEntropy2 = player.records.totalAntimatterOutsideDoom.gte(Decimal.pow10(1e260)) && !Pelle.isDoomed && !Slabdrill.isCursed;
      this.entropyCorrupted = Slabdrill.isCursed;
      this.textShift = ["Glitched", "Corrupted", "Disrupted"];
      this.hadronSpeed = LHC.hadronSpeed;
      this.accelPower = LHC.acceleratorSpeed * 100000;
      this.amSoftcap.copyFrom(Pelle.isDoomed ? DC.E9E15 : Decimal.pow10(1e200));
      this.amSoftcap2.copyFrom(Decimal.pow10(1e260));
      this.amHardcap.copyFrom(Pelle.isDoomed ? DC.ENUMMAX : LHC.breakingPoint);
      this.isRunning = LHC.voidRunning || LHC.nullifiedVoidRunning;
      this.highestAntimatter.copyFrom(player.endgame.largeHadronCollider.void.highestAntimatter);
      this.nullMatter.copyFrom(player.endgame.largeHadronCollider.void.nullMatter);
      this.nullPerSecond.copyFrom(!LHC.voidRunning ? DC.D0 :
        Decimal.log10(Decimal.pow(AntimatterDimension(1).productionPerSecond, 0.01).max(1)).pow(
        Decimal.log10(Decimal.log10(Decimal.pow(AntimatterDimension(1).productionPerSecond, 0.01).max(1)).max(1))));
      this.nullified = player.endgame.largeHadronCollider.void.nullified;
      this.voidMode = player.endgame.largeHadronCollider.void.mode;
      this.nullParticles.copyFrom(player.endgame.largeHadronCollider.void.nullParticles);
      this.nullParticlesPerSecond.copyFrom(!LHC.nullifiedVoidRunning ? DC.D0 : getNullParticleGainPerSecond());
      this.nullParticleEffect.copyFrom(Currency.nullParticles.value.max(1).log10().div(5).add(1).pow(5));
      this.hasC = LHC.hadronC >= 0.5;
      this.c = LHC.hadronC;
      this.milestonesReached = CMilestones.reachedMilestones;
      this.nextAt = CMilestones.nextMilestoneAt;
      this.tessEqual = CMilestones.tesseractEqualizer(Tesseracts.bought, Tesseracts.extra);
      this.antiEqual.copyFrom(CMilestones.antimatterEqualizer(
        (Laitela.continuumActive ? AntimatterDimension(1).continuumAmount : AntimatterDimension(1).amount).times(
        AntimatterDimension(1).multiplier), Tickspeed.perSecond));
      this.tickEqual.copyFrom(CMilestones.tickspeedEqualizer(
        Laitela.continuumActive ? Tickspeed.continuumValue : player.totalTickBought, player.totalTickGained));
      this.bh1Improve.copyFrom(CMilestones.bhImprovement(BlackHole(1).power));
      this.bh2Improve.copyFrom(CMilestones.bhImprovement(BlackHole(2).power));
      this.potencyImprove.copyFrom(CMilestones.potencyImprovement(Accelerators.potency.effectValue3));
      this.isFlipped = player.universes.current === 2;
    },
    formatNullAmount(amount) {
      return amount.gte(DC.NUMMAX) && !DualityUpgrade(26).isBought ? Notations.current.infinite : format(amount, 2, 2);
    },
    glitchAnim() {
      let flux = Math.random() / (this.voidMode === 1 ? 2 : 4);
      let negFlux = -flux;
      return {
        "text-shadow": `${negFlux}rem 0 red, ${flux}rem 0 blue`,
      };
    },
    corruptionText() {
      return `WARNING: The ${player.universes.current === 2 ? "Matter" : "Antimatter"} Hardcap has become ${wordShift.wordCycle(this.textShift)}.`;
    },
    startRun() {
      if (this.voidMode === 1) {
        if (this.isRunning) exitNullifiedVoid();
        else enterNullifiedVoid();
      }
      else {
        if (this.isRunning) exitTheVoid();
        else enterTheVoid();
      }
    },
    changeMode() {
      if (this.isRunning) return;
      player.endgame.largeHadronCollider.void.mode = (player.endgame.largeHadronCollider.void.mode + 1) % 2;
    }
  }
};
</script>

<template>
  <div class="l-large-hadron-collider-tab">
    <div class="l-large-hadron-collider-all-content-container">
      <div
        v-if="hasAccelerator"
        class="c-large-hadron-collider-description"
      >
        {{ $legacyText(_s(hadronSpeedText)) }}
        <br>
        {{ $t('ade.2add87087a21db3f', { p0: $legacyText(_s(formatInt(accelPower))) }) }}
        <div
          v-if="hasC"
          class="c-large-hadron-collider-text"
        >
          <br>
          <div v-if="milestonesReached >= 1">{{ $t('endgame.collider.milestone1', { p0: $legacyText(_s(formatInt(1))), p1: $legacyText(_s(formatPercents(Math.clamp((c - 0.5) * 2, 0, 1), 3, 3))), p2: $legacyText(_s(format(tessEqual, 2, 2))) }) }}</div>
          <div v-if="milestonesReached >= 2">{{ $t('endgame.collider.milestone2', { p0: $legacyText(_s(formatInt(2))), p1: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p2: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p3: $legacyText(_s(isFlipped ? "MDMults" : "ADMults")), p4: $legacyText(_s(isFlipped ? "MDMults" : "ADMults")), p5: $legacyText(_s(formatPercents(Math.clamp((c - 0.7) * 10/3, 0, 1), 3, 3))), p6: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p7: $legacyText(_s(format(antiEqual, 2, 2))) }) }}</div>
          <div v-if="milestonesReached >= 3">{{ $t('endgame.collider.milestone3', { p0: $legacyText(_s(formatInt(3))), p1: $legacyText(_s(formatPercents(Math.clamp((c - 0.85) * 20/3, 0, 1), 3, 3))), p2: $legacyText(_s(format(tickEqual, 2, 2))) }) }}</div>
          <div v-if="milestonesReached >= 4">{{ $t('endgame.collider.milestone4', { p0: $legacyText(_s(formatInt(4))), p1: $legacyText(_s(formatPercents(Math.clamp((c - 0.95) * 20, 0, 1), 3, 3))), p2: $legacyText(_s(formatInt(1))), p3: $legacyText(_s(formatPow(bh1Improve, 2, 3))), p4: $legacyText(_s(formatInt(2))), p5: $legacyText(_s(formatPow(bh2Improve, 2, 3))), p6: $legacyText(_s(formatPow(potencyImprove, 2, 3))) }) }}</div>
          <div v-if="milestonesReached >= 5">{{ $t('endgame.collider.milestone5', { p0: $legacyText(_s(formatInt(5))), p1: $legacyText(_s(formatInt(1))) }) }}</div>
          <br>
          <div>
            {{ $legacyText(_s(nextDisplay)) }}
          </div>
        </div>
      </div>
      <AcceleratorsPanel v-if="hasAccelerator" />
      <div
        v-if="!hasAccelerator"
        class="c-large-hadron-collider-description"
      >
        {{ $t('ade.3871fe20f4628bd8', { p0: $legacyText(_s(format(Decimal.pow10(1e200),2,2))), p1: $legacyText(_s(isFlipped?"Matter":"Antimatter")) }) }}
      </div>
      <div
        class="c-large-hadron-collider-entropy"
        v-if="canSeeEntropy1"
      >
        {{ $t('endgame.collider.entropy', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(format(amSoftcap, 2, 2))), p2: $legacyText(_s(format(amHardcap, 2, 2))) }) }}
      </div>
      <div
        class="c-large-hadron-collider-entropy"
        v-if="canSeeEntropy2"
      >
        {{ $t('endgame.collider.strongerDecay', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(format(amSoftcap2, 2, 2))) }) }}
      </div>
      <div
        class="c-large-hadron-collider-entropy"
        v-if="entropyCorrupted"
      >
        {{ $legacyText(_s(corruptionText())) }}
      </div>
    </div>
    <br>
    <br>
    <div v-if="highestAntimatter.gt(10)">
      <span class="c-void-antimatter-amount">
        {{ $t('endgame.void.highest', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(format(highestAntimatter, 2, 1))) }) }}
      </span>
      <br>
      <span class="c-null">{{ $t('ade.53f8790e58571e38', { p0: $legacyText(_s(formatNullAmount(nullMatter))), p1: $legacyText(_s(formatNullAmount(nullPerSecond))) }) }}</span>
    </div>
    <div v-if="nullified">
      <span class="c-null">{{ $t('ade.421a201b24ec860c', { p0: $legacyText(_s(format(nullParticles,2,2))), p1: $legacyText(_s(format(nullParticlesPerSecond,2,2))) }) }}</span>
    </div>
    <div class="l-void-run">
      <div
        :class="runButtonOuterClass"
        @click="startRun"
      >
        <div
          :button-symbol="voidText"
          :style="glitchAnim()"
        >
          {{ $legacyText(_s(voidText)) }}
        </div>
      </div>
    </div>
    <PrimaryButton
      v-if="nullified"
      class="o-primary-btn--subtab-option"
      @click="changeMode"
    >
      {{ $legacyText(_s(modeDisplay)) }}
    </PrimaryButton>
    <div v-if="voidMode === 0">
      {{ $t('ade.b90d7241977ab1f9') }}
      <br>
      {{ $t('endgame.void.decay', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")) }) }}
      <span v-if="nullified">
        <LocalizedText id="ade.eca6cd5186a09521">
    <template #p0><br></template>
  </LocalizedText>
      </span>
    </div>
    <div v-if="voidMode === 1">
      {{ $t('endgame.void.nullifiedEntry', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(format(0.01, 2, 2))) }) }}
      <br>
      {{ $t('endgame.void.nullParticles', { p0: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p1: $legacyText(_s(isFlipped ? "Matter" : "Antimatter")), p2: $legacyText(_s(formatPow(nullParticleEffect, 2, 3))) }) }}
    </div>
    <NullUpgradesTabComponent />
  </div>
</template>

<style scoped>
.l-large-hadron-collider-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.l-large-hadron-collider-all-content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
}

.c-large-hadron-collider-description {
  position: relative;
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-alpha--base);
}

.c-large-hadron-collider-text {
  margin-left: 5rem;
  margin-right: 5rem;
  position: relative;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-alpha--base);
}

.c-large-hadron-collider-entropy {
  position: relative;
  font-size: 2rem;
  font-weight: bold;
  color: red;
}

.c-void-antimatter-amount {
  position: relative;
  font-size: 1rem;
  color: red;
}

.c-null {
  position: relative;
  font-size: 2rem;
  color: black;
  text-shadow: 0 0 0.2rem white;
}
</style>
