<script>
import PrimaryButton from "@/components/PrimaryButton";
import TimeDimensionRow from "./ClassicTimeDimensionRow";

export default {
  name: "ClassicTimeDimensionsTab",
  components: {
    PrimaryButton,
    TimeDimensionRow
  },
  data() {
    return {
      totalUpgrades: new Decimal(0),
      multPerTickspeed: 0,
      tickspeedSoftcap: 0,
      timeShards: new Decimal(0),
      upgradeThreshold: new Decimal(0),
      shardsPerSecond: new Decimal(0),
      incomeType: "",
      areAutobuyersUnlocked: false,
      showLockedDimCostNote: true,
      hasCap: true
    };
  },
  computed: {
    costIncreases: () => TimeDimension(1).costIncreaseThresholds,
  },
  methods: {
    update() {
      this.showLockedDimCostNote = !TimeDimension(8).isUnlocked && player.realities.gte(1);
      this.totalUpgrades.copyFrom(player.totalTickGained);
      this.multPerTickspeed = FreeTickspeed.multToNext;
      this.tickspeedSoftcap = FreeTickspeed.softcap;
      this.timeShards.copyFrom(Currency.timeShards);
      this.upgradeThreshold.copyFrom(FreeTickspeed.fromShards(Currency.timeShards.value).nextShards);
      this.shardsPerSecond.copyFrom(TimeDimension(1).productionPerRealSecond);
      this.incomeType = EternityChallenge(7).isRunning ? "Eighth Infinity Dimensions" : "Time Shards";
      this.areAutobuyersUnlocked = Autobuyer.timeDimension(1).isUnlocked;
      this.hasCap = Alpha.currentStage < 11 || player.disablePostReality;
    },
    maxAll() {
      tryUnlockTimeDimensions();
      maxAllTimeDimensions();
    },
    toggleAllAutobuyers() {
      toggleAllTimeDims();
    }
  }
};
</script>

<template>
  <div class="l-time-dim-tab l-centered-vertical-tab">
    <div class="c-subtab-option-container">
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        @click="maxAll"
      >
        {{ $t('ade.4df159d13ecdd149') }}
      </PrimaryButton>
      <PrimaryButton
        v-if="areAutobuyersUnlocked"
        class="o-primary-btn--subtab-option"
        @click="toggleAllAutobuyers"
      >
        {{ $t('ade.4b652887fb44f382') }}
      </PrimaryButton>
    </div>
    <div>
      <p>
        <LocalizedText id="ade.27aad1272bb5cd95">
          <template #p0><span class="c-time-dim-description__accent">{{ $legacyText(_s(formatHybridLarge(totalUpgrades, 3))) }}</span></template>
          <template #p1><span class="c-time-dim-description__accent">{{ $legacyText(_s(format(timeShards, 2, 1))) }}</span></template>
        </LocalizedText>
      </p>
      <p>
        <LocalizedText id="ade.c2fa2380f3474e49">
          <template #p0><span class="c-time-dim-description__accent">{{ $legacyText(_s(format(upgradeThreshold, 2, 1))) }}</span></template>
          <template #p1><span class="c-time-dim-description__accent">{{ $legacyText(_s(formatX(multPerTickspeed, 2, 2))) }}</span></template>
        </LocalizedText>
      </p>
    </div>
    <div>
      {{ $t('ade.c0a41734167ae070', { p0: $legacyText(_s(formatHybridLarge(tickspeedSoftcap,3))) }) }}
    </div>
    <div>
      {{ $t('ade.d7aacbaaf60681d1', { p0: $legacyText(_s(format(shardsPerSecond,2,0))), p1: $legacyText(_s(incomeType)) }) }}
    </div>
    <div class="l-dimensions-container">
      <TimeDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
        :are-autobuyers-unlocked="areAutobuyersUnlocked"
      />
    </div>
    <div>
      {{ $t('ade.183959b48cc99716', { p0: $legacyText(_s(format(costIncreases[0],2,2))), p1: $legacyText(_s(format(costIncreases[1]))) }) }}
      <br>
      {{ $t('ade.bef8654b479df5fe', { p0: $legacyText(_s(format(costIncreases[2]))) }) }}
      <br>
      <div v-if="showLockedDimCostNote">
        {{ $t('ade.0e6c57db71518a7b') }}
      </div>
      <div v-if="hasCap">
        Any 8th Time Dimensions purchased above {{ $legacyText(_s(format(1e8))) }} will not further increase the multiplier.
      </div>
    </div>
  </div>
</template>
