<script>
import NewTimeDimensionRow from "./ModernTimeDimensionRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "NewTimeDimensionsTab",
  components: {
    PrimaryButton,
    NewTimeDimensionRow
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
      isEndgameUnlocked: false,
      timeDimCompressionMagnitude: 0,
      timeDimOverflow: 0,
      timeDimStart: new Decimal(0),
      timeDimCompressionMagnitude2: 0,
      timeDimOverflow2: 0,
      timeDimStart2: new Decimal(0),
      hasSecond: false,
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
      this.shardsPerSecond.copyFrom(TimeDimension(1).productionPerSecond);
      this.incomeType = EternityChallenge(7).isRunning ? "Eighth Infinity Dimensions" : "Time Shards";
      this.areAutobuyersUnlocked = Autobuyer.timeDimension(1).isUnlocked;
      this.isEndgameUnlocked = PlayerProgress.endgameUnlocked();
      this.timeDimCompressionMagnitude = TimeDimensions.compressionMagnitude;
      this.timeDimOverflow = 1 / this.timeDimCompressionMagnitude;
      this.timeDimStart = TimeDimensions.OVERFLOW;
      this.timeDimCompressionMagnitude2 = TimeDimensions.compressionMag2;
      this.timeDimOverflow2 = 1 / this.timeDimCompressionMagnitude2;
      this.timeDimStart2 = TimeDimensions.OVERFLOW_SQUARED;
      this.hasSecond = Currency.timeShards.gte(DC.ENUMMAX);
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
        <LocalizedText id="ade.6d51dbc4fb6ca33d">
          <template #p0><span class="c-time-dim-description__accent">{{ $legacyText(_s(formatHybridLarge(totalUpgrades, 3))) }}</span></template>
          <template #p1><span class="c-time-dim-description__accent">{{ $legacyText(_s(format(timeShards, 2, 1))) }}</span></template>
        </LocalizedText>
      </p>
      <p>
        <LocalizedText id="ade.484ab26a905d6607">
          <template #p0><span class="c-time-dim-description__accent">{{ $legacyText(_s(format(upgradeThreshold, 2, 1))) }}</span></template>
          <template #p1><span class="c-time-dim-description__accent">{{ $legacyText(_s(formatX(multPerTickspeed, 2, 2))) }}</span></template>
        </LocalizedText>
      </p>
    </div>
    <div>
      <p>
        <span v-if="isEndgameUnlocked">
          <LocalizedText id="ade.04a5a5b762d766d6">
            <template #p0><span class="c-time-dim-compression-description__accent">{{ $legacyText(_s(format(timeDimCompressionMagnitude, 2, 3))) }}</span></template>
            <template #p1><span class="c-time-dim-compression-description__accent">{{ $legacyText(_s(format(timeDimOverflow, 2, 3))) }}</span></template>
            <template #p2><span>{{ $legacyText(_s(formatPostBreak(timeDimStart, 2, 1))) }}</span></template>
          </LocalizedText>
        </span>
      </p>
    </div>
    <div>
      <p>
        <span v-if="hasSecond">
          <LocalizedText id="ade.29104e60deca169e">
            <template #p0><span class="c-time-dim-compression-description__accent">{{ $legacyText(_s(format(timeDimCompressionMagnitude2, 2, 3))) }}</span></template>
            <template #p1><span class="c-time-dim-compression-description__accent">{{ $legacyText(_s(format(timeDimOverflow2, 2, 3))) }}</span></template>
            <template #p2><span>{{ $legacyText(_s(formatPostBreak(timeDimStart2, 2, 1))) }}</span></template>
          </LocalizedText>
        </span>
      </p>
    </div>
    <div>
      {{ $t('ade.c0a41734167ae070', { p0: $legacyText(_s(formatHybridLarge(tickspeedSoftcap,3))) }) }}
    </div>
    <div>{{ $t('ade.d7aacbaaf60681d1', { p0: $legacyText(_s(format(shardsPerSecond,2,0))), p1: $legacyText(_s(incomeType)) }) }}</div>
    <div class="l-dimensions-container">
      <NewTimeDimensionRow
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
        {{ $t('ade.bf16249a88df4a3b') }}
      </div>
      <div v-if="hasCap">
        Any 8th Time Dimensions purchased above {{ $legacyText(_s(format(1e8))) }} will not further increase the multiplier.
      </div>
    </div>
  </div>
</template>
