<script>
import ChallengeGrid from "@/components/ChallengeGrid";
import ChallengeTabHeader from "@/components/ChallengeTabHeader";
import EternityChallengeBox from "./EternityChallengeBox";

export default {
  name: "EternityChallengesTab",
  components: {
    ChallengeTabHeader,
    ChallengeGrid,
    EternityChallengeBox
  },
  data() {
    return {
      unlockedCount: 0,
      showAllChallenges: false,
      autoEC: false,
      isAutoECVisible: false,
      hasUpgradeLock: false,
      remainingECTiers: 0,
      untilNextEC: TimeSpan.zero,
      untilAllEC: TimeSpan.zero,
      hasECR: false,
    };
  },
  computed: {
    challenges() {
      return EternityChallenges.all;
    },
    upgradeLockNameText() {
      return RealityUpgrade(12).isLockingMechanics
        ? RealityUpgrade(12).name
        : ImaginaryUpgrade(15).name;
    },
    nextECText() {
      return this.untilNextEC.totalMilliseconds === 0 && !this.autoEC
        ? "Immediately upon unpausing"
        : `${this.untilNextEC} (real time)`;
    },
    allECText() {
      return this.untilAllEC.totalMilliseconds === 0 && !this.autoEC
        ? "Immediately upon unpausing"
        : `After ${this.untilAllEC} (real time)`;
    }
  },
  methods: {
    update() {
      this.showAllChallenges = player.options.showAllChallenges;
      this.unlockedCount = EternityChallenges.all
        .filter(this.isChallengeVisible)
        .length;
      this.isAutoECVisible = (Perk.autocompleteEC1.canBeApplied || EndgameMastery(22).isBought) && !player.disablePostReality;
      this.autoEC = player.reality.autoEC;
      const shouldPreventEC7 = TimeDimension(1).amount.gt(0);
      this.hasUpgradeLock = RealityUpgrade(12).isLockingMechanics ||
        (ImaginaryUpgrade(15).isLockingMechanics && shouldPreventEC7 &&
          !Array.range(1, 6).some(ec => !EternityChallenge(ec).isFullyCompleted));
      const remainingCompletions = EternityChallenges.remainingCompletions;
      this.remainingECTiers = remainingCompletions;
      if (remainingCompletions !== 0) {
        const autoECInterval = EternityChallenges.autoComplete.interval;
        const untilNextEC = Math.max(autoECInterval - player.reality.lastAutoEC, 0);
        this.untilNextEC.setFrom(new Decimal(untilNextEC));
        this.untilAllEC.setFrom(new Decimal(untilNextEC + (autoECInterval * (remainingCompletions - 1))));
      }
      this.hasECR = Perk.studyECRequirement.isBought;
    },
    isChallengeVisible(challenge) {
      return challenge.completions > 0 || challenge.isUnlocked || challenge.hasUnlocked ||
        (this.showAllChallenges && PlayerProgress.realityUnlocked());
    }
  }
};
</script>

<template>
  <div class="l-challenges-tab">
    <ChallengeTabHeader />
    <div v-if="isAutoECVisible">
      {{ $t('ade.89375da4fd09fd9c') }}
    </div>
    <div
      v-if="isAutoECVisible && remainingECTiers > 0"
      class="c-challenges-tab__auto-ec-info l-challenges-tab__auto-ec-info"
    >
      <div class="l-challenges-tab__auto-ec-timers">
        <span
          v-if="hasUpgradeLock"
          class="l-emphasis"
        >
          {{ $t('ade.a56fe6d07060ea1f', { p0: $legacyText(_s(upgradeLockNameText)) }) }}
        </span>
        <span v-if="remainingECTiers > 0">
          {{ $t('ade.05570f163e46bcd9', { p0: $legacyText(_s(nextECText)) }) }}
        </span>
        <span>
          {{ $t('ade.4c01a65ca9d9434b', { p0: $legacyText(_s(allECText)) }) }}
        </span>
        <br>
      </div>
    </div>
    <div>
      <LocalizedText id="ade.e9514efbaab73600">
        <template #p0>{{ $legacyText(_s(formatInt(5))) }}</template>
        <template #p1><br></template>
      </LocalizedText>
    </div>
    <div v-if="!hasECR">
      {{ $t('ade.aeadd535b786d1a1') }}<br>
      in order to unlock it again until you complete it; only the Time Theorems are required.
    </div>
    <div v-if="unlockedCount !== 12">
      {{ $t('ade.211d65d64b389cb9', { p0: $legacyText(_s(formatInt(unlockedCount))), p1: $legacyText(_s(formatInt(12))) }) }}
    </div>
    <div v-else>
      {{ $t('ade.7d87a44fa69741a3', { p0: $legacyText(_s(formatInt(12))) }) }}
    </div>
    <ChallengeGrid
      v-slot="{ challenge }"
      :challenges="challenges"
      :is-challenge-visible="isChallengeVisible"
    >
      <EternityChallengeBox :challenge="challenge" />
    </ChallengeGrid>
  </div>
</template>

<style scoped>
.l-emphasis {
  font-weight: bold;
  color: var(--color-bad);
}
</style>
