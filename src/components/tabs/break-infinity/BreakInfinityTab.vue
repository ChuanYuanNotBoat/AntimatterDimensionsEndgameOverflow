<script>
import BreakInfinityButton from "./BreakInfinityButton";
import InfinityUpgradeButton from "@/components/InfinityUpgradeButton";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "BreakInfinityTab",
  components: {
    PrimaryButton,
    BreakInfinityButton,
    InfinityUpgradeButton
  },
  data() {
    return {
      isUnlocked: false,
      chargeUnlocked: false,
      totalCharges: 0,
      chargesUsed: 0,
      disCharge: false
    };
  },
  computed: {
    grid() {
      return [
        [
          BreakInfinityUpgrade.totalAMMult,
          BreakInfinityUpgrade.currentAMMult,
          BreakInfinityUpgrade.galaxyBoost,
        ],
        [
          BreakInfinityUpgrade.infinitiedMult,
          BreakInfinityUpgrade.achievementMult,
          BreakInfinityUpgrade.slowestChallengeMult,
        ],
        [
          BreakInfinityUpgrade.infinitiedGen,
          BreakInfinityUpgrade.autobuyMaxDimboosts,
          BreakInfinityUpgrade.autobuyerSpeed
        ],
        [
          BreakInfinityUpgrade.tickspeedCostMult,
          BreakInfinityUpgrade.dimCostMult,
          BreakInfinityUpgrade.ipGen
        ]
      ];
    },
    disChargeClassObject() {
      return {
        "o-primary-btn--subtab-option": true,
        "o-primary-btn--charged-respec-active": this.disCharge
      };
    }
  },
  watch: {
    disCharge(newValue) {
      player.endgame.overcharge.discharge.infinite = newValue;
    }
  },
  methods: {
    update() {
      this.isUnlocked = Autobuyer.bigCrunch.hasMaxedInterval;
      this.chargeUnlocked = Ascensions.ocA.isUnlocked;
      this.totalCharges = player.endgame.overcharge.completions.bi;
      this.chargesUsed = player.endgame.overcharge.completions.bi - player.endgame.overcharge.chargesLeft.infinite;
      this.disCharge = player.endgame.overcharge.discharge.infinite;
    },
    btnClassObject(column) {
      return {
        "l-infinity-upgrade-grid__cell": true,
        "o-infinity-upgrade-btn--multiplier": column === 3
      };
    },
    timeDisplayShort(time) {
      return timeDisplayShort(time);
    }
  }
};
</script>

<template>
  <div class="l-break-infinity-tab">
    <div v-if="!isUnlocked">
      {{ $t('ade.fc426c11b624a679', { p0: $legacyText(_s(format(0.1,1,1))) }) }}
    </div>
    <div
      v-if="chargeUnlocked"
      class="c-subtab-option-container"
    >
      <PrimaryButton
        :class="disChargeClassObject"
        @click="disCharge = !disCharge"
      >
        {{ $t('ade.3054693485b3302d') }}
      </PrimaryButton>
    </div>
    <div v-if="chargeUnlocked">
      <LocalizedText id="ade.f948a96da48c677e">
        <template #p0>{{ $legacyText(_s(formatInt(chargesUsed))) }}</template>
        <template #p1>{{ $legacyText(_s(formatInt(totalCharges))) }}</template>
        <template #p2><br></template>
        <template #p3><span> {{ $t('ade.13a7a096afdcabbb') }}</span></template>
      </LocalizedText>
    </div>
    <BreakInfinityButton class="l-break-infinity-tab__break-btn" />
    <div
      v-if="isUnlocked"
      class="l-break-infinity-upgrade-grid l-break-infinity-tab__grid"
    >
      <div
        v-for="(column, columnId) in grid"
        :key="columnId"
        class="l-break-infinity-upgrade-grid__row"
      >
        <InfinityUpgradeButton
          v-for="upgrade in column"
          :key="upgrade.id"
          :upgrade="upgrade"
          :class="btnClassObject(columnId)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
